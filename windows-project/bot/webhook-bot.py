import os
import discord
from discord.ext import commands
from datetime import datetime

# ----- Bot setup -----
intents = discord.Intents.default()
intents.messages = True  # needed for sending messages
bot = commands.Bot(command_prefix="!", intents=intents)

# Replace with your actual channel ID
CHANNEL_ID = int(os.getenv("DISCORD_CHANNEL_ID", "1451292477997977803"))

# ----- Function to send the embed -----
async def send_file_update_notification(file_name, line_number, old_line, new_line):
    channel = bot.get_channel(CHANNEL_ID)
    if channel is None:
        print(f"❌ Cannot find channel with ID {CHANNEL_ID}")
        return

    embed = discord.Embed(
        title="📝 File Updated",
        color=0x0078D4,
        timestamp=datetime.utcnow()
    )

    embed.add_field(name="📁 File Name", value=f"`{file_name}`", inline=True)
    embed.add_field(name="📍 Line Number", value=f"`{line_number}`", inline=True)
    embed.add_field(name="❌ Old Line", value=f"```\n{old_line or '(empty)'}\n```", inline=False)
    embed.add_field(name="✅ New Line", value=f"```\n{new_line or '(empty)'}\n```", inline=False)
    embed.set_footer(text="Windows 10 Simulator")
    embed.set_thumbnail(url="https://cdn-icons-png.flaticon.com/512/888/888882.png")

    await channel.send(embed=embed)
    print("✅ Discord message sent successfully!")

# ----- Example command to test -----
@bot.command()
async def update(ctx, file_name, line_number: int, old_line, new_line):
    """Test sending a file update notification from the bot."""
    await send_file_update_notification(file_name, line_number, old_line, new_line)
    await ctx.send("Message sent!")

# ----- Run the bot -----
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
bot.run("TOKEN")
