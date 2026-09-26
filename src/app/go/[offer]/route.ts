import { isConfigured } from '@/lib/config';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeDestination, slug } from '@/lib/validation';
import { apiError, HttpError } from '@/lib/http';
export async function GET(request: Request, { params }: { params: Promise<{ offer: string }> }) {
  try {
    if (!isConfigured()) throw new HttpError(404, 'This offer is no longer available.');
    const name = slug.parse((await params).offer);
    const { data, error } = await db()
      .from('offers')
      .select('id,destination_url,approved_hostname,agreement_confirmed')
      .eq('slug', name)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw new Error('Offer lookup failed');
    if (
      !data ||
      !data.agreement_confirmed ||
      !safeDestination(data.destination_url, data.approved_hostname)
    )
      throw new HttpError(404, 'This offer is no longer available.');
    const search = new URL(request.url).searchParams;
    const label = (name: string) => {
      const v = search.get(name);
      return v && /^[a-zA-Z0-9_-]{1,80}$/.test(v) ? v : null;
    };
    // Anonymous counts only; no IP, email, cookie or arbitrary query string is retained.
    const saved = await db()
      .from('clicks')
      .insert({ offer_id: data.id, campaign: label('campaign'), placement: label('placement') });
    if (saved.error) console.error('click_record_failed', { offer: data.id });
    return NextResponse.redirect(data.destination_url, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
