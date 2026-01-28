# 리팩토링 및 수정 로그 (Refactoring Log)

## 담당: 코더2 (리팩토링)

작업 완료 후 이 파일에 기록합니다.

---

## [2025-01-28] 브랜딩 및 레이아웃 수정

### 작업자
코더2

### 작업 내용

#### 1. 브랜딩 "커피챗" → "ITup" 변경
- **파일**:
  - `src/components/Header.tsx` - 로고 텍스트
  - `src/components/Footer.tsx` - 로고, 저작권, 이메일
- **변경 내역**:
  - "커피챗" → "ITup" (3곳)
  - "support@coffeechat.kr" → "support@itup.kr" (2곳)
  - "© 2025 커피챗" → "© 2025 ITup"

#### 2. 멘토 그리드 3열로 변경
- **파일**: `src/components/Mentors.tsx`
- **변경**:
  - `lg:grid-cols-4` → `lg:grid-cols-3`
  - 스켈레톤 개수 4개 → 3개
- **근거**: `docs/design/style-guide.md` 6.2절 반응형 가이드

### 영향 범위
- Header, Footer 전역 컴포넌트
- 랜딩 페이지 멘토 섹션

---

<!-- 최신 기록이 위로 올라갑니다 -->
