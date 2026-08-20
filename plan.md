# DRIP POS Multi-Tenant SaaS Architecture

Version: 1.0
Status: Architecture Specification
Product: DRIP POS
Backend: Self-hosted Supabase
Database: PostgreSQL
Frontend: Expo React Native
Offline Database: SQLite
Infrastructure: Ubuntu + Docker + Cloudflare Tunnel

---

# 1. Purpose

DRIP POS is a multi-tenant SaaS POS platform.

The core architecture is:

User
  ↓
Organization
  ↓
Subscription
  ↓
Store Capacity
  ↓
Stores
  ↓
Store Members
  ↓
POS Data

A user does NOT directly own a store.

An organization owns stores.

A subscription belongs to the organization.

The subscription determines how many stores the organization can operate.

---

# 2. Core Principles

The system must follow these principles:

1. User is separate from Organization.
2. Organization is separate from Store.
3. Subscription belongs to Organization.
4. Store capacity belongs to Subscription.
5. Store is a tenant boundary.
6. Every store-owned record contains store_id.
7. PostgreSQL RLS is the ultimate tenant security layer.
8. Billing state is controlled by the backend/payment provider.
9. React Native must never be trusted for authorization.
10. Store data must never be deleted automatically because of billing failure.
11. POS must support offline operation.
12. Billing must support mid-cycle store additions.
13. Additional stores are recurring subscription addons.
14. Store addons use quantity rather than creating separate subscriptions.
15. Billing provider webhooks are authoritative for payment state.

---

# 3. High-Level Architecture

                         INTERNET
                            |
                            v
                     Cloudflare DNS
                            |
                            v
                    Cloudflare Tunnel
                            |
                            v
                     Ubuntu Server
                            |
             +--------------+--------------+
             |                             |
             v                             v
      Self-hosted Supabase            Other Services
             |
     +-------+--------+--------+--------+
     |       |        |        |
     v       v        v        v
 PostgreSQL Auth   Storage  Realtime
     |
     v
 DRIP POS Database

Mobile Application
        |
        +---- Authentication
        |
        +---- REST / Supabase API
        |
        +---- Realtime
        |
        +---- Storage
        |
        +---- Local SQLite
        |
        +---- Sync Engine

---

# 4. Tenant Hierarchy

The complete hierarchy is:

USER
 |
 v
ORGANIZATION
 |
 +-- Organization Members
 |
 +-- Subscription
 |      |
 |      +-- Plan
 |      |
 |      +-- Subscription Items
 |             |
 |             +-- Store Addon Quantity
 |
 +-- Stores
        |
        +-- Store Members
        |
        +-- Products
        +-- Categories
        +-- Inventory
        +-- Customers
        +-- Transactions
        +-- Payments
        +-- Reports

---

# 5. User Model

Supabase Auth owns authentication.

Do not create a custom password system.

Supabase:

auth.users
    |
    v
profiles

## profiles

Fields:

- id
- name
- email
- phone
- avatar_url
- created_at
- updated_at

The profile ID must match auth.users.id.

---

# 6. Organization

An organization represents a business/account container.

Examples:

Basth Coffee Group
DRIP Coffee
ABC Restaurant Group

An organization can contain multiple stores.

## organizations

Fields:

- id
- name
- slug
- owner_id
- logo_url
- phone
- email
- address
- currency
- timezone
- created_at
- updated_at

Relationships:

organizations.owner_id
    ↓
profiles.id

organizations
    ↓
stores.organization_id

organizations
    ↓
subscriptions.organization_id

---

# 7. Organization Membership

A user can belong to multiple organizations.

Example:

Achmed
 |
 +-- Basth Coffee Group
 |
 +-- Another Business

## organization_members

Fields:

- id
- organization_id
- user_id
- role
- created_at
- updated_at

Roles:

- owner
- admin
- billing

The organization owner has full organization-level control.

---

# 8. Store

A store is the operational tenant.

Examples:

Basth Coffee
Basth Coffee Medan
Basth Coffee Binjai

## stores

Fields:

- id
- organization_id
- name
- slug
- logo_url
- address
- phone
- email
- currency
- timezone
- is_active
- created_at
- updated_at

Every store belongs to exactly one organization.

---

# 9. Store Membership

Users can work in one or multiple stores.

## store_members

Fields:

- id
- store_id
- user_id
- role
- created_at
- updated_at

Roles:

- manager
- cashier
- staff

Example:

John
 |
 +-- Store A → cashier
 |
 +-- Store B → manager

A user must not automatically receive access to every store in an organization unless their organization role allows it.

---

# 10. Subscription Architecture

The subscription belongs to the organization.

NOT:

User → Subscription

NOT:

Store → Subscription

Correct:

Organization → Subscription

Example:

Organization
    |
    +-- Pro Subscription
          |
          +-- 3 included stores
          |
          +-- 2 additional store slots

---

# 11. Plans

## plans

Fields:

- id
- name
- slug
- description
- monthly_price
- yearly_price
- currency
- included_stores
- included_staff
- included_products
- storage_limit
- transaction_limit
- is_active
- created_at
- updated_at

Example:

FREE:

- included_stores: 1
- included_staff: 2
- included_products: 100

PRO:

- included_stores: 3
- included_staff: 10
- included_products: 2000

BUSINESS:

- included_stores: 10
- included_staff: 50
- included_products: unlimited

---

# 12. Subscriptions

## subscriptions

Fields:

- id
- organization_id
- plan_id
- status
- provider
- provider_customer_id
- provider_subscription_id
- current_period_start
- current_period_end
- cancel_at_period_end
- created_at
- updated_at

Possible statuses:

- trialing
- active
- past_due
- paused
- cancelled
- expired

---

# 13. Subscription Items

A subscription can contain multiple billable items.

## subscription_items

Fields:

- id
- subscription_id
- type
- quantity
- unit_price
- provider_item_id
- status
- created_at
- updated_at

Types:

- base_plan
- extra_store
- extra_staff
- extra_storage
- future_addons

Example:

subscription_items

base_plan
quantity = 1
price = $20

extra_store
quantity = 2
price = $5

Total:

$20 + ($5 × 2)
= $30/month

---

# 14. Store Slot Architecture

Store slots represent store capacity.

Formula:

available_store_slots =
    plan.included_stores
    +
    active_extra_store_quantity

Example:

Pro:

included = 3
extra = 2

available = 5

If:

current_stores = 4

Then:

4 / 5 stores used

One slot remains.

---

# 15. Store Creation Rule

Before creating a store:

1. Authenticate user.
2. Identify organization.
3. Verify organization membership.
4. Verify user permission.
5. Load active subscription.
6. Verify subscription status.
7. Calculate included store slots.
8. Calculate active extra store slots.
9. Count active stores.
10. Compare capacity.
11. If capacity exists, create store.
12. Otherwise require additional store slot purchase.

Formula:

used_stores < available_store_slots

If true:

ALLOW

If false:

STORE_LIMIT_REACHED

---

# 16. Additional Store Purchase

Additional stores are NOT one-time purchases.

They are recurring subscription addons.

Example:

Pro:

$20/month

Includes:

3 stores

Additional store:

+$5/month

Customer with 3 stores:

$20/month

Customer with 4 stores:

$25/month

Customer with 5 stores:

$30/month

---

# 17. Why Store Addons Are Recurring

A store consumes infrastructure continuously:

- database
- storage
- backups
- realtime
- API traffic
- bandwidth
- support
- server resources

Therefore additional store capacity must be recurring.

Do not sell permanent store capacity as a one-time purchase.

---

# 18. Mid-Cycle Store Addition

A customer may add a store during an existing billing period.

Example:

Billing period:

August 1 → August 31

Customer adds Store #4:

August 20

The additional store addon costs:

$5/month

The customer should NOT normally be charged the full $5 immediately.

The billing provider should prorate the addon for the remaining portion of the billing period.

Example:

$5 × remaining time / billing period

Approximate result:

$1.77

The exact amount must be calculated by the billing provider.

---

# 19. Mid-Cycle Billing Flow

User:

+ Add Store

        ↓

Backend:

Check store capacity

        ↓

Capacity unavailable

        ↓

Display:

Additional Store
+$5/month

Prorated today:
~$1.77

Next renewal:
+$5/month

        ↓

