# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every unmatched document path under `/databases/{database}/documents` is explicitly denied (`allow read, write: if false;`).
2. **Verified Identity**: All reads/writes on user-owned documents require `request.auth != null` and `request.auth.token.email_verified == true`.
3. **UID & Path Binding**: Document `uid` / `userId` must strictly equal `request.auth.uid`, and path `{userId}` must match `^[a-zA-Z0-9_\-]+$` (<= 128 chars).
4. **PII Split Collection**: `email`, `phone`, `defaultCity`, and `defaultPincode` live exclusively in `/users/{userId}/private/info`, accessible only to `isOwner(userId)`.
5. **Bounded Arrays & String Lengths**: `wishlistIds` is capped at `<= 100` items; all strings have strict `.size()` bounds.
6. **Immutable Ownership & Temporal Integrity**: `uid`/`userId` and `createdAt` (`== request.time`) are immutable after creation; updates enforce `updatedAt == request.time` and explicit `affectedKeys().hasOnly(...)` action branches.
7. **Terminal State Locking on Orders**: Once `orderStatus == 'Delivered'`, non-admin updates are strictly rejected.
8. **Secure List Queries**: `allow list` on `/orders` enforces `resource.data.userId == request.auth.uid` (no `get()`/`exists()` inside `allow list`).

## 2. "Dirty Dozen" Adversarial Payloads
1. Unauthenticated read on `/users/uid123` -> `PERMISSION_DENIED`
2. Unverified email (`email_verified: false`) attempting write to `/users/uid123` -> `PERMISSION_DENIED`
3. User A attempting read/write on `/users/userB/private/info` -> `PERMISSION_DENIED`
4. Shadow field injection (`isAdmin: true` or `role: 'admin'`) during `/users/uid123` create -> `PERMISSION_DENIED`
5. Fake client timestamp (`createdAt: '2026-01-01'`) instead of `request.time` -> `PERMISSION_DENIED`
6. Oversized document ID (`1500` chars) on `/orders/{orderId}` -> `PERMISSION_DENIED`
7. Client attempting to mutate `userId` or `createdAt` during `/orders/{orderId}` update -> `PERMISSION_DENIED`
8. Non-admin client attempting to transition `/orders/{orderId}` after `orderStatus == 'Delivered'` -> `PERMISSION_DENIED`
9. Client attempting to inject unbounded `wishlistIds` (> 100 entries) -> `PERMISSION_DENIED`
10. Unscoped `list` query on `/orders` without matching `userId` -> `PERMISSION_DENIED`
11. Invalid `modelId` enum on `/users/{userId}/studioPresets/{presetId}` -> `PERMISSION_DENIED`
12. Email spoofing as admin with `email_verified == false` -> `PERMISSION_DENIED`
