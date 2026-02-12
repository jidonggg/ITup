/**
 * Session Reminder Scheduler
 *
 * GET /api/cron/session-reminders
 *
 * Designed to be called by external cron service (Vercel Cron, GitHub Actions, etc.)
 * Sends automated reminders before sessions:
 *   - 24 hours before session
 *   - 1 hour before session
 *
 * Security: Requires CRON_SECRET header for authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SITE_CONFIG } from "@/lib/site-config";
import { safeCompare } from "@/lib/security";

// =============================================
// Configuration
// =============================================

const CRON_SECRET = process.env.CRON_SECRET;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET; // outgoing calls only
const SITE_URL = SITE_CONFIG.url;
const ADMIN_EMAIL = SITE_CONFIG.email.admin;

// Reminder windows (in minutes)
const REMINDER_24H_WINDOW_MIN = 23 * 60 + 30; // 23.5 hours
const REMINDER_24H_WINDOW_MAX = 24 * 60 + 30; // 24.5 hours
const REMINDER_1H_WINDOW_MIN = 30; // 30 minutes
const REMINDER_1H_WINDOW_MAX = 90; // 90 minutes

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// =============================================
// Types
// =============================================

interface ReminderResult {
  bookingId: string;
  reminderType: "24h" | "1h";
  emailSent: boolean;
  alimtalkSent: boolean;
  error?: string;
}

interface SchedulerSummary {
  executedAt: string;
  reminders24h: {
    found: number;
    sent: number;
    failed: number;
  };
  reminders1h: {
    found: number;
    sent: number;
    failed: number;
  };
  errors: string[];
  details: ReminderResult[];
}

interface BookingWithDetails {
  id: string;
  scheduled_at: string;
  meeting_link: string | null;
  mentee_id: string | null;
  mentor_id: string;
  product_id: string | null;
  status: string;
}

// =============================================
// Helper Functions
// =============================================

function getServiceSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Verify cron request authentication (Authorization: Bearer CRON_SECRET only)
 */
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !CRON_SECRET) return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
  return safeCompare(token, CRON_SECRET);
}

/**
 * Check if reminder was already sent
 */
async function wasReminderSent(
  supabase: SupabaseClient,
  bookingId: string,
  reminderType: "24h" | "1h"
): Promise<boolean> {
  const { data, error } = await supabase
    .from("session_reminders")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("reminder_type", reminderType)
    .maybeSingle();

  if (error) {
    console.error(`[Reminder] Error checking reminder status:`, error);
    return false; // Err on the side of sending
  }

  return !!data;
}

/**
 * Mark reminder as sent
 */
async function markReminderSent(
  supabase: SupabaseClient,
  bookingId: string,
  reminderType: "24h" | "1h",
  emailSuccess: boolean,
  alimtalkSuccess: boolean,
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase.from("session_reminders").insert({
    booking_id: bookingId,
    reminder_type: reminderType,
    email_sent: emailSuccess,
    alimtalk_sent: alimtalkSuccess,
    error_message: errorMessage || null,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error(`[Reminder] Error marking reminder as sent:`, error);
  }
}

/**
 * Sleep helper for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send email notification with retry
 */
async function sendEmailReminder(
  bookingId: string,
  reminderType: "reminder_24h" | "reminder_1h"
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${SITE_URL}/api/email/booking-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": INTERNAL_API_SECRET || "",
        },
        body: JSON.stringify({
          type: reminderType,
          bookingId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true };
      }

      // Non-retryable error (4xx)
      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          error: result.error || `Email API returned ${response.status}`,
        };
      }

      // Retryable error
      if (attempt < MAX_RETRIES) {
        console.warn(`[Reminder] Email attempt ${attempt} failed, retrying...`);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      return {
        success: false,
        error: result.error || `Email API failed after ${MAX_RETRIES} attempts`,
      };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`[Reminder] Email attempt ${attempt} error, retrying...`, error);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

/**
 * Send Alimtalk notification with retry
 */
async function sendAlimtalkReminder(
  bookingId: string,
  reminderType: "session_reminder_24h" | "session_reminder_1h"
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${SITE_URL}/api/notification/alimtalk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": INTERNAL_API_SECRET || "",
        },
        body: JSON.stringify({
          type: reminderType,
          bookingId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true };
      }

      // Skip if Alimtalk not configured (dev mode)
      if (result.message?.includes("설정 미완료") || result.message?.includes("not configured")) {
        return { success: true }; // Treat as success in dev mode
      }

      // Non-retryable error
      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          error: result.error || `Alimtalk API returned ${response.status}`,
        };
      }

      // Retryable error
      if (attempt < MAX_RETRIES) {
        console.warn(`[Reminder] Alimtalk attempt ${attempt} failed, retrying...`);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      return {
        success: false,
        error: result.error || `Alimtalk API failed after ${MAX_RETRIES} attempts`,
      };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`[Reminder] Alimtalk attempt ${attempt} error, retrying...`, error);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

/**
 * Send admin notification on repeated failures
 */
async function notifyAdminOnFailures(
  supabase: SupabaseClient,
  errors: string[]
): Promise<void> {
  if (errors.length < 3) return; // Only notify on 3+ failures

  try {
    // Log to a notification table or send email
    console.error("[Reminder] Multiple failures detected, notifying admin:", errors);

    // Could also send an email here if needed
    // For now, we'll rely on logging and the admin dashboard
  } catch (error) {
    console.error("[Reminder] Failed to notify admin:", error);
  }
}

