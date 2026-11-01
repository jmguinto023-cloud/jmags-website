# JMAGS Claude AI – activation and secure integration

## Current status

- **Installed**: owner-only Claude Finance Advisor in `https://jmagsappliances.tech/finance/` → **Claude AI**.
- **Backend**: Supabase Edge Function `jmags-claude-advisor` (JWT verification ON), deployed and independent of the Messenger bot.
- **API activation**: not complete until the JMAGS owner enters a **fresh Anthropic API key**. No key is currently saved in the JMAGS Claude Vault record.
- **Data**: read-only aggregate financial views. Missing historic jobs/expenses mean results must not be considered a finalized profit report.

## Activate from the JMAGS Command Center (recommended)

1. In [Anthropic Console](https://console.anthropic.com/settings/keys), **revoke the old API key previously pasted into a chat**, create a **new API key** for JMAGS, and set a spending limit. API billing is separate from Claude chat subscriptions.
2. Open [JMAGS Command Center](https://jmagsappliances.tech/finance/) and sign in as the approved JMAGS owner.
3. Open **Claude AI**. In the **Activate Claude** panel, paste the fresh API key into the password-style field, then click **Save key securely & activate Claude**.
4. Select October 2026 and Cavite and ask: **Which ad campaigns need investigation before spending more?**
5. After a successful AI response, review recommendations against verified ledger figures. Do not interpret missing sales records as zero sales.

The key is posted once from the authenticated owner's browser to a restricted Supabase Postgres RPC over HTTPS; it is stored encrypted in **Supabase Vault**. The website never writes the key into source files, URLs, browser storage, or GitHub. The original key from chat **must not be reused**.

## Security controls

- The API key setter `public.jmags_claude_store_key(text)` only accepts signed-in **approved owners** and never returns key content.
- The key is encrypted in Vault under `jmags_anthropic_api_key`.
- The runtime key reader `public.jmags_claude_runtime_key()` is executable **only by the Supabase service role**, not regular signed-in users or guests.
- `public.jmags_claude_is_configured()` reveals only boolean activation status to the owner.
- The Edge Function validates JWT, approved owner status, reporting parameters, and the JMAGS website origin.
- **No** customer names, phone numbers, individual repair records, or other customer PII are included in Anthropic API requests (avoid typing them manually into the question).
- Requests are read-only analysis and cannot mutate the CRM, Messenger bot, ad campaigns, database, or ledger.
- Daily owner-only API quota is 20 requests per Manila calendar day.
- No automated API spending without the owner's explicit key activation.
- Supabase Edge Function Secrets variable `ANTHROPIC_API_KEY` remains supported as an optional legacy fallback, but **is no longer required**.

## Troubleshooting

- **Not activated**: Save a new valid API key using the **Activate Claude** form.
- **Key rejected**: Verify it is a real Anthropic Console API key, not a Claude chat subscription/session token. Replace the saved key in the same panel.
- **API billing error**: Enable Anthropic API billing/credits and project spending limits.
- **Missing records**: Import/verify historic JMAGS jobs and expense records before interpreting profit estimates.
- **403**: Only the approved JMAGS owner account can use the Claude feature.

## Independent components

- Website repository: `jmguinto023-cloud/jmags-website`.
- Edge Function source: `supabase/functions/jmags-claude-advisor/index.ts`.
- Messenger bot: `jmguinto023-cloud/Jmags-messenger-bot` and its Render service; **not changed**.

Reference: https://supabase.com/docs/guides/database/vault
