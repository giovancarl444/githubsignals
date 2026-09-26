-- Owned application data. All private writes happen through trusted server code.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null, summary text not null, body text not null default '',
  repository_url text not null check (repository_url ~ '^https://github.com/[^/]+/[^/]+/?$'),
  instagram_url text check (instagram_url is null or instagram_url ~ '^https://www.instagram.com/(p|reel)/[A-Za-z0-9_-]+/?$'),
  category text not null default 'Developer tools', tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.offers (
  id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null, summary text not null, body text not null default '',
  program text not null, destination_url text not null, approved_hostname text not null,
  agreement_confirmed boolean not null default false,
  disclosure text not null default 'We may earn a commission if you purchase through this link.',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (status <> 'published' or agreement_confirmed)
);
create table public.subscribers (
  id uuid primary key default gen_random_uuid(), email text not null unique check (email = lower(trim(email))),
  status text not null default 'pending' check (status in ('pending','subscribed','unsubscribed','suppressed')),
  source jsonb not null default '{}', consent_version text not null,
  confirmation_hash text, confirmation_expires_at timestamptz, last_requested_at timestamptz not null default now(),
  confirmed_at timestamptz, unsubscribed_at timestamptz, suppression_reason text,
  provider_contact_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index confirmation_hash_unique on public.subscribers(confirmation_hash) where confirmation_hash is not null;
create table public.consent_events (
  id bigint generated always as identity primary key, subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  action text not null, consent_version text, created_at timestamptz not null default now()
);
create table public.email_jobs (
  id uuid primary key default gen_random_uuid(), kind text not null check (kind in ('confirmation','contact_sync')),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  dedupe_key text not null unique, payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending','processing','done','dead')),
  attempts integer not null default 0, available_at timestamptz not null default now(),
  lease_until timestamptz, lease_token uuid, last_error text, provider_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index jobs_ready on public.email_jobs(status,available_at);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(), title text not null, subject text not null, body text not null,
  status text not null default 'draft' check (status in ('draft','preparing','ready','scheduled','sending','sent','review_required')),
  provider_broadcast_id text unique, scheduled_at timestamptz, sent_at timestamptz,
  last_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.clicks (
  id uuid primary key default gen_random_uuid(), offer_id uuid not null references public.offers(id),
  campaign text, placement text, created_at timestamptz not null default now()
);
create index clicks_offer_date on public.clicks(offer_id,created_at);
create table public.commissions (
  id uuid primary key default gen_random_uuid(), program text not null, transaction_id text not null,
  offer_id uuid references public.offers(id), amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null check (status in ('pending','approved','reversed','paid')),
  occurred_at timestamptz not null, imported_at timestamptz not null default now(),
  unique(program,transaction_id)
);
create table public.partner_enquiries (
  id uuid primary key default gen_random_uuid(), email text not null, name text not null, company text not null,
  website text not null, message text not null,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed')),
  created_at timestamptz not null default now()
);
create table public.webhook_events (
  event_id text primary key, event_type text not null, processed_at timestamptz not null default now()
);
create table public.rate_limits (
  key text primary key, window_start timestamptz not null, hits integer not null
);
create table public.audit_events (
  id bigint generated always as identity primary key, actor uuid, action text not null,
  entity_id text, created_at timestamptz not null default now()
);

-- Only admins can see their own membership. The service role is used by server routes.
alter table public.admin_users enable row level security;
create policy own_membership on public.admin_users for select to authenticated using (user_id = auth.uid());
alter table public.projects enable row level security;
create policy published_projects on public.projects for select to anon, authenticated using (status = 'published');
alter table public.offers enable row level security;
create policy published_offers on public.offers for select to anon, authenticated using (status = 'published' and agreement_confirmed);
do $$ declare t text; begin
  foreach t in array array['subscribers','consent_events','email_jobs','campaigns','clicks','commissions','partner_enquiries','webhook_events','rate_limits','audit_events'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;
revoke all on all tables in schema public from anon, authenticated;
grant select on public.projects, public.offers to anon, authenticated;
grant select on public.admin_users to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

create function public.consume_rate_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_hits integer; begin
  insert into rate_limits(key,window_start,hits) values(p_key,now(),1)
  on conflict(key) do update set
    hits = case when rate_limits.window_start < now()-make_interval(secs=>p_seconds) then 1 else rate_limits.hits+1 end,
    window_start = case when rate_limits.window_start < now()-make_interval(secs=>p_seconds) then now() else rate_limits.window_start end
  returning hits into v_hits;
  return v_hits <= p_limit;
end $$;

-- Subscriber and email job are committed together. Concurrent signups cannot create duplicates.
create function public.request_subscription(p_email text,p_hash text,p_token text,p_source jsonb,p_consent text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s subscribers; begin
  perform pg_advisory_xact_lock(hashtextextended(lower(trim(p_email)),0));
  select * into s from subscribers where email=lower(trim(p_email)) for update;
  if found then
    if s.status in ('subscribed','suppressed') or s.last_requested_at > now()-interval '15 minutes' then return; end if;
    update subscribers set status='pending',confirmation_hash=p_hash,confirmation_expires_at=now()+interval '24 hours',
      consent_version=p_consent,source=p_source,last_requested_at=now(),updated_at=now() where id=s.id;
  else
    insert into subscribers(email,confirmation_hash,confirmation_expires_at,source,consent_version)
    values(lower(trim(p_email)),p_hash,now()+interval '24 hours',p_source,p_consent) returning * into s;
  end if;
  insert into consent_events(subscriber_id,action,consent_version) values(s.id,'requested',p_consent);
  insert into email_jobs(kind,subscriber_id,dedupe_key,payload)
    values('confirmation',s.id,'confirm:'||p_hash,jsonb_build_object('token',p_token));
end $$;

create function public.confirm_subscription(p_hash text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare s subscribers; begin
  select * into s from subscribers where confirmation_hash=p_hash for update;
  if not found or s.status <> 'pending' or s.confirmation_expires_at < now() then return false; end if;
  update subscribers set status='subscribed',confirmed_at=now(),confirmation_hash=null,confirmation_expires_at=null,updated_at=now() where id=s.id;
  insert into consent_events(subscriber_id,action,consent_version) values(s.id,'confirmed',s.consent_version);
  insert into email_jobs(kind,subscriber_id,dedupe_key) values('contact_sync',s.id,'sync:'||gen_random_uuid());
  return true;
end $$;

create function public.stop_subscription(p_id uuid,p_reason text default 'unsubscribe')
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s subscribers; begin
  select * into s from subscribers where id=p_id for update;
  if not found then return; end if;
  if s.status='suppressed' or (s.status='unsubscribed' and p_reason='unsubscribe') then return; end if;
  update subscribers set status=case when s.status='suppressed' or p_reason <> 'unsubscribe' then 'suppressed' else 'unsubscribed' end,
    unsubscribed_at=now(),suppression_reason=case when p_reason <> 'unsubscribe' then p_reason else suppression_reason end,
    confirmation_hash=null,confirmation_expires_at=null,updated_at=now() where id=p_id;
  insert into consent_events(subscriber_id,action) values(p_id,p_reason);
  insert into email_jobs(kind,subscriber_id,dedupe_key) values('contact_sync',p_id,'sync:'||gen_random_uuid());
end $$;

create function public.process_email_event(p_event_id text,p_type text,p_emails text[],p_contact_id text default null,p_unsubscribed boolean default false)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare s subscribers; begin
  insert into webhook_events(event_id,event_type) values(p_event_id,p_type) on conflict do nothing;
  if not found then return false; end if;
  if p_type in ('email.bounced','email.complained','email.suppressed','suppression.added') or (p_type='contact.updated' and p_unsubscribed) then
    for s in select * from subscribers where email=any(p_emails) or (p_contact_id is not null and provider_contact_id=p_contact_id) loop
      perform stop_subscription(s.id,case when p_type='contact.updated' then 'unsubscribe' else p_type end);
    end loop;
  end if;
  return true;
end $$;

create function public.claim_email_jobs(p_limit integer default 10)
returns setof public.email_jobs language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return query with ready as (
    select id from email_jobs where (status='pending' and available_at<=now()) or (status='processing' and lease_until<now())
    order by created_at for update skip locked limit least(p_limit,25)
  ) update email_jobs j set status='processing',attempts=attempts+1,lease_until=now()+interval '5 minutes',
    lease_token=gen_random_uuid(),updated_at=now() from ready where j.id=ready.id returning j.*;
end $$;

create function public.finish_email_job(p_id uuid,p_lease uuid,p_status text,p_error text default null,p_provider_id text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_status not in ('done','pending','dead') then raise exception 'Invalid job status'; end if;
  update email_jobs set status=p_status,last_error=p_error,provider_id=coalesce(p_provider_id,provider_id),
    payload=case when p_status='done' then '{}'::jsonb else payload end,
    available_at=now()+make_interval(secs=>least(3600,(30*power(2,least(attempts,7)))::integer)),
    lease_until=null,lease_token=null,updated_at=now() where id=p_id and lease_token=p_lease;
end $$;

create function public.import_commissions(p_rows jsonb,p_actor uuid)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer; begin
  insert into commissions(program,transaction_id,offer_id,amount_minor,currency,status,occurred_at)
  select r.program,r.transaction_id,r.offer_id,r.amount_minor,r.currency,r.status,r.occurred_at
  from jsonb_to_recordset(p_rows) as r(program text,transaction_id text,offer_id uuid,amount_minor bigint,currency text,status text,occurred_at timestamptz)
  on conflict(program,transaction_id) do update set offer_id=excluded.offer_id,amount_minor=excluded.amount_minor,
    currency=excluded.currency,status=excluded.status,occurred_at=excluded.occurred_at,imported_at=now();
  get diagnostics n = row_count;
  insert into audit_events(actor,action) values(p_actor,'commissions.import'); return n;
end $$;

create function public.import_projects(p_rows jsonb,p_actor uuid)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer; begin
  insert into projects(slug,title,summary,body,repository_url,instagram_url,category,tags,status)
  select r.slug,r.title,r.summary,r.body,r.repository_url,r.instagram_url,r.category,r.tags,'draft'
  from jsonb_to_recordset(p_rows) as r(slug text,title text,summary text,body text,repository_url text,instagram_url text,category text,tags text[])
  on conflict(slug) do nothing;
  get diagnostics n = row_count;
  insert into audit_events(actor,action) values(p_actor,'projects.import'); return n;
end $$;

-- Explicit grants; postgres functions otherwise default to executable by PUBLIC.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('consume_rate_limit','request_subscription','confirm_subscription','stop_subscription','process_email_event','claim_email_jobs','finish_email_job','import_commissions','import_projects') loop
  execute format('revoke all on function %s from public,anon,authenticated',f.sig);
  execute format('grant execute on function %s to service_role',f.sig);
 end loop;
end $$;
