# 컬러 시스템 (Color System)

> 작성자: 디자인 기획자
> 최종 업데이트: 2025-01-28

---

## 1. 브랜드 컬러

### 1.1 Primary (주 색상)
| 이름 | Tailwind | HEX | 용도 |
|------|----------|-----|------|
| Primary | blue-600 | #2563EB | CTA 버튼, 링크 |
| Primary Hover | blue-700 | #1D4ED8 | 호버 상태 |
| Primary Light | blue-500 | #3B82F6 | 강조 |

### 1.2 Secondary (보조 색상)
| 이름 | Tailwind | HEX | 용도 |
|------|----------|-----|------|
| Accent | purple-600 | #9333EA | 특별 강조 |
| Success | green-500 | #22C55E | 성공 상태 |
| Warning | yellow-500 | #EAB308 | 경고 |
| Error | red-500 | #EF4444 | 에러 |

---

## 2. 배경 컬러

### 2.1 다크 테마 (기본)
| 이름 | Tailwind | HEX | 용도 |
|------|----------|-----|------|
| Background | slate-900 | #0F172A | 페이지 배경 |
| Surface | slate-800 | #1E293B | 카드, 모달 |
| Surface Light | slate-700 | #334155 | 호버, 구분선 |

### 2.2 오버레이
| 이름 | Tailwind | 용도 |
|------|----------|------|
| Backdrop | black/50 | 모달 배경 |
| Overlay | black/70 | 이미지 오버레이 |

---

## 3. 텍스트 컬러

| 이름 | Tailwind | HEX | 용도 |
|------|----------|-----|------|
| Primary | white | #FFFFFF | 제목, 강조 |
| Secondary | slate-300 | #CBD5E1 | 본문 |
| Tertiary | slate-400 | #94A3B8 | 보조 텍스트 |
| Muted | slate-500 | #64748B | 비활성, 힌트 |

---

## 4. 그라데이션

### 4.1 배경 그라데이션
```css
/* Hero 배경 */
bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900

/* 카드 강조 */
bg-gradient-to-r from-blue-600 to-purple-600
```

### 4.2 텍스트 그라데이션
```css
bg-gradient-to-r from-blue-400 to-purple-400
bg-clip-text text-transparent
```

---

## 5. 상태별 컬러

### 5.1 버튼 상태
| 상태 | Primary | Secondary |
|------|---------|-----------|
| Default | blue-600 | slate-700 |
| Hover | blue-700 | slate-600 |
| Active | blue-800 | slate-500 |
| Disabled | slate-600 | slate-800 |

### 5.2 폼 상태
| 상태 | 보더 | 배경 |
|------|------|------|
| Default | slate-600 | slate-700 |
| Focus | blue-500 | slate-700 |
| Error | red-500 | slate-700 |
| Success | green-500 | slate-700 |

---

## 6. 컬러 팔레트 시각화

```
Primary:    ████ #2563EB (blue-600)
Accent:     ████ #9333EA (purple-600)
Background: ████ #0F172A (slate-900)
Surface:    ████ #1E293B (slate-800)
Text:       ████ #FFFFFF (white)
Muted:      ████ #64748B (slate-500)
```
