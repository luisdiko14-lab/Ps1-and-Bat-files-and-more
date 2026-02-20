import os
import asyncio
import logging
from dotenv import load_dotenv
import discord
from discord.ext import commands

# Logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("python_bot")

load_dotenv()
TOKEN = os.getenv("TOKEN")
PREFIX = os.getenv("PREFIX", "!")

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.guilds = True
intents.typing = False
intents.presences = False

bot = commands.Bot(command_prefix=PREFIX, intents=intents, help_command=None)

@bot.event
async def on_ready():
    log.info(f"✅ Logged in as {bot.user} (ID: {bot.user.id})")
    await bot.change_presence(activity=discord.Game(f"{PREFIX}help | Windows 10 Service on!"))

@bot.event
async def on_command_error(ctx, error):
    # Friendly error handling
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.reply("You're missing an argument. Check the command usage.")
    elif isinstance(error, commands.MissingPermissions):
        await ctx.reply("You don't have permission to use this command.")
    elif isinstance(error, commands.CommandNotFound):
        # silently ignore most unknown commands to avoid spam
        return
    else:
        await ctx.reply(f"An unexpected error occurred: `{error}`")
        log.exception("Command error")

async def load_cogs():
    # Load every .py file in cogs/
    for filename in os.listdir("./cogs"):
        if filename.endswith(".py"):
            name = f"cogs.{filename[:-3]}"
            try:
                await bot.load_extension(name)
                log.info(f"Loaded cog: {name}")
            except Exception as e:
                log.exception(f"Failed to load {name}: {e}")

async def main():
    await load_cogs()
    await bot.start(TOKEN)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Bot shutting down (KeyboardInterrupt)")
