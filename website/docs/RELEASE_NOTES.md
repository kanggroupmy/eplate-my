# Release notes

The canonical migration is `supabase/migrations/202609060001_canonical_system.sql`, after both June migrations. It is additive; do not reset production. It adds protected transactional operations, staff roles, lifecycle enforcement, private storage boundaries, appointments, evidence, audit and notification persistence.

Verified payments issue an invoice record idempotently, available to the customer as a PDF receipt. Admin-issued prepayment invoices remain supported. PDF output references the immutable order ID; full account-holder details are available in the authenticated account and optional HTML document. Confirm the business's invoice identity and statutory requirements before using these documents for regulated accounting submissions.

Admins can recover a bill after interrupted setup using its merchant reference. Recovery requires a matching successful provider transaction before the reserved bill is attached and settled. There is no blind retry of uncertain bill creation.

Notification retries stop on permanent errors or uncertain sends. Transient failures are capped at eight attempts; lease replays are rejected. A successful order transition does not depend on delivery.

Source changes include application workflows/API routes, shared domain/security/provider modules, one new migration, focused tests and operational documentation. Existing public branding, routes and articles remain; manual-payment product instructions now describe ToyyibPay. The legacy Worker remains as migration reference with a local 410 guard and disabled deployment script. No live Worker, DNS, database or provider setting was changed.
