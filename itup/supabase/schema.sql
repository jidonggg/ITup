-- Supabase Schema for CoffeeChat Platform
-- Run this SQL in Supabase SQL Editor

-- 1. profiles 테이블 (사용자 프로필 확장)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  phone text,
  role text default 'mentee' check (role in ('mentee', 'mentor', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. mentors 테이블 (멘토 정보)
create table public.mentors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  role text not null,
  company text not null,
  previous_companies text[],
  experience text not null check (experience not in ('1년 미만', '1-3년')),
  skills text[] not null,
  bio text,
  available_times text[],
  consult_types text[] not null,
  rating numeric(2,1) default 0,
  sessions integer default 0,
  reviews integer default 0,
  is_approved boolean default false,
  created_at timestamptz default now()
);

-- 3. consultations 테이블 (상담 신청)
create table public.consultations (
  id uuid default gen_random_uuid() primary key,
  mentor_id uuid references public.mentors(id),
  user_name text not null,
  user_phone text not null,
  user_email text not null,
  interest text,
  message text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

-- 4. RLS (Row Level Security) 활성화
alter table public.profiles enable row level security;
alter table public.mentors enable row level security;
alter table public.consultations enable row level security;

-- 5. profiles 정책
-- 누구나 프로필 읽기 가능
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- 본인만 프로필 수정 가능
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 인증된 사용자만 프로필 생성 가능
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 6. mentors 정책
-- 승인된 멘토만 공개 조회 가능
create policy "Approved mentors are viewable by everyone"
  on public.mentors for select
  using (is_approved = true);

-- 본인 멘토 프로필 조회 (승인 전에도)
create policy "Users can view own mentor profile"
  on public.mentors for select
  using (auth.uid() = user_id);

-- 인증된 사용자만 멘토 등록 가능
create policy "Authenticated users can register as mentor"
  on public.mentors for insert
  with check (auth.uid() = user_id);

-- 본인 멘토 프로필 수정 가능
create policy "Users can update own mentor profile"
  on public.mentors for update
  using (auth.uid() = user_id);

-- 7. consultations 정책
-- 누구나 상담 신청 가능
create policy "Anyone can create consultation"
  on public.consultations for insert
  with check (true);

-- 관련 멘토만 상담 조회 가능
create policy "Mentors can view their consultations"
  on public.consultations for select
  using (
    mentor_id in (
      select id from public.mentors where user_id = auth.uid()
    )
  );

-- 8. 새 사용자 가입 시 자동으로 프로필 생성하는 함수
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

-- 9. 트리거 생성
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. 초기 샘플 멘토 데이터 (테스트용, is_approved = true)
insert into public.mentors (name, role, company, previous_companies, experience, skills, bio, available_times, consult_types, rating, sessions, reviews, is_approved)
values
  (
    '데브민',
    '시니어 게임 프로그래머',
    '넥슨',
    ARRAY['스마일게이트', '크래프톤'],
    '8년',
    ARRAY['C++', 'Unreal Engine', '게임 서버', '최적화'],
    '메이플스토리, 던전앤파이터 등 대형 프로젝트에서 서버 개발을 담당했습니다. 게임 서버 아키텍처 설계부터 최적화까지 실무 경험을 바탕으로 멘토링을 진행합니다. 특히 신입 개발자분들의 기술 면접 준비와 포트폴리오 리뷰에 강점이 있습니다.',
    ARRAY['평일 저녁 7-10시', '주말 오후 2-6시'],
    ARRAY['coffee', 'resume', 'interview'],
    4.9,
    120,
    89,
    true
  ),
  (
    '기획요정',
    '게임 기획자',
    '넷마블',
    ARRAY[]::text[],
    '6년',
    ARRAY['시스템 기획', '밸런싱', '레벨 디자인', 'UX/UI'],
    '모바일 RPG 및 수집형 게임의 시스템 기획과 밸런싱을 전문으로 합니다. 기획서 작성법부터 데이터 분석을 통한 라이브 운영까지, 실무에서 바로 쓸 수 있는 노하우를 전달해드립니다.',
    ARRAY['평일 저녁 8-11시', '토요일 오전 10-12시'],
    ARRAY['coffee', 'resume'],
    4.8,
    95,
    72,
    true
  ),
  (
    '쉐이더장인',
    '테크니컬 아티스트',
    '크래프톤',
    ARRAY['넥슨'],
    '7년',
    ARRAY['셰이더', '렌더링', 'Unity', 'Unreal Engine', '최적화'],
    '배틀그라운드 그래픽 최적화 및 셰이더 개발에 참여했습니다. 아트와 프로그래밍의 가교 역할을 하는 TA로서, 언리얼/유니티 셰이더 작성과 렌더링 파이프라인 이해를 도와드립니다.',
    ARRAY['평일 저녁 9-11시', '일요일 오후 3-7시'],
    ARRAY['coffee', 'resume', 'interview'],
    5.0,
    78,
    65,
    true
  ),
  (
    '유나UI',
    'UI/UX 디자이너',
    '스마일게이트',
    ARRAY['넥슨', '펄어비스'],
    '5년',
    ARRAY['UI 디자인', 'UX/UI', '애니메이션', 'VFX'],
    '로스트아크, 에픽세븐 등의 UI/UX 디자인을 담당했습니다. 게임 특유의 몰입감 있는 인터페이스 설계와 모션 그래픽을 통한 피드백 디자인을 전문으로 합니다. 포트폴리오 구성과 면접 준비를 함께 도와드려요.',
    ARRAY['화/목 저녁 7-10시', '토요일 오후 1-5시'],
    ARRAY['coffee', 'resume'],
    4.9,
    86,
    71,
    true
  );
