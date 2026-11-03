# Phase 08 — User Dashboard

Local frontend demo, 2 November 2026. Account entry: `/account/bookings`.

## Implemented screens

- Bookings and terminal history aggregate the original Hotel/Home and Car adapters. Category, reservation status, service-start/creation date, text search and five-item pagination use URL state. Flight search creates no account orders.
- Native booking detail remains authoritative. Eligible invoices download through the existing PDF renderers after ownership and payment checks. Account dashboard does not create a financial ledger.
- Inquiry list includes owned MICE/Wedding leads. Anonymous inquiry claim requires the same verified contact, independently verified inquiry contact and its same-tab capability token. Matching email alone is rejected.
- Saved properties reuse the shared favorites store, merge anonymous favorites once at login, and isolate lists by account. Inactive properties can be removed but have no detail/booking action. Opening an active property reads current catalog prices.
- Profile preferences and OTP contact updates preserve account ID and transaction contact snapshots. Old contact remains active until OTP verification succeeds.
- Cancellation previews delegate source rules. Separate reason, consent and confirmation are required. Preview expiry/version conflicts force rereview. Refund processing never means received funds. Paid Car cancellations go through support because Phase 07 has no automatic paid-rental refund rule.
- Completed transactions can submit a review within the proposed demo 90-day window. Reviews remain pending and do not mutate public property scores. Demo moderation adapter supports publish/reject/reply.
- Device sessions expire after eight hours and can be revoked. Contact challenges bind to the current session. Privacy requests create verification tickets; transaction records are preserved.
- Account tickets support source-owned booking/inquiry references, replies, private JPEG/PNG/PDF attachments, type/signature/size checks, duplicate-command reconciliation and simulated CS responses. Invalid upload retains entered form text. Private attachment bytes are memory-only and unavailable after reload/account change.

## Demo and verification controls

`Coba aktivitas dashboard demo` explicitly adds source transactions and a verified MICE inquiry to the current account; fresh accounts start empty. A completed example fast-forwards a source operation for review testing. Sample partial cancellation policy is assigned before payment. `simulateCancellationDeadline` advances only the demo decision clock; it does not replace the accepted policy snapshot. Additional-device and support-response controls are clearly labeled simulations.

List scenarios: `/account/bookings?scenario=loading|empty|error|timeout|rate_limited|unauthorized|forbidden`. Adapter mutation timeout reconciliation is covered by automated tests. These are local fixture behaviors, not claims of a production service.

## Production integrations still required

Real server-side authentication and authorization, independent identity verification/OTP delivery, immutable transaction storage, payment/refund gateway and webhook reconciliation, genuine invoice email delivery, secure attachment persistence/scanning, session management across real devices, support operations, privacy retention review and review moderation. Browser storage and demo OTP `123456` are not production security controls.

## Validation

Automated tests cover source aggregation and ownership, date basis filtering, verified inquiry claim, stable contact identity, partial cancellation/version conflicts, pending reviews, session revocation, private ticket authorization, failed files and unknown-result deduplication. Browser coverage exercises desktop/mobile, account navigation, profile verification, refund consent, reviews, support, privacy and session logout; quality checks include TypeScript, lint, production build and axe.
