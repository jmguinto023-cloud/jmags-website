# JMAGS Claude Chat – deployment and billing mode

## Current setup

The JMAGS Command Center now has a **Chat with Claude** interface at [jmagsappliances.tech/finance](https://jmagsappliances.tech/finance/) → **Claude AI**. It includes a message field, Send button, conversation bubbles, error messages and room for several turns of conversation.

**Important: DIRECT CHAT IS NOT ACTIVATED.** The owner selected Claude Pro with no extra API charges. Claude Pro is a separate product from Anthropic API access. To avoid billable calls, TWO independent switches remain off:

- Client: `CLAUDE_DIRECT_ENABLED = false` in `finance/index.html`.
- Server: `JMAGS_PAID_API_ENABLED = false` in `supabase/functions/jmags-claude-advisor/index.ts`.

The server returns HTTP 409 if an old or modified browser attempts a direct request. Neither switch should be enabled unless the JMAGS owner explicitly approves paid API access and there is a funded Anthropic Console API account.

## How to use now without extra API charges

Open the **Claude AI** tab and expand **Continue using Claude Pro without API charges**. The existing secure summary export and Claude Pro website link are available there. Copying the summary into Claude Pro remains manual.

## To enable embedded real Claude answers later

1. In [Claude Console Billing](https://platform.claude.com/settings/billing), fund API credits and disable auto-reload if limiting spending is important. Claude Pro does not fund the API.
2. Get the owner's explicit approval to enable billable API calls.
3. Verify that the saved, encrypted Anthropic API key in Supabase Vault is valid and is not a previously exposed key.
4. Enable the server and client toggles together; deploy both. Verify a minimal owner-authenticated conversation and the 20-request-per-day quota. Test without changing Messenger, Meta campaigns, or the underlying ledger.
5. Direct chat sends a question, selected month/branch, and up to six sanitized previous turns to the secured Supabase Edge Function. The function fetches authorized aggregate finance data and calls Anthropic. Customer details should never be entered in chat.

## Security notes

- Owner-only authenticated access; the backend requires JWT, live owner role and approval.
- API key remains in encrypted Supabase Vault and is never sent to the browser.
- Aggregate finance data only; no individual customer, phone, or raw job records from the DB.
- Chat text is held in page memory, not stored in the JMAGS database. Refreshing clears it.
- Claude cannot change Meta campaigns, your Messenger bot, invoices or records.
- Incomplete historical finance data must not be treated as definitive profitability.
- The existing Messenger bot and monitoring scheduler are untouched.

## Source files

- `finance/index.html`
- `supabase/functions/jmags-claude-advisor/index.ts`

Official reference: https://support.claude.com/en/articles/9876003-why-is-claude-api-usage-billed-separately-from-my-paid-claude-plan
