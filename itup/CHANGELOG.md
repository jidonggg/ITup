# CHANGELOG - 커피챗 (CoffeeChat) 멘토링 플랫폼

## [v1.6.0] - 2026-01-28

### 새 기능 (New Features)
- **서버사이드 관리자 권한 검증** (`/api/admin/mentors`)
  - 관리자 API Route 추가
  - JWT 토큰 기반 인증
  - 멘토 승인/거절/삭제 API 보안 강화

- **결제 서버 검증 API** (`/api/payment/confirm`)
  - TossPayments 결제 서버 승인 API
  - 결제 정보 DB 저장
  - 구독 정보 자동 업데이트

- **상담 시간 선택 기능**
  - 상담 신청 시 멘토의 가능 시간 선택 UI
  - 선택된 시간 DB 저장

- **멘토 프로필 수정 페이지** (`/mentor/edit`)
  - 기존 정보 수정 가능
  - 승인 상태 표시
  - 대시보드에서 링크 연결

- **멘토 목록 페이지네이션**
  - 페이지당 9명 표시
  - 필터 변경 시 첫 페이지로 이동

- **전용 로그인/회원가입 페이지** (`/login`, `/signup`)
  - 독립적인 인증 페이지
  - 브라우저 비밀번호 관리자 호환
  - Google OAuth 지원

- **상세 분석 대시보드**
  - 인기 페이지 Top 10
  - 사용자 클릭 분석 Top 10
  - 전환율 통계
  - 일별 트래픽 차트

### 변경 사항
- Footer 소셜 링크 제거 (플레이스홀더 정리)
- Footer에 계정 링크 섹션 추가
- 문의 이메일 표시

---

## [v1.5.0] - 2026-01-28

### 새 기능 (New Features)
- **관리자 페이지 강화** (`/admin`)
  - 관리자 이메일 화이트리스트 기반 접근 제어
  - 멘토 승인/거절/삭제 기능 추가
  - 상담 관리 탭 (전체 상담 조회)
  - 탭 기반 UI (개요, 멘토 관리, 상담, 분석)
  - 일별 트래픽 차트

### 변경 사항
- `admin.ts`: 관리자 이메일 설정 파일 신규 생성
- `admin/page.tsx`: 전체 리팩토링 및 기능 강화

---

## [v1.4.0] - 2026-01-28

### 배포
- **Vercel 프로덕션 배포 완료**
  - URL: https://itup.vercel.app
  - 16개 페이지 정상 빌드
  - SSL 자동 적용

---

## [v1.3.3] - 2026-01-28

### 새 기능 (New Features)
- **뉴스레터 구독** (Footer)
  - 이메일 구독 폼 기능 구현
  - 중복 이메일 체크
  - 구독 재활성화 처리
  - 성공/오류 메시지 표시

### 변경 사항
- `types.ts`: NewsletterSubscription 타입 추가

---

## [v1.3.2] - 2026-01-28

### 새 기능 (New Features)
- **FAQ 페이지** (`/faq`)
  - 카테고리별 질문/답변 (서비스 소개, 이용 방법, 요금 및 결제, 멘토 관련, 기타)
  - 아코디언 UI
  - 문의하기 섹션

### 변경 사항
- `Footer.tsx`: FAQ 링크 연결 (`#` → `/faq`)
- `Pricing.tsx`: FAQ 링크 연결

---

## [v1.3.1] - 2026-01-28

### 새 기능 (New Features)
- **마이페이지 강화** (`/mypage`)
  - 탭 네비게이션 (프로필, 상담 내역, 구독/결제)
  - 현재 구독 상태 표시
  - 결제 내역 목록
  - 이용 가능한 플랜 안내

### 변경 사항
- `types.ts`: Payment, Subscription 타입 추가

---

## [v1.3.0] - 2026-01-28

### 새 기능 (New Features)
- **멘토 대시보드** (`/mentor/dashboard`)
  - 상담 요청 목록 및 관리 기능
  - 상담 상태 변경 (대기중 → 확정 → 완료/취소)
  - 통계 표시 (전체, 대기중, 확정, 완료)

- **토스페이먼츠 결제 시스템**
  - 결제 모달 (`PaymentModal.tsx`) - 토스페이먼츠 SDK 연동
  - 결제 성공 페이지 (`/payment/success`)
  - 결제 실패 페이지 (`/payment/fail`)
  - 요금제: Basic(99,000원), Pro(199,000원), Premium(399,000원)

### 변경 사항
- `Pricing.tsx`: 결제 버튼 클릭 시 결제 모달 연동
- `HomeClient.tsx`: PaymentModal 통합

---

## [v1.2.0] - 2026-01-28

### 새 기능 (New Features)
- **비밀번호 찾기/재설정**
  - 비밀번호 찾기 모달 (`ForgotPasswordModal.tsx`)
  - 비밀번호 재설정 페이지 (`/auth/reset-password`)
  - Supabase 이메일 인증 연동

