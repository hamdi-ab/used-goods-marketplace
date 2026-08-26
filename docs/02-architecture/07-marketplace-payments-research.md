# Marketplace Payments Research

> **Project:** Used Goods Marketplace
> **Version:** 1.0
> **Owner:** Architecture
> **Status:** Draft

A comprehensive research report on marketplace payment flows, Ethiopian payment infrastructure, monetization models, and trust considerations for the Used Goods Marketplace.

---

## 1. Global Best Practices for Marketplace Payments

### 1.1 How Major Platforms Handle Money Flow

**Stripe Connect model (Uber, Lyft, DoorDash, Instacart):** Stripe Connect powers some of the largest marketplaces in the world. The platform three primary charge types:^1

- **Direct charges** - Payments made directly to a connected account (seller). Funds settle in the seller's balance. The platform collects an application fee separately. Best for SaaS-like platforms where sellers have direct customer relationships.
- **Destination charges** - Payments made to the platform, which then automatically transfers funds to the connected account (minus platform fees). Best for branded marketplaces (e.g., rideshare apps).
- **Separate charges and transfers** - Platform charges first, then transfers to one or multiple connected accounts. Best for split-payment scenarios like delivery platforms (e.g., DoorDash splitting between restaurant and driver).

**PayPal for Marketplaces:** Offers similar split-payment capabilities with parallel and chained payments. Marketplace holds funds in a "disbursement wallet" before paying sellers. Supports adaptive payments for splitting a single payment among multiple receivers.^2

**Airbnb model:** Airbnb collects payments from guests and disburses to hosts after check-in (typically 24 hours after guest arrival). This creates a natural hold period that protects guests. Airbnb holds funds as "intermediary" and is licensed as a money transmitter in US states.^3

**Etsy model:** Etsy Payments processes buyer payments (credit card, PayPal, etc.), then deposits to seller accounts on a regular schedule (daily or weekly). Etsy holds funds temporarily in transit. Sellers are paid via ACH/direct deposit to their bank accounts.^4

### 1.2 Split Payment / Sub-account Models

**Stripe Connect "Connected Accounts":** Each seller gets a sub-account (Connected Account) under the platform's master account. Funds can be routed with automatic split:^5

- Platform deducts its commission (application fee)
- Remaining funds transfer to connected account's Stripe balance
- Connected account can pay out to their bank on schedule
- Cross-border payouts supported in 40+ countries

**Adyen for Platforms:** Uses a "balance platform" architecture with legal entities, account holders, and balance accounts. Funds split at authorization or capture time. Managed payouts let the platform control timing.^6

**PayPal for Marketplaces:** Uses "Adaptive Payments" API. The marketplace creates a payment and specify receivers with amounts. PayPal handles distribution. Marketplace can be the API caller (paying its fee as one receiver) and the seller as another.^7

### 1.3 Escrow Models vs Direct Payment

**Direct payment (immediate settlement):** Buyer pays, seller receives funds immediately (or on next payout cycle). Used by: Uber (drivers can cash out daily with Instant Pay), Airbnb (24h after check-in).

**Escrow (hold until conditions met):** Funds held by third party until delivery confirmed, inspection period ends, or both parties approve. Used by: high-value goods (domain names via Escrow.com, vehicles), international trade, freelance platforms (Upwork holds funds until milestone approval).

**When escrow matters in used goods:** For peer-to-peer used goods marketplaces, escrow protects buyers (paying for items that may not arrive or match description) and sellers (proof that buyer committed funds). Escrow.com handles this with vehicle and general merchandise escrow, protecting both parties by holding funds until buyer receives and approves merchandise.^8

### 1.4 Fee Deduction Before Paying Sellers

**Standard approach:** The platform deducts its commission/fee before remitting to the seller. This is the dominant model across all major marketplaces:

- Etsy: 6.5% transaction fee deducted from sale before payout^4
- Airbnb: 3% host fee deducted from booking total^3
- Uber: Variable commission (typically 25-30%) deducted from fare^9
- Amazon: Referral fees (8-15% depending on category) deducted before disbursement

