export type RoyaltyEventType =
  | "track_played"
  | "transition_performed"
  | "listener_input_submitted"
  | "remix_seed_created"
  | "user_lyrics_used"
  | "royalty_event_pending"
  | "creator_spotlight"
  | "dj_action";

export interface RoyaltyEvent {
  id: string;
  type: RoyaltyEventType;
  sessionId: string;
  stationId?: string;
  djId?: string;
  userId?: string;
  trackId?: string;
  trackTitle?: string;
  description: string;
  data?: Record<string, any>;
  timestamp: string;
  status: "logged" | "pending" | "cleared";
}

export function createRoyaltyEvent(event: Omit<RoyaltyEvent, "id" | "timestamp" | "status">): RoyaltyEvent {
  const full: RoyaltyEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    status: "logged",
  };

  saveEvent(full);
  return full;
}

function getEvents(): RoyaltyEvent[] {
  try {
    const raw = localStorage.getItem("sl_universal_royalty_events");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvent(event: RoyaltyEvent): void {
  const events = getEvents();
  events.unshift(event);
  localStorage.setItem("sl_universal_royalty_events", JSON.stringify(events.slice(0, 500)));
}

export function getRoyaltyEvents(sessionId?: string): RoyaltyEvent[] {
  const events = getEvents();
  if (sessionId) {
    return events.filter(e => e.sessionId === sessionId);
  }
  return events;
}

export function generateEventSummary(sessionId: string): string {
  const events = getRoyaltyEvents(sessionId);
  const played = events.filter(e => e.type === "track_played").length;
  const transitions = events.filter(e => e.type === "transition_performed").length;
  const listenerInputs = events.filter(e => e.type === "listener_input_submitted").length;
  const seeds = events.filter(e => e.type === "remix_seed_created").length;

  return [
    `Tracks played: ${played}`,
    `Transitions: ${transitions}`,
    `Listener inputs: ${listenerInputs}`,
    `Remix seeds: ${seeds}`,
    `Total events: ${events.length}`,
  ].join(" | ");
}
