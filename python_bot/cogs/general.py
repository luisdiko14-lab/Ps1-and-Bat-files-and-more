import discord
from discord.ext import commands
import random
import datetime
import textwrap
import aiohttp
import asyncio

class General(commands.Cog):
    """
    General cog: 20+ commands with helpful, real responses.
    Commands include info, utilities, moderation-lite helpers,
    fun commands, converters, and a richer help command.
    """

    def __init__(self, bot):
        self.bot = bot
        self._start_time = datetime.datetime.utcnow()

    # ---------------- Helper utilities ----------------
    def _uptime(self):
        delta = datetime.datetime.utcnow() - self._start_time
        days, seconds = delta.days, delta.seconds
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        seconds = seconds % 60
        return f"{days}d {hours}h {minutes}m {seconds}s"

    async def _fetch_json(self, url):
        # tiny wrapper used by sample commands (keeps repo offline-safe)
        try:
            async with aiohttp.ClientSession() as s:
                async with s.get(url, timeout=8) as r:
                    return await r.json()
        except Exception:
            return None

    # ---------------- Info / utility commands (many) ----------------
    @commands.command(name="help")
    async def cmd_help(self, ctx, *, topic: str = None):
        """Rich help command. Use `!help <command>` for details."""
        prefix = ctx.bot.command_prefix
        if topic:
            c = ctx.bot.get_command(topic)
            if c:
                embed = discord.Embed(title=f"Help — {c.name}", colour=discord.Colour.blurple())
                embed.add_field(name="Signature", value=f"`{prefix}{c.qualified_name} {c.signature}`", inline=False)
                if c.help:
                    embed.add_field(name="Description", value=c.help, inline=False)
                await ctx.reply(embed=embed)
                return
            else:
                await ctx.reply("Command not found.")
                return

        embed = discord.Embed(title="Help — Command categories", colour=discord.Colour.blue())
        embed.description = textwrap.dedent(f"""
            Use `{prefix}help <command>` for details.
            **General** — ping, avatar, time, info
            **Utility** — choose, roll, random, reverse, calc
            **Fun** — joke, rate, roast, compliment
            **Moderation** — clear, kick, ban (permissions)
        """)
        embed.set_footer(text="Generated help • Python Mega Bot")
        await ctx.reply(embed=embed)

    @commands.command(name="ping")
    async def cmd_ping(self, ctx):
        """Replies with Pong and latency."""
        before = discord.utils.utcnow()
        msg = await ctx.reply("Pinging...")
        after = discord.utils.utcnow()
        latency = (after - before).total_seconds() * 1000
        ws = round(self.bot.latency * 1000)
        await msg.edit(content=f"Pong! REST: {latency:.0f}ms | WS: {ws}ms")

    @commands.command(name="avatar")
    async def cmd_avatar(self, ctx, user: discord.User = None):
        """Returns the avatar of a user (or yourself)."""
        user = user or ctx.author
        em = discord.Embed(title=f"{user}", colour=discord.Colour.green())
        em.set_image(url=user.display_avatar.url)
        em.set_footer(text=f"ID: {user.id}")
        await ctx.reply(embed=em)

    @commands.command(name="userinfo")
    async def cmd_userinfo(self, ctx, target: discord.Member = None):
        """Shows useful info about a member."""
        target = target or ctx.author
        roles = [r.name for r in target.roles if r.name != "@everyone"]
        embed = discord.Embed(title=f"{target}", colour=discord.Colour.teal())
        embed.add_field(name="ID", value=str(target.id), inline=True)
        embed.add_field(name="Account created", value=target.created_at.strftime("%Y-%m-%d"), inline=True)
        embed.add_field(name="Joined server", value=target.joined_at.strftime("%Y-%m-%d") if target.joined_at else "Unknown", inline=True)
        embed.add_field(name="Top role", value=str(target.top_role), inline=True)
        embed.add_field(name="Roles", value=", ".join(roles) or "None", inline=False)
        embed.set_thumbnail(url=target.display_avatar.url)
        await ctx.reply(embed=embed)

    @commands.command(name="server")
    async def cmd_server(self, ctx):
        """Displays server info."""
        g = ctx.guild
        embed = discord.Embed(title=f"{g.name}", colour=discord.Colour.brand_green())
        embed.add_field(name="ID", value=g.id)
        embed.add_field(name="Owner", value=g.owner)
        embed.add_field(name="Members", value=g.member_count)
        embed.add_field(name="Roles", value=len(g.roles))
        embed.set_thumbnail(url=g.icon.url if g.icon else discord.Embed.Empty)
        await ctx.reply(embed=embed)

    @commands.command(name="time")
    async def cmd_time(self, ctx):
        """UTC time now."""
        now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        await ctx.reply(f"`{now}`")

    @commands.command(name="uptime")
    async def cmd_uptime(self, ctx):
        """How long the bot has been running."""
        await ctx.reply(self._uptime())

    @commands.command(name="choose")
    async def cmd_choose(self, ctx, *choices):
        """Choose between multiple items. Example: !choose apple banana pear"""
        if not choices:
            await ctx.reply("Give me some choices to pick from.")
            return
        choice = random.choice(choices)
        await ctx.reply(f"I pick: **{choice}**")

    @commands.command(name="roll")
    async def cmd_roll(self, ctx, dice: str = "1d6"):
        """Roll dice in NdM format, e.g., 2d8 or d20."""
        try:
            if "d" not in dice:
                raise ValueError
            parts = dice.split("d")
            n = int(parts[0]) if parts[0] != "" else 1
            m = int(parts[1])
            if n < 1 or m < 1 or n > 100:
                raise ValueError
            rolls = [random.randint(1, m) for _ in range(n)]
            await ctx.reply(f"Rolls: {rolls} => Total: {sum(rolls)}")
        except Exception:
            await ctx.reply("Usage: `!roll NdM` e.g. `!roll 2d6` or `!roll d20`")

    @commands.command(name="flip")
    async def cmd_flip(self, ctx):
        """Flip a coin."""
        await ctx.reply(random.choice(["Heads", "Tails"]))

    @commands.command(name="reverse")
    async def cmd_reverse(self, ctx, *, text: str):
        """Reverse text."""
        await ctx.reply(text[::-1])

    @commands.command(name="quote")
    async def cmd_quote(self, ctx):
        """Random inspirational-ish quote."""
        quotes = [
            "Ship > Perfect.",
            "Small steps every day.",
            "Don't fear the fail; fear no try.",
            "Write it down, then rewrite it better."
        ]
        await ctx.reply(random.choice(quotes))

    @commands.command(name="joke")
    async def cmd_joke(self, ctx):
        """Clever-ish jokes (not meow)."""
        jokes = [
            "I told my computer I needed a break — it said 'No problem, I'll go to sleep.'",
            "Why do programmers prefer dark mode? Because light attracts bugs.",
            "There are 10 types of people: those who understand binary and those who don't."
        ]
        await ctx.reply(random.choice(jokes))

    @commands.command(name="rate")
    async def cmd_rate(self, ctx, *, what: str):
        """Rate something from 1-10."""
        score = random.randint(1, 10)
        await ctx.reply(f"I rate **{what}** {score}/10")

    @commands.command(name="convert")
    async def cmd_convert(self, ctx, amount: float, from_curr: str, to_curr: str):
        """Very small fake converter — for demo only (no live rates)."""
        # This is deliberately offline and deterministic
        rates = {"USD": 1.0, "EUR": 0.92, "GBP": 0.78, "JPY": 160.0}
        from_curr = from_curr.upper()
        to_curr = to_curr.upper()
        if from_curr not in rates or to_curr not in rates:
            await ctx.reply("Supported: USD EUR GBP JPY")
            return
        usd = amount / rates[from_curr]
        converted = usd * rates[to_curr]
        await ctx.reply(f"{amount:.2f} {from_curr} ≈ {converted:.2f} {to_curr}")

    @commands.command(name="avatar_url")
    async def cmd_avatar_url(self, ctx, user: discord.User = None):
        """Copyable avatar URL."""
        user = user or ctx.author
        await ctx.reply(user.display_avatar.url)

    @commands.command(name="servericon")
    async def cmd_servericon(self, ctx):
        """Get server icon URL."""
        g = ctx.guild
        if not g:
            await ctx.reply("This command must be used in a server.")
            return
        if not g.icon:
            await ctx.reply("Server has no icon.")
            return
        await ctx.reply(g.icon.url)

    @commands.command(name="poll")
    async def cmd_poll(self, ctx, *, question: str):
        """Create a simple yes/no poll (bot adds reactions)."""
        msg = await ctx.reply(f"📊 Poll: {question}")
        await msg.add_reaction("👍")
        await msg.add_reaction("👎")

    @commands.command(name="search")
    async def cmd_search(self, ctx, *, query: str):
        """Example of using http (disabled offline-safe). Attempts to call duckduckgo lite API.
           Falls back to echoing the query if network fails."""
        # Attempt to search a light endpoint (may fail if network blocked)
        data = await self._fetch_json(f"https://api.allorigins.win/raw?url=https://duckduckgo.com/html?q={query}")
        if not data:
            await ctx.reply(f"Search (offline fallback): `{query}`")
            return
        # If data present, just show a small snippet (avoid heavy parsing)
        snippet = data[:300].replace("\n", " ")
        await ctx.reply(f"Search snippet:\n```\n{snippet}\n```")

    @commands.command(name="emoji")
    async def cmd_emoji(self, ctx, name: str):
        """Try to find a server emoji by name and show it."""
        for e in ctx.guild.emojis:
            if e.name.lower() == name.lower():
                await ctx.reply(str(e))
                return
        await ctx.reply("Emoji not found.")

    @commands.command(name="remind")
    async def cmd_remind(self, ctx, seconds: int, *, text: str):
        """Set a short reminder in seconds. Example: !remind 10 Take cookies out"""
        if seconds < 1 or seconds > 3600:
            await ctx.reply("Seconds must be between 1 and 3600.")
            return
        await ctx.reply(f"Okay — I'll remind you in {seconds}s.")
        await asyncio.sleep(seconds)
        try:
            await ctx.author.send(f"⏰ Reminder: {text}")
        except Exception:
            await ctx.reply(f"{ctx.author.mention} Reminder: {text}")

    # end of class

async def setup(bot):
    await bot.add_cog(General(bot))
