# Empire 1 · Discord Bot

Slash-command bridge between Discord and the Sonance Pro studio.

## 1 · Get your bot credentials
1. <https://discord.com/developers/applications> → **New Application** → name it *Lyrica 3 Pro*
2. **Bot** tab → *Add Bot* → reveal & copy the **Token**
3. **OAuth2 → URL Generator** → scopes: `bot`, `applications.commands` → permissions: *Send Messages*, *Embed Links*, *Attach Files*, *Use Slash Commands* → open the generated URL to **invite the bot** into your server
4. (optional, for dev) grab your server ID by right-clicking the guild with Developer Mode on → **Copy Server ID**

## 2 · Configure .env
```bash
cp ../.env.example .env
# then fill in:
DISCORD_BOT_TOKEN=MTxxx...your-bot-token...
DISCORD_GUILD_ID=123456789012345678     # optional; speeds up /ignite registration during dev
EMPIRE1_API_URL=https://api.lyrica3pro.com     # your deployed backend
EMPIRE1_PUBLIC_URL=https://lyrica3pro.com      # your deployed frontend
EMPIRE1_BOT_HANDLE=discord.empire1             # service account — auto-registered on first run
EMPIRE1_BOT_PASS=change_me_please_12345
```

## 3 · Run locally
```bash
pip install -r requirements.txt
python bot.py
```

## 4 · Usage inside Discord
```
/ignite genre:SGV Oldies mood:Porch-Light Grief lyrics:east of the freeway wildflowers in the cracks
/bloodline
```

The bot replies with:
- Claude-forged title + cultural subtext
- `SynthID` DNA tag
- Qualitative biometrics (Vulnerability, Vocal Resonance, Breath, Signature Glyph)
- The **AI vocal performance** as an MP3 attachment (OpenAI TTS via the Universal Key)
- Three buttons:
  - 🔁 **FLIP IT ON EMPIRE 1** → `/feed?flip=<dna>`
  - ♫ **Open Stem Deck** → `/deck?dna=<dna>`
  - 📊 **Bloodline** → `/universal?root=<dna>`

## 5 · Deploy as a worker
Render / Railway / Fly — use a **worker** service (not web), start command:
```
python bot.py
```
Persist the `.env` keys in the host's secret store. No port to expose.
