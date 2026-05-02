"""
Lyrica 3 Pro · Empire 1 — Discord Bot  (Phase 2 / endgame)
==========================================================
Slash-command surface into the Sonance Pro studio:

    /ignite   genre:<> mood:<> lyrics:<>   — full Soulfire mint
    /soulfire lyrics:<>                    — quick mint (auto cultural matrix)
    /remix    dna:<> title:<> genre:<>     — flip an existing track by DNA tag
    /listen_party                          — live top-5 tracks listening session
    /royalties                             — caller's wallet + royalty chain snapshot
    /bloodline                             — top 5 bloodline leaderboard

Flow:
  1. User fires the command inside any Discord server the bot has joined.
  2. Bot authenticates against Empire 1 Ledger using a service account JWT
     (handle + password stored in .env) and POSTs /api/generate.
  3. Bot replies with a gold-accented Embed containing the Claude-forged
     title, SynthID DNA tag, cultural_matrix, qualitative biometrics, and
     the OpenAI-TTS vocal performance as a Discord audio attachment.
  4. A row of buttons:
       🔁 FLIP IT ON EMPIRE 1 → deep-links to the web PWA `/feed?flip=...`
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
from aiohttp import web
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
# /soulfire — quick mint (auto cultural matrix, no genre/mood picker)
# ------------------------------------------------------------

@tree.command(name="soulfire", description="Quick Soulfire mint — drop lyrics, Empire 1 handles the rest.")
@app_commands.describe(lyrics="Raw lyric seed — Claude rewrites with auto cultural matrix.")
async def soulfire(interaction: discord.Interaction, lyrics: str):
    await interaction.response.defer(thinking=True)
    try:
        track = await auth.generate("Auto", "Auto", lyrics[:800])
    except httpx.HTTPError as e:
        log.exception("soulfire generate failed")
        await interaction.followup.send(f"❌ Soulfire mint failed: `{e}`", ephemeral=True)
        return

    dna  = track.get("dna_tag", "unknown")
    bio  = track.get("biometrics", {}) or {}
    stems = track.get("stems", []) or []
    vocal_stem = next((s for s in stems if s.get("name") == "Raw Human Pipes"), None)

    audio_file: discord.File | None = None
    if vocal_stem and vocal_stem.get("src"):
        try:
            data = await auth.download(vocal_stem["src"])
            if len(data) <= 8 * 1024 * 1024:
                audio_file = discord.File(io.BytesIO(data), filename=f"{dna}.mp3")
        except Exception as e:
            log.warning("voice download failed: %s", e)

    embed = discord.Embed(
        title=f"🔥 {track.get('title', 'Untitled Soulfire')}",
        description=(
            f"**Ignited by** `{interaction.user.display_name}`\n"
            f"**Cultural Matrix** · {track.get('cultural_matrix', '—')} _(auto-assigned)_"
        ),
        color=AMBER,
    )
    embed.add_field(name="DNA · SynthID", value=f"`{dna}`", inline=False)
    embed.add_field(name="Vulnerability",   value=bio.get("vulnerability_level", "—"), inline=True)
    embed.add_field(name="Vocal Resonance", value=bio.get("resonance_quality",   "—"), inline=True)
    embed.add_field(name="Breath Profile",  value=bio.get("breath_profile",      "—"), inline=True)
    embed.set_footer(text="Soulfire Quick Mint · SLA-113 · Lyrica 3 Pro")

    view = build_view(dna)
    kwargs = {"embed": embed, "view": view}
    if audio_file:
        kwargs["file"] = audio_file
    await interaction.followup.send(**kwargs)


# ------------------------------------------------------------
# /remix — flip an existing track by its DNA tag
# ------------------------------------------------------------

@tree.command(name="remix", description="Flip an existing Empire 1 track by DNA tag.")
@app_commands.describe(
    dna="SynthID DNA tag of the track to flip (e.g. CVF-0042-LA-SGV)",
    title="Title for the remix",
    genre="Genre for the flip (optional — leave blank to inherit from source)",
)
@app_commands.choices(genre=[app_commands.Choice(name=g, value=g) for g in GENRE_CHOICES[:25]])
async def remix(
    interaction: discord.Interaction,
    dna: str,
    title: str,
    genre: app_commands.Choice[str] | None = None,
):
    await interaction.response.defer(thinking=True)
    try:
        t = await auth.token()
        payload: dict = {"parent_dna": dna, "title": title}
        if genre:
            payload["genre"] = genre.value
        r = await auth._client.post(
            f"{EMPIRE1_API_URL}/api/flip",
            headers={"Authorization": f"Bearer {t}"},
            json=payload,
        )
        r.raise_for_status()
        track = r.json()
    except httpx.HTTPError as e:
        log.exception("remix/flip failed")
        await interaction.followup.send(f"❌ Flip failed: `{e}`", ephemeral=True)
        return

    new_dna   = track.get("dna_tag", "unknown")
    royalties = track.get("royalty_chain", {}) or {}

    embed = discord.Embed(
        title=f"🔁 {track.get('title', title)} _(Remix)_",
        description=(
            f"**Flipped by** `{interaction.user.display_name}`\n"
            f"**Source DNA** · `{dna}`\n"
            f"**New DNA** · `{new_dna}`"
        ),
        color=PINK,
    )
    if royalties:
        chain_lines = "\n".join(
            f"`{creator}` → **{pct:.0%}**" for creator, pct in list(royalties.items())[:5]
        )
        embed.add_field(name="Royalty Chain", value=chain_lines or "—", inline=False)
    embed.add_field(name="Rule Applied", value=track.get("rule_applied", "—"), inline=True)
    embed.set_footer(text="Flip-It Protocol · RULE_003 · SLA-113 · Lyrica 3 Pro")

    await interaction.followup.send(embed=embed, view=build_view(new_dna))


# ------------------------------------------------------------
# /listen_party — live top-5 tracks listening session
# ------------------------------------------------------------

@tree.command(name="listen_party", description="Start a live listen party — top 5 tracks playing now on Empire 1.")
async def listen_party(interaction: discord.Interaction):
    await interaction.response.defer(thinking=True)
    try:
        r = await auth._client.get(f"{EMPIRE1_API_URL}/api/tracks?limit=5&sort=streams")
        r.raise_for_status()
        tracks = r.json().get("tracks", []) or r.json() if isinstance(r.json(), list) else []
    except Exception as e:
        await interaction.followup.send(f"❌ Empire 1 feed unreachable: `{e}`", ephemeral=True)
        return

    embed = discord.Embed(
        title="🎧 Empire 1 · Live Listen Party",
        description=(
            f"**Hosted by** `{interaction.user.display_name}`\n"
            "Top 5 tracks heating up right now. Hit **FLIP IT** on any track to enter the bloodline."
        ),
        color=AMBER,
    )
    for i, tr in enumerate(tracks[:5], 1):
        dna    = tr.get("dna_tag", "—")
        matrix = tr.get("cultural_matrix", "—")
        plays  = tr.get("play_count", tr.get("streams", 0))
        embed.add_field(
            name=f"#{i} · {tr.get('title', 'Untitled')}",
            value=(
                f"Cultural Matrix · {matrix}\n"
                f"DNA · `{dna}` · {plays:,} plays\n"
                f"[▶ Open on Empire 1]({EMPIRE1_PUBLIC_URL}/universal?root={dna})"
            ),
            inline=False,
        )
    embed.set_footer(text="SL Universal Pulse Stream · SLA-113 · Lyrica 3 Pro")

    # build per-track flip buttons (up to 5, max 5 buttons per view)
    view = discord.ui.View(timeout=None)
    for tr in tracks[:5]:
        dna = tr.get("dna_tag", "")
        if dna:
            view.add_item(discord.ui.Button(
                label=f"🔁 {tr.get('title','—')[:20]}",
                style=discord.ButtonStyle.link,
                url=f"{EMPIRE1_PUBLIC_URL}/feed?flip={dna}",
            ))

    await interaction.followup.send(embed=embed, view=view)


# ------------------------------------------------------------
# /royalties — caller's wallet + royalty chain snapshot
# ------------------------------------------------------------

@tree.command(name="royalties", description="Your Empire 1 royalty wallet + live chain snapshot.")
async def royalties(interaction: discord.Interaction):
    await interaction.response.defer(thinking=True, ephemeral=True)
    try:
        t = await auth.token()
        r = await auth._client.get(
            f"{EMPIRE1_API_URL}/api/royalties/me",
            headers={"Authorization": f"Bearer {t}"},
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        await interaction.followup.send(f"❌ Royalty ledger unreachable: `{e}`", ephemeral=True)
        return

    wallet  = data.get("wallet", {}) or {}
    chain   = data.get("active_chains", []) or []
    balance = wallet.get("balance_usd", 0.0)
    pending = wallet.get("pending_usd", 0.0)
    total   = wallet.get("total_earned_usd", 0.0)

    embed = discord.Embed(
        title="💰 Your Empire 1 Royalty Wallet",
        description=f"Snapshot for `{interaction.user.display_name}`",
        color=AMBER,
    )
    embed.add_field(name="Balance",       value=f"**${balance:,.2f}**",  inline=True)
    embed.add_field(name="Pending",       value=f"${pending:,.2f}",       inline=True)
    embed.add_field(name="Total Earned",  value=f"${total:,.2f}",         inline=True)

    if chain:
        embed.add_field(name="\u200b", value="**Active Royalty Chains**", inline=False)
        for ch in chain[:5]:
            root_dna = ch.get("root_dna", "—")
            pct      = ch.get("your_share", 0.0)
            earned   = ch.get("earned_usd", 0.0)
            rule     = ch.get("rule_applied", "—")
            embed.add_field(
                name=f"`{root_dna}` · {pct:.0%} share",
                value=f"Earned **${earned:,.2f}** · Rule `{rule}`",
                inline=False,
            )
    embed.set_footer(text="RULE_001/002/003 · Royalty Chain Engine · SLA-113 · Lyrica 3 Pro")

    view = discord.ui.View(timeout=None)
    view.add_item(discord.ui.Button(
        label="💳 Open Full Wallet",
        style=discord.ButtonStyle.link,
        url=f"{EMPIRE1_PUBLIC_URL}/wallet",
    ))
    await interaction.followup.send(embed=embed, view=view, ephemeral=True)


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

    async def _health(_req):
        return web.json_response({"ok": True, "bot": str(client.user) if client.is_ready() else None})

    async def run():
        # tiny aiohttp server on $PORT for Cloud Run / Render health checks
        port = int(os.environ.get("PORT", "8080"))
        app = web.Application()
        app.router.add_get("/", _health)
        runner = web.AppRunner(app)
        await runner.setup()
        await web.TCPSite(runner, "0.0.0.0", port).start()
        log.info("health endpoint listening on :%d", port)

        try:
            await client.start(DISCORD_BOT_TOKEN)
        finally:
            await auth.close()
            await runner.cleanup()

    asyncio.run(run())


if __name__ == "__main__":
    main()
