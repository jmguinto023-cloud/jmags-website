# JMAGS Finance Command Center (v1)

Live entry point: https://jmagsappliances.tech/finance/

## What is connected
- Existing Supabase project `fhjarnogglakehaztbbj` with Supabase Auth.
- `public.jmags_finance_jobs`: technician/manager job submissions; unique by `(branch, job_no)`; server calculates direct costs and contribution.
- `public.jmags_finance_expenses`: expense approvals, JMAGS-paid or investor-supported (separately reported).
- `public.jmags_ad_spend_daily`: campaign-day Meta spend, imported from Windsor.ai with an idempotent unique key.
- `public.jmags_finance_ledger`: automatically combines sales, job costs, overheads, and Meta ads.
- `public.jmags_monthly_finance`: verified monthly profitability per branch.
- `public.jmags_finance_audit`: immutable-style append-only record of job and expense inserts/updates/deletes, visible to owner.
- After insert/update in legacy `public.job_ledger`, the server bridge creates/updates a finance job with `status=submitted`.

## How to use
1. Sign in using an approved Supabase Auth account and corresponding `public.profiles.role`: `tech`, `staff`, or `owner`. Accounts still marked `pending` cannot use the finance app. Do not simply grant owner access to an unverified account.
2. Technician: open Jobs, enter unique job number, branch, actual cash collected, costs, and optional Facebook campaign. Submit once.
3. Manager/staff: verify or void submitted jobs and expenses. Only verified entries count toward financial profit; pending entries still appear in the automatic ledger.
4. Manager: record overhead, rent, utilities, vehicles, tools in Expenses. **Do not record Facebook ads here** because they are imported separately. Do not enter costs twice if they are already attached to a specific job.
5. Review Overview, Ads, Ledger. Filter by branch/month. Export the ledger CSV.
6. Record a `sales_agent_fee` only when an actual booking has earned a fee; ₱300 per booked customer is not applied automatically to all jobs.
7. Enter the exact ad campaign name on a job if it can be established. This is needed to evaluate profitable paid repairs per campaign.

## Accounting logic
`direct_costs = parts + driver + assistant + transport + technician_commission + sales_agent_fee + other_job_cost`

`contribution = collected - direct_costs`

`branch_profit_after_ads = verified_collected - verified_direct_costs - verified_JMAGS_overheads - imported_Meta_spend`

`fully_loaded_profit = branch_profit_after_ads - verified_investor_supported_costs`

- Supported expenses paid by investors are disclosed separately so cash support is not confused with branch outflow.
- Advertising spend is tracked by day and campaign; imported rows are overwritten on idempotent sync, not appended as duplicates.
- Jobs and expenses created today remain **submitted** until staff verification.
- Missing historical records do not mean zero activity. The Excel October repair and overhead rows have not been imported and should be reconciled rather than assumed zero.

## Security
- The finance app uses only a Supabase **publishable** client key; no service role/secret key is embedded.
- All finance tables have RLS. Anon clients cannot read/write finance tables. Approved staff/owners can review; technicians can see their own submissions and cannot verify.
- Finance audits are owner-readable. Existing project-wide Supabase security-advisor warnings for older functions are outside this deployment and should be reviewed before onboarding additional staff.
- Do not publish passwords or customer records in GitHub.
- If a job needs correction, staff should edit the record rather than enter a duplicate job number.

## Daily ad synchronization
An active ChatGPT task named `JMAGS Daily Profit Watch` is configured for flexible daily morning runs in Asia/Manila. It attempts to read Windsor.ai Cavite daily Meta ad spend and update Supabase before sending management alerts. Verify that the first scheduled run actually syncs. It will report a sync failure, not claim completion. No campaigns are changed by this automation.

Windsor.ai does not currently have a configured scheduled export task. A native Windsor.ai `Supabase` destination is also available but must be configured in Windsor.ai's dashboard. That would give a more independent connector-to-database sync.

## Known setup and data gaps
- The existing Supabase profile is currently `pending` despite one approved app user, so an appropriately verified owner/staff role must be assigned before access.
- Historical August–October Excel sales, overheads, and bank reconciliation have NOT been migrated.
- Only the connected Cavite Meta account has spend data. Main Branch advertising data needs a separately authorized account and mapping.
- Messenger/CRM booking-to-campaign attribution is not yet end-to-end. Campaign names entered on paid jobs are an initial attribution method.
- App auto-refreshes after 60 seconds outside active forms.
- This v1 is not payroll processing, bank reconciliation, accounts payable, or an automated campaign-control system.

## Operational rollout
Begin with one staff account and one technician doing a test job. Verify it appears once as submitted, verify it, check branch/month totals, and export the ledger. After that, onboard both teams and import prior historical ledgers with duplicate review.
