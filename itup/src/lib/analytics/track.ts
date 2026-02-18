// Client-side event tracking utility
// Analytics should never break the app — all calls are fire-and-forget

export type EventCategory =
  | "page_view"
  | "button_click"
  | "form_submit"
  | "form_step"
  | "auth"
  | "booking"
  | "error";

export interface TrackEvent {
  category: EventCategory;
  action: string;
  label?: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(event: TrackEvent): Promise<void> {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...event,
        page:
          event.page ||
          (typeof window !== "undefined" ? window.location.pathname : ""),
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silently fail — analytics should never break the app
  }
}
