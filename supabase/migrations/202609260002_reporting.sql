create function public.dashboard_metrics() returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select jsonb_build_object(
  'subscribed',(select count(*) from subscribers where status='subscribed'),
  'pending',(select count(*) from subscribers where status='pending'),
  'projects',(select count(*) from projects where status='published'),
  'offers',(select count(*) from offers where status='published'),
  'clicks',(select count(*) from clicks),
  'enquiries',(select count(*) from partner_enquiries where status='new'),
  'failed_jobs',(select count(*) from email_jobs where status='dead'),
  'pending_jobs',(select count(*) from email_jobs where status in ('pending','processing')),
  'campaigns_needing_review',(select count(*) from campaigns where status in ('review_required','preparing','sending')),
  'revenue',coalesce((select jsonb_agg(r) from (select currency,status,sum(amount_minor)::text as amount_minor,count(*) as transactions from commissions group by currency,status order by currency,status)r),'[]'::jsonb)
 )
$$;
revoke all on function public.dashboard_metrics() from public,anon,authenticated;
grant execute on function public.dashboard_metrics() to service_role;
