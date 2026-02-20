import discord
from discord.ext import commands
import asyncio
import yt_dlp
import os

class Music(commands.Cog):
    """
    Music cog with 10+ commands.
    NOTE: This is a practical starter. For production-grade music playback you should
    use a robust queue + stream handling. This file provides structure and simple
    playback via FFmpeg/yt-dlp. Requires ffmpeg installed on the host.
    """

    def __init__(self, bot):
        self.bot = bot
        self.queues = {}  # guild_id -> [ {title, url, source} ]

    # ------------- internal helpers -------------
    def _get_queue(self, guild_id):
        return self.queues.setdefault(guild_id, [])

    async def _ensure_voice(self, ctx):
        if ctx.voice_client:
            return ctx.voice_client
        if not ctx.author.voice or not ctx.author.voice.channel:
            await ctx.reply("You must be in a voice channel.")
            return None
        return await ctx.author.voice.channel.connect()

    # ------------- commands -------------
    @commands.command(name="join")
    async def cmd_join(self, ctx):
        """Join the author's voice channel."""
        vc = await self._ensure_voice(ctx)
        if vc:
            await ctx.reply(f"Joined {ctx.author.voice.channel.name}")

    @commands.command(name="leave")
    async def cmd_leave(self, ctx):
        """Leave voice channel and clear queue."""
        if ctx.voice_client:
            await ctx.voice_client.disconnect()
            self.queues.pop(ctx.guild.id, None)
            await ctx.reply("Left voice channel and cleared queue.")
        else:
            await ctx.reply("I'm not in a voice channel.")

    @commands.command(name="play")
    async def cmd_play(self, ctx, *, query: str):
        """Play a song from YouTube (url or search). If already playing, add to queue.
           Note: This uses yt-dlp and assumes ffmpeg is installed on host."""
        vc = await self._ensure_voice(ctx)
        if not vc:
            return

        await ctx.reply(f"Queued: **{query}** (demo mode — streaming may be limited)")
        # For a real implementation, you'd use yt_dlp to extract a stream URL and use FFmpegPCMAudio.
        q = self._get_queue(ctx.guild.id)
        q.append({"title": query, "url": query})
        # If not playing, start a player
        if not vc.is_playing():
            await self._play_next(ctx)

    async def _play_next(self, ctx):
        q = self._get_queue(ctx.guild.id)
        if not q:
            await ctx.reply("Queue finished.")
            return
        song = q.pop(0)
        vc = ctx.voice_client
        if not vc:
            await ctx.reply("Not connected.")
            return

        # This is a placeholder: attempt to use yt_dlp to get a stream url and play via ffmpeg
        try:
            ytdl_opts = {"format": "bestaudio", "noplaylist": True, "quiet": True, "nocheckcertificate": True}
            with yt_dlp.YoutubeDL(ytdl_opts) as ydl:
                info = ydl.extract_info(song["url"], download=False)
                stream_url = info["url"]
            source = discord.FFmpegPCMAudio(stream_url, executable="ffmpeg")
            vc.play(source, after=lambda e: asyncio.run_coroutine_threadsafe(self._after_song(ctx, e), self.bot.loop))
            await ctx.reply(f"Now playing: **{info.get('title', song['title'])}**")
        except Exception as e:
            await ctx.reply(f"Playback failed (demo): {e}")
            await self._play_next(ctx)

    async def _after_song(self, ctx, error):
        if error:
            await ctx.reply(f"Playback error: {error}")
        await asyncio.sleep(0.5)
        await self._play_next(ctx)

    @commands.command(name="pause")
    async def cmd_pause(self, ctx):
        if ctx.voice_client and ctx.voice_client.is_playing():
            ctx.voice_client.pause()
            await ctx.reply("Paused.")
        else:
            await ctx.reply("Nothing is playing.")

    @commands.command(name="resume")
    async def cmd_resume(self, ctx):
        if ctx.voice_client and ctx.voice_client.is_paused():
            ctx.voice_client.resume()
            await ctx.reply("Resumed.")
        else:
            await ctx.reply("Nothing to resume.")

    @commands.command(name="stop")
    async def cmd_stop(self, ctx):
        if ctx.voice_client:
            ctx.voice_client.stop()
            self.queues.pop(ctx.guild.id, None)
            await ctx.reply("Stopped and cleared queue.")
        else:
            await ctx.reply("Not connected.")

    @commands.command(name="skip")
    async def cmd_skip(self, ctx):
        if ctx.voice_client and ctx.voice_client.is_playing():
            ctx.voice_client.stop()
            await ctx.reply("Skipped current track.")
        else:
            await ctx.reply("No track to skip.")

    @commands.command(name="queue")
    async def cmd_queue(self, ctx):
        q = self._get_queue(ctx.guild.id)
        if not q:
            await ctx.reply("Queue is empty.")
            return
        msg = "\n".join(f"{i+1}. {item['title']}" for i, item in enumerate(q[:10]))
        await ctx.reply(f"Upcoming songs:\n{msg}")

    @commands.command(name="nowplaying")
    async def cmd_nowplaying(self, ctx):
        vc = ctx.voice_client
        if vc and vc.is_playing():
            await ctx.reply("Now playing (unknown title in demo).")
        else:
            await ctx.reply("Nothing is currently playing.")

    @commands.command(name="volume")
    async def cmd_volume(self, ctx, vol: int):
        if vol < 0 or vol > 200:
            await ctx.reply("Volume must be 0-200.")
            return
        # In this simple example we don't manage source volume; a real implementation would adjust filter
        await ctx.reply(f"Volume set to {vol}% (note: demo placeholder)")

    @commands.command(name="shuffle")
    async def cmd_shuffle(self, ctx):
        q = self._get_queue(ctx.guild.id)
        if not q:
            await ctx.reply("Queue empty.")
            return
        random = __import__("random")
        random.shuffle(q)
        await ctx.reply("Shuffled queue.")

    @commands.command(name="clearqueue")
    async def cmd_clearqueue(self, ctx):
        self.queues.pop(ctx.guild.id, None)
        await ctx.reply("Queue cleared.")

async def setup(bot):
    await bot.add_cog(Music(bot))