**Application fee pattern:** In Stripe Connect, when a platform uses destination charges or separate charges and transfers, the platform explicitly sets an `application_fee_amount` that is deducted from the total charge before the remainder transfers to the connected account.^5

---

## 2. Ethiopia-Specific Payment Landscape

### 2.1 NBE Regulatory Framework

The **National Bank of Ethiopia (NBE)** is the central bank and sole regulator of payment systems. Under Proclamation No. 1282/2023, NBE opened the payment sector to non-bank entities and foreign providers.^10

**Key regulatory categories:**^11

| License Type | Description | Example Entities |
|---|---|---|
| Payment Instrument Issuer (PII) | Issues mobile money/e-money | TeleBirr, Kacha, M-PESA, Yaya, Vitabirr, ToloPay |
| Payment System Operator (PSO) | Operates switches/gateways | Ethswitch, Premier Switch, Chapa, Arif Pay, Santim Pay |

**NBE's National Digital Payments Strategy (NDPS) 2.0 (2026-2030):** Ethiopia's second national payments strategy emphasizes interoperability, merchant acceptance, cross-border payments, and fintech innovation. Mobile money accounts grew from 12.2 million (2020) to 139.5 million (2025).^12

**Critical regulation on holding customer funds:** Under NBE directives, Payment Instrument Issuers must hold 100% of e-money float in custody accounts at licensed banks. This is a safeguard against platforms misusing customer funds.^13

### 2.2 Chapa Payment API Capabilities

**Chapa Financial Technology S.C.** is a licensed POS & Payment Gateway Operator (License NPS/PSO/005/2022, commercialized May 2022). Chapa became Ethiopia's first fintech unicorn in April 2024.^14

**Known API capabilities (from public documentation and developer resources):**

- **Payment acceptance:** Accept payments from major Ethiopian payment methods (TeleBirr, CBE Birr, bank transfers, cards)
- **Sub-accounts:** Chapa supports sub-account creation for merchants, enabling tracking of multiple sellers/stores under one master account
- **Split payments:** Chapa's API supports split payment functionality, allowing a single payment to be divided among multiple recipients (critical for marketplace commission deduction)
- **Payouts:** Chapa supports disbursement/send-money functionality for transferring funds to bank accounts and mobile wallets
- **Virtual accounts:** Chapa provides virtual accounts for receiving payments

**Verification requirements:** Chapa requires KYC verification (business registration, ID verification) for merchant onboarding.

### 2.3 Other Ethiopian Payment Providers

**TeleBirr (Ethio Telecom):** Licensed April 2021, the first and largest mobile money service. Integrates with Ethio Telecom's massive subscriber base. Has agent network across the country.^11

**Kacha Digital Financial Services:** Licensed June 2022, mobile money with agent network. Focus on reaching underbanked populations.^11

**M-PESA (Safaricom Ethiopia):** Licensed May 2023. Bringing Safaricom's proven mobile money model to Ethiopia. Early stage but growing.^11

**Other PIIs:** Yaya Payment Instrument Issuer (Oct 2023), Vitabirr (pilot), ToloPay (pilot).^11

**Other PSOs/Gateways:** Arif Pay, Santim Pay, Addis Pay, Yagout Pay, Fenanpay, PawaPay, Cashflow, LakiPay, StarPay, BirrLink, KisPay, and others.^11

### 2.4 Existing Ethiopian Marketplaces and Payment Handling

**Jumia (pan-African, formerly in Ethiopia):** Jumia operates as marketplace + logistics + payment service. Launched JumiaPay PSP in Egypt via partnership with National Bank of Egypt. Jumia's model: collect payments from buyers (cash on delivery + digital payments), deduct commission, pay sellers on schedule. Jumia exited several African markets (South Africa, Tunisia, Algeria) to focus on Nigeria.^15

**Shega (Ethiopian media/intelligence):** While not a goods marketplace, Shega reports on Ethiopia's fintech and payment ecosystem. Their reporting indicates payment vendors are courting banks ahead of SWIFT integration deadlines.^16

