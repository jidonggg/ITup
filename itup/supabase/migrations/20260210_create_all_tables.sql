-- =============================================
-- 전체 테이블 생성 마이그레이션
-- 2026-02-10
-- CREATE TABLE IF NOT EXISTS 사용 (기존 테이블 보존)
-- =============================================

-- =============================================
-- 1. verified_domains (이메일 도메인 인증용)
-- =============================================
CREATE TABLE IF NOT EXISTS public.verified_domains (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL UNIQUE,
  company_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.verified_domains ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verified_domains' AND policyname = 'Anyone can read verified_domains') THEN
    EXECUTE 'CREATE POLICY "Anyone can read verified_domains" ON public.verified_domains FOR SELECT USING (true)';
  END IF;
END $$;

-- =============================================
-- 2. products (멘토 상품)
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('coffee_chat', 'document_review', 'mock_interview', 'free_trial')),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  price integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_mentor ON public.products(mentor_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone can read active products') THEN
    EXECUTE 'CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT USING (is_active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Mentors can manage own products') THEN
    EXECUTE 'CREATE POLICY "Mentors can manage own products" ON public.products FOR ALL USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()))';
  END IF;
END $$;

-- =============================================
-- 3. mentor_schedules (멘토 가용 시간)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mentor_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_schedules_mentor ON public.mentor_schedules(mentor_id);

ALTER TABLE public.mentor_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_schedules' AND policyname = 'Anyone can read active schedules') THEN
    EXECUTE 'CREATE POLICY "Anyone can read active schedules" ON public.mentor_schedules FOR SELECT USING (is_active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_schedules' AND policyname = 'Mentors can manage own schedules') THEN
    EXECUTE 'CREATE POLICY "Mentors can manage own schedules" ON public.mentor_schedules FOR ALL USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()))';
  END IF;
END $$;

-- =============================================
-- 4. mentor_unavailable (멘토 불가 날짜)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mentor_unavailable (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_unavailable_mentor ON public.mentor_unavailable(mentor_id);

ALTER TABLE public.mentor_unavailable ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_unavailable' AND policyname = 'Anyone can read unavailable dates') THEN
    EXECUTE 'CREATE POLICY "Anyone can read unavailable dates" ON public.mentor_unavailable FOR SELECT USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_unavailable' AND policyname = 'Mentors can manage own unavailable') THEN
    EXECUTE 'CREATE POLICY "Mentors can manage own unavailable" ON public.mentor_unavailable FOR ALL USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()))';
  END IF;
END $$;

-- =============================================
-- 5. consultations (레거시 상담 신청)
-- =============================================
CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  user_phone text NOT NULL,
  user_email text NOT NULL,
  interest text,
  product_type text CHECK (product_type IN ('coffee', 'resume', 'interview')),
  preferred_time text,
  message text,
  payment_id text,
  expected_amount integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  has_review boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 기존 테이블에 누락 컬럼 추가
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS expected_amount integer;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS has_review boolean DEFAULT false;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS product_type text;

CREATE INDEX IF NOT EXISTS idx_consultations_mentor ON public.consultations(mentor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consultations' AND policyname = 'Users can read own consultations') THEN
    EXECUTE 'CREATE POLICY "Users can read own consultations" ON public.consultations FOR SELECT USING (user_id = auth.uid() OR mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consultations' AND policyname = 'Users can insert consultations') THEN
    EXECUTE 'CREATE POLICY "Users can insert consultations" ON public.consultations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consultations' AND policyname = 'Admins can manage all consultations') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all consultations" ON public.consultations FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 6. bookings (예약)
-- =============================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded')),

  -- 멘티 신청 정보
  mentee_intro text,
  mentee_goal text,
  meeting_link text,
  attached_files jsonb DEFAULT '[]'::jsonb,

  -- 결제 정보
  payment_key text,
  order_id text,
  amount integer NOT NULL DEFAULT 0,
  platform_fee integer NOT NULL DEFAULT 0,
  mentor_amount integer NOT NULL DEFAULT 0,
  payment_method text,
  paid_at timestamptz,

  -- 취소 정보
  cancelled_at timestamptz,
  cancelled_by text CHECK (cancelled_by IN ('mentee', 'mentor', 'admin')),
  cancel_reason text,
  refund_amount integer NOT NULL DEFAULT 0,
  refunded_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_mentee ON public.bookings(mentee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor ON public.bookings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON public.bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON public.bookings(order_id);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Users can read own bookings') THEN
    EXECUTE 'CREATE POLICY "Users can read own bookings" ON public.bookings FOR SELECT USING (mentee_id = auth.uid() OR mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Users can insert bookings') THEN
    EXECUTE 'CREATE POLICY "Users can insert bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Users can update own bookings') THEN
    EXECUTE 'CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (mentee_id = auth.uid() OR mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can manage all bookings') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 7. payments (결제)
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  order_id text NOT NULL,
  payment_key text,
  amount integer NOT NULL,
  platform_fee integer,
  mentor_amount integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partial_refunded')),
  product_type text,
  bundle_type text,
  payment_method text,
  approved_at timestamptz,
  receipt_url text,
  raw_response jsonb,
  refund_reason text,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can read own payments') THEN
    EXECUTE 'CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can manage all payments') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 8. session_confirmations (세션 확인)
