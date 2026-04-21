"""
Lyrica 3 Pro · Empire 1 — Discord Bot  (Phase 1 / endgame)
==========================================================
Slash-command surface into the Sonance Pro studio:

    /ignite genre:<> mood:<> lyrics:<>

Flow:
  1. User fires the command inside any Discord server the bot has joined.
  2. Bot authenticates against Empire 1 Ledger using a service account JWT
     (handle + password stored in .env) and POSTs /api/generate.
  3. Bot replies with a gold-accented Embed containing the Claude-forged
     title, SynthID DNA tag, cultural_matrix, qualitative biometrics, and
     the OpenAI-TTS vocal performance as a Discord audio attachment.
  4. A row of buttons:
       🔁 FLIP IT ON EMPIRE 1 → deep-links to the web PWA `/deck?dna=...`
       ♫ Open Stem Deck       → same PWA at `/deck?dna=...`
       📊 Bloodline           → `/universal?root=<dna>`

Run it:
  cd /app/discord_bot
  pip install -r requirements.txt
  cp ../.env.example .env   # fill in DISCORD_BOT_TOKEN, EMPIRE1_* creds
  python bot.py

Deploy it (Render/Railway/Fly):
  Use a *worker* service (not web), command: `python bot.py`. Persist .env
  secrets in the dashboard. See /app/DEPLOYMENT.md.
"""
from __future__ import annotations
import os
import asyncio
import logging
import io
from pathlib import Path

import httpx
import discord
from discord import app_commands
from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")
# fall back to the monorepo-root env when present
if not os.environ.get("DISCORD_BOT_TOKEN"):
    load_dotenv(ROOT.parent / ".env")

DISCORD_BOT_TOKEN  = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
DISCORD_GUILD_ID   = os.environ.get("DISCORD_GUILD_ID", "").strip()  # optional: fast dev sync

EMPIRE1_API_URL    = os.environ.get("EMPIRE1_API_URL", "http://localhost:8001").rstrip("/")
EMPIRE1_PUBLIC_URL = os.environ.get("EMPIRE1_PUBLIC_URL", "http://localhost:3000").rstrip("/")
EMPIRE1_BOT_HANDLE = os.environ.get("EMPIRE1_BOT_HANDLE", "discord.empire1")
EMPIRE1_BOT_PASS   = os.environ.get("EMPIRE1_BOT_PASS", "discord_bot_sovereign_7f")

GENRE_CHOICES = [
    "SGV Oldies", "LA Heritage", "Art Laboe Sunday Dedication", "SGV Backyard Party",
    "Nahuatl Ancestry", "West Coast G-Funk Piano", "Acoustic Requinto Weeping",
    "Corridos", "Oldies", "Street Bounce", "Cruising", "Resilience",
    "R&B", "Trap Soul", "Hip Hop", "Rap", "Drill",
    "Afrobeats", "UK Garage", "Jersey Club", "Bossa Nova",
]
MOOD_CHOICES = [
    "Late-Night Honesty", "Street Resilience", "Cruising Melancholy", "Defiant Bloom",
    "Sunday Dedication", "Porch-Light Grief", "Ancestral Fire", "Backyard Euphoria",
    "Soft Menace", "Requinto Lament", "After-Hours Prayer", "Lowrider Calm",
]

AMBER = 0xF5A524      # embed accent
PINK  = 0xFF5EAC

logging.basicConfig(level=logging.INFO, format="%(asctime)s · %(name)s · %(levelname)s · %(message)s")
log = logging.getLogger("empire1.discord")

intents = discord.Intents.default()
client = discord.Client(intents=intents)
tree   = app_commands.CommandTree(client)


# ------------------------------------------------------------
# Empire 1 Ledger authentication — cached JWT
# ------------------------------------------------------------

