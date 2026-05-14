import os
import threading
import tkinter as tk
from tkinter import scrolledtext, messagebox
import asyncio
import discord
from discord.ext import commands
from datetime import datetime

# ----- Bot setup -----
intents = discord.Intents.default()
intents.messages = True
bot = commands.Bot(command_prefix="!", intents=intents)

# ----- Discord Channel ID -----
CHANNEL_ID = int(os.getenv("DISCORD_CHANNEL_ID", "YOUR_CHANNEL_ID_HERE"))

# ----- Embed sending function -----
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

# ----- Example command for testing -----
@bot.command()
async def update(ctx, file_name, line_number: int, old_line, new_line):
    await send_file_update_notification(file_name, line_number, old_line, new_line)
    await ctx.send("Message sent!")

# ----- GUI setup -----
class BotGUI:
    def __init__(self, master):
        self.master = master
        master.title("Discord Bot Launcher")
        master.geometry("500x400")

        # Log output
        self.log = scrolledtext.ScrolledText(master, state='disabled', width=60, height=20)
        self.log.pack(pady=10)

        # Start button
        self.start_btn = tk.Button(master, text="Start Bot", command=self.start_bot)
        self.start_btn.pack(side=tk.LEFT, padx=20)

        # Stop button
        self.stop_btn = tk.Button(master, text="Stop Bot", command=self.stop_bot)
        self.stop_btn.pack(side=tk.RIGHT, padx=20)

        self.bot_thread = None

    def log_message(self, message):
        self.log.config(state='normal')
        self.log.insert(tk.END, f"{message}\n")
        self.log.see(tk.END)
        self.log.config(state='disabled')

    def start_bot(self):
        if self.bot_thread and self.bot_thread.is_alive():
            self.log_message("⚠ Bot is already running.")
            return

        self.bot_thread = threading.Thread(target=self.run_bot, daemon=True)
        self.bot_thread.start()
        self.log_message("🚀 Bot starting...")

    def stop_bot(self):
        self.log_message("❌ Stopping bot...")
        # Discord.py doesn’t have a clean stop in threads, so just exit GUI
        self.master.quit()

    def run_bot(self):
        # Redirect prints to GUI
        import sys
        class StdoutRedirector:
            def write(self, msg):
                if msg.strip():
                    self_outer.log_message(msg.strip())
            def flush(self):
                pass

        self_outer = self
        sys.stdout = StdoutRedirector()
        token = os.getenv("DISCORD_BOT_TOKEN")
        if not token:
            messagebox.showerror("Error", "DISCORD_BOT_TOKEN not set!")
            return

        try:
            bot.run(token)
        except Exception as e:
            self.log_message(f"❌ Bot error: {e}")

# ----- Start GUI -----
root = tk.Tk()
app = BotGUI(root)
root.mainloop()
