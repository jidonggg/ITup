-- =============================================
-- ITup v2 마이그레이션 SQL
-- 기존 스키마(schema-full.sql)가 적용된 상태에서 실행
-- 생성일: 2026-02-03
-- =============================================

-- =============================================
-- 1. mentors 테이블 컬럼 추가
-- =============================================
-- 직군 (client/server/planner/artist/other)
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS job_type text CHECK (job_type IN ('client', 'server', 'planner', 'artist', 'other'));

-- 엔진 (unity/unreal/other/null)
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS engine text CHECK (engine IN ('unity', 'unreal', 'other'));

-- 검증 상태 (pending/verified/rejected)
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- 인증된 이메일 주소
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS verified_email text;

-- 이전 경력 JSONB (득실확인서 기반)
-- 기존 previous_companies text[] → previous_companies_detail jsonb 로 별도 추가
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS previous_companies_detail jsonb DEFAULT '[]'::jsonb;

-- 활성 상태
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 연차 (숫자)
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS years integer;

-- 직급
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS position text;

-- 프로필 이미지
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS profile_image_url text;

-- contact_method (이전에 추가되었을 수 있음)
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS contact_method text;

-- =============================================
-- 2. products (멘토링 상품)
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('coffee_chat', 'document_review', 'mock_interview')),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  price integer NOT NULL CHECK (price >= 10000 AND price <= 300000),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_mentor ON public.products(mentor_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;

-- =============================================
-- 3. mentor_schedules (멘토 정기 가능 시간)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mentor_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_schedules_mentor ON public.mentor_schedules(mentor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON public.mentor_schedules(day_of_week);

-- =============================================
-- 4. mentor_unavailable (멘토 불가 일정)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mentor_unavailable (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_unavailable_mentor ON public.mentor_unavailable(mentor_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_dates ON public.mentor_unavailable(start_date, end_date);

-- =============================================
-- 5. bookings (예약) — v2 핵심 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded')),

  -- 멘티 신청 정보
  mentee_intro text,
  mentee_goal text,
  meeting_link text,
  attached_files jsonb DEFAULT '[]'::jsonb,

  -- 결제 정보
  payment_key text,
  order_id text UNIQUE,
  amount integer NOT NULL DEFAULT 0,
  platform_fee integer DEFAULT 0,
  mentor_amount integer DEFAULT 0,
  payment_method text,
  paid_at timestamptz,

  -- 취소 정보
  cancelled_at timestamptz,
  cancelled_by text CHECK (cancelled_by IN ('mentee', 'mentor', 'admin')),
  cancel_reason text,
  refund_amount integer DEFAULT 0,
  refunded_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_mentee ON public.bookings(mentee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor ON public.bookings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_product ON public.bookings(product_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON public.bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_order ON public.bookings(order_id);

-- =============================================
-- 6. session_confirmations (상담 완료 확인)
-- =============================================
CREATE TABLE IF NOT EXISTS public.session_confirmations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- 멘토 확인
  mentor_confirmed text CHECK (mentor_confirmed IN ('completed', 'mentee_noshow', 'issue')),
  mentor_confirmed_at timestamptz,
  mentor_note text,

  -- 멘티 확인
  mentee_confirmed text CHECK (mentee_confirmed IN ('completed', 'mentor_noshow', 'issue')),
  mentee_confirmed_at timestamptz,
  mentee_note text,

  -- 최종 상태
  final_status text CHECK (final_status IN ('completed', 'mentee_noshow', 'mentor_noshow', 'disputed')),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles(id),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_confirmations_booking ON public.session_confirmations(booking_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_status ON public.session_confirmations(final_status);

-- =============================================
-- 7. mentor_feedbacks (멘토 → 멘티 비공개 피드백)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mentor_feedbacks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  mentee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 1000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_mentor ON public.mentor_feedbacks(mentor_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_mentee ON public.mentor_feedbacks(mentee_id);

-- =============================================
-- 8. noshow_records (노쇼 기록)
-- =============================================
CREATE TABLE IF NOT EXISTS public.noshow_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  noshow_type text NOT NULL CHECK (noshow_type IN ('mentee_noshow', 'mentor_noshow')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_noshow_user ON public.noshow_records(user_id);
CREATE INDEX IF NOT EXISTS idx_noshow_type ON public.noshow_records(noshow_type);

-- =============================================
-- 9. verified_domains (검증된 회사 도메인)
-- =============================================
CREATE TABLE IF NOT EXISTS public.verified_domains (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL UNIQUE,
  company_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domains_domain ON public.verified_domains(domain);

-- 초기 도메인 데이터 시드
INSERT INTO public.verified_domains (domain, company_name) VALUES
  -- 대기업
  ('nexon.com', '넥슨'), ('nexon.co.kr', '넥슨'),
  ('krafton.com', '크래프톤'), ('pubg.com', '크래프톤'),
  ('ncsoft.com', 'NC소프트'),
  ('netmarble.com', '넷마블'),
  ('kakaogames.com', '카카오게임즈'),
  ('smilegate.com', '스마일게이트'), ('sginc.co.kr', '스마일게이트'),
  ('pearlabyss.com', '펄어비스'),
  ('devsisters.com', '데브시스터즈'),
  ('com2us.com', '컴투스'), ('gamevil.com', '컴투스'),
  ('shift-up.co.kr', '시프트업'),
  -- 중견
  ('webzen.com', '웹젠'),
  ('gravity.co.kr', '그라비티'),
  ('neowiz.com', '네오위즈'),
  ('nhn.com', 'NHN'), ('nhnent.com', 'NHN'),
  ('line.me', '라인게임즈'), ('linegames.com', '라인게임즈'),
  ('supercent.io', '슈퍼센트'),
  ('111percent.com', '111퍼센트'),
  ('wemade.com', '위메이드'),
  ('hanbitsoft.com', '한빛소프트'),
  -- 해외
  ('ea.com', 'EA'),
  ('ubisoft.com', '유비소프트'),
  ('riotgames.com', '라이엇게임즈'), ('riot.com', '라이엇게임즈'),
  ('blizzard.com', '블리자드'), ('activision.com', '액티비전 블리자드'),
  ('epicgames.com', '에픽게임즈'),
  ('unity3d.com', '유니티'), ('unity.com', '유니티'),
  ('supercell.com', '슈퍼셀'),
  ('mihoyo.com', '호요버스'), ('hoyoverse.com', '호요버스'),
  ('cygames.co.jp', '사이게임즈')
ON CONFLICT (domain) DO NOTHING;

-- =============================================
-- 10. email_verifications (이메일 인증 - v2 확장)
-- =============================================
-- 기존 verification_codes 테이블 활용하되, user_id 및 verified_at 추가
ALTER TABLE public.verification_codes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.verification_codes
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- =============================================
-- 11. business_inquiries (이미 존재하면 스킵)
-- =============================================
CREATE TABLE IF NOT EXISTS public.business_inquiries (
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
-- RLS — 새 테이블들
-- =============================================

-- products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);
CREATE POLICY "Mentors can view own products" ON public.products
  FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can create own products" ON public.products
  FOR INSERT WITH CHECK (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can update own products" ON public.products
  FOR UPDATE USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can delete own products" ON public.products
  FOR DELETE USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- mentor_schedules
ALTER TABLE public.mentor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active schedules" ON public.mentor_schedules
  FOR SELECT USING (is_active = true);
CREATE POLICY "Mentors can manage own schedules" ON public.mentor_schedules
  FOR ALL USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));

-- mentor_unavailable
ALTER TABLE public.mentor_unavailable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view unavailable dates" ON public.mentor_unavailable
  FOR SELECT USING (true);
CREATE POLICY "Mentors can manage own unavailable" ON public.mentor_unavailable
  FOR ALL USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));

-- bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentees can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = mentee_id);
CREATE POLICY "Mentors can view their bookings" ON public.bookings
  FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentees can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "Mentees can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = mentee_id);
CREATE POLICY "Mentors can update their bookings" ON public.bookings
  FOR UPDATE USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- session_confirmations
ALTER TABLE public.session_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own confirmations" ON public.session_confirmations
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE mentee_id = auth.uid()
      UNION
      SELECT b.id FROM public.bookings b
        JOIN public.mentors m ON b.mentor_id = m.id
        WHERE m.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert confirmations" ON public.session_confirmations
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM public.bookings WHERE mentee_id = auth.uid()
      UNION
      SELECT b.id FROM public.bookings b
        JOIN public.mentors m ON b.mentor_id = m.id
        WHERE m.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own confirmations" ON public.session_confirmations
  FOR UPDATE USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE mentee_id = auth.uid()
      UNION
      SELECT b.id FROM public.bookings b
        JOIN public.mentors m ON b.mentor_id = m.id
        WHERE m.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage all confirmations" ON public.session_confirmations
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- mentor_feedbacks
ALTER TABLE public.mentor_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentees can view own feedbacks" ON public.mentor_feedbacks
  FOR SELECT USING (auth.uid() = mentee_id);
CREATE POLICY "Mentors can create feedbacks" ON public.mentor_feedbacks
  FOR INSERT WITH CHECK (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Mentors can view own feedbacks" ON public.mentor_feedbacks
  FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all feedbacks" ON public.mentor_feedbacks
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- noshow_records
ALTER TABLE public.noshow_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own noshow records" ON public.noshow_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage noshow records" ON public.noshow_records
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- verified_domains
ALTER TABLE public.verified_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active domains" ON public.verified_domains
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage domains" ON public.verified_domains
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- business_inquiries (이미 RLS 설정되어 있으면 스킵)
ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VIEW: mentor_stats (멘토별 통계)
-- =============================================
CREATE OR REPLACE VIEW public.mentor_stats AS
SELECT
  m.id AS mentor_id,
  m.name,
  m.company,
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
-- 트리거: bookings.updated_at 자동 갱신
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER session_confirmations_updated_at
  BEFORE UPDATE ON public.session_confirmations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 트리거: 상담 완료 시 멘토 sessions 카운트 갱신
-- =============================================
CREATE OR REPLACE FUNCTION public.update_mentor_sessions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.mentors SET
      sessions = (SELECT COUNT(*) FROM public.bookings WHERE mentor_id = NEW.mentor_id AND status = 'completed')
    WHERE id = NEW.mentor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_mentor_sessions_count();

-- =============================================
-- 함수: 48시간 경과 무응답 자동 완료 처리
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_complete_unconfirmed_sessions()
RETURNS void AS $$
BEGIN
  -- 상담 종료 후 48시간 경과 + 양측 모두 미응답 → 자동 completed
  UPDATE public.bookings b SET
    status = 'completed',
    updated_at = now()
  FROM public.session_confirmations sc
  WHERE sc.booking_id = b.id
    AND b.status = 'confirmed'
    AND sc.mentor_confirmed IS NULL
    AND sc.mentee_confirmed IS NULL
    AND sc.created_at < now() - interval '48 hours';

  -- session_confirmations 최종 상태도 업데이트
  UPDATE public.session_confirmations sc SET
    final_status = 'completed',
    resolved_at = now(),
    updated_at = now()
  FROM public.bookings b
  WHERE sc.booking_id = b.id
    AND b.status = 'completed'
    AND sc.final_status IS NULL
    AND sc.mentor_confirmed IS NULL
    AND sc.mentee_confirmed IS NULL
    AND sc.created_at < now() - interval '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 함수: 노쇼 카운트 조회
-- =============================================
CREATE OR REPLACE FUNCTION public.get_noshow_count(p_user_id uuid, p_months integer DEFAULT 6)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.noshow_records
    WHERE user_id = p_user_id
      AND created_at > now() - (p_months || ' months')::interval
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
