import 'server-only';
import { db } from './db';
export const adminTables = {
  projects: 'projects',
  offers: 'offers',
  campaigns: 'campaigns',
  subscribers: 'subscribers',
  enquiries: 'partner_enquiries',
  commissions: 'commissions',
  jobs: 'email_jobs',
  audit: 'audit_events',
} as const;
export type AdminEntity = keyof typeof adminTables;
export const adminColumns: Record<AdminEntity, string> = {
  projects: '*',
  offers: '*',
  campaigns: '*',
  subscribers:
    'id,email,status,consent_version,confirmed_at,unsubscribed_at,suppression_reason,source,created_at',
  enquiries: '*',
  commissions: '*',
  jobs: 'id,kind,subscriber_id,status,attempts,last_error,created_at,updated_at',
  audit: '*',
};
export async function audit(actor: string, action: string, id?: string) {
  const { error } = await db().from('audit_events').insert({ actor, action, entity_id: id });
  if (error) console.error('audit_write_failed', { action });
}
