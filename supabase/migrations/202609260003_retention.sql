-- Keep the exact wording associated with every consent version.
create table public.consent_versions (
  version text primary key, wording text not null,
  created_at timestamptz not null default now()
);
insert into public.consent_versions(version,wording) values
('weekly-newsletter-2026-09-26','Send me the weekly GitHub Signals newsletter, including clearly labelled partner recommendations. I can unsubscribe at any time.');
alter table public.consent_versions enable row level security;
revoke all on public.consent_versions from anon,authenticated;
grant all on public.consent_versions to service_role;
alter table public.subscribers add constraint subscriber_consent_version foreign key (consent_version) references public.consent_versions(version);
alter table public.consent_events add constraint event_consent_version foreign key (consent_version) references public.consent_versions(version);

alter table public.partner_enquiries add column updated_at timestamptz not null default now();
create function public.touch_enquiry() returns trigger language plpgsql set search_path = public,pg_temp as $$
begin new.updated_at=now(); return new; end $$;
create trigger touch_enquiry before update on public.partner_enquiries for each row execute function public.touch_enquiry();
revoke all on function public.touch_enquiry() from public,anon,authenticated;

create function public.prune_private_data() returns void
language plpgsql security definer set search_path = public,pg_temp as $$
begin
  delete from clicks where created_at < now()-interval '90 days';
  delete from rate_limits where window_start < now()-interval '1 day';
  delete from webhook_events where processed_at < now()-interval '90 days';
  delete from partner_enquiries where status='closed' and updated_at < now()-interval '12 months';
  delete from subscribers where status='pending' and confirmed_at is null and unsubscribed_at is null and last_requested_at < now()-interval '30 days';
  delete from email_jobs where status='done' and updated_at < now()-interval '30 days';
  update email_jobs set status='done',lease_token=null,lease_until=null,updated_at=now(),last_error=coalesce(last_error,'Confirmation expired; a fresh signup is needed') where kind='confirmation' and status<>'done' and created_at < now()-interval '24 hours';
  update email_jobs set payload='{}' where kind='confirmation' and created_at < now()-interval '24 hours' and payload <> '{}';
  update subscribers set source='{}' where status in ('unsubscribed','suppressed') and source <> '{}';
end $$;
revoke all on function public.prune_private_data() from public,anon,authenticated;
grant execute on function public.prune_private_data() to service_role;
