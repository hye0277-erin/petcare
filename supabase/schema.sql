-- ============================================================
-- Pet Care+  Supabase 스키마
-- SQL Editor에 붙여넣고 Run 하세요. (이미 만든 테이블은 건너뜀)
-- ============================================================

-- ===== care_tasks : 케어 일정 =====
create table if not exists care_tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  task_date         date not null default current_date,   -- 날짜별 조회 기준
  icon              text,
  name              text not null,
  category          text,                                 -- medicine/meal/water...
  is_time_sensitive boolean default true,                 -- false면 '오늘 중'
  scheduled_time    text,                                 -- 'HH:MM'
  bg                text,                                 -- bg-blue / __water 등
  done              boolean default false,
  done_time         text,                                 -- 'HH:MM'
  memo              text default '',
  created_at        timestamptz default now()
);

-- 날짜별 조회 성능용 인덱스
create index if not exists care_tasks_user_date_idx
  on care_tasks (user_id, task_date);

-- ===== RLS : 본인 데이터만 =====
alter table care_tasks enable row level security;

drop policy if exists "own care_tasks" on care_tasks;
create policy "own care_tasks" on care_tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
