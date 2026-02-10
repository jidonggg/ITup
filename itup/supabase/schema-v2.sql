-- =============================================
-- ITup v2 통합 스키마 (Full)
-- 새 환경에서 이 파일 하나만 실행하면 전체 DB 구성 완료
-- schema-full.sql의 v2 확장 버전
-- 생성일: 2026-02-03
-- =============================================

-- =============================================
-- 1. profiles (사용자 프로필)
-- =============================================
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  name text,
  phone text,
  role text DEFAULT 'mentee' CHECK (role IN ('mentee', 'mentor', 'admin')),
  preferences jsonb DEFAULT NULL,
  onboarded_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. mentors (멘토 정보) — v2 확장
-- =============================================
CREATE TABLE public.mentors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text NOT NULL,
  position text,
  years integer,
  experience text NOT NULL CHECK (experience NOT IN ('1년 미만', '1-3년')),
  job_type text CHECK (job_type IN ('client', 'server', 'planner', 'artist', 'other')),
  engine text CHECK (engine IN ('unity', 'unreal', 'other')),
  role text NOT NULL,
  skills text[] NOT NULL,
  bio text,
  profile_image_url text,

  -- 검증
  verification_status text DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_method text CHECK (verification_method IN ('email', 'document')),
  verified_email text,
  verified_company text,
  verified_at timestamptz,
  is_verified boolean DEFAULT false,

  -- 경력
  previous_companies text[],
  previous_companies_detail jsonb DEFAULT '[]'::jsonb,

  -- 상태
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,

  -- 레거시 호환
  available_times text[],
  consult_types text[] NOT NULL,
  price integer DEFAULT 50000,
  contact_method text,

  -- 통계
  rating numeric(2,1) DEFAULT 0,
  sessions integer DEFAULT 0,
  reviews integer DEFAULT 0,

  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 3. products (멘토링 상품)
-- =============================================
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('coffee_chat', 'document_review', 'mock_interview', 'free_trial')),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  price integer NOT NULL CHECK (price >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 4. mentor_schedules (멘토 정기 가능 시간)
-- =============================================
CREATE TABLE public.mentor_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- =============================================
-- 5. mentor_unavailable (멘토 불가 일정)
-- =============================================
CREATE TABLE public.mentor_unavailable (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- =============================================
-- 6. bookings (예약) — v2 핵심
-- =============================================
CREATE TABLE public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded')),

  mentee_intro text,
  mentee_goal text,
  meeting_link text,
  attached_files jsonb DEFAULT '[]'::jsonb,

  payment_key text,
  order_id text UNIQUE,
  amount integer NOT NULL DEFAULT 0,
  platform_fee integer DEFAULT 0,
  mentor_amount integer DEFAULT 0,
  payment_method text,
  paid_at timestamptz,

  cancelled_at timestamptz,
  cancelled_by text CHECK (cancelled_by IN ('mentee', 'mentor', 'admin')),
  cancel_reason text,
  refund_amount integer DEFAULT 0,
  refunded_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 7. session_confirmations (상담 완료 확인)
-- =============================================
CREATE TABLE public.session_confirmations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,

  mentor_confirmed text CHECK (mentor_confirmed IN ('completed', 'mentee_noshow', 'issue')),
  mentor_confirmed_at timestamptz,
  mentor_note text,

  mentee_confirmed text CHECK (mentee_confirmed IN ('completed', 'mentor_noshow', 'issue')),
  mentee_confirmed_at timestamptz,
  mentee_note text,

  final_status text CHECK (final_status IN ('completed', 'mentee_noshow', 'mentor_noshow', 'disputed')),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles(id),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 8. consultations (레거시)
-- =============================================
CREATE TABLE public.consultations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id),
  user_id uuid REFERENCES auth.users(id),
  user_name text NOT NULL,
  user_phone text NOT NULL,
  user_email text NOT NULL,
  interest text,
  product_type text,
  preferred_time text,
  message text,
  expected_amount integer,
  payment_key text,
  payment_id uuid,
  has_review boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 9. payments (레거시)
-- =============================================
CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  order_id text NOT NULL UNIQUE,
  payment_key text UNIQUE,
  amount integer NOT NULL,
  platform_fee integer,
  mentor_amount integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partial_refunded')),
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

ALTER TABLE public.consultations
  ADD CONSTRAINT fk_consultation_payment
  FOREIGN KEY (payment_id) REFERENCES public.payments(id);

-- =============================================
-- 10. reviews (후기)
-- =============================================
CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE CASCADE UNIQUE,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 500),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 11. mentor_feedbacks (멘토→멘티 비공개 피드백)
-- =============================================
CREATE TABLE public.mentor_feedbacks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  mentee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 1000),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 12. noshow_records (노쇼 기록)
-- =============================================
CREATE TABLE public.noshow_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  noshow_type text NOT NULL CHECK (noshow_type IN ('mentee_noshow', 'mentor_noshow')),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 13. verified_domains (회사 도메인)
-- =============================================
CREATE TABLE public.verified_domains (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL UNIQUE,
  company_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 14. verification_codes
-- =============================================
CREATE TABLE public.verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX verification_codes_email_idx ON public.verification_codes(email);

-- =============================================
-- 15-17. analytics
-- =============================================
CREATE TABLE public.page_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  path text NOT NULL,
  referrer text,
  user_agent text,
  ip_address text,
  duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  event_name text NOT NULL,
  event_data jsonb,
  path text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sessions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  page_count integer DEFAULT 0,
  device_type text,
  browser text,
  os text,
  country text
);

