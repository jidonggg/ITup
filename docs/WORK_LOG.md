# ITup 프로젝트 작업 회의록

## 2026-02-11 Agent Team 작업 세션

### 팀 구성
| 역할 | 이름 | 담당 |
|------|------|------|
| 총괄 팀장 | team-lead | 전체 조율, 태스크 배분, 커밋/푸시 |
| 기획자 1 | planner-1 | UX 감사 → P0 버그 수정 전환 |
| 기획자 2 | planner-2 | 기능 기획 → P0 버그 수정 전환 |
| 사업팀 1 | biz-1 | 수익화 전략 분석 |
| 사업팀 2 | biz-2 | 성장/SEO 전략 및 구현 |
| 개발자 1 | dev-1 | 구독 취소 기능 구현 |
| 개발자 2 | email-fixer | 이메일 도메인 하드코딩 수정 |
| 개발자 3 | type-fixer | 타입 정의 검증 |
| 디자이너 | designer | 트렌디 UI/UX 개선 |
| QA 1 | qa-1 | 전체 기능 통합 테스트 |
| QA 2 | qa-2 | 보안/성능 점검 |
| QA 3 | analytics-fixer | 분석 대시보드 자동 갱신 |

---

### 13:20 - 세션 시작, 초기 QA 이슈 처리

**참여자**: team-lead, email-fixer, type-fixer, analytics-fixer

#### 논의 사항
- QA_REPORT.md에서 5개 미해결 이슈 확인
- 3명의 개발자를 병렬 배치하여 동시 작업 시작

#### 완료된 태스크

**Task #1: 이메일 도메인 하드코딩 환경변수로 변경** (email-fixer)
- `src/lib/site-config.ts`에 `contactEmail` 객체, `getDisplayDomain()` 함수 추가
- 8개 파일에서 하드코딩된 URL/이메일 제거:
  - `src/app/layout.tsx` - OG URL
  - `src/app/opengraph-image.tsx` - 도메인 표시
  - `src/components/Footer.tsx` - support 이메일 3곳
  - `src/app/faq/page.tsx` - support 이메일 3곳
  - `src/app/privacy/page.tsx` - privacy 이메일
  - `src/app/mentor/apply/page.tsx` - support 이메일
  - `src/app/mentor/guidelines/page.tsx` - support 이메일
  - `src/app/payment/fail/page.tsx` - support 이메일
- 새 환경변수: `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_PRIVACY_EMAIL`

**Task #3: Consultation 타입 preferred_time 필드 확인** (type-fixer)
- 결과: **변경 불필요** (QA 리포트 오탐)
- `types.ts:233`에 이미 `preferred_time: string | null` 정의됨
- DB 스키마, Insert/Update 타입, 사용처 모두 정상

**Task #4: 분석 대시보드 자동 갱신** (analytics-fixer)
- `src/app/admin/page.tsx`에 30초 setInterval 자동 갱신 추가
- 기존 useEffect 내에 5줄 추가, cleanup 포함

---

### 13:25 - 대규모 팀 구성, 병렬 작업 시작

**참여자**: 전체 팀 (12명)

#### 논의 사항
- 기획자 2명, 사업팀 2명, 개발자 3명, QA 3명, 디자이너 1명, 팀장 배치
- 각 역할별 태스크 할당 후 병렬 작업 개시

---

### 13:27 - 기획팀 보고 완료

**Task #9: 추가 기능 기획** (planner-2)
- 8개 신규 기능 제안:
  1. **멘토 찜/위시리스트** (HIGH, LOW-MED) - 하트 아이콘, 마이페이지 탭
  2. **향상된 리뷰 시스템** (HIGH, MED) - 세부 항목 평점, 도움됨 버튼, 답글
  3. **멘토 추천/매칭** (HIGH, MED-HIGH) - 온보딩 기반 scoring, API 엔드포인트
  4. **세션 후 피드백 개선** (MED, LOW-MED) - 구조화된 템플릿, PDF 다운로드
  5. **고급 검색/필터** (MED, MED) - 텍스트 검색, 가격 필터, 정렬 옵션
  6. **알림 시스템 강화** (MED, MED-HIGH) - 인앱 알림 센터, 알림 설정
  7. **캘린더 뷰** (MED, MED) - 주간 스케줄 시각화, "오늘 가능" 뱃지
  8. **채팅/메시징** (LOW, HIGH) - 예약 기반 채팅방, Supabase Realtime
- 3단계 로드맵: Phase 1(즉시) → Phase 2(단기) → Phase 3(중기)

**Task #8: UX 전체 감사** (planner-1)
- **40개 이상 UX 이슈** 발견, 우선순위별 분류:
  - **P0 (Critical) 4건**: 소셜 로그인 에러 표시, 멘토 목록 깜빡임, 로그인 리다이렉트 누락, 네비게이션 부재
  - **P1 (High) 8건**: 검색 없음, 가격 미표시, 모바일 반응형, 예약 UX
  - **P2 (Medium) 10건**: 정렬, 접근성, 딥링크, 코드 구조
  - **P3 (Nice to have) 18건**: 테마, 애니메이션, 공유, 브레드크럼

#### 의사결정
- P0 이슈 즉시 수정 결정
- 기획자 2명을 개발자로 전환하여 P0 수정 투입
  - planner-1 → Task #23 (소셜 로그인), Task #25 (로그인 리다이렉트)
  - planner-2 → Task #24 (멘토 목록 로딩/가격)

---

### 13:28 - 현재 진행 중

| # | 태스크 | 담당 | 상태 |
|---|--------|------|------|
| 1 | 이메일 도메인 하드코딩 수정 | email-fixer | **완료** |
| 2 | 구독 취소 기능 구현 | dev-1 | 작업 중 |
| 3 | Consultation 타입 확인 | type-fixer | **완료** (변경 불필요) |
| 4 | 분석 대시보드 자동 갱신 | analytics-fixer | **완료** |
| 8 | UX 전체 감사 | planner-1 | **완료** |
| 9 | 추가 기능 기획 | planner-2 | **완료** |
| 10 | 수익화 전략 | biz-1 | **완료** |
| 11 | 성장/SEO 전략 | biz-2 | 작업 중 |
| 12 | 트렌디 UI 디자인 | designer | 작업 중 |
| 13 | 기능 통합 테스트 | qa-1 | 작업 중 |
| 14 | 보안/성능 점검 | qa-2 | 작업 중 |
| 23 | [P0] 소셜 로그인 버튼 수정 | planner-1 | 작업 중 |
| 24 | [P0] 멘토 목록 로딩/가격 수정 | planner-2 | 작업 중 |
| 25 | [P0] 로그인 리다이렉트 수정 | planner-1 | 작업 중 |

---

### 대기 중인 보고
- biz-1: 수익화 전략 (완료됨, 보고 대기)
- biz-2: 성장/SEO 전략 및 구현
- designer: 트렌디 UI 디자인 개선
- dev-1: 구독 취소 기능
- qa-1: 기능 통합 테스트
- qa-2: 보안/성능 점검

---

*이 문서는 작업 진행에 따라 지속적으로 업데이트됩니다.*
