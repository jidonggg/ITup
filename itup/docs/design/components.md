# 컴포넌트 명세 (Component Specification)

> 작성자: 디자인 기획자
> 최종 업데이트: YYYY-MM-DD

---

## 1. 버튼 (Button)

### 1.1 Primary Button
```jsx
<button className="
  bg-blue-600 hover:bg-blue-700
  text-white font-semibold
  px-6 py-3 rounded-lg
  transition-colors duration-200
">
  버튼 텍스트
</button>
```

**변형**:
- Size: `sm` (px-4 py-2), `md` (px-6 py-3), `lg` (px-8 py-4)
- Full Width: `w-full`

### 1.2 Secondary Button
```jsx
<button className="
  border border-slate-600
  text-slate-300 hover:text-white
  hover:bg-slate-700
  px-6 py-3 rounded-lg
  transition-colors duration-200
">
  버튼 텍스트
</button>
```

### 1.3 Ghost Button
```jsx
<button className="
  text-slate-400 hover:text-white
  px-4 py-2
  transition-colors duration-200
">
  버튼 텍스트
</button>
```

---

## 2. 카드 (Card)

### 2.1 멘토 카드
```jsx
<div className="
  bg-slate-800 rounded-xl p-6
  hover:shadow-xl hover:scale-105
  transition-all duration-300
  cursor-pointer
">
  {/* 프로필 이미지 */}
  {/* 이름, 회사, 직무 */}
  {/* 태그 */}
  {/* 가격 */}
</div>
```

### 2.2 기능 카드
```jsx
<div className="
  bg-slate-800/50 rounded-xl p-8
  border border-slate-700
  hover:border-blue-500
  transition-colors duration-300
">
  {/* 아이콘 */}
  {/* 제목 */}
  {/* 설명 */}
</div>
```

---

## 3. 모달 (Modal)

### 3.1 기본 구조
```jsx
{/* 백드롭 */}
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
  {/* 모달 컨테이너 */}
  <div className="flex items-center justify-center min-h-screen p-4">
    {/* 모달 */}
    <div className="
      bg-slate-800 rounded-2xl
      w-full max-w-md
      p-6
      shadow-2xl
    ">
      {/* 헤더 */}
      {/* 콘텐츠 */}
      {/* 푸터 */}
    </div>
  </div>
</div>
```

### 3.2 사이즈
| 사이즈 | max-width | 용도 |
|--------|-----------|------|
| Small | max-w-sm | 알림 |
| Medium | max-w-md | 로그인, 폼 |
| Large | max-w-2xl | 상세 보기 |

---

## 4. 폼 (Form)

### 4.1 Input
```jsx
<input className="
  w-full px-4 py-3
  bg-slate-700 border border-slate-600
  rounded-lg text-white
  placeholder:text-slate-400
  focus:outline-none focus:border-blue-500
  transition-colors duration-200
" />
```

### 4.2 Textarea
```jsx
<textarea className="
  w-full px-4 py-3
  bg-slate-700 border border-slate-600
  rounded-lg text-white
  placeholder:text-slate-400
  focus:outline-none focus:border-blue-500
  resize-none
  h-32
" />
```

### 4.3 Label
```jsx
<label className="block text-sm font-medium text-slate-300 mb-2">
  라벨
</label>
```

---

## 5. 네비게이션 (Navigation)

### 5.1 Header
```jsx
<header className="
  fixed top-0 left-0 right-0
  bg-slate-900/80 backdrop-blur-md
  border-b border-slate-800
  z-40
">
  <nav className="max-w-7xl mx-auto px-4 py-4">
    {/* 로고 */}
    {/* 메뉴 */}
    {/* 버튼 */}
  </nav>
</header>
```

### 5.2 Footer
```jsx
<footer className="bg-slate-900 border-t border-slate-800">
  <div className="max-w-7xl mx-auto px-4 py-12">
    {/* 로고 및 설명 */}
    {/* 링크 그룹 */}
    {/* 저작권 */}
  </div>
</footer>
```

---

## 6. 배지 (Badge)

### 6.1 태그
```jsx
<span className="
  px-3 py-1 rounded-full
  bg-blue-600/20 text-blue-400
  text-sm
">
  태그
</span>
```

### 6.2 상태 배지
```jsx
{/* 성공 */}
<span className="px-2 py-1 rounded bg-green-600/20 text-green-400 text-xs">
  완료
</span>

{/* 대기 */}
<span className="px-2 py-1 rounded bg-yellow-600/20 text-yellow-400 text-xs">
  대기중
</span>
```

---

## 7. 로딩 (Loading)

### 7.1 스피너
```jsx
<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
```

### 7.2 스켈레톤
```jsx
<div className="animate-pulse bg-slate-700 rounded-lg h-4 w-full" />
```