/**
 * Get bookings that need 24h reminders
 */
async function getBookingsFor24hReminder(
  supabase: SupabaseClient
): Promise<BookingWithDetails[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() + REMINDER_24H_WINDOW_MIN * 60 * 1000);
  const windowEnd = new Date(now.getTime() + REMINDER_24H_WINDOW_MAX * 60 * 1000);

  const { data, error } = await supabase
    .from("bookings")
    .select("id, scheduled_at, meeting_link, mentee_id, mentor_id, product_id, status")
    .in("status", ["confirmed", "paid"])
    .gte("scheduled_at", windowStart.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  if (error) {
    console.error("[Reminder] Error fetching 24h bookings:", error);
    return [];
  }

  return data || [];
}

/**
 * Get bookings that need 1h reminders
 */
async function getBookingsFor1hReminder(
  supabase: SupabaseClient
): Promise<BookingWithDetails[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() + REMINDER_1H_WINDOW_MIN * 60 * 1000);
  const windowEnd = new Date(now.getTime() + REMINDER_1H_WINDOW_MAX * 60 * 1000);

  const { data, error } = await supabase
    .from("bookings")
    .select("id, scheduled_at, meeting_link, mentee_id, mentor_id, product_id, status")
    .in("status", ["confirmed", "paid"])
    .gte("scheduled_at", windowStart.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  if (error) {
    console.error("[Reminder] Error fetching 1h bookings:", error);
    return [];
  }

  return data || [];
}

/**
 * Process a single reminder
 */
async function processReminder(
  supabase: SupabaseClient,
  booking: BookingWithDetails,
  reminderType: "24h" | "1h"
): Promise<ReminderResult> {
  const result: ReminderResult = {
    bookingId: booking.id,
    reminderType,
    emailSent: false,
    alimtalkSent: false,
  };

  // Check if already sent
  const alreadySent = await wasReminderSent(supabase, booking.id, reminderType);
  if (alreadySent) {
    return { ...result, error: "Already sent" };
  }

  // Send email
  const emailType = reminderType === "24h" ? "reminder_24h" : "reminder_1h";
  const emailResult = await sendEmailReminder(booking.id, emailType);
  result.emailSent = emailResult.success;

  // Send Alimtalk
  const alimtalkType = reminderType === "24h" ? "session_reminder_24h" : "session_reminder_1h";
  const alimtalkResult = await sendAlimtalkReminder(booking.id, alimtalkType);
  result.alimtalkSent = alimtalkResult.success;

  // Collect errors
  const errors: string[] = [];
  if (!emailResult.success && emailResult.error) {
    errors.push(`Email: ${emailResult.error}`);
  }
  if (!alimtalkResult.success && alimtalkResult.error) {
    errors.push(`Alimtalk: ${alimtalkResult.error}`);
  }

  if (errors.length > 0) {
    result.error = errors.join("; ");
  }

  // Mark as sent (even if partially failed, to avoid duplicate sends)
  await markReminderSent(
    supabase,
    booking.id,
    reminderType,
    result.emailSent,
    result.alimtalkSent,
    result.error
  );

  return result;
}

// =============================================
// API Handler
// =============================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify authentication
  if (!verifyCronAuth(request)) {
    console.warn("[Reminder] Unauthorized cron request");
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    console.error("[Reminder] Database not configured");
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const summary: SchedulerSummary = {
    executedAt: new Date().toISOString(),
    reminders24h: { found: 0, sent: 0, failed: 0 },
    reminders1h: { found: 0, sent: 0, failed: 0 },
    errors: [],
    details: [],
  };

  try {
    // Process 24h reminders
    const bookings24h = await getBookingsFor24hReminder(supabase);
    summary.reminders24h.found = bookings24h.length;

    for (const booking of bookings24h) {
      const result = await processReminder(supabase, booking, "24h");
      summary.details.push(result);

      if (result.error && result.error !== "Already sent") {
        summary.reminders24h.failed++;
        summary.errors.push(`24h/${booking.id}: ${result.error}`);
      } else if (!result.error) {
        summary.reminders24h.sent++;
      }
    }

    // Process 1h reminders
    const bookings1h = await getBookingsFor1hReminder(supabase);
    summary.reminders1h.found = bookings1h.length;

    for (const booking of bookings1h) {
      const result = await processReminder(supabase, booking, "1h");
      summary.details.push(result);

      if (result.error && result.error !== "Already sent") {
        summary.reminders1h.failed++;
        summary.errors.push(`1h/${booking.id}: ${result.error}`);
      } else if (!result.error) {
        summary.reminders1h.sent++;
      }
    }

    // Notify admin on repeated failures
    if (summary.errors.length >= 3) {
      await notifyAdminOnFailures(supabase, summary.errors);
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Reminder] Completed in ${duration}ms: 24h=${summary.reminders24h.sent}/${summary.reminders24h.found}, 1h=${summary.reminders1h.sent}/${summary.reminders1h.found}`
    );

    return NextResponse.json({
      success: true,
      summary: {
        executedAt: summary.executedAt,
        duration: `${duration}ms`,
        reminders24h: summary.reminders24h,
        reminders1h: summary.reminders1h,
        totalErrors: summary.errors.length,
      },
    });
  } catch (error) {
    console.error("[Reminder] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        summary,
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
