-- C1: 사용자가 자신의 role을 변경하는 것을 차단
-- profiles 테이블의 UPDATE 정책을 수정하여 role 컬럼 변경을 방지합니다.
-- Supabase Dashboard > SQL Editor에서 실행해주세요.

-- 방법: 트리거로 role 변경 차단
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != OLD.role THEN
    RAISE EXCEPTION 'role 변경은 허용되지 않습니다';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();

-- C7: 분석 데이터 접근을 관리자로 제한
-- 현재 모든 인증 사용자가 page_views, analytics_events, sessions 테이블을 읽을 수 있음

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can view page views" ON page_views;
DROP POLICY IF EXISTS "Authenticated users can view events" ON analytics_events;
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON sessions;

-- 관리자만 읽기 가능하도록 변경
CREATE POLICY "Only admins can view page views" ON page_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can view analytics events" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can view sessions" ON sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 페이지뷰 INSERT는 서비스 역할 키(API route)를 통해서만 가능하도록
-- (기존 INSERT 정책은 유지 - 클라이언트에서 직접 INSERT하는 경우가 있으므로)
