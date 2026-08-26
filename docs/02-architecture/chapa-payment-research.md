# Chapa Payment API Research — Marketplace Capabilities

> **Project:** Used Goods Marketplace (VinTech Challenge 2026)
> **Date:** 2026-08-24
> **Status:** Research findings
> **Sources:** Chapa official developer documentation (developer.chapa.co), chapa.co

---

## 1. Split Payments

**Capability:** Yes — native split payment support via subaccounts.

A single buyer payment can be automatically split between the platform (commission) and a seller sub-account at settlement time. Funds are routed to the bank account associated with the subaccount upon payment completion.

### How it works

1. **Create a subaccount** for each seller with a defined split structure.
2. **Reference the subaccount** in the transaction initialization or direct charge request.
3. Chapa routes funds according to the split configuration automatically.

### API endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Create subaccount | `https://api.chapa.co/v1/subaccount` | `POST` |
| Initialize split payment | `https://api.chapa.co/v1/transaction/initialize` | `POST` |
| Direct charge with split | `https://api.chapa.co/v1/charges?type={payment_method}` | `POST` |

### Subaccount creation payload

```json
{
  "account_name": "Seller Name",
  "bank_code": 128,
  "account_number": "0123456789",
  "split_value": 0.20,
  "split_type": "percentage"
}
```

### Split types

- **`percentage`** — platform takes a percentage of each transaction (e.g., `0.03` = 3% commission, seller receives 97%).
- **`flat`** — platform takes a flat fee per transaction (e.g., `25` ETB), seller receives the remainder.

The split configuration can be overridden per-transaction by specifying `split_type` and `split_value` in the subaccount object at transaction time.

### Example calculation

For a 100 ETB sale with 6 ETB Chapa fee:
- **Flat 25 ETB commission:** Seller receives 69 ETB, platform receives 25 ETB, Chapa fee is 6 ETB.
- **Percentage 20% commission:** Seller receives 75.20 ETB (80% of 94 ETB), platform receives 18.80 ETB.

> **Note:** Subaccount settlements default to ETB. If a payment is made in a foreign currency, Chapa converts to ETB before settlement.