-- =============================================
-- 18. newsletter_subscriptions
-- =============================================
CREATE TABLE public.newsletter_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 19. business_inquiries
-- =============================================
CREATE TABLE public.business_inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  employee_count text,
  message text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 20. mentor_bank_accounts (멘토 정산 계좌)
-- =============================================
CREATE TABLE public.mentor_bank_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  is_default boolean DEFAULT true,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 21. settlements (정산 내역)
-- =============================================
CREATE TABLE public.settlements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL NOT NULL,
  bank_account_id uuid REFERENCES public.mentor_bank_accounts(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  booking_ids uuid[] DEFAULT '{}',
  total_amount integer NOT NULL DEFAULT 0,
  platform_fee integer NOT NULL DEFAULT 0,
  settlement_amount integer NOT NULL DEFAULT 0,
  commission_rate numeric(4,3) NOT NULL DEFAULT 0.150,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  failure_reason text,
  settled_at timestamptz,
  processed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 22. session_reminders (세션 리마인더 추적)
-- =============================================
CREATE TABLE public.session_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  email_sent boolean DEFAULT false,
  alimtalk_sent boolean DEFAULT false,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (booking_id, reminder_type)
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX idx_products_mentor ON public.products(mentor_id);
CREATE INDEX idx_products_type ON public.products(type);
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX idx_schedules_mentor ON public.mentor_schedules(mentor_id);
CREATE INDEX idx_schedules_day ON public.mentor_schedules(day_of_week);
CREATE INDEX idx_unavailable_mentor ON public.mentor_unavailable(mentor_id);
CREATE INDEX idx_unavailable_dates ON public.mentor_unavailable(start_date, end_date);
CREATE INDEX idx_bookings_mentee ON public.bookings(mentee_id);
CREATE INDEX idx_bookings_mentor ON public.bookings(mentor_id);
CREATE INDEX idx_bookings_product ON public.bookings(product_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_scheduled ON public.bookings(scheduled_at);
CREATE INDEX idx_bookings_order ON public.bookings(order_id);
CREATE INDEX idx_confirmations_booking ON public.session_confirmations(booking_id);
CREATE INDEX idx_confirmations_status ON public.session_confirmations(final_status);
CREATE INDEX idx_feedbacks_mentor ON public.mentor_feedbacks(mentor_id);
CREATE INDEX idx_feedbacks_mentee ON public.mentor_feedbacks(mentee_id);
CREATE INDEX idx_noshow_user ON public.noshow_records(user_id);
CREATE INDEX idx_noshow_type ON public.noshow_records(noshow_type);
CREATE INDEX idx_domains_domain ON public.verified_domains(domain);
CREATE INDEX payments_user_id_idx ON public.payments(user_id);
CREATE INDEX payments_status_idx ON public.payments(status);
CREATE INDEX payments_created_at_idx ON public.payments(created_at DESC);
CREATE INDEX reviews_mentor_id_idx ON public.reviews(mentor_id);
CREATE INDEX reviews_user_id_idx ON public.reviews(user_id);
CREATE INDEX reviews_created_at_idx ON public.reviews(created_at DESC);
CREATE INDEX idx_page_views_session ON public.page_views(session_id);
CREATE INDEX idx_page_views_path ON public.page_views(path);
CREATE INDEX idx_page_views_created ON public.page_views(created_at);
CREATE INDEX idx_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_events_created ON public.analytics_events(created_at);
CREATE INDEX idx_bank_accounts_mentor ON public.mentor_bank_accounts(mentor_id);
CREATE INDEX idx_settlements_mentor ON public.settlements(mentor_id);
CREATE INDEX idx_settlements_status ON public.settlements(status);
CREATE INDEX idx_session_reminders_booking ON public.session_reminders(booking_id);
CREATE INDEX idx_session_reminders_type ON public.session_reminders(reminder_type);
CREATE INDEX idx_session_reminders_sent_at ON public.session_reminders(sent_at);

-- 이중 예약 방지 (같은 멘토 + 같은 시간대에 활성 예약 1건만)
CREATE UNIQUE INDEX idx_bookings_no_double_booking
  ON public.bookings (mentor_id, scheduled_at)
  WHERE status NOT IN ('cancelled', 'refunded');

-- 결제 멱등성 보장
CREATE UNIQUE INDEX idx_payments_order_id_unique ON public.payments (order_id);
CREATE UNIQUE INDEX idx_payments_payment_key_unique ON public.payments (payment_key);

-- =============================================
-- VIEW: mentor_stats
-- =============================================
CREATE OR REPLACE VIEW public.mentor_stats AS
SELECT
  m.id AS mentor_id, m.name, m.company,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) AS completed_sessions,
  COUNT(DISTINCT r.id) AS review_count,
  COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
  MIN(p.price) AS min_price,
  MAX(p.price) AS max_price
FROM public.mentors m
LEFT JOIN public.bookings b ON b.mentor_id = m.id
LEFT JOIN public.reviews r ON r.mentor_id = m.id
LEFT JOIN public.products p ON p.mentor_id = m.id AND p.is_active = true
WHERE m.is_approved = true AND m.is_active = true
GROUP BY m.id, m.name, m.company;

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_unavailable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noshow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reminders ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- mentors
CREATE POLICY "Approved mentors are viewable" ON public.mentors FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can view own mentor profile" ON public.mentors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register as mentor" ON public.mentors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mentor" ON public.mentors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all mentors" ON public.mentors FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update mentors" ON public.mentors FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete mentors" ON public.mentors FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Mentors can view own products" ON public.products FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can create products" ON public.products FOR INSERT WITH CHECK (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can update products" ON public.products FOR UPDATE USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can delete products" ON public.products FOR DELETE USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- mentor_schedules
CREATE POLICY "Anyone can view active schedules" ON public.mentor_schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Mentors can manage schedules" ON public.mentor_schedules FOR ALL USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));

-- mentor_unavailable
CREATE POLICY "Anyone can view unavailable" ON public.mentor_unavailable FOR SELECT USING (true);
CREATE POLICY "Mentors can manage unavailable" ON public.mentor_unavailable FOR ALL USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));

