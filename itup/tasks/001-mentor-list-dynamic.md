# 멘토 목록 동적 로딩

- 우선순위: 높음
- 담당: 코더1
- 상태: **완료**
- 완료일: 2026-01-28

## 요구사항
1. 현재 `src/data/mentors.ts`에 하드코딩된 멘토 데이터를 Supabase에서 불러오도록 변경
2. `src/components/Mentors.tsx`에서 동적으로 멘토 목록 표시
3. 승인된 멘토만 표시 (is_approved = true)
4. 로딩 상태 및 에러 처리

## 완료 조건
- [x] Supabase에서 멘토 목록을 성공적으로 불러옴
- [x] 로딩 스피너 표시
- [x] 멘토가 없을 경우 안내 메시지 표시
- [x] 기존 UI와 동일한 디자인 유지

## 구현 내용
- `src/components/Mentors.tsx`: Supabase 연동 및 스켈레톤 UI
- `src/app/mentors/page.tsx`: 전체 멘토 목록 페이지 (필터링 지원)
  - 회사별 필터
  - 상담유형별 필터
  - 기술스택별 필터
