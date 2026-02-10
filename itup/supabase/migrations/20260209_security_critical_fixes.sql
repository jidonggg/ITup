-- =============================================
-- Phase 1: 보안 CRITICAL 수정 마이그레이션
-- 2026-02-09
-- 함수는 무조건 생성, 트리거/정책/인덱스는 테이블 존재시만 적용
-- =============================================

-- 1. prevent_role_change 함수 (profiles용)
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

-- 2. prevent_mentor_protected_column_change 함수 (mentors용)
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

-- 3. prevent_booking_financial_column_change 함수 (bookings용)
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

-- =============================================
-- 트리거 적용 (테이블 존재시만)
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles';
    EXECUTE 'CREATE TRIGGER prevent_role_change_trigger BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_role_change()';
    RAISE NOTICE 'profiles: prevent_role_change trigger applied';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='mentors') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS prevent_mentor_protected_column_change_trigger ON public.mentors';
    EXECUTE 'CREATE TRIGGER prevent_mentor_protected_column_change_trigger BEFORE UPDATE ON public.mentors FOR EACH ROW EXECUTE FUNCTION prevent_mentor_protected_column_change()';
    RAISE NOTICE 'mentors: prevent_mentor_protected_column_change trigger applied';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookings') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS prevent_booking_financial_column_change_trigger ON public.bookings';
    EXECUTE 'CREATE TRIGGER prevent_booking_financial_column_change_trigger BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION prevent_booking_financial_column_change()';
    RAISE NOTICE 'bookings: prevent_booking_financial_column_change trigger applied';
  END IF;
END $$;

-- =============================================
-- RLS 정책 적용 (테이블 존재시만)
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='page_views') THEN
    EXECUTE 'DROP POLICY IF EXISTS "View page views" ON public.page_views';
    EXECUTE 'DROP POLICY IF EXISTS "Only admins can view page views" ON public.page_views';
    EXECUTE 'CREATE POLICY "Only admins can view page views" ON public.page_views FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
    EXECUTE 'DROP POLICY IF EXISTS "Update page view duration" ON public.page_views';
    EXECUTE 'CREATE POLICY "Update page view duration" ON public.page_views FOR UPDATE USING (true) WITH CHECK (true)';
    RAISE NOTICE 'page_views: admin SELECT + UPDATE policies applied';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='analytics_events') THEN
    EXECUTE 'DROP POLICY IF EXISTS "View events" ON public.analytics_events';
    EXECUTE 'DROP POLICY IF EXISTS "Only admins can view analytics events" ON public.analytics_events';
    EXECUTE 'CREATE POLICY "Only admins can view analytics events" ON public.analytics_events FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
    RAISE NOTICE 'analytics_events: admin SELECT policy applied';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sessions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "View sessions" ON public.sessions';
    EXECUTE 'DROP POLICY IF EXISTS "Only admins can view sessions" ON public.sessions';
    EXECUTE 'CREATE POLICY "Only admins can view sessions" ON public.sessions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
    EXECUTE 'DROP POLICY IF EXISTS "Update sessions" ON public.sessions';
    EXECUTE 'DROP POLICY IF EXISTS "Update own sessions" ON public.sessions';
    EXECUTE 'CREATE POLICY "Update own sessions" ON public.sessions FOR UPDATE USING (true) WITH CHECK (true)';
    RAISE NOTICE 'sessions: admin SELECT + UPDATE policies applied';
  END IF;
END $$;

-- =============================================
-- 인덱스 적용 (테이블 존재시만)
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookings') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_no_double_booking ON public.bookings (mentor_id, scheduled_at) WHERE status NOT IN (''cancelled'', ''refunded'')';
    RAISE NOTICE 'bookings: double-booking prevention index applied';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='payments') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_order_id_unique ON public.payments (order_id)';
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_payment_key_unique ON public.payments (payment_key)';
    RAISE NOTICE 'payments: idempotency indexes applied';
  END IF;
END $$;