User confirms

        ↓

Backend requests subscription item quantity change

        ↓

extra_store quantity:

0 → 1

        ↓

Payment provider calculates proration

        ↓

Payment succeeds

        ↓

Payment provider sends webhook

        ↓

Backend verifies webhook

        ↓

subscription_items updated

        ↓

Store slot becomes available

        ↓

Store created

---

# 20. Never Trust the Mobile Client

Bad:

User presses "Buy"

↓

Mobile app assumes payment succeeded

↓

Store created

Correct:

User presses "Buy"

↓

Backend requests billing change

↓

Payment provider confirms

↓

Webhook received

↓

Webhook verified

↓

Subscription item updated

↓

Store capacity updated

↓

Store created

The backend is authoritative.

---

# 21. Subscription Quantity Model

Do not create a separate subscription for every store.

Bad:

Subscription #1 → Store A
Subscription #2 → Store B
Subscription #3 → Store C

Correct:

Subscription
 |
 +-- Base Plan
 |     quantity = 1
 |
 +-- Extra Store
       quantity = 2

This allows:

3 included stores
+
2 extra stores
=
5 available stores

---

# 22. Adding Multiple Stores

Example:

August 1:

3 stores

August 10:

Add Store #4

August 15:

Add Store #5

August 25:

Add Store #6

Do NOT create three subscriptions.

Instead:

extra_store quantity:

0
↓
1
↓
2
↓
3

At renewal:

Base plan:

$20

Extra stores:

3 × $5 = $15

Total:

$35/month

---

# 23. Removing Stores

Deleting a physical store does not automatically cancel an addon.

Example:

Plan:

3 included

Extra slots:

2

Stores:

5

Customer deletes Store #5.

Now:

Stores = 4

Extra slots = 2

The customer still has:

5 available slots

The unused slot remains available.

The customer can explicitly cancel one extra store slot.

---

# 24. Cancelling an Extra Store Slot

Customer chooses:

Manage Store Slots

Then:

Extra slots:

2

User chooses:

Cancel 1 slot

Backend requests:

quantity:

2 → 1

Depending on billing provider policy, the cancellation can:

- take effect immediately with credit
- take effect at the end of the billing period

Recommended:

Allow the customer to cancel at the end of the current billing period.

---

# 25. Subscription Upgrade

Example:

Pro:

3 included stores

Customer currently has:

3 stores

and:

2 extra slots

Total capacity:

5

Customer upgrades:

Business:

10 included stores

The 2 additional slots are no longer necessary.

Recommended behavior:

1. Upgrade base plan.
2. Keep existing addons until current billing period ends OR explicitly handle prorated cancellation.
3. Inform customer that the additional slots are no longer required.
4. Allow them to remove addons.

Avoid silently changing billing without clearly showing the customer.

---

# 26. Subscription Downgrade

Example:

Business:

10 stores

Customer has:

8 stores

Downgrades to Pro:

3 included stores

The backend must NOT immediately delete stores.

Instead:

new capacity:

3

current stores:

8

Result:

5 stores exceed the new capacity.

The organization enters:

OVER_CAPACITY

The customer cannot create additional stores.

Existing stores remain available according to the downgrade policy.

Recommended:

Allow the downgrade to complete but require the customer to resolve the excess stores before the next billing period.

Possible options:

- deactivate stores
- remove extra addons
- upgrade again

Never automatically delete business data.

---

# 27. Payment Failure

If payment fails:

subscription:

past_due

Do not immediately delete anything.

Recommended sequence:

active
  ↓
past_due
  ↓
grace period
  ↓
payment retry
  ↓
success → active

If payment continues failing:

past_due
  ↓
suspended

---

# 28. Suspension

Suspension must preserve data.

Example:

Allowed stores:

3

Current stores:

5

After losing extra capacity:

Store A → active
Store B → active
Store C → active
Store D → suspended
Store E → suspended

Store D and Store E data remain intact.

No data deletion.

---

# 29. Reactivation

If payment is restored:

subscription:

active

Additional slots:

restored

Suspended stores can become active again.

Example:

Store D:

suspended
  ↓
active

Store E:

suspended
  ↓
active

---

# 30. Store Status

## stores.status

Recommended values:

- active
- suspended
- archived

Do not use deletion for normal billing lifecycle.

---

# 31. Product Architecture

## categories

Fields:

- id
- store_id
- name
- description
- sort_order
- is_active
- created_at
- updated_at

## products

Fields:

- id
- store_id
- category_id
- name
- description
- sku
- barcode
- price
- cost
- track_stock
- image_url
- is_active
- created_at
- updated_at

Every product belongs to one store.

---

# 32. Inventory

## inventory

Fields:

- id
- store_id
- product_id
- quantity
- reserved_quantity
- minimum_stock
- updated_at

## inventory_movements

Fields:

- id
- store_id
- product_id
- type
- quantity
- previous_quantity
- new_quantity
- reference_type
- reference_id
- user_id
- created_at

Types:

- sale
- purchase
- return
- adjustment
- damage
- transfer

---

# 33. Transactions

## transactions

Fields:

- id
- store_id
- cashier_id
- customer_id
- subtotal
- discount
- total
- payment_method
- status
- created_at
- updated_at

## transaction_items

Fields:

- id
- transaction_id
- product_id
- product_name
- price
- quantity
- cost_snapshot
- subtotal

The following must be snapshotted:

- product name
- price
- cost

This ensures historical receipts do not change when the product changes later.

---

# 34. Payments

## payments

Fields:

- id
- transaction_id
- method
- amount
- reference
- status
- created_at

Methods:

- cash
- bank
- qris
- e_wallet
- card

---

# 35. Customers

## customers

Fields:

- id
- store_id
- name
- phone
- email
- created_at
- updated_at

Customers are store-specific unless a future global customer system is intentionally introduced.

---

# 36. Storage

Do not store image binaries in PostgreSQL.

Use Supabase Storage.

Suggested structure:

products/
    {store_id}/
        {product_id}/
            main.webp

stores/
    {store_id}/
        logo.webp

profiles/
    {user_id}/
        avatar.webp

organizations/
    {organization_id}/
        logo.webp

Database stores only the path/reference.

---

# 37. Realtime

Supabase Realtime should be used for:

- inventory updates
- transaction updates
- order status
- store activity
- notifications
- staff activity

Example:

Cashier A
    ↓
Sale
    ↓
PostgreSQL
    ↓
Realtime
    ↓
Manager dashboard

---

# 38. Offline Architecture

DRIP POS must support offline operation.

Architecture:

React Native
      |
      +-------------------+
      |                   |
      v                   v
SQLite               Supabase
      |                   |
      +--------+----------+
               |
               v
          Sync Engine

The POS must continue working when internet is unavailable.

---

# 39. SQLite

Local SQLite stores:

- current store
- products
- categories
- inventory
- customers
- pending transactions
- transaction items
- sync queue

Every local record should have:

- id
- created_at
- updated_at
- sync_status

---

# 40. Sync Status

Possible values:

- pending
- syncing
- synced
- failed

Flow:

pending
   ↓
syncing
   ↓
synced

If failed:

failed
   ↓
retry
   ↓
syncing

---

# 41. Offline Transactions

When offline:

Cashier
   ↓
SQLite
   ↓
Create transaction
   ↓
Update local inventory
   ↓
Create sync queue item

When internet returns:

Sync queue
   ↓
Supabase
   ↓
PostgreSQL
   ↓
Realtime

---

# 42. UUID Strategy

Use UUIDs generated client-side.

This allows offline transaction creation.

Example:

transaction_id:

550e8400-e29b-41d4-a716-446655440000

The same ID can safely be uploaded later.

Do not rely only on server-generated sequential IDs for offline data.

---

# 43. Multi-Store Switching

The mobile application should maintain:

currentOrganization
currentStore

Example:

Organization:

Basth Coffee Group

Current store:

Basth Coffee Medan

User switches:

Basth Coffee
   ↓
currentStore changes
   ↓
UI reloads store data

Every query must be scoped to current store.

---

# 44. Store Context

Frontend concept:

useOrganization()

Returns:

- organization
- organizationRole
- members

useStore()

Returns:

- stores
- currentStore
- switchStore
- storeRole

Example:

