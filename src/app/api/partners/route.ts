import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { partnerSchema } from '@/lib/validation';
import { apiError, checkOrigin, HttpError, rateLimit, readJson, verifyBot } from '@/lib/http';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const input = partnerSchema.parse(await readJson(request));
    if (input.website) throw new HttpError(400, 'Please check your submission.');
    await rateLimit(request, 'partners', 5);
    await verifyBot(input.turnstileToken, 'partners');
    const { error } = await db().from('partner_enquiries').insert({
      name: input.name,
      email: input.email,
      company: input.company,
      website: input.url,
      message: input.message,
    });
    if (error) throw new Error('Enquiry could not be stored');
    return NextResponse.json(
      { message: 'Your enquiry is saved. We’ll review it and get back to you.' },
      { status: 201 },
    );
  } catch (e) {
    return apiError(e);
  }
}
