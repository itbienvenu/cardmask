# ADR: Transition to Middleman Funding Model

## Status
Proposed

## Context
Initial version of the cardmask system attempted to build an entire wallet infrastructure. This introduced high regulatory overhead and complexity in fund management.

## Decision
We are moving from building an entire wallet to a **middleman logic** (Subscription Firewall). This is significantly more scalable and carries much less regulatory risk. We will position the app as a "Subscription Firewall" for businesses.

## Implementation Details

### 1. Strategic Masking Logic
- **Merchant Locking**: Create cards restricted to a specific merchant (e.g., "Netflix").
- **Disposable Cards (ONE_TIME)**: Cards that automatically block themselves after a single successful transaction.
- **Spending Limits**: Each mask card has its own "budget" (limitAmount) separate from the user's total balance.

### 2. Professional Transaction Engine
- **Real-time Authorization**: The system runs a check for every payment: Status (Active/Blocked), Limits (Available funds at source), and Merchant Permission.
- **Integrated Log History**: Every attempt (Success or Decline) is logged in a persistent Audit Trail.
- **Reason Tracking**: Transactions store a `failureReason` (e.g., `MERCHANT_NOT_AUTHORIZED` or `CARD_BLOCKED`).

### 3. Business-Specific Controls
- **Subscription Guard**: If a business only wants to spend $50/month on AWS, the card will automatically "Reset" its limit every month but never allow an overage.

### 4. UI Transformation
- The dashboard will focus on **Billing Profiles** and **Linked Funding Sources** rather than raw wallets.