-- =============================================
CREATE TABLE IF NOT EXISTS public.session_confirmations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,

  mentor_confirmed text CHECK (mentor_confirmed IN ('completed', 'mentee_noshow', 'issue')),
  mentor_confirmed_at timestamptz,
  mentor_note text,

  mentee_confirmed text CHECK (mentee_confirmed IN ('completed', 'mentor_noshow', 'issue')),
  mentee_confirmed_at timestamptz,
  mentee_note text,

  final_status text CHECK (final_status IN ('completed', 'mentee_noshow', 'mentor_noshow', 'disputed')),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_confirmations_booking ON public.session_confirmations(booking_id);

ALTER TABLE public.session_confirmations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_confirmations' AND policyname = 'Users can read related confirmations') THEN
    EXECUTE 'CREATE POLICY "Users can read related confirmations" ON public.session_confirmations FOR SELECT USING (
      booking_id IN (SELECT id FROM public.bookings WHERE mentee_id = auth.uid() OR mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()))
    )';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_confirmations' AND policyname = 'Users can manage related confirmations') THEN
    EXECUTE 'CREATE POLICY "Users can manage related confirmations" ON public.session_confirmations FOR ALL USING (
      booking_id IN (SELECT id FROM public.bookings WHERE mentee_id = auth.uid() OR mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()))
    )';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_confirmations' AND policyname = 'Admins can manage all confirmations') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all confirmations" ON public.session_confirmations FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 9. reviews (리뷰)
-- =============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_mentor ON public.reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can read reviews') THEN
    EXECUTE 'CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can insert own reviews') THEN
    EXECUTE 'CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can update own reviews') THEN
    EXECUTE 'CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (user_id = auth.uid())';
  END IF;
END $$;

-- =============================================
-- 10. mentor_feedbacks (멘토 → 멘티 피드백)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mentor_feedbacks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  mentee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_feedbacks_booking ON public.mentor_feedbacks(booking_id);
CREATE INDEX IF NOT EXISTS idx_mentor_feedbacks_mentor ON public.mentor_feedbacks(mentor_id);

ALTER TABLE public.mentor_feedbacks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_feedbacks' AND policyname = 'Users can read own feedbacks') THEN
    EXECUTE 'CREATE POLICY "Users can read own feedbacks" ON public.mentor_feedbacks FOR SELECT USING (
      mentee_id = auth.uid() OR mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
    )';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_feedbacks' AND policyname = 'Mentors can insert feedbacks') THEN
    EXECUTE 'CREATE POLICY "Mentors can insert feedbacks" ON public.mentor_feedbacks FOR INSERT WITH CHECK (
      mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
    )';
  END IF;
END $$;

-- =============================================
-- 11. noshow_records (노쇼 기록)
-- =============================================
CREATE TABLE IF NOT EXISTS public.noshow_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  noshow_type text NOT NULL CHECK (noshow_type IN ('mentee_noshow', 'mentor_noshow')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_noshow_records_user ON public.noshow_records(user_id);

ALTER TABLE public.noshow_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'noshow_records' AND policyname = 'Admins can manage noshow_records') THEN
    EXECUTE 'CREATE POLICY "Admins can manage noshow_records" ON public.noshow_records FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 12. mentor_bank_accounts (멘토 정산 계좌)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mentor_bank_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  is_default boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_bank_accounts_mentor ON public.mentor_bank_accounts(mentor_id);

ALTER TABLE public.mentor_bank_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_bank_accounts' AND policyname = 'Mentors can manage own bank accounts') THEN
    EXECUTE 'CREATE POLICY "Mentors can manage own bank accounts" ON public.mentor_bank_accounts FOR ALL USING (
      mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
    )';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_bank_accounts' AND policyname = 'Admins can manage all bank accounts') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all bank accounts" ON public.mentor_bank_accounts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 13. settlements (정산)
-- =============================================
CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  bank_account_id uuid REFERENCES public.mentor_bank_accounts(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  booking_ids uuid[] DEFAULT '{}',
  total_amount integer NOT NULL DEFAULT 0,
  platform_fee integer NOT NULL DEFAULT 0,
  settlement_amount integer NOT NULL DEFAULT 0,
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.15,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  failure_reason text,
  settled_at timestamptz,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlements_mentor ON public.settlements(mentor_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.settlements(status);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settlements' AND policyname = 'Mentors can read own settlements') THEN
    EXECUTE 'CREATE POLICY "Mentors can read own settlements" ON public.settlements FOR SELECT USING (
      mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
    )';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settlements' AND policyname = 'Admins can manage all settlements') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all settlements" ON public.settlements FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 14. verification_codes (이메일 인증 코드)
