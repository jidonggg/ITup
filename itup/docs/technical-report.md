# 커피챗 기술 보고서

> 최종 업데이트: 2026-01-28

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | 커피챗 (CoffeeChat) |
| **목적** | 게임 업계 현직자와 취준생/이직자 간 1:1 멘토링 매칭 플랫폼 |
| **배포 URL** | https://itup.vercel.app |
| **GitHub** | https://github.com/jidonggg/ITup |
| **개발 기간** | 2026-01-28 ~ |
| **현재 버전** | 0.1.0 (MVP) |

---

## 2. 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 16.1.5 | React 기반 풀스택 프레임워크 |
| **React** | 19.2.3 | UI 컴포넌트 라이브러리 |
| **TypeScript** | 5.x | 타입 안전성 |
| **Tailwind CSS** | 4.x | 유틸리티 기반 CSS |

### Backend & Database
| 기술 | 용도 |
|------|------|
| **Supabase** | PostgreSQL 데이터베이스 + 인증 |
| **Supabase Auth** | 이메일/비밀번호 인증 + 비밀번호 재설정 |
| **Supabase SSR** | 서버사이드 세션 관리 |

### 배포 & 인프라
| 기술 | 용도 |
|------|------|
| **Vercel** | 호스팅 및 CI/CD |
| **Edge Functions** | 미들웨어 (세션 갱신) |

---

## 3. 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Next.js App Router                  │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │    │
│  │  │  Pages  │ │Components│ │ Contexts │           │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘           │    │
│  │       └───────────┼───────────┘                 │    │
│  │                   ▼                              │    │
│  │         ┌─────────────────┐                     │    │
│  │         │  Supabase Client │                     │    │
│  │         └────────┬────────┘                     │    │
│  └──────────────────┼──────────────────────────────┘    │
└─────────────────────┼───────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase Cloud                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │     │
│  │  Database   │  │   Service   │  │  (Future)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 디렉토리 구조

```
itup/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── page.tsx            # 메인 페이지
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── globals.css         # 전역 스타일
│   │   ├── auth/
│   │   │   ├── callback/       # OAuth 콜백
│   │   │   └── reset-password/ # 비밀번호 재설정
│   │   ├── mentors/            # 멘토 목록 (필터링)
│   │   ├── mentor/
│   │   │   └── register/       # 멘토 등록
│   │   ├── mypage/             # 마이페이지
│   │   ├── admin/
│   │   │   └── dashboard/      # 운영자 대시보드
│   │   ├── terms/              # 이용약관
│   │   └── privacy/            # 개인정보처리방침
│   │
│   ├── components/             # React 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Hero.tsx            # 헤드라인 로테이션
│   │   ├── Features.tsx
│   │   ├── Mentors.tsx         # Supabase 동적 로딩
│   │   ├── Pricing.tsx         # 상담 모달 연결
│   │   ├── CTA.tsx             # 멘토 둘러보기 스크롤
│   │   ├── Footer.tsx
│   │   ├── HomeClient.tsx      # 홈 클라이언트 컴포넌트
│   │   ├── ConsultModal.tsx    # 상담 신청 (DB 저장)
│   │   ├── MentorDetailModal.tsx
│   │   └── auth/
│   │       ├── AuthButton.tsx
│   │       ├── LoginModal.tsx
│   │       ├── SignupModal.tsx
│   │       └── ForgotPasswordModal.tsx  # 비밀번호 찾기
│   │
│   ├── contexts/               # React Context
│   │   ├── AuthContext.tsx     # 인증 상태 관리
│   │   ├── ThemeContext.tsx    # 테마 상태 관리
│   │   ├── LayoutContext.tsx   # 레이아웃 상태 관리
│   │   └── AnalyticsContext.tsx # 사용자 행동 분석
│   │
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts       # 브라우저 클라이언트
│   │       ├── server.ts       # 서버 클라이언트
│   │       ├── middleware.ts   # 미들웨어 헬퍼
│   │       └── types.ts        # 타입 정의
│   │
│   ├── hooks/
│   │   ├── useModal.ts         # 모달 관련 훅
│   │   └── useScrollAnimation.ts # 스크롤 애니메이션
│   │
│   ├── data/
│   │   └── mentors.ts          # 멘토 폴백 데이터
│   │
│   └── middleware.ts           # Next.js 미들웨어
│
├── docs/                       # 문서
│   ├── requirements.md         # 요구사항
│   ├── qa-report.md            # QA 리포트
│   ├── pending-features.md     # 미완성 기능
│   └── technical-report.md     # 기술 보고서
│
├── tasks/                      # 작업 명세
│   ├── 001-mentor-list-dynamic.md
│   ├── 002-consult-submit-db.md
│   ├── 003-mypage.md
│   └── 004-password-reset.md
│
├── supabase/
│   └── schema.sql              # DB 스키마
│
└── public/                     # 정적 파일
```

---

## 5. 데이터베이스 스키마

