# Domain, DNS and email handoff

## Observed baseline (2026-09-26)

Public DNS is not a complete zone export. These are observations, not a replacement for the owner's authoritative zone inventory:

| Record                           | Observed value                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `.com` apex A                    | `185.158.133.1`                                                                               |
| Nameservers                      | `ns1hwy.name.com`, `ns2fln.name.com`, `ns3fqs.name.com`, `ns4jNZ.name.com` (case-insensitive) |
| Apex MX / TXT                    | No answers observed at inspection                                                             |
| Registration expiry              | 2027-04-30, from the inspected registration record                                            |
| Search Console HTML verification | `u5pvagiREMdJGJ5wwPq2UDNXL4Pizuf38fjThYrP_k4`                                                 |

Do not infer that subdomain, verification, DKIM, CAA or DNSSEC records are absent. The owner must export or inventory the **entire authoritative zone** in Lovable's domain controls before changing nameservers. Preserve a timestamped zone file and screenshots in private owner-controlled storage.

## Keep registration; move DNS carefully

Lovable's managed website records cannot simply be edited. Its domain settings allow custom nameservers. The registration and renewal stay with the existing Lovable purchase/underlying Name.com arrangement for this release.

1. Record registrant/renewal email, auto-renew state, payment method, recovery access, exact renewal price and the account's transfer/unlock procedure. The observed expiry does not prove auto-renew is enabled.
2. Add `.com` to the owner's Cloudflare account. Prepopulate its zone with the **complete existing zone**, still pointing the website to the working old deployment. Do not treat Cloudflare's automatic DNS scan as complete. Mail/verification records must be DNS-only.
3. If DNSSEC is active, follow the registrar/Cloudflare migration procedure so an obsolete DS record cannot break resolution. Record TTLs and plan a quiet change window.
4. Replace nameservers in Lovable's workspace domain configuration with the exact pair assigned by Cloudflare. Verify authoritative answers and old-site availability from independent resolvers before changing website routing.
5. Add `.com` and `www.githubsignals.com` to the Vercel project. Copy **the records Vercel actually assigns**, not values from a generic guide. Start website records DNS-only while validating Vercel ownership/certificates.
6. After acceptance checks, change only the website records. Preserve all MX, SPF, DKIM, DMARC, Search Console, domain-verification and unrelated subdomain records. `www` returns a permanent redirect to `https://githubsignals.com` through the app configuration.
7. Check HTTPS, both hostnames, canonical metadata, sitemap, signup and incoming email. Keep the previous deployment and the private DNS snapshot available throughout propagation.

Application rollback is a Vercel deployment rollback **using the same current database**. Never roll back subscriber data just to revert frontend code. Returning the domain to Lovable also returns to the old simulated signup unless that form is disabled first; use this only as emergency recovery with an explicit capture plan.

## Separate sending from receiving

- **Receiving:** Google Workspace mailbox such as `hello@githubsignals.com`, with `contact@`, `partners@` and `privacy@` aliases. Follow the exact MX/verification/DKIM records supplied by Workspace. Test receipt and replies from external controlled inboxes. A Resend verified sending domain does not create this inbox.
- **Sending:** Resend subdomain such as `mail.githubsignals.com`; sender `GitHub Signals <newsletter@mail.githubsignals.com>`. Install its exact DKIM and return-path SPF/MX records. Use the Workspace address as reply-to.
- Maintain one SPF record per hostname. Do not publish two competing SPF TXT records or overwrite Workspace records while adding Resend.
- Add DMARC with an owner-controlled reporting address and an intentional policy. Start with monitoring while both senders are tested; tighten after reviewing legitimate traffic. Verify alignment from actual received-message headers.
- Newsletter broadcasts include Resend's native unsubscribe placeholder and the verified business postal address. Resend enforces its own opt-outs; signed webhooks mirror them locally. Never bypass or bulk reset provider suppression.

Current provider instructions: [Lovable custom domains](https://docs.lovable.dev/features/custom-domain), [Cloudflare full setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/), [Vercel domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [Resend domains](https://resend.com/docs/dashboard/domains/introduction), [Workspace activation](https://support.google.com/a/answer/174125).
