-- ITup 추가 스키마 v2
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. mentors 테이블 업데이트 (인증 필드 추가)
-- ============================================
ALTER TABLE public.mentors
ADD COLUMN IF NOT EXISTS price integer DEFAULT 50000,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS verification_method text CHECK (verification_method IN ('email', 'document')),
ADD COLUMN IF NOT EXISTS verified_company text;

-- ============================================
-- 2. verification_codes 테이블 (이메일 인증 코드)
-- ============================================
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 이메일별 유니크 (한 번에 하나의 코드만)
CREATE UNIQUE INDEX IF NOT EXISTS verification_codes_email_idx ON public.verification_codes(email);

-- 만료된 코드 자동 삭제를 위한 인덱스
CREATE INDEX IF NOT EXISTS verification_codes_expires_idx ON public.verification_codes(expires_at);

-- RLS 활성화
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- 서비스 롤만 접근 가능 (API에서만 사용)
CREATE POLICY "Service role only" ON public.verification_codes
  USING (false)
  WITH CHECK (false);

-- ============================================
-- 3. payments 테이블 (결제 내역)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  order_id text NOT NULL UNIQUE,
  payment_key text UNIQUE,
  amount integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  plan_type text,
  payment_method text,
  approved_at timestamptz,
  receipt_url text,
  raw_response jsonb,
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON public.payments(created_at DESC);

-- RLS 활성화
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 본인 결제 내역만 조회 가능
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- 인증된 사용자만 결제 생성 가능
CREATE POLICY "Authenticated users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. subscriptions 테이블 (구독 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  plan_type text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_period_end_idx ON public.subscriptions(current_period_end);

-- RLS 활성화
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 본인 구독 정보만 조회 가능
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 5. consultations 테이블 업데이트
-- ============================================
ALTER TABLE public.consultations
ADD COLUMN IF NOT EXISTS preferred_time text,
ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.payments(id),
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- 사용자가 본인 상담 내역 조회 가능하도록 정책 추가
CREATE POLICY "Users can view own consultations" ON public.consultations
  FOR SELECT USING (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- ============================================
-- 6. newsletter_subscriptions 테이블 (뉴스레터)
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- 누구나 구독 가능
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 7. 관리자용 정책 추가
-- ============================================

-- 관리자는 모든 멘토 조회 가능
CREATE POLICY "Admins can view all mentors" ON public.mentors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자는 멘토 승인/수정 가능
CREATE POLICY "Admins can update mentors" ON public.mentors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자는 멘토 삭제 가능
CREATE POLICY "Admins can delete mentors" ON public.mentors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자는 모든 상담 조회 가능
CREATE POLICY "Admins can view all consultations" ON public.consultations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자는 모든 결제 조회 가능
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 8. 유용한 함수들
-- ============================================

-- 만료된 인증 코드 자동 삭제 함수
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.verification_codes WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 만료된 구독 상태 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND current_period_end < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 완료 메시지
-- ============================================
-- 실행 완료 후 Supabase Dashboard > Database > Tables 에서 확인하세요.
--
-- 생성된 테이블:
-- - verification_codes (이메일 인증)
-- - payments (결제 내역)
-- - subscriptions (구독 정보)
-- - newsletter_subscriptions (뉴스레터)
--
-- 업데이트된 테이블:
-- - mentors (인증 필드 추가)
-- - consultations (결제 연동 필드 추가)