### profiles 테이블
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### mentors 테이블
```sql
CREATE TABLE mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  previous_companies TEXT[],
  experience TEXT NOT NULL,
  skills TEXT[],
  consult_types TEXT[],
  available_times TEXT[],
  bio TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### consultations 테이블
```sql
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id),
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  user_email TEXT NOT NULL,
  interest TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 인증 플로우

### 회원가입/로그인
```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User   │────▶│ SignUp   │────▶│  Email   │────▶│  Login   │
│         │     │  Modal   │     │  Verify  │     │  Modal   │
└─────────┘     └──────────┘     └──────────┘     └──────────┘
                     │                                  │
                     ▼                                  ▼
              ┌──────────┐                       ┌──────────┐
              │ Supabase │                       │ Supabase │
              │ signUp() │                       │ signIn() │
              └──────────┘                       └──────────┘
                     │                                  │
                     ▼                                  ▼
              ┌──────────┐                       ┌──────────┐
              │ profiles │                       │ Session  │
              │  INSERT  │                       │ Created  │
              └──────────┘                       └──────────┘
```

### 비밀번호 재설정
```
┌─────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────────┐
│  User   │────▶│ ForgotPassword│────▶│  Email   │────▶│ reset-password│
│         │     │    Modal      │     │  Link    │     │    Page       │
└─────────┘     └──────────────┘     └──────────┘     └──────────────┘
                      │                                       │
                      ▼                                       ▼
              ┌────────────────┐                     ┌────────────────┐
              │ resetPassword  │                     │  updateUser    │
              │   ForEmail()   │                     │  (password)    │
              └────────────────┘                     └────────────────┘
```

---

## 7. 상태 관리

### AuthContext
- **역할**: 사용자 인증 상태 관리
- **상태**: user, profile, session, isLoading, isInitialized
- **메서드**: signIn, signUp, signOut, refreshProfile

### ThemeContext
- **역할**: 테마 (라이트/다크) 관리
- **상태**: currentTheme, isDarkMode
- **메서드**: setTheme, toggleDarkMode

### LayoutContext
- **역할**: 레이아웃 스타일 관리
- **상태**: currentLayout
- **메서드**: setLayout

### AnalyticsContext
- **역할**: 사용자 행동 추적
- **상태**: events
- **메서드**: trackClick, trackEvent, getEvents

---

## 8. 주요 컴포넌트 설명

### Header
- 반응형 네비게이션 바
- 로그인 상태에 따라 다른 버튼 표시
- 다크 모드 토글

### Hero
- 4초마다 변경되는 헤드라인 (3개 문구)
- 마우스 이동에 반응하는 배경 효과
- CTA 버튼 (상담 신청)

### Mentors
- Supabase에서 동적 로딩
- 스켈레톤 로딩 UI
- 승인된 멘토만 표시 (is_approved = true)

### ConsultModal
- 상담 신청 폼
- 유효성 검사 (전화번호 포맷팅 포함)
- Supabase 저장 + localStorage 폴백
- mentor_id 연결

### ForgotPasswordModal
- 이메일 입력 폼
- Supabase resetPasswordForEmail 호출
- 성공/실패 피드백

### /mentors 페이지
- 전체 멘토 목록
- 필터링: 회사, 상담유형, 기술스택
- 필터 초기화

---

## 9. 보안

### Row Level Security (RLS)
```sql
-- profiles: 본인만 조회/수정 가능
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- mentors: 승인된 멘토만 공개 조회
CREATE POLICY "Anyone can view approved mentors"
  ON mentors FOR SELECT
  USING (is_approved = true);

-- consultations: 본인 상담만 조회 가능
CREATE POLICY "Users can view own consultations"
  ON consultations FOR SELECT
  USING (auth.uid()::text = user_email);
```

### 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 10. 성능 최적화

| 기법 | 적용 |
|------|------|
| **코드 스플리팅** | Next.js 자동 적용 |
| **이미지 최적화** | next/image 사용 (향후) |
| **CSS 최적화** | Tailwind CSS purge |
| **캐싱** | Vercel Edge 캐싱 |
| **로딩 타임아웃** | 0.5초 (AuthContext) |

---

## 11. 완료된 기능

### Phase 1 (완료)
- [x] 랜딩 페이지 (Hero, Features, Stats, Testimonials, Footer)
- [x] 인증 시스템 (회원가입, 로그인, 로그아웃)
- [x] Supabase 데이터베이스 연동

### Phase 2 (완료)
- [x] 멘토 목록 동적 로딩 (Supabase)
- [x] 멘토 목록 페이지 (/mentors) + 필터링
- [x] 상담 신청 DB 저장
- [x] 마이페이지 (/mypage)
- [x] 비밀번호 찾기/재설정
- [x] 사용자 행동 분석 시스템
- [x] 운영자 대시보드

---

## 12. 향후 계획

### Phase 3 (예정)
- [ ] 결제 시스템 (Toss Payments)
- [ ] 실시간 알림 시스템
- [ ] 리뷰/평점 시스템
- [ ] 이용약관/개인정보처리방침 작성

### Phase 4 (향후)
- [ ] 실시간 채팅 (Socket.io)
- [ ] 모바일 앱 (React Native)
- [ ] AI 멘토 매칭

---

## 13. 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)
