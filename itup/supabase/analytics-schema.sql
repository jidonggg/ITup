-- =============================================
-- 사용자 분석 (Analytics) 테이블
-- =============================================

-- 페이지뷰 추적
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이벤트 추적 (클릭, 액션 등)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 세션 추적
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  page_count INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events(created_at);

-- RLS 정책
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 INSERT 가능 (익명 포함)
CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert sessions" ON sessions
  FOR INSERT WITH CHECK (true);

-- 관리자만 조회 가능 (나중에 admin 역할 추가 필요)
-- 현재는 인증된 사용자 모두 조회 가능
CREATE POLICY "Authenticated users can view page views" ON page_views
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view events" ON analytics_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view sessions" ON sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update sessions" ON sessions
  FOR UPDATE WITH CHECK (true);
