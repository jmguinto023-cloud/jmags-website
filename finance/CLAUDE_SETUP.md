# JMAGS Claude Pro mode – active

The JMAGS owner selected **Option 1: Claude Pro chat**. The Command Center uses a **manual copy-and-paste handoff** to Claude Pro, with **no additional Anthropic API requests or charges from JMAGS**.

## How to use

1. Open [JMAGS Command Center](https://jmagsappliances.tech/finance/) and sign in as the approved owner.
2. Select the reporting month and branch, then open **Claude AI**.
3. Choose or type a question.
4. Tap **Copy JMAGS financial brief**. If copying is blocked, long-press and copy from the visible preview.
5. Tap **Open Claude Pro chat**, then paste and send the summary in your own Claude Pro chat.

The copied brief contains only summarized verified revenue, direct costs, overhead, and top advertising campaign totals from the selected month/branch, with explicit warnings about incomplete data. No client names, phone numbers, individual job details or API keys are included.

## Billing safeguards

- JMAGS Finance website contains **no paid Claude API invocation or activation buttons** in the Claude Pro view.
- The separate Supabase `jmags-claude-advisor` Edge Function rejects billable API requests with HTTP 409 `JMAGS_CLAUDE_PRO_ONLY`. This also protects against older browser-cached pages.
- Your saved encrypted API key has **not been deleted or used for this mode**. If any prior API key was shared in chat, revoke it in Anthropic Console.
- Claude Pro plan usage limits still apply, but the manual workflow does not incur separate Claude API charges.

## Limits and data integrity

- Historical October 2026 sales/expenses were not yet imported into the new cloud finance ledger. Imported Cavite ad data does not establish actual profit or return on ad spend.
- If the browser blocks clipboard access, copy from the manual preview text area.
- No interaction with the JMAGS Messenger bot. It is unchanged.

## Components

- GitHub: `jmguinto023-cloud/jmags-website` (`finance/index.html`)
- Supabase: `jmags-claude-advisor` (currently disabled for billable API use)
- Claude Pro chat: https://claude.ai/new
