# 스타일 가이드 (Style Guide)

> 작성자: 디자인 기획자
> 최종 업데이트: 2025-01-28

---

## 1. 디자인 원칙

### 1.1 핵심 가치

| 가치 | 설명 | 적용 |
|------|------|------|
| **신뢰감** | 전문적이고 깔끔한 디자인 | 다크 테마, 미니멀 UI |
| **친근함** | 접근하기 쉬운 인터페이스 | 둥근 모서리, 부드러운 전환 |
| **효율성** | 빠른 정보 탐색 | 명확한 계층 구조 |
| **게임스러움** | 게임 업계 느낌 | 다크 모드, 그라데이션 |

### 1.2 톤 앤 매너

- **스타일**: 모던, 미니멀, 다크
- **느낌**: 프로페셔널하면서 친근함
- **영감**: 게임 런처, 개발자 도구

---

## 2. 레이아웃

### 2.1 그리드 시스템

| 항목 | 값 | Tailwind |
|------|-----|----------|
| 최대 너비 | 1280px | max-w-7xl |
| 컨테이너 | 중앙 정렬 | mx-auto |
| 여백 (모바일) | 16px | px-4 |
| 여백 (데스크톱) | 24px | px-6 |

### 2.2 브레이크포인트

| 이름 | 사이즈 | Tailwind | 용도 |
|------|--------|----------|------|
| Mobile | < 640px | (기본) | 모바일 기기 |
| Tablet | ≥ 640px | sm: | 태블릿 세로 |
| Desktop | ≥ 1024px | lg: | 데스크톱 |
| Wide | ≥ 1280px | xl: | 와이드 모니터 |

### 2.3 섹션 간격

| 요소 | 모바일 | 데스크톱 | Tailwind |
|------|--------|----------|----------|
| 섹션 간 | 64px | 96px | py-16 lg:py-24 |
| 컴포넌트 간 | 16px | 24px | gap-4 lg:gap-6 |
| 카드 내부 | 16px | 24px | p-4 lg:p-6 |

---

## 3. 컴포넌트 스타일

### 3.1 카드

```css
/* 기본 카드 */
.card {
  background: slate-800;      /* bg-slate-800 */
  border-radius: 12px;        /* rounded-xl */
  padding: 24px;              /* p-6 */
  box-shadow: lg;             /* shadow-lg */
}

/* 호버 효과 */
.card:hover {
  box-shadow: xl;             /* hover:shadow-xl */
  transform: scale(1.02);     /* hover:scale-[1.02] */
}
```

**Tailwind 클래스**
```
bg-slate-800 rounded-xl p-6 shadow-lg
hover:shadow-xl hover:scale-[1.02]
transition-all duration-300
```

### 3.2 버튼

#### Primary Button
```
bg-blue-600 hover:bg-blue-700
text-white font-semibold
px-6 py-3 rounded-lg
transition-colors duration-200
```

#### Secondary Button
```
border border-slate-600
text-slate-300 hover:text-white
hover:bg-slate-700
px-6 py-3 rounded-lg
transition-colors duration-200
```

#### Ghost Button
```
text-slate-400 hover:text-white
transition-colors duration-200
```

### 3.3 모달

```css
/* 백드롭 */
.backdrop {
  background: rgba(0,0,0,0.5); /* bg-black/50 */
  backdrop-filter: blur(4px);  /* backdrop-blur-sm */
}

/* 모달 컨테이너 */
.modal {
  background: slate-800;       /* bg-slate-800 */
  border-radius: 16px;         /* rounded-2xl */
  max-width: 448px;            /* max-w-md */
  padding: 24px;               /* p-6 */
  box-shadow: 2xl;             /* shadow-2xl */
}
```

### 3.4 폼 필드

```
/* Input */
w-full px-4 py-3
bg-slate-700 border border-slate-600
rounded-lg text-white
placeholder:text-slate-400
focus:outline-none focus:border-blue-500
transition-colors duration-200
```

---

## 4. 애니메이션

### 4.1 트랜지션

| 용도 | Duration | Easing | Tailwind |
|------|----------|--------|----------|
| 버튼 호버 | 200ms | ease-out | duration-200 |
| 카드 호버 | 300ms | ease-in-out | duration-300 |
| 모달 | 300ms | ease-out | duration-300 |
| 드롭다운 | 150ms | ease-out | duration-150 |