const {
  currentStore,
  stores,
  switchStore
} = useStore();

---

# 45. RLS Security

RLS is mandatory.

Never rely only on:

store_id = currentStore.id

inside React Native.

A malicious client could modify the request.

PostgreSQL must verify membership.

Conceptually:

authenticated user
       |
       v
organization_members
       |
       v
store_members
       |
       v
store_id
       |
       v
ALLOW / DENY

---

# 46. Store-Level RLS

For:

- products
- categories
- inventory
- transactions
- transaction_items
- customers
- payments

RLS must verify that the authenticated user has access to the associated store.

---

# 47. Organization-Level RLS

For:

- organizations
- subscriptions
- subscription_items
- store_addons

RLS must verify organization membership.

Billing management should additionally require:

- owner
- admin
- billing role

---

# 48. Owner Permissions

Owner can:

- manage organization
- manage subscription
- purchase store slots
- create stores
- archive stores
- manage organization members
- manage billing
- view all stores
- view organization-wide reports

---

# 49. Admin Permissions

Admin can:

- manage stores
- manage products
- manage inventory
- manage staff
- view reports

Billing permissions can be separately controlled.

---

# 50. Manager Permissions

Manager can:

- manage products
- manage inventory
- view sales
- manage store staff
- view store reports

Manager cannot:

- change organization subscription
- access other organizations
- modify billing

---

# 51. Cashier Permissions

Cashier can:

- create sales
- view products
- view inventory where allowed
- manage assigned transactions
- process payments

Cashier cannot:

- manage billing
- create organizations
- create stores
- modify subscription
- manage organization users

---

# 52. Billing Architecture

The payment provider is external.

The architecture is:

DRIP POS
   |
   v
Billing Backend
   |
   v
Payment Provider
   |
   v
Webhook
   |
   v
DRIP Backend
   |
   v
Supabase PostgreSQL

The provider is responsible for:

- payment processing
- invoices
- recurring charges
- payment methods
- proration
- subscription renewal
- payment failures

The DRIP database stores synchronized billing state.

---

# 53. Webhooks

Required webhook events depend on the payment provider.

Conceptually:

subscription.created
subscription.updated
subscription.cancelled

invoice.created
invoice.paid
invoice.payment_failed

payment.succeeded
payment.failed

Every webhook must:

1. Verify signature.
2. Validate event.
3. Find organization/subscription.
4. Update database.
5. Be idempotent.
6. Record the event.

---

# 54. Billing Events

## billing_events

Fields:

- id
- provider
- provider_event_id
- event_type
- payload
- processed
- processed_at
- created_at

provider_event_id must be unique.

This prevents duplicate webhook processing.

---

# 55. Idempotency

If the same webhook arrives twice:

Event:

invoice.paid

First:

processed = true

Second:

ignore safely.

Never apply the same billing update twice.

---

# 56. Store Slot Billing Example

Plan:

PRO

$20/month

Included:

3 stores

Addon:

$5/month/store

Customer:

3 stores

Monthly:

$20

Customer adds Store #4 halfway through billing period.

System:

1. Check capacity.
2. Determine extra slot is required.
3. Increase extra_store quantity.
4. Payment provider calculates prorated charge.
5. Payment succeeds.
6. Webhook received.
7. Subscription item synchronized.
8. Store slot becomes available.
9. Store created.
10. Next renewal becomes:

$20 + $5 = $25/month.

---

# 57. Store Creation Transaction

Store creation should be atomic.

Conceptually:

BEGIN

Check organization

Check subscription

Calculate capacity

Count active stores

Verify capacity

Create store

Create owner store_membership

COMMIT

If any step fails:

ROLLBACK

This prevents race conditions.

---

# 58. Race Condition Protection

Example:

Owner has:

3 / 3 stores

Two requests arrive simultaneously:

Request A:
Create Store 4

Request B:
Create Store 5

Both must not bypass the limit.

The backend/database must perform capacity validation atomically.

Use database transactions/locking where necessary.

---

# 59. Organization Onboarding

Signup flow:

SIGN UP
   ↓
VERIFY EMAIL
   ↓
CREATE PROFILE
   ↓
CREATE ORGANIZATION
   ↓
ASSIGN OWNER ROLE
   ↓
CREATE FREE SUBSCRIPTION
   ↓
CREATE FIRST STORE
   ↓
ENTER POS

The first organization and first store can be created during onboarding.

---

# 60. Example Onboarding

User:

Achmed

Creates:

Organization:

Basth Coffee Group

Then:

Store:

Basth Coffee

Result:

User
 |
 +-- Organization
       |
       +-- Free Subscription
       |     |
       |     +-- 1 store
       |
       +-- Store
             |
             +-- Owner membership

---

# 61. Store Limit UI

Example:

Stores

3 / 3 used

[ + Add Store ]

When no capacity exists:

Add Store

Your plan includes 3 stores.

You currently use:

3 / 3

Additional store:

$5/month

[ Buy Store Slot ]

---

# 62. Billing UI

Subscription screen:

Current Plan
PRO

$20/month

Stores
4 / 5

Included:
3

Additional:
2

Current recurring total:
$30/month

Next billing date:
August 31

[ Manage Plan ]

[ Manage Store Slots ]

---

# 63. Upgrade UI

Example:

Current:

PRO
3 stores

Upgrade:

BUSINESS
10 stores

The app should show:

Current price
New price
Proration/credit
Next renewal price

The exact invoice amount must come from the billing provider.

---

# 64. Cancellation UI

When canceling:

Do NOT delete:

- organization
- stores
- products
- transactions
- customers
- images

Instead:

subscription.cancel_at_period_end = true

Show:

Your subscription will remain active until:

DATE

After that:

subscription = cancelled/suspended

Data remains preserved.

---

# 65. Data Retention

Billing failure or cancellation must not immediately destroy data.

Recommended lifecycle:

ACTIVE
  ↓
PAST_DUE
  ↓
GRACE_PERIOD
  ↓
SUSPENDED
  ↓
ARCHIVED

Data remains available according to the retention policy.

---

# 66. Archive

Store archive:

status = archived

Archived stores:

- cannot create sales
- cannot modify inventory
- cannot add staff
- remain readable to authorized users
- remain recoverable

---

# 67. Audit Logs

Create:

## audit_logs

Fields:

- id
- organization_id
- store_id
- user_id
- action
- entity_type
- entity_id
- metadata
- created_at

Examples:

store.created

product.created

product.updated

inventory.adjusted

transaction.refunded

staff.invited

subscription.changed

store.suspended

This is useful for debugging and business accountability.

---

# 68. Notifications

## notifications

Fields:

- id
- user_id
- organization_id
- type
- title
- message
- read_at
- created_at

Examples:

Low stock

Payment failed

Store suspended

Subscription renewed

New staff member

Store slot added

---

# 69. Reports

Reports should be organization-aware.

Store report:

Store A
   ↓
Sales
Profit
Inventory
Customers

Organization report:

Organization
   |
   +-- Store A
   +-- Store B
   +-- Store C
   |
   +-- Combined sales
   +-- Combined profit
   +-- Store comparison

Organization owners can see aggregate data across stores.

Store managers only see their store.

---

# 70. Organization Dashboard

Example:

DRIP POS

Basth Coffee Group

Stores:
3 / 5

Today's sales:
$1,248

Transactions:
87

Low stock:
12

Stores:

Basth Coffee
$542

Basth Coffee Medan
$431

Basth Coffee Binjai
$275

---

# 71. Database Relationship Diagram

auth.users
    |
    v
profiles
    |
    +-----------------------+
    |                       |
    v                       v
organizations        organization_members
    |
    +-----------------------------+
    |                             |
    v                             v
subscriptions                stores
    |                             |
    +-- plans                     +-- store_members
    |                             |
    +-- subscription_items        +-- categories
          |                       +-- products
          +-- extra_store         +-- inventory
                                  +-- inventory_movements
                                  +-- customers
                                  +-- transactions
                                  +-- payments

---

# 72. Required Core Tables

Minimum production schema:

1. profiles
2. organizations
3. organization_members
4. plans
5. subscriptions
6. subscription_items
7. stores
8. store_members
9. categories
10. products
11. inventory
12. inventory_movements
13. customers
14. transactions
15. transaction_items
16. payments
17. billing_events
18. audit_logs
19. notifications