**Source:** [Chapa Split Payments](https://developer.chapa.co/integrations/split-payment)

---

## 2. Sub-accounts

### Creation

Sub-accounts can be created via:

1. **Chapa Dashboard** (dashboard.chapa.co) — manual creation.
2. **API** — programmatic creation (may be restricted).

**Endpoint:** `POST https://api.chapa.co/v1/subaccount`

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `account_name` | string | Seller's bank account name |
| `bank_code` | integer | Recipient bank ID (from `/v1/banks` endpoint) |
| `account_number` | string | Seller's bank account number |
| `business_name` | string | Seller/merchant name |
| `split_type` | string | `percentage` or `flat` |
| `split_value` | number | Commission amount per split type |

### Programmatic creation restrictions

The API documentation includes the error message: *"You Can't create a subaccount via API, try to create from dashboard."* and *"To create subaccounts via API you need to be on live mode."* — indicating API-based sub-account creation may be gated behind account tier or compliance approval. Merchants should verify current eligibility with Chapa.

### KYC requirements

KYC is performed at the **platform merchant level**, not per-subaccount. Chapa requires:
- Business registration compliance form submission.
- Identity verification for the merchant (before live mode is enabled).

For sub-accounts, Chapa requires:
- Valid `bank_code` (from the bank list endpoint).
- Valid `account_number` for the specified bank.

Chapa states: *"Knowing your vendors/sub-accounts is your responsibility and if there is any dispute or chargeback raised we will be taking it from your account."*

**Source:** [Chapa Create Subaccount](https://developer.chapa.co/integrations/split-payment), [Chapa Error Codes](https://developer.chapa.co/integrations/responses), [Chapa Quick Start](https://developer.chapa.co/dashboard/quick-start)

---

## 3. Payouts (Seller Withdrawals)

Seller withdrawals from Chapa are initiated via the **Transfer API**, sending funds from the platform's Chapa balance to a seller's bank account or mobile money wallet.

### Transfer endpoint

**Endpoint:** `POST https://api.chapa.co/v1/transfers`

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `account_number` | string | Recipient account number |
| `amount` | number | Amount to transfer |
| `bank_code` | integer | Recipient bank/wallet code |

**Optional fields:** `account_name`, `currency` (defaults to ETB), `reference`, `status` (test mode only).

### Supported payout methods

| Method | Min Payout | Max Payout |
|--------|-----------|-----------|
| telebirr | 1 ETB | 75,000 ETB |
| CBEBirr | 1 ETB | 300,000 ETB |
| AwashBirr | 1 ETB | 600,000 ETB |
| Awash Bank | 1 ETB | Unlimited |
| Coopay-Ebirr | 1 ETB | 30,000 ETB |
| M-Pesa | 1 ETB | 75,000 ETB |
| Amole | 1 ETB | 250,000 ETB |
| Enat Bank | 1 ETB | 90,000 ETB |
| Amhara Bank | 1 ETB | 100,000 ETB |
| CBE Bank Transfer | 1 ETB | 9,999,999 ETB |
| COOP Bank Transfer | 1 ETB | 1,000,000 ETB |

### Processing flow

1. Initiate transfer request.
2. Validation (OTP sent to merchant device OR server approval callback).
3. Wait for approval status.
4. Transfer queued.
5. Transfer response.

### Transfer hours

> *"Our Transfer hours are Mon-Sat from 08:30 AM - 04:30 PM only."*

Transfers outside these hours will receive a `401` error. For immediate assistance outside hours, contact Chapa support.

### Bulk payouts

Supports sending up to 100 transfers per batch request to `POST https://api.chapa.co/v1/bulk-transfers`. Each batch should be sent every 5 seconds to avoid rate limiting.

### Balance requirements

Transfers require sufficient available balance. Chapa distinguishes between:
- **Available Balance** — immediately usable for transfers/withdrawals.
- **Ledger Balance** — includes funds on hold/pending settlement.

**Sources:** [Chapa Transfer](https://developer.chapa.co/transfer/transfers), [Chapa Payment Methods](https://developer.chapa.co/payment-methods), [Chapa Bulk Transfer](https://developer.chapa.co/transfer/bulk-transfers), [Chapa Balance](https://developer.chapa.co/transfer/balance)

---

## 4. Fund Custody

**Not publicly documented in Chapa's API or security documentation.**

The available documentation does not specify:
- Whether funds are held in regulated custody accounts.
- The specific license or regulatory authority covering fund custody (e.g., National Bank of Ethiopia).
- Whether Chapa operates as a payment gateway with direct bank settlement or holds funds in pooled accounts.

What is documented:
- All card numbers are encrypted at rest with AES-256.
- Chapa uses HTTPS/TLS for all connections.
- Chapa is described as *"an Ethiopian Financial Service and Data Engineering Company"* on its about page.

**Recommendation:** Contact Chapa directly (support.chapa.co or the merchant onboarding team) to obtain their custody license details, fund holding policies, and settlement cycle documentation before committing to marketplace payment flows.

**Sources:** [Chapa Security Guide](https://developer.chapa.co/security/security-guide), [Chapa About](https://chapa.co/about)

---

## 5. Webhook Events

Chapa sends webhook notifications to a configured URL when payment or transfer events occur.

### Enabling webhooks

1. Log in to Chapa Dashboard.
2. Navigate to Profile Settings → Webhooks tab.
3. Add webhook URL and secret hash.
4. Custom webhooks can also be enabled from the dashboard with event-type filtering.

### Authentication

Chapa signs each webhook with `HMAC SHA256` using the configured secret. The signature is sent in two headers:
- `chapa-signature`
- `x-chapa-signature`

The endpoint should verify at least one of these headers before processing the event.

### Transaction events

| Event | Trigger | Type field |
|-------|---------|------------|
| `charge.success` | Payment completed successfully | `API`, `Payment Link`, `Event`, `Donation` |
| `charge.refunded` | Refund processed | same |
| `charge.reversed` | Transaction reversed | same |
| `charge.failed/cancelled` | Payment failed or was cancelled | same |

### Transfer/payout events

| Event | Trigger | Type field |
|-------|---------|------------|
| `payout.success` | Payout completed | `Payout` |
| `payout.failed/cancelled` | Payout failed | `Payout` |

### Custom webhook event types

Custom webhooks can subscribe to specific event categories:
- **Payout** — events related to payouts from the Chapa account.
- **Transaction** — payments received via Chapa.
- **Refund** — refund events.

### Transaction webhook payload

```json
{
  "event": "charge.success",
  "currency": "ETB",
  "amount": "400.00",
  "charge": "12.00",
  "status": "success",
  "mode": "live",
  "reference": "AP634JFwEbxd",
  "tx_ref": "4FGFF4FFGD3",
  "type": "API",
  "payment_method": "telebirr",
  "customization": { "title": null, "description": null, "logo": null },
  "meta": null
}
```

### Transfer webhook payload

```json
{
  "event": "payout.success",
  "type": "Payout",
  "account_name": "Customer Name",
  "account_number": "25190000000",
  "bank_id": 855,
  "bank_name": "telebirr",
  "amount": "2000.00",
  "charge": "60.00",
  "currency": "ETB",
  "status": "success",
  "reference": "MYMER3434989",
  "chapa_reference": "2o10dfs332U",
  "bank_reference": "GT3412w3"
}
```

### Retry behavior

If the webhook endpoint does not respond with `200 OK`, Chapa retries every 10 minutes for up to 10 attempts over a 72-hour period.

**Sources:** [Chapa Webhooks](https://developer.chapa.co/integrations/webhooks), [Chapa Accept Payment](https://developer.chapa.co/integrations/accept-payments)

---

## Summary for Marketplace Integration

| Question | Answer |
|----------|--------|
| Split payments | Yes — native subaccount split (percentage or flat) |
| Sub-account creation | API exists; may require live mode/compliance approval |
| Payout mechanism | Transfer API to bank/mobile money |
| Minimum transfer | 1 ETB |
| Transfer hours | Mon–Sat, 08:30–16:30 |
| Fund custody license | Not publicly documented — contact Chapa |
| Webhooks | Full coverage for payment success/failure/refund and payout success/failure |
| Idempotency | Webhooks retry; merchant must implement idempotency |

### Recommended marketplace flow

1. Onboard the marketplace merchant on Chapa and complete compliance.
2. For each seller, create a subaccount via API or dashboard with the agreed commission split.
3. On buyer checkout, initialize a transaction with the seller's subaccount ID in the payload.
4. Verify payment via the verify endpoint or webhook before fulfilling the order.
5. Initiate seller payouts via the Transfer API (single or bulk) on the agreed schedule.

**Open risk:** Fund custody and regulatory license status are not disclosed in available documentation. This must be resolved before committing to a custodial marketplace model where Chapa holds seller funds.