-- bookings
CREATE POLICY "Mentees can view bookings" ON public.bookings FOR SELECT USING (auth.uid() = mentee_id);
CREATE POLICY "Mentors can view bookings" ON public.bookings FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentees can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "Mentees can update bookings" ON public.bookings FOR UPDATE USING (auth.uid() = mentee_id);
CREATE POLICY "Mentors can update bookings" ON public.bookings FOR UPDATE USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage bookings" ON public.bookings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- session_confirmations
CREATE POLICY "Users can view confirmations" ON public.session_confirmations FOR SELECT USING (
  booking_id IN (SELECT id FROM public.bookings WHERE mentee_id = auth.uid() UNION SELECT b.id FROM public.bookings b JOIN public.mentors m ON b.mentor_id = m.id WHERE m.user_id = auth.uid())
);
CREATE POLICY "Users can insert confirmations" ON public.session_confirmations FOR INSERT WITH CHECK (
  booking_id IN (SELECT id FROM public.bookings WHERE mentee_id = auth.uid() UNION SELECT b.id FROM public.bookings b JOIN public.mentors m ON b.mentor_id = m.id WHERE m.user_id = auth.uid())
);
CREATE POLICY "Users can update confirmations" ON public.session_confirmations FOR UPDATE USING (
  booking_id IN (SELECT id FROM public.bookings WHERE mentee_id = auth.uid() UNION SELECT b.id FROM public.bookings b JOIN public.mentors m ON b.mentor_id = m.id WHERE m.user_id = auth.uid())
);
CREATE POLICY "Admins can manage confirmations" ON public.session_confirmations FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- consultations (legacy)
CREATE POLICY "Anyone can create consultation" ON public.consultations FOR INSERT WITH CHECK (true);
CREATE POLICY "Mentors can view consultations" ON public.consultations FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own consultations" ON public.consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view consultations" ON public.consultations FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Mentors can update consultations" ON public.consultations FOR UPDATE USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update consultations" ON public.consultations FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- payments (legacy)
CREATE POLICY "Users can view payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- mentor_feedbacks
CREATE POLICY "Mentees can view feedbacks" ON public.mentor_feedbacks FOR SELECT USING (auth.uid() = mentee_id);
CREATE POLICY "Mentors can create feedbacks" ON public.mentor_feedbacks FOR INSERT WITH CHECK (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can view feedbacks" ON public.mentor_feedbacks FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage feedbacks" ON public.mentor_feedbacks FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- noshow_records
CREATE POLICY "Users can view noshow" ON public.noshow_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage noshow" ON public.noshow_records FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- verified_domains
CREATE POLICY "Anyone can view domains" ON public.verified_domains FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage domains" ON public.verified_domains FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- verification_codes
CREATE POLICY "Service role only" ON public.verification_codes USING (false) WITH CHECK (false);

-- analytics
CREATE POLICY "Insert page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Update sessions" ON public.sessions FOR UPDATE WITH CHECK (true);
CREATE POLICY "Update page view duration" ON public.page_views FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Only admins can view page views" ON public.page_views FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can view analytics events" ON public.analytics_events FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can view sessions" ON public.sessions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- newsletter
CREATE POLICY "Subscribe newsletter" ON public.newsletter_subscriptions FOR INSERT WITH CHECK (true);

-- mentor_bank_accounts
CREATE POLICY "Mentors can view own bank accounts" ON public.mentor_bank_accounts FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can manage own bank accounts" ON public.mentor_bank_accounts FOR ALL USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage bank accounts" ON public.mentor_bank_accounts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- settlements
CREATE POLICY "Mentors can view own settlements" ON public.settlements FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage settlements" ON public.settlements FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- session_reminders (cron job only - uses service role)
CREATE POLICY "Admins can view session_reminders" ON public.session_reminders FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- 트리거 & 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.mentors SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE mentor_id = NEW.mentor_id), 0),
    reviews = (SELECT COUNT(*) FROM public.reviews WHERE mentor_id = NEW.mentor_id)
  WHERE id = NEW.mentor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_mentor_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.mentors SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE mentor_id = OLD.mentor_id), 0),
    reviews = (SELECT COUNT(*) FROM public.reviews WHERE mentor_id = OLD.mentor_id)
  WHERE id = OLD.mentor_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_mentor_rating();