---

# 73. Optional Future Tables

Can be added later:

- suppliers
- purchase_orders
- purchase_items
- stock_transfers
- employee_shifts
- attendance
- discounts
- coupons
- loyalty_points
- tax_rules
- receipts
- register_sessions
- cash_movements
- expenses
- expenses_categories
- table_orders
- kitchen_orders
- reservations

Do not build all of these initially.

---

# 74. Recommended Implementation Phases

## Phase 1: Foundation

Build:

- Supabase
- PostgreSQL
- Auth
- profiles
- organizations
- organization_members

Goal:

User can register and create an organization.

---

## Phase 2: Stores

Build:

- stores
- store_members
- store switching
- store creation
- store limits

Goal:

One organization can own multiple stores.

---

## Phase 3: POS

Build:

- categories
- products
- inventory
- customers
- transactions
- payments

Goal:

Basic POS works per store.

---

## Phase 4: RLS

Implement:

- organization RLS
- store RLS
- member RLS
- role-based access

Goal:

Users cannot access unauthorized tenant data.

---

## Phase 5: Offline

Build:

- SQLite
- local store cache
- transaction queue
- synchronization
- retry system

Goal:

POS works without internet.

---

## Phase 6: Realtime

Build:

- inventory realtime
- transaction realtime
- notifications

Goal:

Multiple devices see updates.

---

## Phase 7: Billing

Build:

- plans
- subscriptions
- subscription_items
- billing_events
- provider integration
- webhooks

Goal:

Recurring SaaS billing works.

---

## Phase 8: Dynamic Store Slots

Build:

- extra_store addon
- quantity updates
- mid-cycle purchase
- prorated billing
- store capacity calculation

Goal:

Customer can dynamically add stores.

---

## Phase 9: Subscription Lifecycle

Implement:

- trial
- active
- past_due
- grace period
- suspended
- cancellation
- downgrade
- upgrade
- reactivation

Goal:

Complete SaaS lifecycle.

---

## Phase 10: Admin

Build:

- admin dashboard
- organizations
- users
- stores
- subscriptions
- billing events
- audit logs
- support tools

Goal:

You can operate DRIP POS as a SaaS business.

---

# 75. Final Architecture

                         DRIP POS
                            |
              +-------------+-------------+
              |                           |
          MOBILE APP                 ADMIN PANEL
              |                           |
              +-------------+-------------+
                            |
                            v
                       SUPABASE
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
     Auth              PostgreSQL          Storage
                            |
                            v
                     MULTI-TENANT CORE
                            |
                         USER
                            |
                         ORG
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
        SUBSCRIPTION     MEMBERS       STORES
              |                         |
        +-----+-----+            +------+------+
        |           |            |             |
       PLAN       ADDONS       MEMBERS       DATA
                    |                         |
                    |                  +------+------+
                    |                  |      |      |
                    v                  v      v      v
              STORE SLOTS          POS   INVENTORY SALES
                    |
                    v
              STORE CAPACITY

Billing:

Organization
    |
    v
Subscription
    |
    +-- Base Plan
    |
    +-- Extra Store Quantity
              |
              v
       Payment Provider
              |
              v
          Webhooks
              |
              v
          PostgreSQL

Offline:

POS
 |
 +-- SQLite
 |
 +-- Sync Queue
 |
 +-- Supabase
 |
 +-- Realtime

Security:

User
 |
 v
Organization Membership
 |
 v
Store Membership
 |
 v
RLS
 |
 v
Tenant Data

---

# 76. Golden Rules

RULE 1:

User != Organization

RULE 2:

Organization != Store

RULE 3:

Subscription belongs to Organization.

RULE 4:

Store capacity belongs to Subscription.

RULE 5:

Additional stores are recurring addons.

RULE 6:

One subscription can contain multiple subscription items.

RULE 7:

Never create one subscription per store.

RULE 8:

Mid-cycle store additions use subscription quantity changes and provider-side proration.

RULE 9:

Payment provider webhooks are authoritative.

RULE 10:

Never trust the mobile app for authorization or billing state.

RULE 11:

Every store-owned record contains store_id.

RULE 12:

RLS is mandatory.

RULE 13:

Payment failure must not delete business data.

RULE 14:

Store suspension must preserve data.

RULE 15:

Offline POS must use local SQLite and a sync queue.

RULE 16:

Use client-generated UUIDs for offline records.

RULE 17:

Billing webhook processing must be idempotent.

RULE 18:

Store creation must be atomic.

RULE 19:

Do not automatically cancel paid store addons just because a physical store was deleted.

RULE 20:

Do not build billing logic directly into React Native.

---

# 77. Final Target

The final DRIP POS system should behave like this:

User signs up
    ↓
Creates Organization
    ↓
Receives Free Plan
    ↓
Creates Store #1
    ↓
Uses POS
    ↓
Adds employees
    ↓
Adds products
    ↓
Makes sales
    ↓
Organization grows
    ↓
Needs Store #2
    ↓
Creates Store #2
    ↓
Needs Store #3
    ↓
Creates Store #3
    ↓
Needs Store #4
    ↓
Buys Extra Store Slot
    ↓
Subscription item quantity increases
    ↓
Payment provider calculates proration
    ↓
Webhook confirms payment
    ↓
Store #4 becomes available
    ↓
Store #4 created
    ↓
Next renewal includes extra store fee
    ↓
Organization can continue growing

This architecture allows DRIP POS to evolve from:

Single-store POS

into:

Multi-store POS

into:

Multi-tenant SaaS

without rebuilding the fundamental database or billing architecture.


One important implementation decision

For the actual payment provider, don't hard-code the architecture around a specific provider yet. The database above deliberately uses:

provider
provider_customer_id
provider_subscription_id
provider_item_id

# DRIP POS
# Complete Data Management & Inventory Architecture

Version: 1.0
Status: Architecture Specification
Platform: Mobile POS + Backend
Architecture: Multi-Tenant / Multi-Organization / Multi-Store
Inventory: FIFO + FEFO
Database: PostgreSQL / Supabase Self-Hosted
Storage: Object Storage
Realtime: PostgreSQL Realtime
Authentication: Supabase Auth

---

# 1. SYSTEM OVERVIEW

DRIP POS is designed as a large-scale POS platform where:

- One user can own multiple organizations.
- One organization can contain multiple stores.
- One store can contain multiple warehouses.
- Products can be shared across stores.
- Inventory is isolated per store/warehouse.
- Stock is tracked by batch.
- FIFO and FEFO are supported.
- Ingredients can be consumed through recipes.
- HPP is calculated from actual inventory cost.
- Purchasing creates inventory batches.
- Sales consume inventory automatically.
- Transfers move stock between stores.
- Every stock change creates an immutable movement record.

High-level architecture:

User
│
├── Organization A
│   │
│   ├── Store 1
│   │   ├── Warehouse
│   │   ├── Products
│   │   ├── Stock
│   │   └── Sales
│   │
│   ├── Store 2
│   │   ├── Warehouse
│   │   ├── Products
│   │   ├── Stock
│   │   └── Sales
│   │
│   └── Organization Settings
│
└── Organization B
    │
    └── Store 1


---

# 2. CORE PRINCIPLES

The system must follow these rules.

## 2.1 Organization isolation

Every business belongs to an organization.

Every organization-owned record must contain:

organization_id

Never rely only on user_id.

---

## 2.2 Store isolation

Store-specific inventory must contain:

store_id

Example:

Product:

Coffee Beans

Organization:

DRIP Coffee Group

Store:

DRIP Medan

Inventory:

500 kg

Another store:

DRIP Binjai

Inventory:

120 kg

These must remain separate.

---

## 2.3 Inventory is ledger-based

Never modify inventory only using:

stock = stock - quantity

Every inventory change must generate:

stock_movement

Current stock is derived from inventory state plus movement history.

---

## 2.4 Batch-based inventory

Purchases create batches.

Example:

Batch A:

100 kg
Rp100,000/kg

Batch B:

100 kg
Rp120,000/kg

These must remain separate.

---

## 2.5 FIFO / FEFO

The inventory engine supports:

FIFO
FEFO
SPECIFIC_BATCH

FIFO:

First In First Out