### 변경 사항
- `LoginModal.tsx`: "비밀번호를 잊으셨나요?" 링크 추가
- 문서 업데이트 (qa-report.md, technical-report.md)

---

## [v1.1.0] - 2026-01-28

### 새 기능 (New Features)
- **사용자 행동 분석 시스템** (`AnalyticsContext.tsx`)
  - 페이지 뷰 추적
  - 클릭 이벤트 추적
  - 세션 시간 측정
  - Supabase `user_analytics` 테이블 연동

- **운영자 대시보드** (`/admin`)
  - 실시간 통계 (총 방문자, 오늘 방문자, 평균 체류시간, 전환율)
  - 인기 페이지 순위
  - 최근 활동 로그
  - 클릭 분석

### 성능 개선
- 로딩 타임아웃 2초 → 0.5초로 단축

### 버그 수정
- AuthContext 초기화 로직 개선
- 마이페이지 로딩 상태 수정
- 디버그 console.log 제거

---

## [v1.0.0] - 2026-01-28

### 새 기능 (New Features)
- **Supabase 인증 시스템**
  - 이메일/비밀번호 로그인
  - Google OAuth 로그인
  - 회원가입 및 이메일 인증
  - 사용자 프로필 관리

- **멘토링 플랫폼 핵심 기능**
  - 멘토 목록 페이지 (`/mentors`) - Supabase 동적 로딩
  - 멘토 상세 모달
  - 상담 신청 모달 - DB 저장 연동
  - 멘토 등록 페이지 (`/mentor/register`)

- **마이페이지** (`/mypage`)
  - 프로필 정보 표시
  - 로그아웃 기능

- **정적 페이지**
  - 이용약관 (`/terms`)
  - 개인정보처리방침 (`/privacy`)

### UI/UX
- Hero 섹션 헤드라인 로테이션 애니메이션
- 반응형 디자인 개선
- 모달 UX 개선 (ESC 키 닫기, 배경 클릭 닫기)

---

## [v0.1.0] - 2026-01-27

### 초기 설정
- Next.js 16.1.5 + React 19 프로젝트 생성
- Tailwind CSS 설정
- 기본 컴포넌트 구조
  - Header, Hero, Stats, Features
  - Mentors, Testimonials, Pricing
  - CTA, Footer
- 테마 시스템 (다크/라이트 모드)

---

## 페이지 목록

| 경로 | 설명 | 상태 |
|------|------|------|
| `/` | 메인 랜딩 페이지 | 완료 |
| `/mentors` | 멘토 전체 목록 | 완료 |
| `/mypage` | 마이페이지 | 완료 |
| `/admin` | 운영자 대시보드 | 완료 |
| `/mentor/register` | 멘토 등록 | 완료 |
| `/mentor/dashboard` | 멘토 대시보드 | 완료 |
| `/payment/success` | 결제 성공 | 완료 |
| `/payment/fail` | 결제 실패 | 완료 |
| `/auth/reset-password` | 비밀번호 재설정 | 완료 |
| `/terms` | 이용약관 | 완료 |
| `/privacy` | 개인정보처리방침 | 완료 |

---

## 기술 스택

- **Frontend**: Next.js 16.1.5, React 19.2.3, TypeScript
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL, Auth)
- **결제**: TossPayments SDK
- **배포**: Vercel (예정)

---

## 커밋 히스토리

```
b12a974 feat: 멘토 대시보드 및 토스페이먼츠 결제 시스템 추가
d362a3a feat: 비밀번호 찾기/재설정 기능 추가 및 문서 업데이트
6b78604 feat: 사용자 행동 분석 기능 강화
8c895a4 feat: 사용자 분석 시스템 및 운영자 대시보드 추가
c47c045 chore: 디버그 console.log 제거, QA 완료
062b7c7 perf: 로딩 타임아웃 2초 → 0.5초로 단축
94360a4 fix: AuthContext 2초 타임아웃 강제 로딩 완료
52fc02f fix: AuthContext isInitialized 플래그 추가
719e08f fix: 헤드라인 통일 및 마이페이지 로딩 수정
8e48f98 feat: Hero 헤드라인 로테이션 추가
389b468 fix: AuthContext 초기화 로직 개선
a9c9cef fix: AuthContext isLoading 상태 수정
06254ba style: Hero 메인 문구 변경
def049e debug: AuthContext 및 마이페이지 디버깅 로그 추가
a26446f feat: Supabase 인증 시스템 및 주요 기능 추가
0f7ed75 chore: 프로젝트명 커피챗으로 변경
6ddae75 chore: 프로젝트명 ITup → camo 변경
a7a5cc8 refactor: 멘토 프로필 정책 변경
6511fbc style: 반응형 UI 개선
becd589 feat: 모달 UX 개선
9c822e8 refactor: 멘토 데이터 개인정보 보호 및 상담 유형 추가
70d6c31 feat: 멘토 상세 모달 추가
061d389 feat: 상담 신청 모달 추가 및 인터랙션 개선
fab83c9 first setting
```
