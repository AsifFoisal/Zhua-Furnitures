# Zhua Furnitures Auth Email Branding (Supabase)

Use this guide to make Supabase auth emails appear as if they come from Zhua Furnitures.

## 1) Configure Custom SMTP in Supabase

1. Open Supabase Dashboard.
2. Go to Authentication -> Email -> SMTP Settings.
3. Enable custom SMTP.
4. Fill values from your provider (Resend, Postmark, SendGrid, Zoho, etc.).
5. Set sender name to `Zhua Furnitures`.
6. Set sender email to a branded address, for example `noreply@zhuafurniture.com`.

## 2) Verify DNS for Deliverability

Configure DNS records from your SMTP provider:

1. SPF record
2. DKIM record(s)
3. DMARC record (recommended)

Without DNS verification, Gmail may still show warnings or route to spam.

## 3) Paste Branded HTML Templates

In Supabase Dashboard:

1. Go to Authentication -> Email Templates.
2. Update each template body by copying from files in this folder.
3. Recommended subjects:
   - Confirm signup: `Welcome to Zhua Furnitures - Confirm Your Email`
   - Reset password: `Reset Your Zhua Furnitures Password`
   - Magic link: `Your Secure Sign-In Link - Zhua Furnitures`
   - Change email: `Confirm Your New Email - Zhua Furnitures`
   - Invite user: `You Are Invited to Zhua Furnitures`

## 4) Confirm Site URL and Redirect URL

In Supabase Auth settings, ensure:

1. Site URL is exactly `https://www.zhuafurniture.com/`.
2. Redirect URLs include:
    - `https://www.zhuafurniture.com/auth/login`
    - `https://www.zhuafurniture.com/auth/update-password`
    - `https://www.zhuafurniture.com/auth/callback`
3. Remove legacy hosts such as `https://zhua-furnitures.vercel.app/` from Site URL and redirect allowlists.

App-side fallback hardening:

- Set `.env` values to:
   - `NEXT_PUBLIC_SITE_URL=https://www.zhuafurniture.com/`
   - `SITE_URL=https://www.zhuafurniture.com/`
   - `CANONICAL_SITE_URL=https://www.zhuafurniture.com/` (optional but recommended)

## 5) Send End-to-End Test Emails

1. Register a new user.
2. Trigger password reset.
3. Trigger magic link sign-in (if used).
4. Validate:
   - Sender appears as Zhua Furnitures
   - Branded HTML renders correctly
   - Buttons route to your domain and succeed

## Notes

- `{{ .ConfirmationURL }}` is used by Supabase for the action link.
- Keep template HTML inline-styled for better email client compatibility.
- If changing button links manually, keep Supabase token parameters intact.

## Troubleshooting: "Error sending confirmation email"

Supabase returns this error when its auth mailer cannot deliver the signup email (bad SMTP
credentials, revoked Resend API key, unverified sender domain, or the built-in mailer's rate
limit). Signup is rolled back, so no account is created.

The app now recovers from this automatically in `src/app/auth/register/actions.ts`:

1. `signUp` is attempted first, so Supabase's own templates are used while SMTP works.
2. If the auth mailer fails, the account is created through the Admin API and the confirmation
   email is sent with the app's Resend integration (`RESEND_API_KEY` / `RESEND_FROM_EMAIL`).
3. If Resend also fails, the account is activated without email verification and the customer is
   signed in, so registration is never blocked. The reason is written to the server log with the
   `[register]` prefix.

Emails sent by step 2 link to `/auth/callback`, which verifies the token and signs the customer
in. Keep that URL in the Supabase redirect allowlist.

To restore verification emails, replace the revoked Resend API key:

1. Create a new key at https://resend.com/api-keys.
2. Update `RESEND_API_KEY` in `.env.local` (and in the hosting provider's environment variables).
3. Update the Supabase SMTP password (Authentication -> Email -> SMTP Settings) with the same key.
4. Confirm `zhuafurniture.com` is verified in Resend (SPF/DKIM) and that `RESEND_FROM_EMAIL` uses
   that domain.