FEFO:

First Expired First Out

Specific Batch:

Authorized user manually chooses batch.

---

# 3. TENANCY ARCHITECTURE

## 3.1 User

Represents authentication identity.

Fields:

id
email
phone
name
avatar_url
created_at
updated_at

Authentication is handled by Supabase Auth.

---

# 4. ORGANIZATION

An organization represents the business owner/company.

Example:

DRIP Coffee Group

Fields:

id
owner_user_id
name
slug
logo_url
currency
timezone
country
default_inventory_method
status
created_at
updated_at

Example:

default_inventory_method:

FIFO

Possible values:

FIFO
FEFO

---

# 5. ORGANIZATION MEMBERS

Users can belong to organizations.

Table:

organization_members

Fields:

id
organization_id
user_id
role
status
joined_at
created_at

Roles:

OWNER
ADMIN
MANAGER
CASHIER
INVENTORY
PURCHASING
ACCOUNTANT
STAFF

Permissions must be separated from roles where possible.

---

# 6. ORGANIZATION ROLES

Example permission groups:

OWNER

Full access.

ADMIN

Almost full operational access.

MANAGER

Store management.

CASHIER

POS and sales.

INVENTORY

Stock management.

PURCHASING

Suppliers and purchase orders.

ACCOUNTANT

Financial and HPP reporting.

STAFF

Limited operational access.

---

# 7. STORE

A store represents a physical business location.

Fields:

id
organization_id
name
code
address
phone
timezone
currency
status
created_at
updated_at

Example:

Store:

DRIP POS Medan

Code:

MDN01

---

# 8. STORE MEMBERS

Users can have different access per store.

Table:

store_members

Fields:

id
store_id
user_id
role
created_at

Example:

User A:

Organization role:

MANAGER

Store access:

Medan
Binjai

But not:

Jakarta

---

# 9. WAREHOUSE

Each store can have one or multiple warehouses.

Fields:

id
organization_id
store_id
name
code
type
status
created_at
updated_at

Types:

MAIN
BACKROOM
COLD_STORAGE
PRODUCTION
DISPLAY

Example:

Store:

DRIP Medan

Warehouses:

MAIN
COLD STORAGE

---

# 10. PRODUCT MASTER

Products represent sellable or stock-managed items.

Fields:

id
organization_id
sku
barcode
name
description
brand
product_type
base_unit_id
category_id
group_id
track_stock
track_batch
track_expiry
inventory_method
hpp_enabled
selling_price
min_stock
max_stock
status
image_url
created_at
updated_at

Product types:

PRODUCT
SERVICE
COMBO
RECIPE_PRODUCT
INGREDIENT

---

# 11. PRODUCT GROUP

Groups provide high-level organization.

Example:

Food
Beverage
Merchandise

Table:

product_groups

Fields:

id
organization_id
name
description
sort_order
status
created_at
updated_at

---

# 12. CATEGORY

Categories belong to product groups.

Example:

Group:

Beverage

Categories:

Coffee
Tea
Milk
Juice

Fields:

id
organization_id
group_id
name
description
sort_order
status
created_at
updated_at

Hierarchy:

Group
│
├── Category
│   ├── Product
│   └── Product
│
└── Category

---

# 13. PRODUCT IMAGES

Products may have multiple images.

Fields:

id
organization_id
product_id
storage_path
url
sort_order
is_primary
created_at

Images should be stored in object storage.

Do not store binary image data directly inside PostgreSQL.

---

# 14. PRODUCT VARIANTS

A product can have variants.

Example:

Coffee

Small
Medium
Large

Fields:

id
product_id
sku
barcode
name
selling_price
cost_override
unit_id
status

Example:

Latte Small
Latte Medium
Latte Large

Each variant may have a different recipe.

---

# 15. PRODUCT UNITS

Every inventory quantity must use a standardized unit.

Unit types:

WEIGHT
VOLUME
QUANTITY
LENGTH
AREA
TIME

Examples:

Weight:

mg
g
kg

Volume:

ml
L

Quantity:

pcs
box
pack
bottle
carton

---

# 16. UNIT TABLE

Fields:

id
organization_id
name
symbol
unit_type
is_base
created_at

Example:

Gram:

name = Gram
symbol = g
unit_type = WEIGHT
is_base = true

---

# 17. UNIT CONVERSION

Conversions are required for purchasing and recipes.

Fields:

id
organization_id
from_unit_id
to_unit_id
conversion_factor
created_at

Examples:

1 kg = 1000 g

1 L = 1000 ml

1 box = 12 pcs

---

# 18. INGREDIENT

Ingredients are inventory items used in recipes.

Fields:

id
organization_id
name
sku
barcode
category_id
base_unit_id
track_batch
track_expiry
inventory_method
hpp_enabled
status
created_at
updated_at

Example:

Coffee Beans
Milk
Sugar
Chocolate Syrup

---

# 19. INGREDIENT VS PRODUCT

A product is usually sold.

An ingredient is usually consumed.

Example:

Product:

Cappuccino

Ingredients:

Coffee Beans
Milk
Sugar

However, the system may allow the same inventory item to be both.

Therefore use:

inventory_item_type

PRODUCT
INGREDIENT
BOTH

---

# 20. RECIPE

A recipe defines what inventory is consumed when a product is sold.

Fields:

id
organization_id
product_id
variant_id
name
version
yield_quantity
yield_unit_id
status
created_at
updated_at

Example:

Cappuccino Recipe v1

---

# 21. RECIPE ITEMS

Fields:

id
recipe_id
ingredient_id
quantity
unit_id
wastage_percent
created_at

Example:

Cappuccino:

Coffee Beans
18 g

Milk
180 ml

Sugar
8 g

---

# 22. RECIPE VERSIONING

Never overwrite historical recipes.

Example:

Recipe v1:

18g coffee
180ml milk

Recipe v2:

20g coffee
180ml milk

Existing sales must continue referencing v1.

New sales use v2.

---

# 23. INVENTORY ITEM

Inventory is separate from product definition.

A product can exist globally without having stock.

Table:

inventory_items

Fields:

id
organization_id
store_id
warehouse_id
product_id
quantity
reserved_quantity
available_quantity
base_unit_id
created_at
updated_at

Formula:

available_quantity =
quantity - reserved_quantity

---

# 24. STOCK BATCH

Every batch is independently tracked.

Fields:

id
organization_id
store_id
warehouse_id
product_id

batch_number

quantity_received
quantity_remaining
quantity_reserved

unit_cost
total_cost

manufactured_at
received_at
expires_at

supplier_id
purchase_order_id
purchase_order_item_id

status

created_at
updated_at

---

# 25. BATCH STATUS

Possible values:

AVAILABLE
RESERVED
DEPLETED
EXPIRED
BLOCKED
DAMAGED

---

# 26. FIFO

FIFO means:

First In First Out.

Sorting priority:

received_at ASC

Example:

Batch A:

received Jan 1

Batch B:

received Feb 1

Consumption:

Batch A first.

---

# 27. FEFO

FEFO means:

First Expired First Out.

Sorting priority:

expires_at ASC

Example:

Batch A:

expires Dec 1

Batch B:

expires Oct 1

Batch B is consumed first.

---

# 28. FIFO / FEFO DECISION

Inventory engine:

if method == FIFO:

ORDER BY received_at ASC

if method == FEFO:

ORDER BY expires_at ASC

If expiration is null:

place non-expiring inventory after expiring inventory when using FEFO.

---

# 29. INVENTORY METHOD

Inventory method can exist at three levels.

Organization:

default method

Store:

store override

Product:

product override

Priority:

Product
↓
Store
↓
Organization

---

# 30. STOCK MOVEMENT

Every inventory change creates a movement.

Fields:

id
organization_id
store_id
warehouse_id
product_id
batch_id

movement_type

quantity
unit_cost
total_cost

reference_type
reference_id

reason

created_by
created_at

---

# 31. MOVEMENT TYPES

PURCHASE_RECEIVE

SALE

SALE_RETURN

PURCHASE_RETURN

TRANSFER_OUT

TRANSFER_IN

ADJUSTMENT_IN

ADJUSTMENT_OUT

WASTE

EXPIRED

DAMAGE

PRODUCTION_IN

PRODUCTION_OUT

