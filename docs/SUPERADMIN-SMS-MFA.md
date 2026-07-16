# SuperAdmin SMS verification

PhotoView.io can require a texted one-time code after the existing secure email login link. The second approval is restricted to `SUPERADMIN`, bound to the current login session, stored in an HTTP-only signed cookie, and expires after 12 hours. Subscriber authentication is unchanged.

## Safe activation order

1. Sign in to the existing Twilio account and verify the owner phone.
2. Create one Twilio Verify Service named `PhotoView.io SuperAdmin` with Fraud Guard enabled.
3. Create a restricted production API key that can create Verify verifications and verification checks. Account SID/Auth Token may be used temporarily, but a restricted key is preferred.
4. Add these private Production environment variables in Vercel while leaving `ADMIN_SMS_MFA_ENABLED=false`:
   - `SUPERADMIN_MFA_PHONE_E164` — the owner phone in `+15555550123` format.
   - `TWILIO_VERIFY_SERVICE_SID` — the `VA...` service identifier.
   - `TWILIO_API_KEY_SID` and `TWILIO_API_KEY_SECRET` — preferred credentials.
5. Test one code in a Preview deployment.
6. Set `ADMIN_SMS_MFA_ENABLED=true` in Preview, verify that `/admin` requires the texted code, and confirm that `/dashboard` subscriber login is unchanged.
7. Set `ADMIN_SMS_MFA_ENABLED=true` in Production and redeploy.

The production configuration check rejects an enabled deployment if any required SMS setting is absent or malformed.

## Protection and operating limits

- Codes are sent only after a successful email-link login and an explicit press of **Send security code**.
- Sending is limited by SuperAdmin, day, and client address. Code checks are separately limited.
- Twilio Verify also expires codes and applies its own attempt limits.
- The application never stores or logs the code or the full phone number.
- Send, rejection, verification, provider failure, and rate-limit events appear in the existing admin audit log.

## Emergency recovery

If the owner loses the phone, an authorized operator must set `ADMIN_SMS_MFA_ENABLED=false` in Vercel and redeploy. This restores email-link-only SuperAdmin access. Replace and verify the phone, test in Preview, then re-enable the flag. Do not add an email bypass or a permanent recovery URL because either would defeat the second factor.

## Later hardening

SMS is a pragmatic first step, but it is not phishing-resistant. As the company scales, move SuperAdmin to passkeys/WebAuthn, require step-up approval for financial and access-right changes, add additional named administrators with individual factors, and retain SMS only as a controlled recovery channel.
