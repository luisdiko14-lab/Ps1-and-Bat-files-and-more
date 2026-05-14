import disnake
from disnake.ext import commands, tasks
import os
import asyncio
from dotenv import load_dotenv

# 1. SETUP
load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")

# Check if token exists
if not TOKEN:
    print("❌ ERROR: DISCORD_TOKEN not found in .env file.")
    exit()

# 2. INTENTS (Crucial for reading messages)
intents = disnake.Intents.default()
intents.message_content = True 
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

# 3. CONFIGURATION STORAGE
# stored in memory (resets if bot restarts)
game_state = {
    "channel_id": 1379418790080544870,
    "current_count": 0,
    "high_score": 0,
    "format": "0-9",      # "0-9" or "a-z"
    "last_msg_id": None,  # To track where we left off
    "last_user_id": None, # To prevent double counting
    "topic_timer": 0      # To prevent rate limits
}

# --- HELPER: Number to Letters (a, b ... z, aa, ab) ---
def number_to_alpha(n):
    # n should start at 1 for 'a'. 
    string = ""
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        string = chr(65 + remainder) + string
    return string.lower()

def get_next_expected_str():
    # If count is 0, next is 1. 
    target = game_state["current_count"] + 1

    if game_state["format"] == "a-z":
        return number_to_alpha(target)
    else:
        return str(target)

# --- BOT EVENTS ---

@bot.event
async def on_ready():
    print(f"✅ Logged in as {bot.user}")
    print("-----------------------------")
    if not count_monitor_loop.is_running():
        count_monitor_loop.start()

@bot.slash_command(name="setup", description="Start the counting game in this channel")
async def setup(
    ctx: disnake.AppCmdInter, 
    format: str = commands.Param(choices=["0-9", "a-z"])
):
    # Permission Check
    if not ctx.channel.permissions_for(ctx.guild.me).manage_channels:
        await ctx.send("⚠️ I need 'Manage Channels' permission to update the topic!", ephemeral=True)
        return

    # Reset State
    game_state["channel_id"] = ctx.channel.id
    game_state["format"] = format
    game_state["current_count"] = 0
    game_state["last_msg_id"] = None
    game_state["last_user_id"] = None

    # Send Start Message
    next_val = get_next_expected_str()
    await ctx.send(
        f"✅ **Setup Complete!**\n"
        f"Mode: `{format}`\n"
        f"The next number is: **{next_val}**\n"
        f"(I will check this channel every 5 seconds)"
    )

    # Try to set initial topic
    try:
        await ctx.channel.edit(topic=f"Next count: {next_val} | High Score: {game_state['high_score']}")
    except Exception as e:
        print(f"⚠️ Could not set topic: {e}")

# --- THE LOOP (Checks every 5 seconds) ---

@tasks.loop(seconds=5)
async def count_monitor_loop():
    # 1. Safety Checks
    cid = game_state["channel_id"]
    if not cid:
        return # Game not set up yet

    channel = bot.get_channel(cid)
    if not channel:
        return # Channel deleted or bot kicked

    # 2. Fetch Messages
    # We fetch messages AFTER the last one we saw to ensure we don't miss any
    # or re-process old ones.
    try:
        history_args = {"limit": 10, "oldest_first": True}

        if game_state["last_msg_id"]:
            # Fetch messages sent AFTER the last processed message
            last_msg_obj = disnake.Object(id=game_state["last_msg_id"])
            messages = await channel.history(after=last_msg_obj, **history_args).flatten()
        else:
            # First run: just get the very last message
            messages = await channel.history(limit=1).flatten()

        if not messages:
            return # No new messages

    except Exception as e:
        print(f"Error fetching history: {e}")
        return

    # 3. Process Each New Message
    for message in messages:
        if message.author.bot:
            # Update ID so we don't check this bot message again
            game_state["last_msg_id"] = message.id
            continue

        content = message.content.strip().lower()
        expected = get_next_expected_str()

        # LOGIC CHECK
        if content == expected:
            # --- CORRECT ---
            await message.add_reaction("✅")
            game_state["current_count"] += 1
            game_state["last_msg_id"] = message.id
            game_state["last_user_id"] = message.author.id

            # High Score Logic
            if game_state["current_count"] > game_state["high_score"]:
                game_state["high_score"] = game_state["current_count"]

            # Update Topic (Only every 10 counts to avoid Rate Limits)
            game_state["topic_timer"] += 1
            if game_state["topic_timer"] >= 10:
                game_state["topic_timer"] = 0
                next_val = get_next_expected_str()
                try:
                    await channel.edit(topic=f"Count: {content} | Next: {next_val} | Record: {game_state['high_score']}")
                except:
                    pass # Ignore rate limit errors

        else:
            # --- WRONG ---
            await message.add_reaction("❌")
            game_state["last_msg_id"] = message.id

            await channel.send(
                f"💥 **{message.author.mention} broke the streak at {game_state['current_count']}!**\n"
                f"Correct was: `{expected}`. Restarting..."
            )

            game_state["current_count"] = 0
            game_state["topic_timer"] = 0

            # Reset Topic immediately on fail
            try:
                await channel.edit(topic=f"🔥 Streak Broken! Next: {get_next_expected_str()}")
            except:
                pass

bot.run(TOKEN)