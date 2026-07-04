export type SourceType = "external_stream" | "lyrica_generated" | "ai_dj_room";

export interface StationPreset {
  id: string;
  name: string;
  genre: string[];
  sourceType: SourceType;
  streamUrl: string;
  homepage: string;
  provider: string;
  enabled: boolean;
  needsVerifiedStreamUrl: boolean;
  notes: string;
  artworkUrl?: string;
  slFormatLabel?: string;
}

export interface UserStation {
  id: string;
  name: string;
  genre: string[];
  streamUrl: string;
  provider?: string;
  notes?: string;
  createdAt: string;
}

const DEFAULT_PRESETS: StationPreset[] = [
  {
    id: "90s_hiphop_rnb",
    name: "90s Hip Hop & R&B Classics",
    genre: ["90s Hip-Hop", "90s R&B", "Old School", "Golden Era"],
    sourceType: "external_stream",
    streamUrl: "https://stream.zeno.fm/7aub8w8cc0hvv",
    homepage: "",
    provider: "Zeno/FM",
    enabled: true,
    needsVerifiedStreamUrl: false,
    notes: "90s Hip Hop & R&B Classics. Zeno mount ID: 7aub8w8cc0hvv.",
    artworkUrl: "",
    slFormatLabel: "90s Hip Hop & R&B Classics|https://stream.zeno.fm/7aub8w8cc0hvv",
  },
  {
    id: "rnb_sweet_jamz",
    name: "R&B Sweet Jamz",
    genre: ["R&B", "Soul", "90s Throwbacks", "Slow Jams"],
    sourceType: "external_stream",
    streamUrl: "https://stream.zeno.fm/8ez60szcc0hvv",
    homepage: "",
    provider: "Zeno/FM",
    enabled: true,
    needsVerifiedStreamUrl: false,
    notes: "Smooth R&B & 90s Throwbacks. Zeno mount ID: 8ez60szcc0hvv.",
    artworkUrl: "",
    slFormatLabel: "R&B Sweet Jamz|https://stream.zeno.fm/8ez60szcc0hvv",
  },
  {
    id: "samp_lowrider",
    name: "SA-MP LowRider Node",
    genre: ["Lowrider", "Oldies", "Funk", "Sweet Soul"],
    sourceType: "external_stream",
    streamUrl: "https://stream.zeno.fm/4eub8w8cc0hvv",
    homepage: "",
    provider: "Zeno/FM",
    enabled: true,
    needsVerifiedStreamUrl: false,
    notes: "SA-MP LowRider stream. Zeno mount ID: 4eub8w8cc0hvv.",
    artworkUrl: "",
    slFormatLabel: "SA-MP LowRider Node|https://stream.zeno.fm/4eub8w8cc0hvv",
  },
  {
    id: "street_military_radio",
    name: "Street Military Radio",
    genre: ["Hip-Hop", "Street", "Military", "Urban"],
    sourceType: "external_stream",
    streamUrl: "https://stream.zeno.fm/s8e60szcc0hvv",
    homepage: "",
    provider: "Zeno/FM",
    enabled: true,
    needsVerifiedStreamUrl: false,
    notes: "Street Military Radio. Zeno mount ID: s8e60szcc0hvv.",
    artworkUrl: "",
    slFormatLabel: "Street Military Radio|https://stream.zeno.fm/s8e60szcc0hvv",
  },
  {
    id: "oldie_goldie_hiphop",
    name: "Oldie Goldie Hip-Hop Studio",
    genre: ["Old School Hip-Hop", "Golden Era", "Boom Bap"],
    sourceType: "external_stream",
    streamUrl: "https://stream.zeno.fm/1w809t6zc0hvv",
    homepage: "",
    provider: "Zeno/FM",
    enabled: true,
    needsVerifiedStreamUrl: false,
    notes: "Oldie Goldie Hip-Hop Studio. Zeno mount ID: 1w809t6zc0hvv.",
    artworkUrl: "",
    slFormatLabel: "Oldie Goldie Hip-Hop Studio|https://stream.zeno.fm/1w809t6zc0hvv",
  },
  {
    id: "all_underground_hiphop",
    name: "All Underground Hip Hop Radio",
    genre: ["Underground Hip-Hop", "Indie Rap", "Lyrical"],
    sourceType: "external_stream",
    streamUrl: "https://stream.zeno.fm/9v76zshcc0hvv",
    homepage: "",
    provider: "Zeno/FM",
    enabled: true,
    needsVerifiedStreamUrl: false,
    notes: "All Underground Hip Hop Radio. Zeno mount ID: 9v76zshcc0hvv.",
    artworkUrl: "",
    slFormatLabel: "All Underground Hip Hop Radio|https://stream.zeno.fm/9v76zshcc0hvv",
  },
  {
    id: "what_radio",
    name: "WHAT?! Radio (Macchiato Media SL)",
    genre: ["Variety", "Mixed", "Second Life"],
    sourceType: "external_stream",
    streamUrl: "http://macchiatomedia.org:9119",
    homepage: "http://macchiatomedia.org",
    provider: "Macchiato Media SL",
    enabled: true,
    needsVerifiedStreamUrl: false,
    notes: "Direct stream URL on port 9119. Handshakes with Second Life land server relay network.",
    artworkUrl: "",
    slFormatLabel: "WHAT?! Radio|http://macchiatomedia.org:9119",
  },
  {
    id: "kandy_chrome_radio",
    name: "Kandy and Chrome Radio",
    genre: ["Oldies", "Sweet Soul", "Old School", "Funk", "Doo-wop"],
    sourceType: "external_stream",
    streamUrl: "https://stream.zeno.fm/f97a66vcc0hvv",
    homepage: "https://www.oldschoolandoldies.com",
    provider: "Zeno/FM — Producer Ai / #illpSquad",
    enabled: true,
    needsVerifiedStreamUrl: false,
    notes: "West Coast lowrider rap and sweet soul. Mixed by Producer Ai / Alex Ibarra — legendary lowrider compilation 'The Beginning'. Zeno mount ID: f97a66vcc0hvv.",
    artworkUrl: "",
    slFormatLabel: "Kandy and Chrome Radio|https://stream.zeno.fm/f97a66vcc0hvv",
  },
  {
    id: "lyrica_main",
    name: "Lyrica Radio",
    genre: ["Chicano Soul", "R&B", "Hip-Hop", "Regional", "Electronic"],
    sourceType: "lyrica_generated",
    streamUrl: "",
    homepage: "",
    provider: "Lyrica 3 Pro",
    enabled: true,
    needsVerifiedStreamUrl: false,
    notes: "Lyrica's own generated music stream. Powered by SL Universal engine.",
    slFormatLabel: "Lyrica Radio|lyrica://main",
  },
];

export function getPresets(): StationPreset[] {
  return DEFAULT_PRESETS;
}

export function getEnabledPresets(): StationPreset[] {
  return DEFAULT_PRESETS.filter(s => s.enabled || !s.needsVerifiedStreamUrl);
}

export function getPresetById(id: string): StationPreset | undefined {
  return DEFAULT_PRESETS.find(s => s.id === id);
}

export function getUserStations(): UserStation[] {
  try {
    const raw = localStorage.getItem("sl_universal_user_stations");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserStation(station: UserStation): void {
  const stations = getUserStations();
  stations.push(station);
  localStorage.setItem("sl_universal_user_stations", JSON.stringify(stations));
}

export function removeUserStation(id: string): void {
  const stations = getUserStations().filter(s => s.id !== id);
  localStorage.setItem("sl_universal_user_stations", JSON.stringify(stations));
}

export function updateUserStationStreamUrl(id: string, streamUrl: string): void {
  const stations = getUserStations().map(s =>
    s.id === id ? { ...s, streamUrl } : s
  );
  localStorage.setItem("sl_universal_user_stations", JSON.stringify(stations));
}

export function exportSlFormat(name: string, streamUrl: string): string {
  return `${name}|${streamUrl}`;
}
