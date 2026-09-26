import { lookup } from 'node:dns/promises';
import { connection } from './database.mjs';
const client = connection();
let failed = 0;
try {
  await client.connect();
  const { rows } = await client.query(
    "select slug,destination_url,approved_hostname from offers where status='published' and agreement_confirmed",
  );
  for (const offer of rows) {
    try {
      const url = new URL(offer.destination_url);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== offer.approved_hostname ||
        url.username ||
        url.password ||
        url.port
      )
        throw new Error('Destination is not approved');
      const addresses = await lookup(url.hostname, { all: true });
      if (
        addresses.some(({ address }) =>
          /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.|::|fe80:|fc|fd)/i.test(
            address,
          ),
        )
      )
        throw new Error('Hostname resolves to a private address');
      let response = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 405)
        response = await fetch(url, {
          method: 'GET',
          redirect: 'manual',
          signal: AbortSignal.timeout(10000),
        });
      await response.body?.cancel();
      if (response.status >= 400) throw new Error(`HTTP ${response.status}`);
      console.log(
        offer.slug,
        `HTTP ${response.status}${response.status >= 300 ? ' (inspect partner redirect periodically)' : ''}`,
      );
    } catch (e) {
      console.error(offer.slug, e.message);
      failed++;
    }
  }
  console.log(`Checked ${rows.length} published offer(s); ${failed} need attention.`);
  if (failed) process.exitCode = 1;
} catch (e) {
  console.error('Offer check failed:', e.code || 'database unavailable');
  process.exitCode = 1;
} finally {
  await client.end();
}