class EmpireAuth:
    def __init__(self):
        self._token: str | None = None
        self._client = httpx.AsyncClient(timeout=120.0)

    async def token(self) -> str:
        if self._token:
            return self._token
        # try login first (idempotent), then register if account doesn't exist
        r = await self._client.post(
            f"{EMPIRE1_API_URL}/api/auth/login",
            json={"handle": EMPIRE1_BOT_HANDLE, "password": EMPIRE1_BOT_PASS},
        )
        if r.status_code == 401:
            r = await self._client.post(
                f"{EMPIRE1_API_URL}/api/auth/register",
                json={"handle": EMPIRE1_BOT_HANDLE, "password": EMPIRE1_BOT_PASS},
            )
        r.raise_for_status()
        self._token = r.json()["token"]
        log.info("bot authenticated to Empire 1 Ledger")
        return self._token

    async def generate(self, genre: str, mood: str, lyrics: str) -> dict:
        t = await self.token()
        r = await self._client.post(
            f"{EMPIRE1_API_URL}/api/generate",
            headers={"Authorization": f"Bearer {t}"},
            json={"lyrics": lyrics, "genre": genre, "mood": mood},
        )
        r.raise_for_status()
        return r.json()

    async def download(self, url: str) -> bytes:
        # resolve relative /static/... URLs against backend origin
        if url.startswith("/"):
            url = f"{EMPIRE1_API_URL}{url}"
        r = await self._client.get(url)
        r.raise_for_status()
        return r.content

    async def close(self):
        await self._client.aclose()


auth = EmpireAuth()


# ------------------------------------------------------------
# UI — Button View with deep-links into the PWA
# ------------------------------------------------------------

def build_view(dna: str) -> discord.ui.View:
    view = discord.ui.View(timeout=None)
    view.add_item(discord.ui.Button(
        label="🔁 FLIP IT ON EMPIRE 1",
        style=discord.ButtonStyle.link,
        url=f"{EMPIRE1_PUBLIC_URL}/feed?flip={dna}",
    ))
    view.add_item(discord.ui.Button(
        label="♫ Open Stem Deck",
        style=discord.ButtonStyle.link,
        url=f"{EMPIRE1_PUBLIC_URL}/deck?dna={dna}",
    ))
    view.add_item(discord.ui.Button(
        label="📊 Bloodline",
        style=discord.ButtonStyle.link,
        url=f"{EMPIRE1_PUBLIC_URL}/universal?root={dna}",
    ))
    return view


# ------------------------------------------------------------
# /ignite slash command
# ------------------------------------------------------------

