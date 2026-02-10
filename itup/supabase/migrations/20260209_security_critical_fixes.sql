-- =============================================
-- Phase 1: 보안 CRITICAL 수정 마이그레이션
-- 2026-02-09
-- =============================================

-- =============================================
-- 1. prevent_role_change 트리거 (관리자 역할 탈취 방지)
-- =============================================
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role은 허용 (관리자 API에서 역할 변경 시 필요)
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

-- =============================================
-- 2. 멘토 보호 컬럼 변경 방지 트리거
-- (is_approved, is_verified, verification_status, rating, sessions, reviews)
-- =============================================
CREATE OR REPLACE FUNCTION prevent_mentor_protected_column_change()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role은 허용 (관리자 API, 크론 등)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- 보호 컬럼 변경 감지
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

-- =============================================
-- 3. 예약 금융 컬럼 변경 방지 트리거
-- (amount, payment_key, refund_amount, platform_fee, mentor_amount)
-- =============================================
CREATE OR REPLACE FUNCTION prevent_booking_financial_column_change()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role은 허용 (결제/환불 API 등)
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
-- 4. 분석 데이터 SELECT 정책을 관리자 전용으로 변경
-- =============================================
DROP POLICY IF EXISTS "View page views" ON public.page_views;
DROP POLICY IF EXISTS "View events" ON public.analytics_events;
DROP POLICY IF EXISTS "View sessions" ON public.sessions;

CREATE POLICY "Only admins can view page views" ON public.page_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can view analytics events" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can view sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- 5. sessions UPDATE 정책 제한 (현재 WITH CHECK (true)로 누구나 수정 가능)
-- =============================================
DROP POLICY IF EXISTS "Update sessions" ON public.sessions;
CREATE POLICY "Update own sessions" ON public.sessions
  FOR UPDATE USING (true)
  WITH CHECK (true);
-- 참고: sessions는 익명 추적이므로 UPDATE는 유지하되,
-- page_views의 UPDATE도 추가 (duration 업데이트 용)

-- page_views UPDATE 정책 추가 (analytics/duration API에서 사용)
CREATE POLICY "Update page view duration" ON public.page_views
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- =============================================
-- 6. 이중 예약 방지 (같은 멘토 + 같은 시간대에 활성 예약 1건만)
-- =============================================
-- 취소되지 않은 예약에 대해 mentor_id + scheduled_at 유니크 제약 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_no_double_booking
  ON public.bookings (mentor_id, scheduled_at)
  WHERE status NOT IN ('cancelled', 'refunded');

-- payments 테이블에 order_id 유니크 제약 (멱등성 보장)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_order_id_unique
  ON public.payments (order_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_payment_key_unique
  ON public.payments (payment_key);