CREATE TRIGGER on_review_updated AFTER UPDATE OF rating ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_mentor_rating();
CREATE TRIGGER on_review_deleted AFTER DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_mentor_rating_on_delete();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER session_confirmations_updated_at BEFORE UPDATE ON public.session_confirmations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER bank_accounts_updated_at BEFORE UPDATE ON public.mentor_bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER settlements_updated_at BEFORE UPDATE ON public.settlements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.update_mentor_sessions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.mentors SET sessions = (SELECT COUNT(*) FROM public.bookings WHERE mentor_id = NEW.mentor_id AND status = 'completed') WHERE id = NEW.mentor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_completed AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_mentor_sessions_count();

CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN DELETE FROM public.verification_codes WHERE expires_at < now(); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auto_complete_unconfirmed_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.bookings b SET status = 'completed', updated_at = now()
  FROM public.session_confirmations sc
  WHERE sc.booking_id = b.id AND b.status = 'confirmed'
    AND sc.mentor_confirmed IS NULL AND sc.mentee_confirmed IS NULL
    AND sc.created_at < now() - interval '48 hours';
  UPDATE public.session_confirmations sc SET final_status = 'completed', resolved_at = now(), updated_at = now()
  FROM public.bookings b
  WHERE sc.booking_id = b.id AND b.status = 'completed'
    AND sc.final_status IS NULL AND sc.mentor_confirmed IS NULL AND sc.mentee_confirmed IS NULL
    AND sc.created_at < now() - interval '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_noshow_count(p_user_id uuid, p_months integer DEFAULT 6)
RETURNS integer AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.noshow_records WHERE user_id = p_user_id AND created_at > now() - (p_months || ' months')::interval);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 보안 트리거 (역할/컬럼 보호)
-- =============================================

-- 사용자가 자신의 role을 변경하는 것을 차단
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.role != OLD.role THEN
    RAISE EXCEPTION 'role 변경은 허용되지 않습니다';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();

