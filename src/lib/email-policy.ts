import { isProduction } from './config';
export function canEmail(address: string): boolean {
  if (process.env.EMAIL_ENABLED !== 'true') return false;
  if (isProduction()) return true;
  return (process.env.TEST_RECIPIENTS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(address.toLowerCase());
}
export function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
export function emailHtml(title: string, body: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#0a0d12;color:#f9f5f0;font:16px/1.7 Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:40px 24px"><p style="color:#fa843c;font-weight:bold">GITHUB SIGNALS</p><h1>${escapeHtml(title)}</h1>${body}<hr style="border:0;border-top:1px solid #333;margin:32px 0"><p style="font-size:12px;color:#b5b5b5">${footer}</p></div></body></html>`;
}

export function newsletterBody(body: string) {
  return body
    .split(/\n\n+/)
    .map(
      (paragraph) =>
        '<p>' +
        paragraph
          .split(/(https:\/\/[^\s<>]+)/g)
          .map((part) => {
            if (!part.startsWith('https://')) return escapeHtml(part).replaceAll('\n', '<br>');
            try {
              const url = new URL(part);
              if (url.username || url.password) return escapeHtml(part);
              return `<a href="${escapeHtml(url.toString())}" style="color:#ff9d5d">${escapeHtml(part)}</a>`;
            } catch {
              return escapeHtml(part);
            }
          })
          .join('') +
        '</p>',
    )
    .join('');
}