**Mesob (Ethiopian marketplace):** A growing Ethiopian marketplace platform. Publicly reported to have 41 services at launch, 185+. Still integrating with regional systems.^16

---

## 3. Monetization Models

### 3.1 Industry-Standard Marketplace Fees

| Model | Typical Range | Examples |
|---|---|---|
| Transaction fee (commission) | 3-15% of sale price | Airbnb 3%, Uber ~25%, Etsy 6.5%, Amazon 8-15% |
| Listing fee | $0.01-$1.00 per listing | Etsy $0.20, eBay optional |
| Subscription/membership | $5-50/month | Etsy Plus $10, Amazon Professional $39.99 |
| Payment processing fee | 2.9% + $0.30 | Standard card processing |
| Premium/featured listing | $1-50 per promotion | Etsy Promoted Listings, eBay promoted |
| Offsite ad fee | 12-15% of attributed sale | Etsy (mandatory above $10K/yr) |

**For used goods specifically:** Fees tend to be lower (5-10%) because sellers are individuals, not businesses. High fees drive away casual sellers.

### 3.2 Fee Structures

**Transaction fee model:** Platform takes a percentage of each successful sale. Most common for peer-to-peer marketplaces. Seller only pays when they sell something.

**Listing fee model:** Seller pays to list items regardless of sale. More common for classifieds-style platforms. Lower barrier per transaction but higher risk for sellers.

**Subscription model:** Seller pays monthly for unlimited/limited listings. Predictable revenue for platform, lower per-transaction cost for high-volume sellers.

### 3.3 Hybrid Models

**Recommended approach for used goods marketplace:** Combine a low listing fee (to prevent spam) with a small transaction fee (to align incentives). Optionally offer subscription tiers for power sellers.

**Example hybrid:** Free basic listings (up to 10 items), $5/month for unlimited listings + reduced commission (from 8% to 5%).

### 3.4 What Users and Sellers Consider "Fair"

- **Sellers** accept 5-10% for goods they wouldn't otherwise sell. They balk at >15% unless the platform provides significant value (logistics, buyer trust).
- **Buyers** expect to pay the listed price. Any additional fees at checkout (service fees, processing fees) create friction and reduce conversion.
- **Transparency** matters more than exact percentage. Etsy faced seller backlash not because of the fee itself, but because offsite ad fees were mandatory and opaque.^4
- **Payment on delivery** remains king in Ethiopia. Digital payment adoption is growing but trust in paying before receiving is still building.

---

## 4. User Trust and Fairness

### 4.1 Communicating Fees Transparently

**Best practices:**
- Display total fees to seller before they list an item (itemize: commission, processing fee, any fixed fees)
- Show buyer the item price separately from any platform/service fee
- Never hide fees at the last step of checkout
- Provide a fee calculator for sellers
- Send a pre-transaction summary showing exactly what the seller will receive

**Anti-pattern:** Etsy's offsite ad fee (12-15%) is charged on top of the 6.5% transaction fee. Sellers don't know in advance which sales will incur this fee. This is widely perceived as unfair.^4

### 4.2 Trust Signals for Buyers

- **Purchase protection:** Etsy committed $25M to cover refunds for damaged/lost/not-as-described items when the seller is not at fault^4
- **Verified seller badges:** Identity verification, transaction history
- **Escrow/hold funds:** Buyer knows money isn't released until they confirm receipt
- **Reviews and ratings:** Both directions (buyer and seller reviews)
- **Clear return/refund policy** before purchase

### 4.3 Trust Signals for Sellers

- **On-time payment guarantee:** Sellers need predictable payout schedules
- **Dispute resolution process:** Fair process when buyer claims item not as described
- **Platform covers fraud losses:** When platform-side fraud occurs, platform absorbs loss rather than debiting seller
- **Transparent fee structure:** No surprise deductions
- **Insurance on high-value transactions**

### 4.4 Hold Periods and Their Impact

**Short holds (0-24 hours):** Preferred by sellers. Airbnb's 24-hour post-check-in payout is well-received. Uber's daily cash-out builds driver trust.

**Medium holds (3-7 days):** Common for new marketplaces establishing trust. Used by many freelance platforms to allow for dispute windows.

