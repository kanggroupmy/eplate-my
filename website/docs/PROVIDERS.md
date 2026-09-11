# Provider setup and reconciliation

No account settings, real bills, messages or production data were changed during local implementation. Production acceptance requires merchant and Meta accounts controlled by the business.

## ToyyibPay

Set server-only `TOYYIBPAY_SECRET_KEY`, `TOYYIBPAY_CATEGORY_CODE`, `PAYMENT_PROVIDER_MODE=live`, and matching HTTPS `APP_URL` / `NEXT_PUBLIC_SITE_URL`. Never use the Supabase public environment prefix for these secrets. FPX checkout is configured with merchant-borne transaction fees so the customer pays the stored order amount. Confirm merchant fee settings before launch.

The authenticated payment endpoint reserves a single pending payment before contacting the provider. It sends the database amount in sen and the order UUID as the external reference. It stores the returned bill identifier before exposing checkout. A timed-out create request remains reserved for manual investigation; blindly retrying could create duplicate payable bills. Operators must inspect ToyyibPay and the order audit before resolving an uncertain reservation. A bill returned but not stored is retained as a safe identifier in the audit when the database is available.

Callback URL: `https://<canonical-host>/api/webhooks/toyyibpay/`. Browser return URL opens `/order/?order=<uuid>` and never confirms payment. Callback requests must be form-encoded and pass the provider's documented MD5 signature. Server reconciliation independently checks `getBillTransactions` for successful state, the external order reference, exact amount and a valid transaction reference. Currency is fixed to MYR in application and database; the provider response does not expose an independent currency field. Payment confirmation is transactional and has unique bill and transaction references. Repeated or late callbacks cannot regress a paid order. Staff can use payment reconciliation in the order interface to recover a missing callback.

Sandbox requires a separate sandbox account and `PAYMENT_PROVIDER_MODE=sandbox` in a nonproduction runtime. Fake checkout additionally requires `ALLOW_LOCAL_FAKE_PROVIDERS=true`; it does not mark any order paid. Both modes fail closed under production runtime or Vercel production environment. Use a local development server for fake mode; production builds intentionally reject fake providers.

Acceptance: create a sandbox bill, complete simulated successful/failed payments, verify wrong signature and wrong amount rejection, replay successful callbacks concurrently, send late failure callbacks, and check one settlement/history/outbox event. Then perform an explicitly approved low-value live merchant checkout and refund according to the merchant's procedure. Local tests are not evidence of live merchant acceptance.

Reference checked September 2026: [ToyyibPay API reference](https://toyyibpay.com/apireference/), especially callback hashing and transaction lookup.

## WhatsApp Cloud API

Set `WHATSAPP_PROVIDER_MODE=live`, a server-only `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, supported `WHATSAPP_API_VERSION`, approved `WHATSAPP_TEMPLATE_LANGUAGE`, and JSON `WHATSAPP_TEMPLATE_MAP`. Each template uses exactly one body parameter: the order UUID. Obtain customer consent and business approval for transaction notifications. Approve these event templates in Meta before enabling delivery:

- `order_received`
- `documents_required`
- `payment_confirmed`
- `submitted_for_production`
- `plate_arrived`
- `appointment_confirmed`
- `appointment_changed`
- `installation_completed`

Template wording should identify the event, include the order reference, and direct the customer to the account page. Do not include identity documents, VIN, payment details or rejection reasons in message bodies. A customer's order page contains the details behind authentication.

A scheduler must POST `/api/notifications/dispatch/` with `Authorization: Bearer <CRON_SECRET>` once per minute; use a random secret at least 32 characters long. Configure it outside source control. This endpoint claims two rows per invocation under exclusive leases, sends independently from the originating order transaction, and records provider message identifiers or sanitized failure codes. Increase invocation frequency if the backlog exceeds the operational delivery target. Alert on failed outbox rows, age of pending rows and unsuccessful dispatch responses.

Explicit HTTP throttling/server errors use capped exponential retries up to eight attempts. Network timeouts and malformed successful responses are uncertain sends: quarantine them rather than automatically duplicate a potentially delivered message. A process crash after send can likewise leave an expired lease requiring review. Meta does not guarantee exactly-once sending through a client idempotency key; the outbox prevents duplicate local processing, but cannot eliminate the remote send/commit uncertainty. `biz_opaque_callback_data` carries the outbox UUID for provider investigation. `sent` on the outbox means API accepted. Signed provider delivery receipts are retained separately in `notification_delivery_events`, including sent, delivered, read and failed states; arrival order cannot overwrite earlier evidence.

Missing credentials or unapproved template configuration mark the item failed with a safe code. After fixing configuration, an administrator may explicitly requeue confirmed-unsent failures in the database under a recorded operations change. Never automatically requeue `SEND_UNCERTAIN` or expired sends without checking provider records. Preserve the original outbox UUID, deduplication key and attempts.

For local fake delivery set `WHATSAPP_PROVIDER_MODE=fake` and `ALLOW_LOCAL_FAKE_PROVIDERS=true` outside a production runtime. It returns deterministic local message IDs. It never calls Meta. Live acceptance requires actual approved-template delivery, expired-token failure, scheduler overlap, retry tests and operator review of uncertain sends.

Official setup reference: [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/). Confirm the supported API version and approved template structure in the business account before deployment.

## WhatsApp delivery webhook

Set `WHATSAPP_APP_SECRET` and a random `WHATSAPP_WEBHOOK_VERIFY_TOKEN` of at least 32 characters. Register `https://<canonical-host>/api/webhooks/whatsapp/` in Meta and subscribe to message status events. Verification uses the configured token; POST delivery receipts require HMAC-SHA256 over the exact bounded raw body with the app secret. Only receipts matching a stored provider message ID are recorded; early/unmatched receipts return retryable 503 for investigation. Receipts deduplicate by message ID, status and provider timestamp. Phone numbers and incoming message bodies are discarded. Configure a dedicated app/number or filter subscriptions so unrelated business traffic does not create unmatched receipt retries.
