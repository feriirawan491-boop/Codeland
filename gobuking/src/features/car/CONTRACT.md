# Phase 07 — Car Rental frontend

Local implementation of the Phase 07 business and frontend PRDs. This extends the existing Gobuking checkout without changing Hotel/Home Rental direct-payment rules or venue inquiry rules. Car rental remains **request → partner review/allocation → approval → payment → confirmed reservation → pickup → return**. The user's earlier invoice preference replaces voucher wording: paid reservations provide a downloadable booking/reservation invoice and pickup information.

## Route and P0 mapping

| ID     | Frontend                                                                                        | Validation evidence                                                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAR-01 | `/cars`, mode radios and compatible offer filtering                                             | Self-drive-only Mandiri Drive never appears for driver mode; changing mode clears offer context                                                     |
| CAR-02 | Typed city/area/date/time search, same-area return, resource timezone                           | Invalid/reversed dates and different return areas rejected; 25 hours self-drive bills two 24-hour units                                             |
| CAR-03 | `/cars/results`, class/transmission/seats/luggage/provider/total/name filters, URL context      | Passenger seats separate from luggage; unknown luggage stays unknown; price is the whole search duration                                            |
| CAR-04 | `/cars/[offerId]`, package detail and cost summary on desktop/mobile                            | Driver 12-hour versus self-drive 24-hour packages; fuel, toll, parking, overtime, delivery, protection and deposit explicit                         |
| CAR-05 | `/checkout/car/[draftId]`, account, renter, eligibility, pickup point and consent               | Provider-configured age/licence checks; only one sample document when explicitly required; MIME/signature/5 MB checks; rejection has no bill        |
| CAR-06 | Internal fleet/driver allocation and operational maintenance intervals                          | Approval checks [start,end) plus 60-minute return buffer; overlapping units/drivers and maintenance rejected; internal IDs absent from customer DTO |
| CAR-07 | `/bookings/CAR-DEMO-*`, approval deadline, VA/QRIS demo, authoritative status refresh           | No payment before approval; expiry releases holds; unknown results reconciled; late money goes to review/refund, never confirmation                 |
| CAR-08 | Assignment summary, explicit replacement consent, pickup/return checklists and condition review | Replacement does not change the paid quote; pickup blocked pending consent; return/dispute separate from automatic charges                          |

## State, privacy and pricing

- Next server routes compose feature client components; private routes are noindex. Existing shared account UI supports rental-specific copy. Anonymous public draft IDs retain mode, package and date/time context through OTP; renter/contact/file data never enter URLs or localStorage.
- Public offers and customer booking DTOs are separate from internal allocation records. Requests allocate no stock. Approved unpaid reservations hold a specific unit/driver until the payment deadline. Confirmed/in-use bookings block the same resources. Requested/rejected/cancelled/expired/completed records do not hold fleet stock.
- The demo checks real internal resource identities in the local adapter. Allocated-unit maintenance is rechecked before opening or confirming payment. Buffer conflicts use the provider-configured duration. These are tab-local simulations, not multi-user server guarantees.
- Request creation is idempotent per customer/draft. Mutations use command IDs; simulated lost responses require reconciliation. Another account receives 403; a signed-out user receives 401. Account changes unmount private form/status state, and in-flight mutations recheck identity before commit.
- All amount calculations use numeric values: duration rounded up to package units, base, delivery where applicable, service and tax. Deposit is outside the platform charge and tax base; it is paid/settled directly with the partner. Actual usage overtime and damage charges are never automatic.
- Quote/request snapshots are retained. Repricing requires a refreshed total and renewed consent. The UI countdown may disable payment, but only adapter results transition status. Invoice eligibility requires succeeded payment and a confirmed/in-use/completed reservation.
- Document bytes are only read for validation and are neither uploaded nor stored by this demo. Only owner-visible filename/type/size metadata persist in session storage. The UI requests a sample licence file only for the SUV self-drive fixture; other packages do not request uploads. Original identity documents must not be used in the demo.

## Fixture policies and scenarios

All providers, capacity, eligibility, rates, deposits, driver contacts and registrations are synthetic. Configured demo policies are 18+ with driver, 21+ self-drive, 4/24-hour advance requests, 12/24-hour billing units, two vehicle units per class/provider/city and one driver per provider/city. These are not legal requirements or real supplier policies. OTP is `123456`. Demo operations controls are visibly labelled; they simulate the partner role inside a customer-owned local record and do not implement production RBAC.

Scenarios: ready/loading/empty/error/timeout/rate_limited/inactive/maintenance/driver_busy/price_changed/quote_expired/mutation_timeout/unauthorized/forbidden. Stored maintenance and fleet/driver holds are also exercised through tests and local operations actions. Payment instructions are fake and must not receive real transfers. Email invoice delivery and retries are labelled simulations; no email is sent. Email failure never cancels a paid reservation.

Photos are illustrative and do not guarantee a model. MPV/minibus illustrations are native SVG matched to the vehicle class. Local photo assets:

- `car-city.jpg`: https://images.unsplash.com/photo-1549317661-bd32c8ce0db2
- `car-suv.jpg`: https://images.unsplash.com/photo-1533473359331-0135ef1b58bf

## Production contract still required

Backend integrations must provide durable authentication/ownership and partner organization permissions, eligibility verification and secure document handling, immutable quotes/version checks, transactional fleet/driver allocation with maintenance and buffers, server-clock/payment expiry, real payment gateway callbacks/idempotency/reconciliation/refunds, invoice/email delivery records, near-service contact disclosure, replacement consent audit and actual handover evidence. Session storage can be edited/cleared by the browser user and cannot supply server authorization, durable inventory or real financial facts. Full unit/driver IDs in synthetic implementation fixtures are not secrets; they are stripped from customer view models and absent from public cards.

The local Operations controls can fast-forward pickup/return for review; production must enforce actual service timestamps and operator permissions. The current phase does not add one-way returns, automatic overtime billing, gateway deposits, telematics, fleet APIs or instant booking. D-04/D-09/D-11 and production release gates remain decisions for the product/operations/backend owners.

## Validation baseline — 31 October 2026

Strict typecheck, lint, formatting and production build passed. The full unit suite passed 80 cases across 11 files; the 12 Car cases were also rerun after final domain changes. The targeted browser regression set covers 14 Car cases and 14 shared account/Hotel/Home Rental/MICE/Wedding/home-search cases across desktop and mobile. A registration-helper timing issue was corrected, and the six affected/search/paid-handover cases passed on rerun, including focus restoration after replacement consent. Additional browser checks verified expired-estimate recovery, invalid area handling, English reflow at 320 CSS px and an axe scan with no violations. Automated scans are not a full accessibility certification, and all checks apply to the local demo rather than production services.
