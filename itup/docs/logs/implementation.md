# 구현 로그 (Implementation Log)

## 담당: 코더1 (초기 구현)

작업 완료 후 이 파일에 기록합니다.

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
