# JMAGS Claude AI – secure integration

## Current status
- Backend deployed: Supabase Edge Function `jmags-claude-advisor` (JWT verification ON).
- Website: `https://jmagsappliances.tech/finance/` → **Claude AI** tab (visible only to approved JMAGS owner).
- **Not connected to Anthropic until the owner supplies an API key in Supabase Edge Function Secrets.**
- This project intentionally does **not** connect to or modify the JMAGS Messenger bot on Render.
- Source: `supabase/functions/jmags-claude-advisor/index.ts`; UI: `finance/index.html`.

## Activate Claude (owner action)

1. In the [Claude Console](https://console.anthropic.com/), open API Keys, create a key for this JMAGS integration, and enable Anthropic API billing/spend limits if needed. A Claude website subscription is **not** the same as API billing.
2. Sign in to [JMAGS Supabase project](https://supabase.com/dashboard/project/fhjarnogglakehaztbbj/functions) and open **Edge Functions → Secrets**.
3. Add a new secret **Name**: `ANTHROPIC_API_KEY`; **Value**: your key from Claude Console. Save. Do **not** put it in GitHub, ChatGPT, the browser JavaScript, a spreadsheet, or the Messenger bot environment.
4. Reopen [JMAGS Command Center](https://jmagsappliances.tech/finance/), sign in with the existing approved owner account, and refresh with Ctrl+Shift+R if needed.
5. Select **October 2026 → Cavite → Claude AI**, and ask: `Which ad campaigns need investigation before spending more?`. The app sends a *summary* of financial data; Claude returns an advisory response. Do not use unimported sales as a zero-profit conclusion.

## Security / scope
- Approved **owner-only** check on server: Supabase user auth token + live `my_role() = owner` and `is_approved() = true`.
- Server-side API key; never in browser, logs, or the public repository.
- The server reads only the `jmags_monthly_finance` aggregate view and `jmags_ad_spend_daily` campaign spending, not customer data or individual repair records.
- No CRM changes, no campaign changes, no messaging bot changes, no writes to financial records.
- Atomic **20 Claude requests per Manila calendar day** per owner, enforced in Postgres via `jmags_claim_claude_quota`, plus up to 850 output tokens/request. Each request can incur Claude API charges.
- Accepts only the JMAGS website origin for browser requests; validates JWT, owner role, branch, date and question length.
- No customer contact details or raw ledger rows transmitted. Avoid putting sensitive customer details into the free-text question.
- Answers are advisory; the initial October imported Facebook spending does **not** include the missing historical job/expense transactions in the current cloud ledger.

## Troubleshooting
- **Not configured**: `CLAUDE_NOT_CONFIGURED`; save `ANTHROPIC_API_KEY` in Supabase Edge Function Secrets.
- **API key rejected**: verify it is from Claude Console and entered exactly.
- **API billing or rate limits**: check Claude Console billing and usage.
- **403**: must be signed into the approved JMAGS owner account; do not share owner credentials.
- **429 Daily limit**: allow quota to reset next Asia/Manila day.
- **Incomplete finance data**: verify job/expense entries and historical imports before acting on recommendations.

## Independent components
- JMAGS Command Center website repository: `jmguinto023-cloud/jmags-website`.
- New Edge Function: `jmags-claude-advisor`, `verify_jwt=true`.
- Messenger bot: separate `jmguinto023-cloud/Jmags-messenger-bot` repo and Render service; **unmodified**.

For reference:
- [Supabase Edge Function secrets](https://supabase.com/docs/guides/functions/secrets)
- [Anthropic API overview](https://platform.claude.com/docs/en/api/overview)
