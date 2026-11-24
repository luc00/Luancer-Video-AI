# Security Specification — Viggle Studio Firestore

## 1. Data Invariants
1. **Strict Ownership & PII Isolation**: `/users/{userId}` stores private account PII (`email`, `credits`, `planId`). Only the verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) can `get`, `create`, or `update` their own profile. `list` on `/users` is globally denied (`false`), and client-side `delete` of `/users/{userId}` is denied.
2. **Zero Self-Escalation on Registration**: A new `UserProfile` MUST start with `credits == 80` and `planId == 'free'`, preventing clients from minting `999999` credits or granting themselves `'max'` tier. Credits can only decrement (`incoming().credits <= existing().credits && incoming().credits >= 0`).
3. **Master Gate on Subcollections**: Every `/users/{userId}/creations/{creationId}` document requires its parent `/users/{userId}` document to exist (`exists(...)`) and belong to `request.auth.uid` on single-document operations (`get`, `create`, `update`, `delete`).
4. **No Media Blobs in Firestore**: `outputUrl` is strictly capped at `<= 500` characters (`videoId <= 128`) so raw video/image base64 data cannot exceed Firestore's 1MB limit or trigger Denial of Wallet attacks.
5. **Terminal State Locking**: Once a `StudioCreation` reaches `status == 'completed'` or `status == 'failed'`, no subsequent update is permitted.
6. **Temporal Integrity & Path Hardening**: All document IDs match `^[a-zA-Z0-9_-]+$` (`<= 128` chars), and all `createdAt` / `updatedAt` timestamps MUST equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Cross-Tenant Profile Read**: User B attempts `get(/users/userA)` -> `PERMISSION_DENIED`.
2. **Global Users Scrape (`list`)**: Signed-in User A attempts `list(/users)` -> `PERMISSION_DENIED`.
3. **Unverified Email Write**: User with `email_verified: false` attempts `create(/users/userA)` -> `PERMISSION_DENIED`.
4. **Self-Minted Credits on Signup**: User A creates `/users/userA` with `{ credits: 99999, planId: 'max' }` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Profile**: User A creates `/users/userA` with `{ ..., isAdmin: true }` -> `PERMISSION_DENIED` (`hasOnly` rejection).
6. **Client Timestamp Forgery**: User A creates `/users/userA/creations/c1` with client `Date` instead of `request.time` -> `PERMISSION_DENIED`.
7. **Orphan Creation Without Parent User**: User A attempts `create(/users/userA/creations/c1)` before `/users/userA` exists -> `PERMISSION_DENIED`.
8. **ID Poisoning Attack**: User A attempts `create(/users/userA/creations/bad$id..)` or a 500-char ID -> `PERMISSION_DENIED` (`isValidId`).
9. **Base64 Blob / 1MB String Poisoning**: User A writes 200KB `data:video/mp4;base64,...` into `outputUrl` -> `PERMISSION_DENIED` (`outputUrl.size() <= 500`).
10. **Credit Inflation Update**: User A updates `/users/userA` from `credits: 70` to `credits: 500` -> `PERMISSION_DENIED`.
11. **Terminal State Tampering**: User A updates a `'completed'` creation document to change `status` or `prompt` -> `PERMISSION_DENIED`.
12. **Cross-Tenant Creation List / Spoofed `userId`**: User B creates or lists `/users/userA/creations` or sets `userId: 'userA'` while signed in as User B -> `PERMISSION_DENIED`.

## 3. Rules Unit Verification
See `firestore.rules.test.ts` validating the static invariants and payload constraints synchronized with `firebase-blueprint.json` and `firestore.rules`.
