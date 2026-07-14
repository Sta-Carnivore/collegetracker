-- AI usage quotas for the non-Bio features: Resume parsing + Advisor
-- (recommend + strategy share one "advisor" pool). Separate pools so a user
-- re-parsing their resume never eats their advisor runs, and vice-versa.
-- Run in the Supabase SQL editor.

-- Resume pool reuses the existing ai_resume_calls_this_month counter, and adds a
-- resettable period + a concurrency lock. Advisor pool gets its own columns.
alter table public.users
  add column if not exists resume_period_start   date,
  add column if not exists resume_active_job     boolean      not null default false,
  add column if not exists resume_last_job_at    timestamptz,
  add column if not exists advisor_calls_used     integer     not null default 0,
  add column if not exists advisor_period_start   date,
  add column if not exists advisor_active_job     boolean     not null default false,
  add column if not exists advisor_last_job_at    timestamptz;

-- Atomic increment so parallel requests can't both pass the limit check and then
-- both write (the read-then-write race in the old resume route).
create or replace function public.ai_increment_usage(
  p_user_id uuid,
  p_feature text   -- 'resume' | 'advisor'
) returns void
language plpgsql
security definer
as $$
begin
  -- Callers must only increment their own counters.
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized';
  end if;
  if p_feature = 'resume' then
    update public.users
      set ai_resume_calls_this_month = coalesce(ai_resume_calls_this_month, 0) + 1
      where id = p_user_id;
  elsif p_feature = 'advisor' then
    update public.users
      set advisor_calls_used = coalesce(advisor_calls_used, 0) + 1
      where id = p_user_id;
  end if;
end;
$$;

grant execute on function public.ai_increment_usage(uuid, text) to authenticated;