OPENING_BALANCE

---

# 32. PURCHASE ORDER

Purchase order represents an order sent to a supplier.

Fields:

id
organization_id
store_id
supplier_id
po_number
status
order_date
expected_date
subtotal
discount
tax
shipping
grand_total
notes
created_by
created_at
updated_at

---

# 33. PURCHASE ORDER STATUS

DRAFT
PENDING
APPROVED
PARTIALLY_RECEIVED
RECEIVED
CANCELLED
CLOSED

---

# 34. PURCHASE ORDER ITEMS

Fields:

id
purchase_order_id
product_id
quantity
unit_id
unit_cost
discount
tax
total
received_quantity
created_at

---

# 35. SUPPLIER

Fields:

id
organization_id
name
code
phone
email
address
tax_number
payment_terms
status
created_at
updated_at

---

# 36. GOODS RECEIVING

When goods arrive:

PO

↓

Goods Receiving

↓

Batch Creation

↓

Inventory Increase

---

# 37. GOODS RECEIVING TABLE

Fields:

id
organization_id
store_id
warehouse_id
supplier_id
purchase_order_id
receiving_number
received_at
received_by
notes
status

---

# 38. GOODS RECEIVING ITEMS

Fields:

id
receiving_id
purchase_order_item_id
product_id
batch_number
quantity
unit_id
unit_cost
manufactured_at
expires_at

Each receiving item may generate a batch.

---

# 39. PURCHASE FLOW

Complete flow:

Supplier
↓
Purchase Order
↓
Approval
↓
Supplier Delivery
↓
Goods Receiving
↓
Batch Identification
↓
Expiry Date
↓
Unit Conversion
↓
Stock Batch
↓
Stock Movement
↓
Inventory Updated

---

# 40. EXAMPLE PURCHASE

PO:

100 kg Coffee Beans

Cost:

Rp100,000/kg

Receive:

100 kg

Batch:

CB-2026-001

Expiry:

2027-01-01

System creates:

Stock Batch:

CB-2026-001

Quantity:

100 kg

Unit Cost:

Rp100,000

---

# 41. STOCK TRANSFER

Transfers move stock between warehouses/stores.

Flow:

Transfer Request
↓
Approval
↓
Reserve Stock
↓
Transfer Out
↓
Transit
↓
Transfer In
↓
Destination Stock

---

# 42. STOCK TRANSFER TABLE

Fields:

id
organization_id
from_store_id
from_warehouse_id
to_store_id
to_warehouse_id
transfer_number
status
requested_by
approved_by
created_at
completed_at

---

# 43. STOCK TRANSFER ITEMS

Fields:

id
transfer_id
product_id
batch_id
quantity
unit_id
unit_cost

Batch identity must be preserved.

---

# 44. STOCK ADJUSTMENT

Used for:

Wrong stock count
Damage
Loss
Opening balance
Correction
Manual inventory count

Fields:

id
organization_id
store_id
warehouse_id
adjustment_number
reason
status
created_by
approved_by
created_at

---

# 45. STOCK COUNT

Physical stock counting.

Flow:

Create Count
↓
Freeze/Record System Quantity
↓
Count Physical Stock
↓
Compare
↓
Difference
↓
Approval
↓
Adjustment Movement

Example:

System:

100 pcs

Physical:

97 pcs

Difference:

-3 pcs

Create:

ADJUSTMENT_OUT

---

# 46. STOCK RESERVATION

Stock can be reserved before consumption.

Fields:

id
organization_id
store_id
warehouse_id
product_id
batch_id
quantity
reference_type
reference_id
status
created_at

---

# 47. SALE

Sale belongs to a store.

Fields:

id
organization_id
store_id
cashier_id
receipt_number
customer_id
subtotal
discount
tax
grand_total
payment_status
status
created_at

---

# 48. SALE ITEMS

Fields:

id
sale_id
product_id
variant_id
quantity
unit_price
discount
total
recipe_id
created_at

---

# 49. SALE INVENTORY CONSUMPTION

When sale is completed:

Sale
↓
Sale Items
↓
Recipe
↓
Ingredients
↓
Required Quantity
↓
Unit Conversion
↓
FIFO/FEFO Engine
↓
Batch Allocation
↓
Stock Movement
↓
HPP Calculation

---

# 50. EXAMPLE SALE

Customer buys:

2 Cappuccino

Recipe:

Coffee Beans = 18g
Milk = 180ml
Sugar = 8g

Required:

Coffee:

36g

Milk:

360ml

Sugar:

16g

Inventory engine allocates batches.

---

# 51. BATCH ALLOCATION

Suppose:

Batch A:

20g remaining

Batch B:

100g remaining

Required:

36g

FIFO:

Batch A:

20g

Batch B:

16g

Result:

Batch A:

0g

Batch B:

84g

Two stock movements are created.

---

# 52. HPP CALCULATION

For the above example:

Batch A:

20g × Rp100/g

Batch B:

16g × Rp120/g

HPP:

Rp2,000
+
Rp1,920

Total:

Rp3,920

The sale's actual COGS:

Rp3,920

---

# 53. HPP SNAPSHOT

Historical sales must never change when product cost changes.

Therefore sale items should store:

hpp
cogs
recipe_version_id

Example:

Sale:

Rp25,000

HPP:

Rp3,920

Gross Profit:

Rp21,080

If future ingredient prices increase, old sales remain unchanged.

---

# 54. PRODUCT HPP

Product HPP may be calculated from:

Recipe

or

Batch cost

or

Manual cost

Configuration:

hpp_method

Possible values:

ACTUAL_BATCH
RECIPE
MANUAL

For recipe-based products:

HPP =
sum(ingredient consumed quantity × batch unit cost)

---

# 55. WASTAGE

Recipe items may define wastage.

Example:

Milk:

180ml

Wastage:

5%

Effective consumption:

189ml

Formula:

effective_quantity =
recipe_quantity × (1 + wastage_percent)

---

# 56. EXPIRATION

Products may have:

track_expiry = true

When receiving:

expires_at

must be recorded.

Expired batches should not be available for normal sales.

---

# 57. EXPIRATION STATES

ACTIVE

EXPIRING_SOON

EXPIRED

BLOCKED

---

# 58. EXPIRATION CONFIGURATION

Organization can define:

expiry_warning_days

Example:

7 days

A batch expiring within 7 days appears as:

EXPIRING_SOON

---

# 59. AUTOMATIC EXPIRED STOCK

Scheduled worker:

Find:

expires_at < current_time

and:

quantity_remaining > 0

Then mark:

EXPIRED

Optionally generate:

EXPIRED

stock movement.

---

# 60. RETURN FROM CUSTOMER

Customer return flow:

Sale
↓
Return Request
↓
Approval
↓
Determine Condition
↓
Stock Return OR Damaged
↓
Movement

If reusable:

SALE_RETURN

If damaged:

DAMAGE

---

# 61. PURCHASE RETURN

Purchase return:

Stock
↓
Select Batch
↓
Remove Quantity
↓
PURCHASE_RETURN
↓
Supplier Credit / Refund

Batch remains traceable.

---

# 62. COSTING

Every stock movement that changes inventory value should record:

quantity
unit_cost
total_cost

Formula:

total_cost =
quantity × unit_cost

---

# 63. INVENTORY VALUE

Inventory value:

sum(
batch.quantity_remaining
×
batch.unit_cost
)

Example:

Batch A:

50kg × Rp100,000

Batch B:

100kg × Rp120,000

Inventory value:

Rp5,000,000
+
Rp12,000,000

=

Rp17,000,000

---

# 64. PRODUCT STOCK DASHBOARD

Display:

Current Stock
Available Stock
Reserved Stock
Incoming Stock
Minimum Stock
Maximum Stock

Example:

Coffee Beans

Current:

120kg

Reserved:

20kg

Available:

100kg

Incoming:

200kg

---

# 65. LOW STOCK

If:

available_quantity <= min_stock

create:

LOW_STOCK

notification.

---

# 66. REORDER POINT

Future system can support:

reorder_point

Example:

Coffee Beans

Minimum:

20kg

Reorder:

30kg

Maximum:

100kg

When stock reaches 30kg:

suggest purchase.

---

# 67. INVENTORY FORECASTING

Future feature:

