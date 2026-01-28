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

#### 3. 스타일 일관성 - 테마 시스템 수정
- **파일**:
  - `src/contexts/ThemeContext.tsx` - 테마 시스템 업데이트
  - `src/app/globals.css` - 기본 CSS 변수 변경
- **변경**:
  - ITup 다크 테마 추가 (스타일 가이드 기준 blue-600, slate-900)
  - 기본 테마를 다크 모드로 변경 (게임 업계 느낌)
  - localStorage 키 "coffeechat-" → "itup-" 변경
  - 다크 테마 목록 관리 로직 개선
- **근거**: `docs/design/style-guide.md`, `docs/design/colors.md`

### 스타일 가이드 적용 현황
| 항목 | 스타일 가이드 | 적용 상태 |
|------|-------------|----------|
| Primary Color | blue-600 (#2563EB) | ✅ |
| Background | slate-900 (#0F172A) | ✅ |
| Card Background | slate-800 (#1E293B) | ✅ |
| Accent | purple-600 (#9333EA) | ✅ |
| 기본 테마 | 다크 모드 | ✅ |

---

<!-- 최신 기록이 위로 올라갑니다 -->
