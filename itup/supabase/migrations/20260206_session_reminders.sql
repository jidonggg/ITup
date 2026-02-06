-- =============================================
-- Session Reminders Table
-- Tracks sent reminders to avoid duplicates
-- Created: 2026-02-06
-- =============================================

-- Create session_reminders table
CREATE TABLE IF NOT EXISTS public.session_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  email_sent boolean DEFAULT false,
  alimtalk_sent boolean DEFAULT false,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),

  -- Ensure only one reminder of each type per booking
  UNIQUE (booking_id, reminder_type)
);

-- Add comment
COMMENT ON TABLE public.session_reminders IS 'Tracks sent session reminders to prevent duplicate notifications';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_session_reminders_booking ON public.session_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_type ON public.session_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_session_reminders_sent_at ON public.session_reminders(sent_at);

-- Enable RLS
ALTER TABLE public.session_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role only (cron jobs use service role)
CREATE POLICY "Service role can manage session_reminders"
  ON public.session_reminders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view (for debugging)
CREATE POLICY "Admins can view session_reminders"
  ON public.session_reminders
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_reminders TO service_role;
GRANT SELECT ON public.session_reminders TO authenticated;
