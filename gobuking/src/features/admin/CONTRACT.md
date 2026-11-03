# Phase 10 — Super Admin frontend contract

## Routes and roles

`/admin`, `/admin/partners`, `/admin/catalog`, `/admin/reservations`, `/admin/venue-crm`, `/admin/customers`, `/admin/payments`, `/admin/settlements`, `/admin/support`, `/admin/cms`, `/admin/reports`, `/admin/settings`, `/admin/moderation`, `/admin/integrations`, `/admin/access`.

Five explicit demo personas: Super Admin, Content/Partnership, Operations/CS, Finance Maker, Finance Checker. Capabilities, organization scopes, active membership and session identity are checked inside mutations, not only navigation. Real invited members use account identity as principal; changing roles cannot bypass separation of duties. Initial local demo activation creates explicitly labeled personas. This is not production authorization.

## Requirements

| Requirement         | Implemented behavior                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADM-01 Verification | PIC, business files, bank and contract checklist; missing originals block approval; private evidence, actor, reason and timestamp; bank changes require review.                                            |
| ADM-02 Catalog      | Category completeness, public photo/location validation, shared physical resource check, audited publication/suspension; existing reservations preserved.                                                  |
| ADM-03 Exceptions   | Separate payment and reservation facts; paid exceptions never become confirmed automatically; assigned case, resolution plan, evidence and cost bearer.                                                    |
| ADM-04 Venue CRM    | Original inquiry and due timestamps preserved when reassigning PIC; quote pipeline remains separate from booking revenue.                                                                                  |
| ADM-05 Refund       | Remaining paid amount bounds requests, original pending requests imported once, independent checker, evidence/reference and deduplicated reconciliation events.                                            |
| ADM-06 Payout       | Maker cannot approve own batch, including Super Admin/emergency access; immutable bank snapshot; disputed/refund/unmapped legacy funds held; evidence precedes independent reconciliation and paid status. |
| ADM-07 Support      | Original customer/partner tickets, scoped private evidence; internal notes separated from customer-visible replies; no-show requires elapsed service date and evidence.                                    |
| ADM-08 CMS          | Draft, preview, publish/archive, scheduled period with Indonesian timezones; public assets/links; promo basis and funding party required.                                                                  |
| ADM-09 Reports      | GMV, commission, platform-funded subsidy, net platform income, refunds and partner entitlement displayed separately; CSV and date/timezone filters; venue pipeline excluded.                               |
| ADM-10 Settings     | Versioned future-effective policy; before/after preview and unsaved changes warning; bookings capture policy snapshots.                                                                                    |
| ADM-11 Moderation   | Guideline/reason required; negative score alone is not a rejection reason; original review score remains unchanged.                                                                                        |
| ADM-12 Integrations | Local connector diagnostics, sanitized logs, correlation IDs, replay deduplication and actor audit. Emergency access expires and cannot bypass finance rules.                                              |

## Source integrity and financial calculations

Admin projections read original Hotel/Home, Car, venue inquiry, review, ticket and Partner stores. Refund reconciliation updates original booking refund facts. Paid payout creates a Partner payout with listing allocations; original payouts and active batches reduce future availability. Gateway events bind event ID to payload and reject contradictory reuse. Unknown mutation outcomes can be checked by command ID before retrying.

Financial projection: net cash = paid minus refunded; proportionate platform-funded discount restores the partner commission basis; commission uses the booking policy snapshot; partner entitlement = net cash + subsidy - commission; platform net = commission - subsidy. Quotes show discount and funding party. Existing booking snapshots remain stable after CMS or policy updates. Flights remain search-only and never contribute fictitious booking revenue.

Public catalog projection contains approved public content only. New locally published products use category fixture templates for the demo catalog; production must require verified complete product/room specifications, location and asset rights instead of demo template defaults. Shared Hotel/Home physical resources use original inventory holds.

## Local persistence and privacy

Admin records: `gobuking:admin:v1`; selection is bound to current account. Session storage data is visible to its browser owner and is not a security boundary. Private file bytes remain in memory, with signature/size checks; reload requires re-upload. Internal source file readers are called only after admin capability/scope checks. Logs redact credentials, account numbers and email. Invoice download remains the booking document; no voucher is introduced.

## Production boundary

No real gateway callback, payout transfer, bank verification, SMTP delivery, secure server authorization, database transaction or durable file storage is provided. Production requires server-enforced RBAC/scopes, transactional ledger/locking, webhook signature checks, immutable audit storage, verified evidence storage, real invitations and asynchronous delivery. Diagnostic replay never performs actual money movement.

## Validation

Unit tests cover approval blockers, shared stock, paid exceptions, SLA preservation, refund limits/deduplication, payout separation, disputes, notes/privacy, scheduled content, financial projections, policy snapshots, moderation, scoped access and customer restrictions. Playwright covers desktop/mobile administrative workflows, keyboard-accessible controls, responsive layouts and accessibility checks.
