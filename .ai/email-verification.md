# Email Verification Setup

## Overview

Email verification is now enabled for user registration in production mode. New users will receive a confirmation email with a link to verify their email address before they can sign in.

## Configuration

### Supabase Config (`supabase/config.toml`)

```toml
[auth.email]
enable_confirmations = true  # Changed from false

[auth.email.template.confirmation]
subject = "Potwierdź swój adres e-mail - 10x Cards"
content_path = "./supabase/templates/confirmation.html"
```

### Email Template

Location: `supabase/templates/confirmation.html`

The template includes:
- Polish language content
- Branded header with gradient (10x Cards)
- CTA button for email confirmation
- Alternative link for manual copy-paste
- Warning about email prefetching (Gmail, Outlook)
- 24-hour expiration notice

## How It Works

### Registration Flow

**With `enable_confirmations = true` (Production):**

1. User fills registration form
2. Backend calls `supabase.auth.signUp({ email, password })`
3. Supabase sends confirmation email (using `confirmation.html` template)
4. Backend returns JSON: `{ message: "Sprawdź e-mail aby potwierdzić konto", requiresVerification: true }`
5. Frontend displays success message (no login, no redirect)
6. User clicks link in email
7. Supabase verifies email → redirects to `SUPABASE_SITE_URL`
8. User can now log in with their credentials

**With `enable_confirmations = false` (Development):**

1. User fills registration form
2. Backend calls `supabase.auth.signUp({ email, password })`
3. Supabase creates user AND session (no email sent)
4. Backend returns redirect: `redirect('/generate', 303)`
5. User is immediately logged in

### Backend Logic

`/api/auth/register.ts` (lines 95-113):

```typescript
const sessionExists = data.session !== null;

if (!sessionExists) {
  // Email verification required - return JSON with message
  return new Response(
    JSON.stringify({
      message: 'Sprawdź e-mail aby potwierdzić konto',
      requiresVerification: true,
    }),
    { status: 200 },
  );
}

// User is logged in - redirect to generator page
return redirect('/generate', 303);
```

### Frontend Handling

`RegisterForm.tsx` (lines 106-119):

```typescript
if (data.requiresVerification) {
  // Email verification required - show message instead of redirect
  setSuccessMessage(data.message);
  setEmail('');
  setPassword('');
  setConfirmPassword('');
} else if (response.redirected) {
  // Server redirected - follow it
  window.location.href = response.url;
} else {
  // Fallback: redirect manually
  window.location.href = '/generate';
}
```

## Testing

### Local Development

To test email verification locally:

1. Ensure Supabase is running: `npx supabase start`
2. Check Inbucket URL in terminal output (usually `http://localhost:54324`)
3. Register a new user
4. Open Inbucket in browser to see confirmation email
5. Click the confirmation link

### Production

In production:
- Configure SMTP settings in `supabase/config.toml` under `[auth.email.smtp]`
- Or use Supabase's default email service
- Monitor email delivery and user confirmation rates

## Troubleshooting

### Email Not Received

1. Check `supabase/logs` for email sending errors
2. Verify `enable_confirmations = true` in config
3. Check spam folder
4. Verify SMTP configuration (production)

### Link Expired

- Default expiry: 24 hours (`otp_expiry = 86400` in config)
- User must request new confirmation email via forgot password flow
- Or contact support to manually verify email

### Email Prefetching Issues

Some email clients (Gmail, Outlook) automatically open links for security scanning. This can consume the one-time token before the user clicks.

**Solution implemented:**
- Warning message in email template
- Instructions to copy-paste link manually if needed
- Extended OTP expiry (24 hours) to minimize impact

## Related Files

- `supabase/config.toml` - Email verification settings
- `supabase/templates/confirmation.html` - Email template
- `src/pages/api/auth/register.ts` - Backend registration logic
- `src/components/auth/RegisterForm.tsx` - Frontend registration form
- `src/middleware/index.ts` - Authentication middleware

## Security Considerations

- Email verification prevents fake/spam registrations
- One-time tokens expire after 24 hours
- Tokens are single-use (consumed after first click)
- Email templates use HTTPS links only
- No sensitive data in email content (only confirmation link)

