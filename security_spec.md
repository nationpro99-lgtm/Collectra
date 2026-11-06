# Security Specification: CollectIQ Multi-Tenant ABAC

## 1. Data Invariants

1. **Business Isolation (Tenant Master Gate)**:
   - Every invoice, customer, payment, follow-up, and task document MUST reside under `/businesses/{businessId}/...` subcollections.
   - Access to any subcollection requires the requesting user to be an authorized member of that specific business (via `/users/{userId}.businessId == businessId` or business owner `ownerUid == request.auth.uid`).
   - Cross-tenant data access or queries are strictly forbidden.

2. **User Identity & Role Integrity**:
   - Users can only read and update their own `/users/{userId}` record (`request.auth.uid == userId`).
   - Self-escalation is blocked: a user cannot change their own `role` or `businessId`.

3. **Immutable Auditing & Temporal Guarding**:
   - `id`, `businessId`, and `createdAt` are strictly immutable once created.
   - Updates must use action-specific field sets (`affectedKeys().hasOnly(...)`).

4. **Input Size & Injection Shield**:
   - All string fields are constrained with `.size() <= MAX` to prevent Denial of Wallet exhaustion attacks.
   - Path variables must pass `isValidId()` regex checking (`^[a-zA-Z0-9_\\-]+$`).

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Ghost Field / Shadow Injection)**: Attempting to update an invoice with an unapproved key `{ "isSecretlyPaid": true, "amount": 10 }` -> Must be rejected by `affectedKeys().hasOnly()`.
2. **Payload 2 (Tenant Cross-Pollination)**: An authenticated user from `biz_alpha` attempting to read `/businesses/biz_beta/invoices/inv_1` -> Must be rejected by the Master Gate.
3. **Payload 3 (ID Poisoning Attack)**: Submitting a 2KB junk character string as `{invoiceId}` -> Must be rejected by `isValidId(invoiceId)`.
4. **Payload 4 (Privilege Escalation on User Profile)**: Collector user sending `{ "role": "Admin" }` in an update to `/users/{userId}` -> Must be rejected.
5. **Payload 5 (Unauthenticated Scrape)**: Anonymous or unauthenticated HTTP client querying `/businesses/{businessId}/customers` -> Must be rejected by `isSignedIn()`.
6. **Payload 6 (Forged Owner ID)**: Creating a new business document with `ownerUid: "victim_uid"` instead of `request.auth.uid` -> Must be rejected.
7. **Payload 7 (Denial of Wallet Payload)**: Submitting an invoice with a 500,000 character `notes` string -> Must be rejected by string size limit (`size() <= 1000`).
8. **Payload 8 (Negative Amount Injection)**: Submitting an invoice with `amount: -99999` -> Must be rejected by positive number constraints (`amount >= 0`).
9. **Payload 9 (Terminal State Tampering)**: Attempting to modify customer or invoice balance after status is `paid` without admin privileges -> Must be blocked.
10. **Payload 10 (Client-Delegated Query Bypass)**: Issuing a collection-wide query without proper tenant scoping -> Blocked by rule-side check `isBusinessMember(businessId)`.
11. **Payload 11 (Orphaned Follow-Up Write)**: Creating a follow-up with mismatched `businessId` in body vs path -> Must be rejected (`incoming().businessId == businessId`).
12. **Payload 12 (Direct Document Deletion by Contributor)**: Contributor attempting to delete an audit trail log in `/activityLogs/` -> Must be rejected (activity logs are append-only).

---

## 3. Test Runner Invariant Assertions

The `firestore.rules` must ensure that all 12 adversarial scenarios trigger `PERMISSION_DENIED`.
