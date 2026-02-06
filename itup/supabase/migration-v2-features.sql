-- =============================================
-- ITup v2 신규 기능 마이그레이션
-- Feature A: 무료 체험 (Free Trial)
-- Feature C: 멘티 온보딩
-- Feature D: 멘토 정산 시스템
-- 생성일: 2026-02-04
-- =============================================
-- 실행 방법: Supabase Dashboard → SQL Editor → 이 파일 전체 붙여넣기 → Run

BEGIN;

-- =============================================
-- 0. 공통 함수 (없으면 생성)
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 1. profiles 테이블 확장 (Feature C: 온보딩)
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded_at timestamptz DEFAULT NULL;

-- =============================================
-- 2. products 테이블 제약조건 변경 (Feature A: 무료 체험)
-- =============================================
-- products 테이블이 존재할 때만 제약조건 변경
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_type_check;
    ALTER TABLE public.products ADD CONSTRAINT products_type_check
      CHECK (type IN ('coffee_chat', 'document_review', 'mock_interview', 'free_trial'));
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_price_check;
    ALTER TABLE public.products ADD CONSTRAINT products_price_check CHECK (price >= 0);
  END IF;
END $$;

-- =============================================
-- 3. mentor_bank_accounts 테이블 (Feature D: 정산)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mentor_bank_accounts (
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

CREATE INDEX IF NOT EXISTS idx_bank_accounts_mentor ON public.mentor_bank_accounts(mentor_id);

ALTER TABLE public.mentor_bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 멘토 본인 계좌만 조회/관리
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_bank_accounts' AND policyname = 'Mentors can view own bank accounts') THEN
    CREATE POLICY "Mentors can view own bank accounts" ON public.mentor_bank_accounts
      FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_bank_accounts' AND policyname = 'Mentors can manage own bank accounts') THEN
    CREATE POLICY "Mentors can manage own bank accounts" ON public.mentor_bank_accounts
      FOR ALL USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_bank_accounts' AND policyname = 'Admins can manage bank accounts') THEN
    CREATE POLICY "Admins can manage bank accounts" ON public.mentor_bank_accounts
      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- updated_at 트리거
DROP TRIGGER IF EXISTS bank_accounts_updated_at ON public.mentor_bank_accounts;
CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON public.mentor_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 4. settlements 테이블 (Feature D: 정산)
-- =============================================
CREATE TABLE IF NOT EXISTS public.settlements (
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

CREATE INDEX IF NOT EXISTS idx_settlements_mentor ON public.settlements(mentor_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.settlements(status);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 멘토 본인 정산 조회 + 어드민 전체 관리
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settlements' AND policyname = 'Mentors can view own settlements') THEN
    CREATE POLICY "Mentors can view own settlements" ON public.settlements
      FOR SELECT USING (mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settlements' AND policyname = 'Admins can manage settlements') THEN
    CREATE POLICY "Admins can manage settlements" ON public.settlements
      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- updated_at 트리거
DROP TRIGGER IF EXISTS settlements_updated_at ON public.settlements;
CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMIT;

-- =============================================
-- 검증 쿼리 (마이그레이션 후 실행하여 확인)
-- =============================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('preferences', 'onboarded_at');
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.products'::regclass;
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('mentor_bank_accounts', 'settlements');
