# 스타일 가이드 (Style Guide)

> 작성자: 디자인 기획자
> 최종 업데이트: YYYY-MM-DD

---

## 1. 디자인 원칙

### 1.1 핵심 가치
- **신뢰감**: 전문적이고 깔끔한 디자인
- **친근함**: 접근하기 쉬운 UI
- **효율성**: 빠른 정보 탐색

### 1.2 톤 앤 매너
- 모던하고 미니멀한 스타일
- 게임 업계 느낌 (다크 테마 활용)

---

## 2. 레이아웃

### 2.1 그리드 시스템
- **컨테이너**: max-width 1280px
- **여백**: 좌우 패딩 16px (모바일), 24px (데스크톱)

### 2.2 브레이크포인트
| 이름 | 사이즈 | Tailwind |
|------|--------|----------|
| Mobile | < 640px | default |
| Tablet | 640px | sm: |
| Desktop | 1024px | lg: |
| Wide | 1280px | xl: |

### 2.3 섹션 간격
- 섹션 간: py-16 (모바일), py-24 (데스크톱)
- 컴포넌트 간: gap-4 ~ gap-8

---

## 3. 컴포넌트 스타일

### 3.1 카드
```css
- 배경: bg-slate-800
- 둥글기: rounded-xl
- 그림자: shadow-lg
- 호버: hover:shadow-xl, scale-105
```

### 3.2 버튼
```css
Primary:
- bg-blue-600 hover:bg-blue-700
- text-white
- rounded-lg
- px-6 py-3

Secondary:
- border border-slate-600
- text-slate-300
- hover:bg-slate-700
```

### 3.3 모달
```css
- 백드롭: bg-black/50 backdrop-blur-sm
- 모달: bg-slate-800 rounded-2xl
- 최대 너비: max-w-md (소형), max-w-2xl (중형)
```

---

## 4. 애니메이션

### 4.1 트랜지션
- 기본: transition-all duration-300
- 호버: ease-in-out

### 4.2 스크롤 애니메이션
- Intersection Observer 활용
- fade-in, slide-up 효과

---

## 5. 접근성

### 5.1 색상 대비
- 텍스트/배경 대비 4.5:1 이상

### 5.2 포커스 상태
- focus:ring-2 focus:ring-blue-500

### 5.3 키보드 네비게이션
- Tab으로 모든 인터랙티브 요소 접근 가능
- ESC로 모달 닫기
