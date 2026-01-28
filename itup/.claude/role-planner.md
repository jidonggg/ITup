# 기획팀 구성 (Planning Team)

## 팀 구조

```
기획 총괄 리드 (Planning Lead)
├── 사업 기획자 (Business Planner)
├── 서비스 기획자 (Service Planner)
└── 디자인 기획자 (Design Planner)
```

## 역할별 문서
- `role-planning-lead.md` - 기획 총괄 리드
- `role-business-planner.md` - 사업 기획자
- `role-service-planner.md` - 서비스 기획자
- `role-design-planner.md` - 디자인 기획자

## 공통 규칙
1. **코드 직접 작성 금지** - 기획 문서만 작성
2. 모든 산출물은 `docs/` 폴더에 저장
3. 개발 요청은 `tasks/` 폴더에 태스크 파일 생성
4. 팀 간 소통은 `docs/communications.md` 활용

## 폴더 구조
```
docs/
├── business/       # 사업 기획
├── service/        # 서비스 기획
├── design/         # 디자인 기획
├── meeting-notes/  # 회의록
├── roadmap.md      # 로드맵
├── decisions.md    # 의사결정
└── communications.md # 팀 소통
```

## 워크플로우
1. **기획 총괄 리드**: 전체 방향 설정, 우선순위 조율
2. **사업 기획자**: 시장/경쟁사 분석 → 수익모델 → 가격정책
3. **서비스 기획자**: 요구사항 → 화면흐름 → 태스크 생성
4. **디자인 기획자**: 스타일가이드 → 컴포넌트 명세 → UI 가이드
