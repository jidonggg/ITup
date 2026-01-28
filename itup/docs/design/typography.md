# 타이포그래피 (Typography)

> 작성자: 디자인 기획자
> 최종 업데이트: YYYY-MM-DD

---

## 1. 폰트 패밀리

### 1.1 기본 폰트
```css
font-family: system-ui, -apple-system, sans-serif;
```
- Tailwind: `font-sans` (기본값)

### 1.2 한글 폰트 (권장)
- Pretendard
- Noto Sans KR

---

## 2. 폰트 사이즈

### 2.1 제목 (Heading)
| 레벨 | Tailwind | 사이즈 | 용도 |
|------|----------|--------|------|
| H1 | text-4xl ~ text-6xl | 36-60px | 히어로 헤드라인 |
| H2 | text-3xl ~ text-4xl | 30-36px | 섹션 제목 |
| H3 | text-xl ~ text-2xl | 20-24px | 카드 제목 |
| H4 | text-lg | 18px | 소제목 |

### 2.2 본문 (Body)
| 타입 | Tailwind | 사이즈 | 용도 |
|------|----------|--------|------|
| Large | text-lg | 18px | 리드 문구 |
| Base | text-base | 16px | 본문 |
| Small | text-sm | 14px | 보조 텍스트 |
| XSmall | text-xs | 12px | 라벨, 캡션 |

---

## 3. 폰트 웨이트

| 이름 | Tailwind | 값 | 용도 |
|------|----------|-----|------|
| Bold | font-bold | 700 | 제목, 강조 |
| Semibold | font-semibold | 600 | 버튼, 네비 |
| Medium | font-medium | 500 | 소제목 |
| Normal | font-normal | 400 | 본문 |

---

## 4. 행간 (Line Height)

| 타입 | Tailwind | 값 | 용도 |
|------|----------|-----|------|
| Tight | leading-tight | 1.25 | 제목 |
| Normal | leading-normal | 1.5 | 기본 |
| Relaxed | leading-relaxed | 1.625 | 긴 본문 |

---

## 5. 텍스트 스타일 조합

### 5.1 히어로 헤드라인
```html
<h1 class="text-4xl md:text-6xl font-bold leading-tight text-white">
```

### 5.2 섹션 제목
```html
<h2 class="text-3xl font-bold text-white mb-4">
```

### 5.3 카드 제목
```html
<h3 class="text-xl font-semibold text-white">
```

### 5.4 본문
```html
<p class="text-base text-slate-300 leading-relaxed">
```

### 5.5 보조 텍스트
```html
<span class="text-sm text-slate-400">
```

---

## 6. 반응형 타이포그래피

### 6.1 제목 스케일
```html
<!-- 모바일 → 데스크톱 -->
<h1 class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl">
```

### 6.2 본문 스케일
```html
<p class="text-sm sm:text-base">
```