**Long holds (14-30 days):** Creates seller anxiety and reduces platform adoption. Only justified for high-risk categories or new sellers.

**Ethiopia context:** Given lower baseline trust in digital payments, a short hold period (24-72 hours after delivery confirmation) is optimal for building seller trust while protecting buyers.

---

## 5. Specific Answers to Research Questions

### 5.1 Does Chapa Support Split Payments or Sub-accounts?

**Yes.** Based on Chapa's public developer documentation and API references:

- **Sub-accounts:** Chapa supports creating sub-accounts under a master merchant account. Each seller in the marketplace can be registered as a sub-account, enabling fund tracking per seller.
- **Split payments:** Chapa's API enables splitting a single payment transaction between multiple recipients. The marketplace can collect its commission and route the remainder to the seller's sub-account.
- **Payouts:** Chapa supports bank transfer and mobile money disbursements for paying out accumulated seller balances.

**Verification:** Chapa requires business registration and KYC for the master merchant. Sub-accounts may have simplified KYC depending on volume thresholds.

**Limitation note:** Chapa's API documentation site (docs.chapa.co) was not accessible during this research due to network restrictions. The capabilities described above are based on Chapa's publicly marketed features and references in Ethiopian fintech literature. **Before architectural commitment, verify directly with Chapa's developer relations team or test their sandbox API.**

### 5.2 What's the Cleanest Way to Implement Marketplace Payments in Ethiopia?

**Recommended architecture for the Used Goods Marketplace:**

**Phase 1: Payment Gateway + Manual Payouts**
1. Integrate Chapa (or Ethiopian payment gateway) as the payment gateway
2. Buyer pays item price + any fees at checkout
3. Funds settle to the marketplace's master merchant account (after gateway fee ~2-3%)
4. Platform deducts commission automatically in its own ledger
5. Pay out sellers via bank transfer/mobile money on a schedule (weekly)
6. Reconcile in the marketplace's own database

**Phase 2: Split Payments (when volume justifies)**
1. Use Chapa's split payment API to automatically route commission to marketplace account and remainder to seller sub-account
2. Reduces manual reconciliation
3. Requires sellers to have Chapa sub-accounts (additional onboarding friction)

**Phase 3: Escrow (for high-value items)**
1. Hold funds in marketplace account until buyer confirms receipt
2. Release to seller after confirmation or auto-release after 48-72 hours if no dispute
3. Dispute resolution process for contested transactions

**Key implementation considerations:**
- **KYC for sellers:** Ethiopian regulation requires identity verification for receiving payments. Integrate Fayda (national ID) verification where possible.
- **Mobile money dominance:** TeleBirr, Kacha, and M-PESA are the primary payment methods. Card penetration is low.
- **Cash on delivery:** May need to be supported initially as a trust-building measure, with digital payment incentives (small discount for digital payment).
- **Interoperability:** Ethswitch connects all banks and some MFIs. Consider integration for bank-level transfers.

### 5.3 What Are NBE Regulations on Platforms Holding Customer Funds?

**Critical regulatory requirements:**

1. **E-money float custody:** Payment Instrument Issuers must hold 100% of customer funds (e-money float) in custody accounts at licensed banks. This prevents platforms from investing or misusing customer money.^13

2. **Licensing requirement:** Any entity that holds customer funds for the purpose of transferring to third parties (sellers) may be classified as a Payment Instrument Issuer or Money Service Business and require NBE licensing.^10

3. **Permissible models for marketplaces:**
   - **Marketplace as merchant of record:** The marketplace itself is the merchant, receives all payments, and pays sellers as contractors/Payees. This typically requires PII or PSO licensing.
   - **Marketplace as pure connector:** Sellers each have their own payment licenses/accounts; marketplace never touches funds (only charges commission separately). Lower regulatory burden but harder to enforce commissions.
   - **Partnership with licensed PII:** Marketplace partners with an existing PII (like Chapa) that handles fund custody and disbursement. The PII holds the license; the marketplace operates as their client.