average_daily_usage

estimated_days_remaining

Suggested purchase quantity.

Formula:

days_remaining =
available_stock / average_daily_usage

---

# 68. MULTI-STORE PRODUCT MODEL

Products should normally belong to the organization, not directly to one store.

Example:

Organization:

DRIP Coffee Group

Product:

Cappuccino

Stores:

Medan
Binjai
Jakarta

Each store can have:

selling price
availability
stock
warehouse
recipe override

---

# 69. STORE PRODUCT SETTINGS

Table:

store_products

Fields:

id
store_id
product_id
selling_price
min_stock
max_stock
is_available
inventory_method
created_at
updated_at

This allows:

Medan:

Rp25,000

Binjai:

Rp27,000

Jakarta:

Rp30,000

Same product.

---

# 70. STORE-SPECIFIC RECIPES

Default recipe:

Organization recipe

Optional:

Store recipe override

Example:

Medan:

18g coffee

Jakarta:

20g coffee

Priority:

Store Recipe
↓
Organization Recipe

---

# 71. DATA RELATIONSHIP

Organization
│
├── Members
│
├── Stores
│   │
│   ├── Store Members
│   │
│   ├── Warehouses
│   │
│   ├── Store Products
│   │
│   ├── Inventory
│   │   ├── Batches
│   │   ├── Movements
│   │   └── Reservations
│   │
│   ├── Sales
│   │
│   ├── Purchase Orders
│   │
│   └── Transfers
│
├── Product Groups
│
├── Categories
│
├── Products
│
├── Variants
│
├── Ingredients
│
├── Recipes
│
├── Units
│
├── Suppliers
│
└── Customers

---

# 72. COMPLETE PRODUCT FLOW

Create Group

↓

Create Category

↓

Create Product

↓

Assign Unit

↓

Assign SKU / Barcode

↓

Add Images

↓

Configure Stock

↓

Configure HPP

↓

Configure Recipe

↓

Assign Store

↓

Set Store Price

↓

Enable POS

↓

Product becomes sellable.

---

# 73. COMPLETE INGREDIENT FLOW

Create Ingredient

↓

Select Base Unit

↓

Configure Batch Tracking

↓

Configure Expiry

↓

Configure FIFO/FEFO

↓

Add Supplier

↓

Purchase Ingredient

↓

Receive Ingredient

↓

Create Batch

↓

Inventory

↓

Recipe

↓

Sale Consumption

↓

HPP

---

# 74. COMPLETE PURCHASE FLOW

Supplier

↓

Purchase Order

↓

Approval

↓

Delivery

↓

Goods Receiving

↓

Batch Creation

↓

Stock Increase

↓

Inventory Movement

↓

HPP Updated

---

# 75. COMPLETE SALES FLOW

Cashier selects product

↓

Product validated

↓

Price calculated

↓

Cart created

↓

Payment

↓

Sale completed

↓

Recipe loaded

↓

Inventory requirements calculated

↓

FIFO/FEFO selects batches

↓

Inventory deducted

↓

Stock movements created

↓

HPP calculated

↓

COGS recorded

↓

Profit calculated

↓

Receipt generated

---

# 76. COMPLETE FEFO FLOW

Sale requires:

50 units

Available:

Batch A
20 units
Expiry: Dec 10

Batch B
50 units
Expiry: Nov 10

Batch C
100 units
Expiry: Jan 10

FEFO sorts:

Batch B
Batch A
Batch C

Consumption:

Batch B:

50 units

Result:

Batch B = 0

Batch A = 20

Batch C = 100

---

# 77. COMPLETE FIFO FLOW

Sale requires:

50 units

Available:

Batch A
20 units
Received Jan 1

Batch B
50 units
Received Feb 1

Batch C
100 units
Received Mar 1

FIFO:

Batch A:

20

Batch B:

30

Result:

Batch A = 0

Batch B = 20

Batch C = 100

---

# 78. SPECIFIC BATCH FLOW

Authorized user selects:

Batch B

System verifies:

available_quantity >= requested_quantity

Then consumes selected batch.

This should require permission:

inventory.batch.override

---

# 79. NEGATIVE STOCK

Default:

NEGATIVE STOCK DISABLED

If stock is insufficient:

POS should reject transaction.

Optional organization setting:

allow_negative_stock

If enabled:

permission required.

Negative stock should never silently happen.

---

# 80. OFFLINE POS

Because DRIP POS should be offline-first:

Sales can be temporarily stored locally.

Local flow:

Local SQLite
↓
Pending Sale
↓
Sync Queue
↓
Server
↓
Transaction Validation
↓
Inventory Allocation
↓
Server Confirmation

Important:

Inventory allocation must be authoritative on the server.

---

# 81. OFFLINE CONFLICT

If two devices sell the last item:

Device A:

1 item

Device B:

1 item

Server must prevent:

stock = -1

Use transactional database operations.

---

# 82. DATABASE TRANSACTIONS

Critical operations must use database transactions.

Examples:

Complete Sale:

BEGIN

Create Sale

Create Sale Items

Allocate Batch

Create Stock Movements

Update Inventory

Record COGS

COMMIT

If any step fails:

ROLLBACK

---

# 83. IDEMPOTENCY

Every offline transaction should have:

client_transaction_id

Example:

client_transaction_id:

device123-sale-000982

If sync happens twice:

server recognizes existing transaction.

Do not create duplicate sales.

---

# 84. AUDIT LOG

Important operations must be logged.

Fields:

id
organization_id
store_id
user_id
action
entity_type
entity_id
old_data
new_data
created_at

Examples:

PRODUCT_CREATED

PRODUCT_UPDATED

PRICE_CHANGED

PO_APPROVED

STOCK_ADJUSTED

SALE_VOIDED

BATCH_BLOCKED

---

# 85. SECURITY

All organization data must be protected using PostgreSQL Row Level Security.

Users can only access organizations where:

organization_members.user_id = auth.uid()

Store access must also be checked.

Inventory access:

organization_id

AND

store_id belongs to user's permitted stores.

---

# 86. RLS MODEL

Conceptually:

User
↓
Organization Membership
↓
Organization
↓
Store Membership
↓
Store
↓
Inventory

Never trust:

store_id

sent from the client.

The server must verify ownership/access.

---

# 87. STORAGE

Object storage should contain:

Product images
Category images
Organization logo
Store logo
Receipt assets
User avatars
Supplier documents

Database stores:

storage_path

not binary files.

---

# 88. REALTIME

Realtime events can be used for:

Stock updates
New sales
Order status
Purchase receiving
Transfer status
Low stock alerts
Cashier activity

Example:

Device A sells:

Coffee Beans

Device B inventory screen receives:

stock updated

---

# 89. NOTIFICATIONS

Possible notifications:

LOW_STOCK

EXPIRING_SOON

EXPIRED

PURCHASE_RECEIVED

TRANSFER_RECEIVED

TRANSFER_REJECTED

PO_APPROVED

SALE_VOIDED

---

# 90. REPORTING

Inventory reports:

Stock Summary
Stock Card
Stock Movement
Batch Report
Expiry Report
Low Stock
Inventory Valuation
Stock Adjustment
Stock Transfer
Purchase Report
Supplier Report

---

# 91. HPP REPORTING

Reports:

Product HPP
Ingredient HPP
Recipe HPP
Actual COGS
Estimated HPP
Gross Profit
Profit Margin

---

# 92. PRODUCT PROFIT

Formula:

Gross Profit =
Sales Revenue - COGS

Margin:

Gross Profit / Sales Revenue × 100

---

# 93. STOCK CARD

Example:

Coffee Beans

Date | Movement | Batch | In | Out | Balance | Cost

Jan 1
Purchase
A
100kg
0
100kg
Rp100k

Jan 5
Sale
A
0
20kg
80kg
Rp100k

Feb 1
Purchase
B
100kg
0
180kg
Rp120k

---

# 94. INVENTORY VALUATION

For FIFO/FEFO:

valuation is based on remaining batch costs.

Example:

Batch A:

20kg × Rp100k

Batch B:

100kg × Rp120k

Total inventory value:

Rp14,000,000

---

# 95. IMPORTANT: FIFO/FEFO AND HPP

FIFO/FEFO determines:

Which batch is physically consumed.

