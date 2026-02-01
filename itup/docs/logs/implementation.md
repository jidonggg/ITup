# 구현 로그 (Implementation Log)

## 담당: 코더1 (초기 구현)

작업 완료 후 이 파일에 기록합니다.

---

## [2026-02-01] Soft Launch — 정직한 콘텐츠 정리 + 핵심 기능 보완

### 작업자
코더2 (Claude Code)

### 개요
허위/가짜 데이터 전면 제거, 멘토-멘티 연결 메커니즘 추가, B2B 폼 실제 동작, 멘토 알림 버그 수정

### Phase 1 — 프론트엔드 정직성 정리 (8개 파일)

#### 1. 가짜 "무료" 문구 제거
- `Pricing.tsx`: "첫 커피챗 15분 무료" 배너 전체 삭제
- `CTA.tsx`: "첫 커피챗은 무료예요" → "현직자 멘토와 커피 한 잔의 가격으로", "무료로 시작하기" → "커피챗 시작하기"
- `Hero.tsx`: "무료로 시작하기" → "커피챗 시작하기"

#### 2. 가짜 수치/후기 제거
- `Hero.tsx`: 가짜 지표(500+ 멘티, 4.9점) → 정성적 신뢰 지표 (현직자 멘토 / 안전한 결제 / 1:1 맞춤 상담)
- `Stats.tsx`: 전체 교체 — 가짜 카운터(500+/50+/98%/85%) → 정성적 가치 카드 4개
- `Testimonials.tsx`: `return null` — 가짜 후기 4건(넷마블/크래프톤/스마일게이트/넥슨) 비노출

#### 3. 가짜 팀/연혁/파트너 제거
- `about/page.tsx`: 가짜 팀원(김철수/이영희/박지민) 섹션 삭제, 가짜 연혁 → 실제 마일스톤 2건
- `business/page.tsx`: 가짜 통계(100+ 멘토 등) + 가짜 파트너 후기(넥슨/크래프톤) 제거
- `faq/page.tsx`: "첫 커피챗이 무료라고요?" FAQ → "가장 저렴한 상품은 뭔가요?"

### Phase 2 — 멘토-멘티 연결 메커니즘 (3개 파일 + SQL)

- `types.ts`: Mentor 인터페이스에 `contact_method: string | null` 추가
- `payment/success/page.tsx`: 결제 확인 후 멘토 연락 방법 카드 표시
- `mypage/page.tsx`: confirmed/completed 상담 카드에 멘토 연락처 표시
- **SQL**: `mentors` 테이블에 `contact_method` 컬럼 추가 (⚠️ 미실행)

### Phase 3 — B2B 폼 실제 동작 (2개 파일 + SQL)

- `api/business/inquiry/route.ts` (신규): POST → Supabase 저장 + 관리자 이메일 알림
- `business/page.tsx`: setTimeout 시뮬레이션 → 실제 API 호출 + 에러 처리
- `email/templates.ts`: `businessInquiryTemplate` 추가
- **SQL**: `business_inquiries` 테이블 생성 + RLS 정책 (⚠️ 미실행)

### 버그 수정

- `api/payment/confirm/route.ts`: 결제 완료 시 멘토에게도 `consultation_request` 이메일 발송 (기존: 멘티에게만 발송)

### 인프라

- Vercel 환경변수 6개 추가 (TOSS_PAYMENTS_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, NEXT_PUBLIC_SITE_URL, INTERNAL_API_SECRET, ADMIN_EMAIL)
- NEXT_PUBLIC_ADMIN_EMAILS에 jee599@naver.com 추가
- Vercel 프로덕션 재배포 완료

### 빌드 검증
- `tsc --noEmit` ✅
- `next build` ✅
- Vercel 배포 ✅ (https://itup.vercel.app)

---

## [2025-01-28] 기획 기반 기능 보완

### 작업자
코더1

### 작업 내용

#### 1. Header 네비게이션 동적 링크 구현
- **파일**: `src/components/Header.tsx`
- **변경**:
  - 앵커 링크(#features 등) → 실제 페이지 링크로 변경
  - 역할 기반 동적 메뉴 구현
  - 비로그인: 멘토 둘러보기, FAQ
  - 멘토: + 대시보드, 마이페이지
  - 관리자: + 관리자, 마이페이지
- **관련 기획**: `docs/service/user-flow.md` 6.1절

#### 2. 멘토 가격 표시 기능 추가
- **파일**:
  - `src/lib/supabase/types.ts` - Mentor 인터페이스에 price 필드 추가
  - `src/components/MentorDetailModal.tsx` - 가격 섹션 UI 추가
  - `src/components/Mentors.tsx` - convertToMentorData에 price 매핑
- **변경**:
  - 멘토 상세 모달에 상담 가격 표시 (기본값 50,000원/30분)
  - 첫 상담 30% 할인 배지 표시
- **관련 기획**: `docs/business/pricing.md`, `docs/service/features.md`

#### 3. 상담-결제 흐름 연동
- **파일**:
  - `src/components/ConsultModal.tsx` - 결제 단계 추가
  - `src/app/mentors/page.tsx` - 멘토 정보 props 전달
  - `src/components/HomeClient.tsx` - 멘토 정보 props 전달
- **변경**:
  - 상담 신청 폼 → 결제 확인 → 결제 진행 (2단계 플로우)
  - 토스페이먼츠 결제 연동
  - 첫 상담 30% 할인 적용 (50,000원 → 35,000원)
  - 결제 정보 요약 UI 추가
- **관련 기획**: `docs/service/scenarios.md` 2.1절

---

<!-- 최신 기록이 위로 올라갑니다 -->
