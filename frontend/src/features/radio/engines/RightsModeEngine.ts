export type RightsMode = "remixable" | "playable_only" | "reference_only" | "blocked";

export interface RightsResult {
  mode: RightsMode;
  canRemix: boolean;
  canBroadcast: boolean;
  canExport: boolean;
  requiresAttribution: boolean;
  requiresLicense: boolean;
}

export const RIGHTS_RULES: Record<RightsMode, RightsResult> = {
  remixable: {
    mode: "remixable",
    canRemix: true,
    canBroadcast: true,
    canExport: true,
    requiresAttribution: false,
    requiresLicense: false,
  },
  playable_only: {
    mode: "playable_only",
    canRemix: false,
    canBroadcast: true,
    canExport: false,
    requiresAttribution: true,
    requiresLicense: false,
  },
  reference_only: {
    mode: "reference_only",
    canRemix: false,
    canBroadcast: false,
    canExport: false,
    requiresAttribution: true,
    requiresLicense: true,
  },
  blocked: {
    mode: "blocked",
    canRemix: false,
    canBroadcast: false,
    canExport: false,
    requiresAttribution: false,
    requiresLicense: false,
  },
};

export function getRightsMode(source: string): RightsMode {
  const lower = source.toLowerCase();

  if (lower.includes("lyrica") || lower.includes("sl_universal") || lower.includes("creator-owned")) {
    return "remixable";
  }

  if (lower.includes("external") || lower.includes("stream") || lower.includes("radio")) {
    return "playable_only";
  }

  if (lower.includes("reference") || lower.includes("demo") || lower.includes("sample")) {
    return "reference_only";
  }

  return "playable_only";
}

export function checkRights(source: string): RightsResult {
  const mode = getRightsMode(source);
  return RIGHTS_RULES[mode];
}
