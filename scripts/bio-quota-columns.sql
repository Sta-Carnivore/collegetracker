-- Bio quota enforcement: per-user generation/refine counters + concurrency lock.
-- Run in the Supabase SQL editor.

-- Step 1: Add quota + lock columns to users table.
alter table public.users
  add column if not exists has_bio_purchase    boolean      not null default false,
  add column if not exists bio_generates_used  integer      not null default 0,
  add column if not exists bio_refines_used    integer      not null default 0,
  add column if not exists bio_css_tweaks_used integer      not null default 0,
  add column if not exists bio_usage_period_start date,
  add column if not exists bio_active_job      boolean      not null default false,
  add column if not exists bio_last_job_start_at timestamptz;

-- Step 2: Atomic increment function (avoids read-modify-write races even though
--         the job lock already prevents concurrent jobs per user).
create or replace function public.bio_increment_usage(
  p_user_id   uuid,
  p_credit    text    -- 'generate' | 'refine' | 'css'
) returns void
language plpgsql
security definer
as $$
begin
  -- Callers must only increment their own counters.
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized';
  end if;
  if p_credit = 'generate' then
    update public.users
      set bio_generates_used = bio_generates_used + 1
      where id = p_user_id;
  elsif p_credit = 'refine' then
    update public.users
      set bio_refines_used = bio_refines_used + 1
      where id = p_user_id;
  elsif p_credit = 'css' then
    update public.users
      set bio_css_tweaks_used = bio_css_tweaks_used + 1
      where id = p_user_id;
  end if;
end;
$$;

-- Step 3: Grant execute to authenticated users so the route handler (which runs
--         under the user's session) can call it.
grant execute on function public.bio_increment_usage(uuid, text) to authenticated;
