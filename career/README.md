# FastBilly Career

Public-facing, multi-user job-search operating system built as the FastBilly product family’s Career app.

## V1 includes
- Public FastBilly landing page
- Career Passport onboarding shell
- Today dashboard and job pipeline
- AI Studio UX (ready for a private AI provider)
- Assets, referral/support sharing UI
- Supabase-ready authentication client and secure `career_*` data model

## Configure production
Add these Vercel environment variables:

```bash
VITE_SUPABASE_URL=https://sywajkcyomsvgolycjfl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_9rhlGPStiyNGPYjXTmcYHA_uhqkJuCt
```

Then enable Email OTP and Google OAuth in Supabase Auth, add the Vercel URL as an allowed redirect URL, and redeploy.

The current V1 intentionally keeps AI generation and third-party application submission behind explicit, user-approved actions. It must never invent career facts or submit external applications without final user review.