-- =============================================
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 기존 테이블에 누락 컬럼 추가
ALTER TABLE public.verification_codes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.verification_codes ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON public.verification_codes(expires_at);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='verification_codes' AND column_name='user_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_codes' AND policyname = 'Users can read own verification codes') THEN
      EXECUTE 'CREATE POLICY "Users can read own verification codes" ON public.verification_codes FOR SELECT USING (user_id = auth.uid())';
    END IF;
  END IF;
END $$;

-- =============================================
-- 15. newsletter_subscriptions (뉴스레터)
-- =============================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 기존 테이블에 누락 컬럼 추가
ALTER TABLE public.newsletter_subscriptions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'newsletter_subscriptions' AND policyname = 'Anyone can subscribe') THEN
    EXECUTE 'CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscriptions FOR INSERT WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'newsletter_subscriptions' AND policyname = 'Admins can manage subscriptions') THEN
    EXECUTE 'CREATE POLICY "Admins can manage subscriptions" ON public.newsletter_subscriptions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 16. business_inquiries (기업 문의)
-- =============================================
CREATE TABLE IF NOT EXISTS public.business_inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  employee_count text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 기존 테이블에 누락 컬럼 추가
ALTER TABLE public.business_inquiries ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.business_inquiries ADD COLUMN IF NOT EXISTS employee_count text;
ALTER TABLE public.business_inquiries ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_inquiries' AND policyname = 'Anyone can submit inquiry') THEN
    EXECUTE 'CREATE POLICY "Anyone can submit inquiry" ON public.business_inquiries FOR INSERT WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_inquiries' AND policyname = 'Admins can manage inquiries') THEN
    EXECUTE 'CREATE POLICY "Admins can manage inquiries" ON public.business_inquiries FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 17. session_reminders (세션 리마인더)
-- =============================================
CREATE TABLE IF NOT EXISTS public.session_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  email_sent boolean DEFAULT false,
  alimtalk_sent boolean DEFAULT false,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (booking_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_session_reminders_booking ON public.session_reminders(booking_id);

ALTER TABLE public.session_reminders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_reminders' AND policyname = 'Admins can view session_reminders') THEN
    EXECUTE 'CREATE POLICY "Admins can view session_reminders" ON public.session_reminders FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =============================================
-- 18. DB 함수: get_noshow_count
-- =============================================
CREATE OR REPLACE FUNCTION public.get_noshow_count(p_user_id uuid, p_months integer DEFAULT 6)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM public.noshow_records
  WHERE user_id = p_user_id
    AND created_at >= now() - (p_months || ' months')::interval;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================
-- 19. DB 함수: cleanup_expired_verification_codes
-- =============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void AS $$
  DELETE FROM public.verification_codes WHERE expires_at < now();
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- 20. DB 함수: auto_complete_unconfirmed_sessions
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_complete_unconfirmed_sessions()
RETURNS void AS $$
  UPDATE public.bookings
  SET status = 'completed', updated_at = now()
  WHERE status = 'confirmed'
    AND scheduled_at < now() - interval '48 hours';
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- 21. View: mentor_stats
-- =============================================
CREATE OR REPLACE VIEW public.mentor_stats AS
SELECT
  m.id AS mentor_id,
  m.name,
  m.company,
  COALESCE(b.completed_sessions, 0) AS completed_sessions,
  COALESCE(r.review_count, 0) AS review_count,
  COALESCE(r.avg_rating, 0) AS avg_rating,
  p.min_price,
  p.max_price
FROM public.mentors m
LEFT JOIN (
  SELECT mentor_id, COUNT(*) AS completed_sessions
  FROM public.bookings WHERE status = 'completed'
  GROUP BY mentor_id
) b ON b.mentor_id = m.id
LEFT JOIN (
  SELECT mentor_id, COUNT(*) AS review_count, ROUND(AVG(rating), 1) AS avg_rating
  FROM public.reviews
  GROUP BY mentor_id
) r ON r.mentor_id = m.id
LEFT JOIN (
  SELECT mentor_id, MIN(price) AS min_price, MAX(price) AS max_price
  FROM public.products WHERE is_active = true
  GROUP BY mentor_id
) p ON p.mentor_id = m.id
WHERE m.is_approved = true;

-- =============================================
-- 22. updated_at 자동 갱신 트리거
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['products', 'bookings', 'session_confirmations', 'mentor_bank_accounts', 'settlements'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', tbl, tbl);
      EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- =============================================
-- 23. service_role 권한 부여
-- =============================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'products', 'mentor_schedules', 'mentor_unavailable', 'bookings',
    'payments', 'session_confirmations', 'reviews', 'mentor_feedbacks',
    'noshow_records', 'verified_domains', 'mentor_bank_accounts',
    'settlements', 'verification_codes', 'newsletter_subscriptions',
    'business_inquiries', 'session_reminders', 'consultations'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', tbl);
    END IF;
  END LOOP;
END $$;