The selected batch determines:

Actual unit cost.

Actual unit cost determines:

COGS/HPP.

Therefore:

FIFO/FEFO
↓
Batch selection
↓
Batch cost
↓
COGS
↓
Profit

---

# 96. DATA IMMUTABILITY

Historical transactions should not be deleted.

Never delete:

Sales
Stock movements
Purchase receiving
Completed transfers
COGS records

Use:

VOID
CANCELLED
REVERSED

instead.

---

# 97. SALE VOID

If a sale is voided:

Do not delete the sale.

Create reversal movements.

Example:

Original:

SALE
-10 pcs

Void:

SALE_REVERSAL
+10 pcs

The audit trail remains complete.

---

# 98. INVENTORY CORRECTION

Never directly edit:

batch.quantity_remaining

Instead:

Create adjustment movement.

This maintains the audit trail.

---

# 99. MASTER DATA VS TRANSACTION DATA

MASTER DATA:

Organization
Store
Warehouse
Product
Category
Group
Ingredient
Recipe
Unit
Supplier
Customer

TRANSACTION DATA:

Sale
Purchase Order
Receiving
Transfer
Stock Movement
Adjustment
Return
Payment

Master data can be edited.

Transaction data should be immutable after completion.

---

# 100. DATABASE DESIGN SUMMARY

Core tables:

users

organizations

organization_members

stores

store_members

warehouses

product_groups

categories

products

product_variants

product_images

store_products

ingredients

recipes

recipe_items

recipe_versions

units

unit_conversions

suppliers

purchase_orders

purchase_order_items

goods_receivings

goods_receiving_items

inventory_items

stock_batches

stock_movements

stock_reservations

stock_transfers

stock_transfer_items

stock_adjustments

stock_adjustment_items

sales

sale_items

sale_payments

sale_inventory_consumptions

inventory_counts

inventory_count_items

customers

audit_logs

notifications

---

# 101. SALE INVENTORY CONSUMPTION TABLE

This table is extremely important.

Fields:

id
sale_id
sale_item_id
product_id
ingredient_id
batch_id

quantity
unit_id

unit_cost
total_cost

recipe_id
recipe_version_id

created_at

This creates the exact historical relationship:

Sale
→ Product
→ Recipe
→ Ingredient
→ Batch
→ Cost

---

# 102. WHY THIS TABLE MATTERS

If an accountant asks:

"Why was this Cappuccino's HPP Rp4,250?"

System can answer:

Sale #001293

Cappuccino

Coffee Beans:

18g
Batch CB-002
Rp2,100

Milk:

180ml
Batch ML-004
Rp1,800

Sugar:

8g
Batch SG-003
Rp350

Total:

Rp4,250

This is the level of traceability expected from a serious POS.

---

# 103. DATA FLOW MASTER DIAGRAM

                         ORGANIZATION
                              │
             ┌────────────────┼────────────────┐
             │                │                │
          STORES           PRODUCTS         SUPPLIERS
             │                │                │
        WAREHOUSES       CATEGORIES          PO
             │                │                │
         INVENTORY        INGREDIENTS      RECEIVING
             │                │                │
          BATCHES         RECIPES           BATCH
             │                │                │
             └───────────────┼────────────────┘
                             │
                        FIFO / FEFO
                             │
                            SALE
                             │
                     INVENTORY CONSUMPTION
                             │
                       STOCK MOVEMENT
                             │
                            HPP
                             │
                           COGS
                             │
                          PROFIT

---

# 104. RECOMMENDED IMPLEMENTATION ORDER

Do NOT build everything simultaneously.

Phase 1:

Organizations
Stores
Users
Roles
RLS

Phase 2:

Units
Categories
Groups
Products
Ingredients

Phase 3:

Recipes
Recipe versions
Product variants

Phase 4:

Suppliers
Purchase Orders
Goods Receiving

Phase 5:

Inventory
Batches
Stock Movements

Phase 6:

FIFO / FEFO Engine

Phase 7:

Sales
Recipe Consumption
COGS
HPP

Phase 8:

Transfers

Phase 9:

Stock Counts
Adjustments
Returns

Phase 10:

Realtime
Notifications
Reports

Phase 11:

Offline Sync

Phase 12:

Advanced Analytics

---

# 105. CRITICAL ENGINE ORDER

The most important backend engine should be:

Inventory Engine

It handles:

receiveStock()
consumeStock()
reserveStock()
releaseStock()
transferStock()
adjustStock()
returnStock()
allocateBatch()
calculateHPP()

Example:

allocateBatch(
    productId,
    warehouseId,
    quantity,
    inventoryMethod
)

returns:

[
    {
        batch_id,
        quantity,
        unit_cost
    }
]

---

# 106. INVENTORY ENGINE RULE

The client must never decide:

"Use Batch A."

The client requests:

"I need 50 units."

Server decides:

"Batch A: 20"
"Batch B: 30"

according to:

FIFO / FEFO

This prevents manipulation and race conditions.

---

# 107. FINAL ARCHITECTURE

DRIP POS should ultimately be:

AUTH
│
├── USER
│
└── ORGANIZATION
    │
    ├── MEMBERS
    │
    ├── STORES
    │   │
    │   ├── MEMBERS
    │   ├── WAREHOUSES
    │   ├── STORE PRODUCTS
    │   ├── INVENTORY
    │   │   ├── BATCHES
    │   │   ├── RESERVATIONS
    │   │   └── MOVEMENTS
    │   │
    │   ├── SALES
    │   ├── PURCHASES
    │   ├── TRANSFERS
    │   └── ADJUSTMENTS
    │
    ├── PRODUCTS
    │   ├── GROUPS
    │   ├── CATEGORIES
    │   ├── VARIANTS
    │   └── IMAGES
    │
    ├── INGREDIENTS
    │
    ├── RECIPES
    │   └── RECIPE VERSIONS
    │
    ├── UNITS
    │   └── CONVERSIONS
    │
    ├── SUPPLIERS
    │
    ├── CUSTOMERS
    │
    └── REPORTING

                         ↓

                  INVENTORY ENGINE

                         ↓

                  FIFO / FEFO ENGINE

                         ↓

                  BATCH ALLOCATION

                         ↓

                  STOCK MOVEMENTS

                         ↓

                  ACTUAL HPP / COGS

                         ↓

                    PROFIT REPORTING

---

# 108. FINAL DESIGN RULES

1. Organization is the tenant.

2. User can belong to multiple organizations.

3. Organization can have multiple stores.

4. Store can have multiple warehouses.

5. Product master belongs to organization.

6. Store controls product availability and pricing.

7. Inventory belongs to store + warehouse.

8. Inventory is batch-based.

9. Every stock change creates a movement.

10. Never directly mutate historical inventory movements.

11. FIFO is supported.

12. FEFO is supported.

13. Batch expiry is optional.

14. Products can have recipes.

15. Recipes can contain ingredients.

16. Recipes must be versioned.

17. Unit conversions are mandatory.

18. HPP must be based on actual consumed batch cost when using actual costing.

19. Historical sales must store their HPP/COGS snapshot.

20. Offline transactions require idempotency.

21. Inventory allocation must happen transactionally on the server.

22. RLS must enforce organization and store isolation.

23. Completed transactions must not be deleted.

24. Corrections use reversal/adjustment movements.

25. Batch identity must be preserved during transfers.

26. Expired stock must not normally be sellable.

27. Negative stock should be disabled by default.

28. Every sensitive inventory action must be auditable.

29. Client applications never directly determine authoritative stock.

30. The Inventory Engine is the central authority for stock.

---

# 109. TARGET RESULT

With this architecture, DRIP POS can support:

Small coffee shop
↓
Multiple stores
↓
Restaurant
↓
Retail
↓
Mini market
↓
Warehouse
↓
Multi-brand organization
↓
Large enterprise

without redesigning the inventory database later.

The most important architectural decision is:

ORGANIZATION
→ STORE
→ WAREHOUSE
→ INVENTORY
→ BATCH
→ MOVEMENT

combined with:

PRODUCT
→ RECIPE
→ INGREDIENT
→ BATCH
→ COST

and:

SALE
→ CONSUMPTION
→ HPP
→ COGS
→ PROFIT

This creates a scalable foundation for the entire DRIP POS platform.