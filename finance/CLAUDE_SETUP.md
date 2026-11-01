# JMAGS Claude – choose Pro (no extra API charges) or low-cost API

## Recommended: use your existing Claude Pro plan with no additional API spend

Claude Pro chat subscriptions **do not include API usage** for third-party websites. The JMAGS Command Center therefore now includes a simple manual workflow using Claude Pro's existing chat allowance without purchasing API credits:

1. Open [JMAGS Command Center](https://jmagsappliances.tech/finance/), sign in as the approved owner, select **Claude AI**.
2. Choose a reporting **month and branch**.
3. Type your question (optional) and tap **1. Copy JMAGS financial brief**.
4. Tap **2. Open Claude Pro chat**, sign in with your existing Claude Pro subscription, and **paste** the copied brief in a new chat.
5. Claude analyzes the *aggregate* selected financial metrics. No additional Claude API charges apply to this manual workflow.

**Privacy**: The exported brief includes only verified monthly aggregate sales, cost totals, overhead, advertiser campaign-level spending and conversation-start counts, plus data-completeness warnings. It excludes individual customer names/contact details, individual repair records, credentials and raw ledger exports. The copied text stays on your clipboard until you paste it into your own Claude chat.

**Important**: October 2026 historical repair/expense records are not fully imported in the current cloud finance ledger. The initial advertising sync only covered Cavite, so real paid bookings/campaign profitability cannot be reliably inferred from campaign conversation totals.

## Optional: fully automatic answers inside the JMAGS dashboard

This requires separate prepaid **Anthropic API credits**, independent of Claude Pro. The owner's current saved API key is managed in encrypted Supabase Vault.

- Model in the Supabase Edge Function: **`claude-haiku-5-5`**, configured with low effort, disabled extended thinking, and `max_tokens: 650` per response.
- Official first-party API rate for prompts up to 100k tokens: **$0.10 per million input tokens + $0.50 per million output tokens** (check current Anthropic pricing for changes).
- To enable: [Anthropic Console Billing](https://platform.claude.com/settings/billing) → add the **smallest available amount of prepaid API credit**, switch **auto-reload OFF**, optionally set a low workspace spending limit.
- The JMAGS owner-only API endpoint has an enforced daily limit of **20 API requests**. A prepaid credit amount is not a guaranteed bill cap if other API keys use the same Anthropic organization.
- Open **Claude AI** and tap **Ask Claude** after adding credits. Successful requests consume API credits. API requests that receive an error are generally not charged.

## Security

- Server-side `jmags-claude-advisor` Supabase Edge Function with JWT verification, live owner role/approval checks.
- API key in encrypted Supabase Vault; runtime reader restricted to service role; no key in website JS or GitHub.
- Server sends **aggregate** finance figures and top campaign totals only to Anthropic; no individual job or customer records.
- Claude cannot update bookings, ad accounts, ledger records, or the Messenger bot.
- Existing Messenger bot source and Render service remain **unchanged**.
- If any Claude key was ever posted into chat, revoke it in Anthropic Console and create a replacement.

## Source

- Dashboard UI: `finance/index.html`
- Backend: `supabase/functions/jmags-claude-advisor/index.ts`
- Supabase project: `fhjarnogglakehaztbbj`

Sources:
- https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
- https://platform.claude.com/docs/en/models/haiku-5-5/overview
- https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage
