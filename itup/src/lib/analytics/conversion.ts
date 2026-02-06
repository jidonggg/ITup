// =============================================
// Free Trial to Paid Conversion Analytics
// =============================================

export type ConversionEvent =
  | "free_trial_completed"
  | "conversion_cta_shown"
  | "conversion_cta_clicked"
  | "first_paid_booking"
  | "discount_code_applied";

export interface ConversionEventData {
  event: ConversionEvent;
  userId?: string;
  mentorId?: string;
  bookingId?: string;
  discountCode?: string;
  discountAmount?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track conversion funnel events
 * In production, this would send data to an analytics service
 */
export function trackConversionEvent(
  event: ConversionEvent,
  data?: Omit<ConversionEventData, "event" | "timestamp">
): void {
  const eventData: ConversionEventData = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Log for development
  if (process.env.NODE_ENV === "development") {
    console.log("[Conversion Tracking]", eventData);
  }

  // Store in localStorage for client-side tracking
  if (typeof window !== "undefined") {
    try {
      const existingEvents = JSON.parse(
        localStorage.getItem("conversion_events") || "[]"
      ) as ConversionEventData[];

      // Keep last 50 events
      const updatedEvents = [...existingEvents, eventData].slice(-50);
      localStorage.setItem("conversion_events", JSON.stringify(updatedEvents));
    } catch {
      // Ignore localStorage errors
    }
  }

  // In production, you would send this to your analytics service:
  // - Google Analytics 4
  // - Mixpanel
  // - Amplitude
  // - Custom analytics endpoint

  // Example: sendToAnalytics(eventData);
}

/**
 * Track when free trial session is completed
 */
export function trackFreeTrialCompleted(
  userId: string,
  mentorId: string,
  bookingId: string
): void {
  trackConversionEvent("free_trial_completed", {
    userId,
    mentorId,
    bookingId,
  });
}

/**
 * Track when conversion CTA is shown to user
 */
export function trackConversionCTAShown(
  userId?: string,
  mentorId?: string
): void {
  trackConversionEvent("conversion_cta_shown", {
    userId,
    mentorId,
  });
}

/**
 * Track when user clicks conversion CTA
 */
export function trackConversionCTAClicked(
  userId?: string,
  mentorId?: string,
  ctaType?: string
): void {
  trackConversionEvent("conversion_cta_clicked", {
    userId,
    mentorId,
    metadata: { ctaType },
  });
}

/**
 * Track first paid booking after free trial
 */
export function trackFirstPaidBooking(
  userId: string,
  mentorId: string,
  bookingId: string,
  amount: number
): void {
  trackConversionEvent("first_paid_booking", {
    userId,
    mentorId,
    bookingId,
    metadata: { amount },
  });
}

/**
 * Track discount code usage
 */
export function trackDiscountCodeApplied(
  userId: string,
  discountCode: string,
  discountAmount: number,
  bookingId?: string
): void {
  trackConversionEvent("discount_code_applied", {
    userId,
    bookingId,
    discountCode,
    discountAmount,
  });
}

/**
 * Get conversion rate from stored events (client-side only)
 */
export function getConversionStats(): {
  freeTrialsCompleted: number;
  ctaShown: number;
  ctaClicked: number;
  paidBookings: number;
  conversionRate: number;
} | null {
  if (typeof window === "undefined") return null;

  try {
    const events = JSON.parse(
      localStorage.getItem("conversion_events") || "[]"
    ) as ConversionEventData[];

    const freeTrialsCompleted = events.filter(
      (e) => e.event === "free_trial_completed"
    ).length;
    const ctaShown = events.filter(
      (e) => e.event === "conversion_cta_shown"
    ).length;
    const ctaClicked = events.filter(
      (e) => e.event === "conversion_cta_clicked"
    ).length;
    const paidBookings = events.filter(
      (e) => e.event === "first_paid_booking"
    ).length;

    const conversionRate =
      freeTrialsCompleted > 0
        ? (paidBookings / freeTrialsCompleted) * 100
        : 0;

    return {
      freeTrialsCompleted,
      ctaShown,
      ctaClicked,
      paidBookings,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  } catch {
    return null;
  }
}
