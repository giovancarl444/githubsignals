create table public.system_status (key text primary key,updated_at timestamptz not null default now());
alter table public.system_status enable row level security;
revoke all on public.system_status from anon,authenticated;
grant all on public.system_status to service_role;
create function public.operational_health() returns boolean
language sql security definer set search_path=public,pg_temp as $$
  select exists(select 1 from system_status where key='email_worker' and updated_at>now()-interval '10 minutes')
    and not exists(select 1 from email_jobs where status='dead' or (status in ('pending','processing') and created_at<now()-interval '15 minutes'))
    and not exists(select 1 from campaigns where status='review_required' or (status in ('sending','preparing') and updated_at<now()-interval '10 minutes'));
$$;
revoke all on function public.operational_health() from public,anon,authenticated;
grant execute on function public.operational_health() to service_role;
