# Phase 06 — Wedding Venue frontend

Local implementation of `06_PRD_Phase_06_Wedding_Venue.md` and its UI/UX frontend PRD. Uses the established blue-950 / blue-600 design, Bebas Neue / Plus Jakarta Sans, shared accessible UI primitives and ID/EN locale provider.

## Public routes and boundaries

- `/wedding`: city, definite/flexible date, event hours, guest count and **seated versus standing** capacity. Filters cover indoor/outdoor, venue type, venue-only/package and indicative total budget. Sort compares whole-event estimates including minimum participants, known overtime, tax and service; custom prices remain unknown. URL retains filters, pagination and event context on return from details.
- `/wedding/[slug]`: area selector, area-labelled illustrative gallery, per-area capacities, icon facility points, access/parking, opening and music hours, venue-only versus inclusive/custom packages. Rate, minimum, catering, decorations, exclusions and overtime are explicit. Package estimates are not final quotes.
- `/wedding/[slug]/inquiry`: couple/planner contact (organisation optional), up to three distinct future alternative dates, ceremony/reception, optional budget, notes, catering/decorations and optional site visit preference. Contact verification precedes active inquiry tracking. A visit is a request, not a guaranteed appointment.
- `/wedding/[slug]/request`: account gate retains public date/guest/package URL context across sign-in/registration. Definite date, capacity, opening hours, consent and resource availability are revalidated at mutation. With no quote, price and quote reference stay **null**; selected package is snapshotted. An optional inquiry/quote reference uses the latest unexpired proposal.
- `/account/inquiries/[id]?service=wedding`: shared private venue tracking, inquiry history, assigned demo PIC, response target, immutable quote versions/expiry, version comparison, update request, booking request states and withdrawal. Old/expired proposals cannot be submitted. Sales controls are explicitly local demo controls.

## Shared resource and mutation contract

Wedding and MICE use the same physical `resourceId` for overlapping fixture spaces. The shared operational block registry is checked by both adapters before request commit. Inquiries, site visit requests and submitted booking requests do **not** hold inventory or confirm reservations. No payment, deposit, voucher or invoice is generated in this phase.

Commands are idempotent within the local session. A simulated unknown mutation result must be reconciled by command ID rather than blindly retried. Request snapshots include package, event and wedding requirements. Guest inquiry access uses a tab capability; submitted requests bind to the verified demo account. Account changes clear private UI state. These guards demonstrate frontend behaviour, not production authorization.

## Local fixtures and scenarios

Derived wedding-compatible areas from existing venue fixtures preserve MICE package/capacity fixtures. Asmara Celebration Estate adds two wedding-only areas to exercise seated/standing and area selection. Prices, contacts, access, parking, hours, capacities and package content are synthetic. OTP `123456` is local only. Query `scenario` supports shared loading, empty, error, timeout, rate-limited, inactive, blocked and mutation-timeout states. No email, CRM or external venue is contacted.

Illustrative images from Unsplash (not actual listed venues):

- `wedding-garden.jpg`: https://images.unsplash.com/photo-1519741497674-611481863552
- `wedding-celebration.jpg`: https://images.unsplash.com/photo-1511795409834-ef04bbd61622
- `wedding-outdoor.jpg`: https://images.unsplash.com/photo-1519225421980-715cb0215aed

## Production integration still required

A backend must supply authenticated ownership, real email verification and delivery, durable idempotency and audit records, server-authoritative quote versions/prices/expiry, timezone-aware availability shared with MICE, contact assignment/CRM, real response deadlines, venue data and actual site visit coordination. Session storage is a demo adapter, not durable storage. A reload within the same tab preserves the demo; clearing storage loses it. Requests and local PIC actions create no legal contract or real inventory lock.

## Verification

Wedding unit tests cover distinct capacities, query/date validation, optional budget/company semantics, package minimums/overtime/unknown prices, verification, immutable quote metadata, stale/expired proposals, authenticated no-quote requests, shared resource blocks, ownership, idempotency and unknown-result reconciliation. Browser tests cover desktop/mobile search context, gallery keyboard focus, accessibility, alternate dates/site visits, registration handoff, blocked submission, language and responsive widths. Shared MICE and prior-phase tests remain regression checks.

## P0 traceability

| Requirement | Implementation                                                                              | Verification                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| WED-01      | `wedding-results`, `wedding-search-form`, `wedding-filters`, typed query and search adapter | Seated/standing 500-guest cases; filter and back navigation                                                        |
| WED-02      | `wedding-detail`, `wedding-gallery`, shared facility icon points                            | Area change, failed-image fallback, focus restoration, visible opening hours                                       |
| WED-03      | Package comparison, `WeddingPackageScope`, shared pricing                                   | Venue-only exclusions, unknown custom price, minimums, overtime and event totals                                   |
| WED-04      | `wedding-inquiry`, contact verification, shared inquiry adapter                             | Flexible dates, blank budget/company, alternatives and site visit metadata                                         |
| WED-05      | `wedding-request`, account gate, shared request adapter                                     | Registration handoff, definite dates, consent, ownership, idempotency, submitted status without quote/payment/hold |
| WED-06      | Shared inquiry tracking and quote version panel with wedding view data                      | Latest/old/expired quote handling, comparison, refresh request and contract-follow-up states                       |

Validation baseline, 31 October 2026: lint, strict typecheck, formatting and production build passed; 68 unit cases passed (Wedding's 6 cases also rerun after extending the shared-block assertion); all 72 desktop/mobile browser cases passed. Additional manual browser checks covered all three gallery images failing, changing area and a mobile axe scan with no violations. These checks validate the local frontend demo, not production integrations or a full accessibility certification.
