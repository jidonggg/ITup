# 상담 신청 DB 저장

- 우선순위: 높음
- 담당: 코더1
- 상태: **완료**
- 완료일: 2026-01-28

## 요구사항
1. `src/components/ConsultModal.tsx`에서 상담 신청 시 Supabase consultations 테이블에 저장
2. 신청 완료 시 성공 메시지 표시
3. 멘토 ID를 올바르게 연결

## 완료 조건
- [x] 상담 신청 정보가 Supabase에 저장됨
- [x] 저장 성공/실패에 따른 UI 피드백
- [x] 필수 입력값 검증

## 구현 내용
- `src/components/ConsultModal.tsx`
  - Supabase consultations 테이블에 저장
  - mentor_id 정상 전달
  - 로딩 스피너 및 성공 화면
  - Supabase 미설정 시 localStorage fallback