-- 멘토 보호 컬럼 변경 방지 (is_approved, is_verified, verification_status, rating, sessions, reviews)
CREATE OR REPLACE FUNCTION prevent_mentor_protected_column_change()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    RAISE EXCEPTION '승인 상태는 관리자만 변경할 수 있습니다';
  END IF;
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION '인증 상태는 시스템만 변경할 수 있습니다';
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION '인증 상태는 시스템만 변경할 수 있습니다';
  END IF;
  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    RAISE EXCEPTION '평점은 시스템만 변경할 수 있습니다';
  END IF;
  IF NEW.sessions IS DISTINCT FROM OLD.sessions THEN
    RAISE EXCEPTION '세션 수는 시스템만 변경할 수 있습니다';
  END IF;
  IF NEW.reviews IS DISTINCT FROM OLD.reviews THEN
    RAISE EXCEPTION '리뷰 수는 시스템만 변경할 수 있습니다';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_mentor_protected_column_change_trigger ON public.mentors;
CREATE TRIGGER prevent_mentor_protected_column_change_trigger
  BEFORE UPDATE ON public.mentors
  FOR EACH ROW EXECUTE FUNCTION prevent_mentor_protected_column_change();

-- 예약 금융 컬럼 변경 방지 (amount, payment_key, refund_amount, platform_fee, mentor_amount)
CREATE OR REPLACE FUNCTION prevent_booking_financial_column_change()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.amount IS DISTINCT FROM OLD.amount THEN
    RAISE EXCEPTION '결제 금액은 변경할 수 없습니다';
  END IF;
  IF NEW.payment_key IS DISTINCT FROM OLD.payment_key THEN
    RAISE EXCEPTION '결제 키는 변경할 수 없습니다';
  END IF;
  IF NEW.refund_amount IS DISTINCT FROM OLD.refund_amount THEN
    RAISE EXCEPTION '환불 금액은 시스템만 변경할 수 있습니다';
  END IF;
  IF NEW.platform_fee IS DISTINCT FROM OLD.platform_fee THEN
    RAISE EXCEPTION '수수료는 변경할 수 없습니다';
  END IF;
  IF NEW.mentor_amount IS DISTINCT FROM OLD.mentor_amount THEN
    RAISE EXCEPTION '멘토 금액은 변경할 수 없습니다';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_booking_financial_column_change_trigger ON public.bookings;
CREATE TRIGGER prevent_booking_financial_column_change_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION prevent_booking_financial_column_change();

-- =============================================
-- 도메인 시드 데이터
-- =============================================
INSERT INTO public.verified_domains (domain, company_name) VALUES
  ('nexon.com', '넥슨'), ('nexon.co.kr', '넥슨'),
  ('krafton.com', '크래프톤'), ('pubg.com', '크래프톤'),
  ('ncsoft.com', 'NC소프트'), ('netmarble.com', '넷마블'),
  ('kakaogames.com', '카카오게임즈'),
  ('smilegate.com', '스마일게이트'), ('sginc.co.kr', '스마일게이트'),
  ('pearlabyss.com', '펄어비스'), ('devsisters.com', '데브시스터즈'),
  ('com2us.com', '컴투스'), ('gamevil.com', '컴투스'),
  ('shift-up.co.kr', '시프트업'),
  ('webzen.com', '웹젠'), ('gravity.co.kr', '그라비티'),
  ('neowiz.com', '네오위즈'), ('nhn.com', 'NHN'), ('nhnent.com', 'NHN'),
  ('line.me', '라인게임즈'), ('linegames.com', '라인게임즈'),
  ('supercent.io', '슈퍼센트'), ('111percent.com', '111퍼센트'),
  ('wemade.com', '위메이드'), ('hanbitsoft.com', '한빛소프트'),
  ('ea.com', 'EA'), ('ubisoft.com', '유비소프트'),
  ('riotgames.com', '라이엇게임즈'), ('riot.com', '라이엇게임즈'),
  ('blizzard.com', '블리자드'), ('activision.com', '액티비전 블리자드'),
  ('epicgames.com', '에픽게임즈'),
  ('unity3d.com', '유니티'), ('unity.com', '유니티'),
  ('supercell.com', '슈퍼셀'),
  ('mihoyo.com', '호요버스'), ('hoyoverse.com', '호요버스'),
  ('cygames.co.jp', '사이게임즈')
ON CONFLICT (domain) DO NOTHING;