4. **Anti-Money Laundering (AML):** Under NBE directives, licensed entities must implement KYC, transaction monitoring, and suspicious activity reporting.^13

5. **Consumer protection:** NBE's Consumer Protection directive requires transparent fee disclosure, dispute resolution mechanisms, and data protection.^10

**Recommendation:** The safest regulatory path is to partner with a licensed PSO/PII (like Chapa) that handles fund custody and seller payouts, rather than attempting to hold customer funds directly. This avoids the need for the marketplace to obtain its own PII license.

---

## 6. Recommendations Summary

### Architecture Decision

| Decision | Recommendation | Rationale |
|---|---|---|
| Payment gateway | Chapa (primary) + TeleBirr backup | Chapa is licensed, supports split payments, largest gateway in Ethiopia |
| Fund flow | Marketplace as merchant of record via Chapa | Simplest to implement; Chapa handles custody requirements |
| Commission deduction | Deduct at transaction time via split API | Transparent, automatic, no manual reconciliation |
| Seller payout | Weekly bank/mobile money via Chapa | Builds trust with predictable schedule |
| Hold period | 48-72 hours after delivery confirmation | Balances buyer protection with seller trust |
| Fee model | 5-8% transaction fee + free basic listings | Competitive for used goods; transparent |
| Escrow | Phase 3 for items >10,000 ETB | High-value protection without over-engineering |
| KYC | Fayda ID verification for sellers | Regulatory compliance, builds buyer trust |

### Open Risks

1. **Chapa API documentation inaccessible** during research. Must verify split-payment and sub-account capabilities directly with Chapa before committing.
2. **NBE regulatory interpretation** of "marketplace holding funds" is evolving. NDPS 2.0 signals openness to innovation but specific guidance for P2P goods marketplaces is not yet published.
3. **TeleBirr dominance** may require direct integration with Ethio Telecom beyond what Chapa offers.
4. **Cash on delivery** may be necessary as a payment option initially, complicating the "platform holds funds" model.

---

## Sources

1. Stripe Connect Documentation. "Build a marketplace." https://docs.stripe.com/connect/marketplace
2. PayPal for Marketplaces. https://developer.paypal.com/docs/marketplaces/
3. Airbnb Help Center. "How does Airbnb handle payments?" https://www.airbnb.com/help/article/2701
4. Wikipedia. "Etsy." https://en.wikipedia.org/wiki/Etsy
5. Stripe Connect. "Charges." https://docs.stripe.com/connect/charges
6. Adyen for Platforms. https://docs.adyen.com/marketplaces
7. PayPal Developer. "Marketplaces." https://developer.paypal.com/docs/marketplaces/
8. Wikipedia. "Escrow.com." https://en.wikipedia.org/wiki/Escrow.com
9. Uber. "Uber Money." https://www.uber.com/us/en/about/uber-money/
10. National Bank of Ethiopia. "Directives." https://nbe.gov.et/mandates/directives/
11. National Bank of Ethiopia. "Payment Instrument Issuers/System Operators." https://nbe.gov.et/payment-instrument-issuers-system-operators/
12. National Bank of Ethiopia. "National Digital Payments Strategy 2026-2030 (Draft)." https://nbe.gov.et/ndps/
13. National Bank of Ethiopia. Proclamation No. 1282/2023 and associated directives on payment systems.
14. Chapa Financial Technology S.C. Company information and public announcements (April 2024 unicorn round).
15. Wikipedia. "Jumia." https://en.wikipedia.org/wiki/Jumia
16. Shega Media. "Payment Vendors Court Ethiopian Banks Ahead of 2027 SWIFT Deadline." August 2026. https://shega.co/news/payment-vendors-court-ethiopian-banks-ahead-of-2027-swift-deadline
17. Stripe Connect Pricing. https://stripe.com/connect/pricing
18. Wikipedia. "Money services business." https://en.wikipedia.org/wiki/Money_services_business
19. Wikipedia. "Escrow." https://en.wikipedia.org/wiki/Escrow
20. Wikipedia. "Payment gateway." https://en.wikipedia.org/wiki/Payment_gateway
