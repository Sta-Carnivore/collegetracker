-- Auto-create a public.users row whenever a new auth user signs up.
-- WHY: nothing in the app code inserts into public.users. Without this trigger,
-- a new user has no users row, so:
--   - quota counters update 0 rows (→ unlimited free AI)
--   - the Stripe webhook update affects 0 rows (→ paid users get nothing)
-- Run once in the Supabase SQL editor.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create rows for any existing auth users that don't have one yet.
insert into public.users (id, email)
select au.id, au.email
from auth.users au
left join public.users u on u.id = au.id
where u.id is null
on conflict (id) do nothing;
