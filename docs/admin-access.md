# Editor invitations and password recovery

Only the owner provisions editors. Disable public signup in Supabase Auth. Creating an Auth user does not grant dashboard access: add their UUID to `public.admin_users` separately. Use the correct isolated project's Auth configuration and Site URL for each environment.

## Email templates

Set Supabase Auth's Site URL to the exact application origin. The current preview origin is `https://githubsignals-preview-giovancarl444.vercel.app`; production will use `https://githubsignals.com`. Configure authenticated SMTP before sending invitations or resets to real editors. These Auth emails are separate from the newsletter outbox and its `EMAIL_ENABLED` flag.

Replace the **Invite user** template's action link with:

```html
<a href="{{ .SiteURL }}/admin/activate#token_hash={{ .TokenHash }}&type=invite"
  >Choose your editor password</a
>
```

Replace the **Reset password** template's action link with:

```html
<a href="{{ .SiteURL }}/admin/activate#token_hash={{ .TokenHash }}&type=recovery"
  >Reset your editor password</a
>
```

Keep these action URLs literal, with no click tracking or URL rewriting. The fragment keeps the one-time token out of application request URLs and referrers. The page removes the fragment from browser history after reading it. A reload requires reopening the original email. Merely opening the link never verifies or consumes it; the editor must submit a matching new password of at least 12 characters.

The server verifies the one-time token and checks admin membership before changing the password. Only `invite` and `recovery` token types are accepted. There is no caller-controlled redirect. On success it revokes refresh sessions through Supabase and requires a fresh sign-in. As with Supabase sign-out generally, already issued access tokens can remain valid until expiry; configure an appropriately short JWT lifetime in the provider. Removing `admin_users` membership immediately blocks this application's protected operations even for an existing session.

## Owner procedure

1. Create/invite the editor in the correct Supabase project's Auth dashboard. Add the returned UUID to `public.admin_users` before they use the link. If the initial link was consumed before membership existed, issue a new recovery link after adding membership.
2. The editor opens the email, chooses their own password, then signs in at `/admin/login`. Passwords and action links must never enter Git, screenshots, logs, support tickets or public chat.
3. For recovery, the owner issues a new password reset through Supabase Auth. Lost provider access is recovered through the owner's provider account and MFA recovery methods, not a public application bypass.
4. For revocation, delete the editor's `admin_users` membership first, then revoke their Auth sessions. Preserve the audit log.

Expired/replayed links and non-admin Auth users cannot change a password through the application. If the provider rejects a password after accepting the link, issue a fresh link and use a different strong password. If a password was saved but session revocation failed, the page explicitly reports that partial result; resolve the provider failure and revoke sessions before treating recovery as complete.

## Controlled verification

Use a synthetic `.invalid` address and the Supabase Admin `generateLink` API in the isolated preview. That API produces the token without sending an invitation email. Grant temporary membership, open the fragment URL, submit a password and verify password sign-in, replay rejection and revoked membership. Delete only that temporary user afterward. Never expose the generated token in command output or a browser trace. Configure and verify actual Auth email receipt separately before launch.

References: [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords), [server-side Auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
