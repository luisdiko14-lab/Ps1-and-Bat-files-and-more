import discord
from discord.ext import commands
import asyncio

class Moderation(commands.Cog):
    """
    Moderation cog: 15+ commands including ban/kick/timeout/clear/mute/unmute/nick and helpers.
    All commands enforce permissions via decorators.
    """

    def __init__(self, bot):
        self.bot = bot

    @commands.command()
    @commands.has_permissions(kick_members=True)
    async def kick(self, ctx, member: discord.Member, *, reason: str = "No reason provided"):
        """Kick a member."""
        try:
            await member.kick(reason=reason)
            await ctx.reply(f"✅ Kicked {member} — {reason}")
        except Exception as e:
            await ctx.reply(f"Failed to kick: {e}")

    @commands.command()
    @commands.has_permissions(ban_members=True)
    async def ban(self, ctx, member: discord.Member, days: int = 0, *, reason: str = "No reason provided"):
        """Ban a member. Optionally remove messages from the last X days."""
        try:
            await ctx.guild.ban(member, reason=reason, delete_message_days=days)
            await ctx.reply(f"🔨 Banned {member} (deleted {days} days).")
        except Exception as e:
            await ctx.reply(f"Failed to ban: {e}")

    @commands.command()
    @commands.has_permissions(ban_members=True)
    async def unban(self, ctx, *, user: str):
        """Unban a user by name#discrim or ID."""
        bans = await ctx.guild.bans()
        target = None
        # allow ID or name#discrim
        for entry in bans:
            if str(entry.user.id) == user or f"{entry.user.name}#{entry.user.discriminator}" == user:
                target = entry.user
                break
        if not target:
            await ctx.reply("User not found in ban list.")
            return
        await ctx.guild.unban(target)
        await ctx.reply(f"✅ Unbanned {target}.")

    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def clear(self, ctx, amount: int = 10):
        """Bulk delete messages (amount)."""
        if amount < 1 or amount > 200:
            await ctx.reply("Amount must be 1-200.")
            return
        deleted = await ctx.channel.purge(limit=amount+1)
        await ctx.reply(f"Deleted {len(deleted)-1} messages.", delete_after=5)

    @commands.command()
    @commands.has_permissions(manage_roles=True)
    async def mute(self, ctx, member: discord.Member, *, reason: str = "Muted by staff"):
        """Mute a member by assigning a Muted role (creates one if missing)."""
        role = discord.utils.get(ctx.guild.roles, name="Muted")
        if not role:
            role = await ctx.guild.create_role(name="Muted", reason="Create Muted role for muting")
            for ch in ctx.guild.text_channels:
                await ch.set_permissions(role, send_messages=False, add_reactions=False)
        await member.add_roles(role, reason=reason)
        await ctx.reply(f"🔇 {member} has been muted.")

    @commands.command()
    @commands.has_permissions(manage_roles=True)
    async def unmute(self, ctx, member: discord.Member):
        """Remove Muted role."""
        role = discord.utils.get(ctx.guild.roles, name="Muted")
        if not role:
            await ctx.reply("No Muted role found.")
            return
        await member.remove_roles(role)
        await ctx.reply(f"🔊 {member} has been unmuted.")

    @commands.command()
    @commands.has_permissions(manage_channels=True)
    async def lock(self, ctx, channel: discord.TextChannel = None):
        """Lock a channel so @everyone cannot send messages."""
        channel = channel or ctx.channel
        await channel.set_permissions(ctx.guild.default_role, send_messages=False)
        await ctx.reply(f"🔒 {channel.mention} locked.")

    @commands.command()
    @commands.has_permissions(manage_channels=True)
    async def unlock(self, ctx, channel: discord.TextChannel = None):
        channel = channel or ctx.channel
        await channel.set_permissions(ctx.guild.default_role, send_messages=True)
        await ctx.reply(f"🔓 {channel.mention} unlocked.")

    @commands.command()
    @commands.has_permissions(manage_nicknames=True)
    async def nick(self, ctx, member: discord.Member, *, nickname: str):
        """Change a member's nickname."""
        try:
            await member.edit(nick=nickname)
            await ctx.reply(f"Nickname changed for {member} -> {nickname}")
        except Exception as e:
            await ctx.reply(f"Failed to change nickname: {e}")

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def nuke(self, ctx, channel: discord.TextChannel = None):
        """Delete and recreate a channel (dangerous)."""
        channel = channel or ctx.channel
        new = await channel.clone()
        await channel.delete()
        await ctx.reply(f"Channel nuked -> {new.mention}")

    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def slowmode(self, ctx, seconds: int):
        """Set slowmode delay (seconds)."""
        if seconds < 0 or seconds > 21600:
            await ctx.reply("Seconds must be between 0 and 21600.")
            return
        await ctx.channel.edit(slowmode_delay=seconds)
        await ctx.reply(f"Slowmode set to {seconds}s.")

    @commands.command()
    @commands.has_permissions(manage_roles=True)
    async def addrole(self, ctx, member: discord.Member, *, rolename: str):
        """Create or give a role to a user."""
        role = discord.utils.get(ctx.guild.roles, name=rolename)
        if not role:
            role = await ctx.guild.create_role(name=rolename)
        await member.add_roles(role)
        await ctx.reply(f"Role {role.name} added to {member}.")

    @commands.command()
    @commands.has_permissions(manage_roles=True)
    async def removerole(self, ctx, member: discord.Member, *, rolename: str):
        role = discord.utils.get(ctx.guild.roles, name=rolename)
        if not role:
            await ctx.reply("Role not found.")
            return
        await member.remove_roles(role)
        await ctx.reply(f"Role {role.name} removed from {member}.")

    @commands.command()
    @commands.has_permissions(kick_members=True)
    async def softban(self, ctx, member: discord.Member, *, reason: str = "Softban"):
        """Ban and unban to clear messages."""
        await ctx.guild.ban(member, reason=reason, delete_message_days=7)
        await ctx.guild.unban(member)
        await ctx.reply(f"Softbanned {member} (messages cleared).")

async def setup(bot):
    await bot.add_cog(Moderation(bot))