### 4.2 호버 효과

| 컴포넌트 | 효과 |
|----------|------|
| 버튼 | 배경색 변경 |
| 카드 | 그림자 확대, 약간 확대 |
| 링크 | 색상 변경, 밑줄 |
| 태그 | 배경색 변경 |

### 4.3 스크롤 애니메이션

- Intersection Observer 활용
- fade-in: 투명도 0→1
- slide-up: 아래에서 위로 이동
- scale-in: 작은 크기에서 확대

---

## 5. 접근성

### 5.1 색상 대비

| 조합 | 대비율 | 상태 |
|------|--------|------|
| 흰색/slate-900 | 15.8:1 | PASS (AAA) |
| slate-300/slate-900 | 7.5:1 | PASS (AAA) |
| blue-600/white | 4.7:1 | PASS (AA) |

### 5.2 포커스 상태

```
/* 모든 인터랙티브 요소 */
focus:outline-none
focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
focus:ring-offset-slate-900
```

### 5.3 키보드 네비게이션

| 키 | 동작 |
|----|------|
| Tab | 다음 요소로 이동 |
| Shift+Tab | 이전 요소로 이동 |
| Enter | 버튼 클릭, 폼 제출 |
| ESC | 모달 닫기 |
| Space | 체크박스, 버튼 |

### 5.4 스크린 리더

- 모든 이미지에 alt 텍스트
- 폼 필드에 label 연결
- 아이콘 버튼에 aria-label
- 모달에 aria-modal, role="dialog"

---

## 6. 반응형 가이드

### 6.1 모바일 우선

```css
/* 기본: 모바일 */
.element { ... }

/* 태블릿 이상 */
@media (min-width: 640px) { ... }

/* 데스크톱 이상 */
@media (min-width: 1024px) { ... }
```

### 6.2 컴포넌트별 반응형

| 컴포넌트 | 모바일 | 데스크톱 |
|----------|--------|----------|
| Header | 햄버거 메뉴 | 인라인 네비게이션 |
| 멘토 그리드 | 1열 | 3열 |
| 모달 | 전체 화면 | 중앙 팝업 |
| Footer | 세로 스택 | 가로 배치 |
| 가격표 | 세로 스택 | 3열 그리드 |

### 6.3 터치 타겟

| 요소 | 최소 크기 |
|------|----------|
| 버튼 | 44px × 44px |
| 링크 | 44px 높이 |
| 폼 필드 | 48px 높이 |
| 체크박스 | 20px × 20px |

---

## 7. 아이콘

### 7.1 아이콘 시스템

- **라이브러리**: Heroicons (권장)
- **스타일**: Outline (기본), Solid (강조)
- **크기**: 20px (sm), 24px (md), 32px (lg)

### 7.2 주요 아이콘

| 용도 | 아이콘 | 크기 |
|------|--------|------|
| 닫기 | XMarkIcon | 24px |
| 메뉴 | Bars3Icon | 24px |
| 검색 | MagnifyingGlassIcon | 20px |
| 사용자 | UserIcon | 24px |
| 설정 | Cog6ToothIcon | 24px |
| 체크 | CheckIcon | 20px |

---

## 8. 이미지 가이드

### 8.1 프로필 이미지

| 항목 | 값 |
|------|-----|
| 크기 | 80px × 80px (멘토 카드) |
| 모양 | 원형 (rounded-full) |
| 기본 이미지 | 이니셜 또는 아바타 |
| 포맷 | WebP 권장, JPEG 대체 |

### 8.2 배경 이미지

| 용도 | 처리 |
|------|------|
| Hero 배경 | 그라데이션 오버레이 |
| 카드 배경 | 불투명도 조절 |
| 전체 배경 | 다크 톤 유지 |

---

## 9. 로딩 상태

### 9.1 스피너

```html
<div class="animate-spin rounded-full h-8 w-8
            border-2 border-blue-500 border-t-transparent" />
```

### 9.2 스켈레톤

```html
<div class="animate-pulse bg-slate-700 rounded-lg h-4 w-full" />
```

### 9.3 버튼 로딩

```html
<button disabled class="opacity-50 cursor-not-allowed">
  <Spinner class="mr-2" />
  처리중...
</button>
```
