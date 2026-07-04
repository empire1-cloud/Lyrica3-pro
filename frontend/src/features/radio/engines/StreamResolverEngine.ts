export interface StreamValidationResult {
  valid: boolean;
  mimeType?: string;
  supportsCors?: boolean;
  estimatedBitrate?: number;
  error?: string;
}

export interface StreamMetadata {
  name?: string;
  genre?: string;
  bitrate?: number;
  currentTrack?: string;
  listenerCount?: number;
  description?: string;
}

export async function validateStreamUrl(url: string): Promise<StreamValidationResult> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:", "icy:"].includes(parsed.protocol)) {
      return { valid: false, error: `Unsupported protocol: ${parsed.protocol}` };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      mode: "cors",
    });

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";
    const isAudio = contentType.startsWith("audio/") ||
      contentType.includes("mpeg") ||
      contentType.includes("ogg") ||
      contentType.includes("aac") ||
      contentType.includes("wav") ||
      contentType.includes("x-ms-wma") ||
      contentType.includes("x-scpls") ||
      contentType.includes("x-mpegurl") ||
      contentType.includes("x-aac");

    return {
      valid: isAudio || response.ok,
      mimeType: contentType || undefined,
      supportsCors: response.ok,
      error: isAudio ? undefined : `Content-Type "${contentType}" may not be playable audio`,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err.message || "Failed to validate stream URL",
    };
  }
}

export async function fetchIcyMetadata(url: string): Promise<StreamMetadata | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Icy-MetaData": "1" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const icyName = response.headers.get("icy-name");
    const icyGenre = response.headers.get("icy-genre");
    const icyBr = response.headers.get("icy-br");

    if (!icyName && !icyGenre && !icyBr) return null;

    return {
      name: icyName || undefined,
      genre: icyGenre || undefined,
      bitrate: icyBr ? parseInt(icyBr, 10) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildSlParcelUrl(stationName: string, streamUrl: string): string {
  return `secondlife:///app/parcel/media/url/${encodeURIComponent(streamUrl)}/name/${encodeURIComponent(stationName)}`;
}

export function formatExportLine(name: string, streamUrl: string): string {
  return `${name}|${streamUrl}`;
}
