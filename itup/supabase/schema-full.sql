-- =============================================
-- ITup 커피챗 플랫폼 — 통합 스키마 (Full)
-- 새 환경에서 이 파일 하나만 실행하면 전체 DB 구성 완료
-- 최종 업데이트: 2026-01-29
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. mentors (멘토 정보)
-- =============================================
CREATE TABLE public.mentors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  company text NOT NULL,
  previous_companies text[],
  experience text NOT NULL CHECK (experience NOT IN ('1년 미만', '1-3년')),
  skills text[] NOT NULL,
  bio text,
  available_times text[],
  consult_types text[] NOT NULL,
  rating numeric(2,1) DEFAULT 0,
  sessions integer DEFAULT 0,
  reviews integer DEFAULT 0,
  price integer DEFAULT 50000,
  is_approved boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verification_method text CHECK (verification_method IN ('email', 'document')),
  verified_company text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 3. consultations (상담 신청)
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
-- 4. payments (결제 내역)
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

-- consultations.payment_id 외래키 (payments 생성 후)
ALTER TABLE public.consultations
  ADD CONSTRAINT fk_consultation_payment
  FOREIGN KEY (payment_id) REFERENCES public.payments(id);

-- =============================================
-- 5. reviews (리뷰/평점)
-- =============================================
CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE CASCADE UNIQUE,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 500),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 6. verification_codes (이메일 인증)
-- =============================================
CREATE TABLE public.verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX verification_codes_email_idx ON public.verification_codes(email);
CREATE INDEX verification_codes_expires_idx ON public.verification_codes(expires_at);

-- =============================================
-- 7. analytics — page_views
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

-- =============================================
-- 8. analytics — analytics_events
-- =============================================
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

-- =============================================
-- 9. analytics — sessions
-- =============================================
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
-- 10. newsletter_subscriptions
-- =============================================
CREATE TABLE public.newsletter_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 인덱스
-- =============================================
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

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 정책 — profiles
-- =============================================
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- RLS 정책 — mentors
-- =============================================
CREATE POLICY "Approved mentors are viewable by everyone" ON public.mentors
  FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can view own mentor profile" ON public.mentors
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can register as mentor" ON public.mentors
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mentor profile" ON public.mentors
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all mentors" ON public.mentors
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update mentors" ON public.mentors
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete mentors" ON public.mentors
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- RLS 정책 — consultations
-- =============================================
CREATE POLICY "Anyone can create consultation" ON public.consultations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Mentors can view their consultations" ON public.consultations
  FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own consultations" ON public.consultations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all consultations" ON public.consultations
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Mentors can update their consultations" ON public.consultations
  FOR UPDATE USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update all consultations" ON public.consultations
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- RLS 정책 — payments
-- =============================================
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- RLS 정책 — reviews
-- =============================================
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RLS 정책 — verification_codes (서비스 롤 전용)
-- =============================================
CREATE POLICY "Service role only" ON public.verification_codes
  USING (false) WITH CHECK (false);

-- =============================================
-- RLS 정책 — analytics (누구나 INSERT, 인증 사용자 SELECT)
-- =============================================
CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert sessions" ON public.sessions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.sessions
  FOR UPDATE WITH CHECK (true);
CREATE POLICY "Authenticated users can view page views" ON public.page_views
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view events" ON public.analytics_events
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view sessions" ON public.sessions
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- RLS 정책 — newsletter
-- =============================================
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 트리거 — 신규 유저 프로필 자동 생성
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

-- =============================================
-- 트리거 — 리뷰 작성 시 멘토 평점 자동 갱신
-- =============================================
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

CREATE TRIGGER on_review_created AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_mentor_rating();
CREATE TRIGGER on_review_updated AFTER UPDATE OF rating ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_mentor_rating();
CREATE TRIGGER on_review_deleted AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_mentor_rating_on_delete();

-- =============================================
-- 유틸리티 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.verification_codes WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
