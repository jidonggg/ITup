# 비밀번호 찾기/재설정 기능

- 우선순위: 높음
- 담당: 코더1
- 상태: **완료**
- 완료일: 2026-01-28

## 요구사항
1. 로그인 모달에서 "비밀번호를 잊으셨나요?" 링크 추가
2. 비밀번호 찾기 모달 구현 (이메일 입력)
3. Supabase Auth의 resetPasswordForEmail 활용
4. 비밀번호 재설정 페이지 구현

## 완료 조건
- [x] 비밀번호 찾기 링크 동작
- [x] 이메일 입력 후 재설정 링크 발송
- [x] 재설정 페이지에서 새 비밀번호 설정
- [x] 에러 처리 및 사용자 피드백

## 구현 내용
- `src/components/auth/ForgotPasswordModal.tsx`
  - 이메일 입력 폼
  - Supabase resetPasswordForEmail 호출
  - 성공/실패 피드백
- `src/components/auth/LoginModal.tsx`
  - "비밀번호를 잊으셨나요?" 링크 추가
  - onSwitchToForgotPassword prop 추가
- `src/app/auth/reset-password/page.tsx`
  - 새 비밀번호 입력 폼
  - 비밀번호 확인 검증
  - Supabase updateUser 호출
  - 성공 시 홈으로 리디렉션
- `src/components/HomeClient.tsx`
  - ForgotPasswordModal 상태 관리