@tree.command(name="ignite", description="Ignite Soulfire — mint a sovereign AI track onto Empire 1.")
@app_commands.describe(
    genre="Cultural matrix (SGV Oldies, Corridos, Trap Soul, …)",
    mood="Emotional register (Late-Night Honesty, Porch-Light Grief, …)",
    lyrics="Raw lyric seed. Claude rewrites with biometric tags.",
)
@app_commands.choices(
    genre=[app_commands.Choice(name=g, value=g) for g in GENRE_CHOICES[:25]],
    mood=[app_commands.Choice(name=m, value=m) for m in MOOD_CHOICES],
)
async def ignite(interaction: discord.Interaction,
                 genre: app_commands.Choice[str],
                 mood:  app_commands.Choice[str],
                 lyrics: str):
    await interaction.response.defer(thinking=True)
    try:
        track = await auth.generate(genre.value, mood.value, lyrics[:800])
    except httpx.HTTPError as e:
        log.exception("generate failed")
        await interaction.followup.send(f"❌ Empire 1 rejected the mint: `{e}`", ephemeral=True)
        return

    dna  = track.get("dna_tag", "unknown")
    bio  = track.get("biometrics", {}) or {}
    stems = track.get("stems", []) or []
    vocal_stem = next((s for s in stems if s.get("name") == "Raw Human Pipes"), None)

    # pull the AI voice MP3 as a Discord file attachment (≤ 8MB for free servers)
    audio_file: discord.File | None = None
    if vocal_stem and vocal_stem.get("src"):
        try:
            data = await auth.download(vocal_stem["src"])
            if len(data) <= 8 * 1024 * 1024:
                audio_file = discord.File(io.BytesIO(data), filename=f"{dna}.mp3")
        except Exception as e:
            log.warning("voice download failed: %s", e)

    embed = discord.Embed(
        title=f"⚡ {track.get('title', 'Untitled Soulfire')}",
        description=(
            f"**Ignited by** `{interaction.user.display_name}`\n"
            f"**Cultural Matrix** · {track.get('cultural_matrix','—')}\n"
            f"**Mood** · {mood.value}"
        ),
        color=AMBER,
    )
    embed.add_field(name="DNA · SynthID", value=f"`{dna}`", inline=False)
    embed.add_field(name="Vulnerability", value=bio.get("vulnerability_level", "—"), inline=True)
    embed.add_field(name="Vocal Resonance", value=bio.get("resonance_quality",  "—"), inline=True)
    embed.add_field(name="Breath Profile",  value=bio.get("breath_profile",     "—"), inline=True)
    if bio.get("signature_glyph"):
        embed.add_field(name="Aether-Voice Signature", value=bio["signature_glyph"], inline=False)
    embed.set_footer(text="Pinned to Empire 1 Ledger · SLA-113 · Lyrica 3 Pro")

    view = build_view(dna)
    kwargs = {"embed": embed, "view": view}
    if audio_file:
        kwargs["file"] = audio_file
    await interaction.followup.send(**kwargs)


# ------------------------------------------------------------
# /bloodline — surface current top lineage chains
# ------------------------------------------------------------

@tree.command(name="bloodline", description="Top Empire 1 bloodlines — whose DNA is earning globally.")
async def bloodline(interaction: discord.Interaction):
    await interaction.response.defer(thinking=True)
    try:
        r = await auth._client.get(f"{EMPIRE1_API_URL}/api/leaderboard/bloodlines?limit=5")
        r.raise_for_status()
        data = r.json().get("bloodlines", [])
    except Exception as e:
        await interaction.followup.send(f"❌ Ledger unreachable: `{e}`", ephemeral=True)
        return

    embed = discord.Embed(
        title="📊 Empire 1 · Bloodline Leaderboard",
        description="Rolling 24h royalty mass by cultural lineage.",
        color=PINK,
    )
    for i, bl in enumerate(data, 1):
        embed.add_field(
            name=f"#{i} · {bl.get('root_title','—')} · ${bl.get('total_earnings_usd',0):.2f}",
            value=(f"root: `{bl.get('root_creator','?')}` · depth {bl.get('depth',0)}"
                   f" · {bl.get('total_streams',0):,} streams · {bl.get('total_flips',0)} flips\n"
                   f"[Open on Empire 1]({EMPIRE1_PUBLIC_URL}/universal?root={bl.get('root_dna','')})"),
            inline=False,
        )
    await interaction.followup.send(embed=embed)


# ------------------------------------------------------------
# Startup
# ------------------------------------------------------------

@client.event
async def on_ready():
    if DISCORD_GUILD_ID:
        guild = discord.Object(id=int(DISCORD_GUILD_ID))
        tree.copy_global_to(guild=guild)
        await tree.sync(guild=guild)
        log.info("slash commands synced to guild %s", DISCORD_GUILD_ID)
    else:
        await tree.sync()
        log.info("slash commands synced globally (may take up to 1h to propagate)")
    log.info("bot online as %s (%s)", client.user, client.user.id if client.user else "?")


def main():
    if not DISCORD_BOT_TOKEN:
        raise SystemExit("DISCORD_BOT_TOKEN missing. Paste into .env (see .env.example).")
    try:
        client.run(DISCORD_BOT_TOKEN)
    finally:
        asyncio.run(auth.close())


if __name__ == "__main__":
    main()
