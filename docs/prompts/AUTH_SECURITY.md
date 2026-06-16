# AUTH_SECURITY.md — Auth, login service, service layer & security (authoritative)

This is the binding spec for **authentication, the login/token services, the service-layer architecture, and security** in `unifind-mobile`. The migrator and parity-reviewer defer to it. The user flagged this as the most important area — treat it as non-negotiable.

---

## 1. How web auth works today (ground truth)

- **Identity provider:** Auth0 (RS256, JWKS). All user IDs are the Auth0 `sub` (`auth0|...`); the web derives `userID` by splitting on `|`.
- **Web login:** redirect to a hosted Auth0 page — `${NEXT_PUBLIC_AUTH_URL}/${lang}?returnTo=<path>`; signup at `${NEXT_PUBLIC_AUTH_URL}/auth/signup?returnTo=<path>`.
- **Token storage (web):** the access token lives in an `ACCESS_TOKEN` cookie (`httpOnly, secure, sameSite=none`). The server validates it via JWKS (issuer + audience) and reads the user from it (`getUserFromCookie`).
- **Logout (web):** clear `ACCESS_TOKEN`, then redirect to `https://${AUTH0_DOMAIN}/v2/logout?client_id=${CLIENT_ID}&returnTo=<url>`.
- **Calling the backends:**
  - **Node API** (`nodeApi`): `Authorization: Bearer <Auth0 access token>`.
  - **Strapi** (`http`): `Authorization: Bearer <NEXT_PUBLIC_BEARER_TOKEN>` — a **shared, public** token (see §6 — do not blindly copy this to mobile).
- **Profile data:** stored in Auth0 `user_metadata`. `GET /userinfo` reads it; `PATCH /userinfo` updates it. Password change goes through Auth0 `change_password`. Avatar uses the 3-step Cloudinary flow (§4).
- **Backend gate:** `verifyToken` middleware validates the Auth0 JWT and sets `req.user.sub`. Ownership is enforced server-side off `req.user.sub` for bookings/favorites/compares/reviews (the backend does **not** trust a `userId` from the body for those).

## 2. Mobile auth flow (what to build — `auth-login`)

- **Login:** Auth0 **native** flow — `expo-auth-session` (Authorization Code + **PKCE**) or `react-native-auth0`. No hosted-cookie redirect; the app receives tokens directly. Support **sign in** and **create account** (Auth0 signup screen / `screen_hint=signup`).
- **Token storage:** **`expo-secure-store`** (Keychain / Keystore). **Never AsyncStorage, never plain state persisted to disk.** Store access token + refresh token (if enabled) + expiry.
- **Refresh:** request `offline_access` scope; refresh silently when the token is near expiry and **on app foreground**. If refresh fails → sign out and show `SignInSheet`.
- **Logout:** clear secure-store, clear `authStore`, call Auth0 logout endpoint (and clear the Auth0 session in the in-app browser).
- **`authStore` (Zustand):** `isLoggedIn`, `user` (decoded claims: `sub`, `userID`, name, email, picture), `accessToken`, `login()`, `logout()`, `refresh()`. Hydrate from secure-store on boot.
- **Auth gate:** `useAuthGate(action)` — protected actions (favorite, compare, book, review, profile, checkout, compare page) run only when logged in; otherwise present **`SignInSheet`** (Actionsheet → Sign in / Create account) and resume the action after login (`returnTo`-equivalent: re-invoke the pending action). Whole-page-gated screens (profile, checkout, compare) redirect to the sign-in flow if opened logged-out (mirrors the web redirect-home behaviour).
- **Deep links:** register the Auth0 callback scheme; validate the returned `state` (PKCE) — never accept a token from an unexpected source.

## 3. Service layer (api/ vs services/) — DRY orchestration

The web keeps controllers thin and orchestrates multi-step flows in components. On mobile, separate **transport** from **domain orchestration** so logic is built once and reused:

- **`src/api/<domain>.ts` — transport only.** Typed functions that hit one endpoint and return a typed result via `http` (Strapi) or `nodeApi` (Node). No multi-step logic. Example: `bookingsApi.create(dto)`, `favoritesApi.toggle(itemID, itemType)`, `cloudinaryApi.sign()`, `userApi.getInfo()`, `userApi.patchInfo(dto)`.
- **`src/services/<domain>.ts` — domain orchestration.** Multi-step flows that call several api functions and apply business rules. Built once, reused by every screen that needs them. Examples:
  - `authService` — login / refresh / logout / secure-store glue (wraps Auth0 + `authStore`).
  - `uploadService.uploadAvatar(file)` — the 3-step Cloudinary flow (§4).
  - `bookingService.book(...)` — create booking → navigate to checkout.
  - `paymentService.pay(bookingRef)` — apply/remove promo → request Whish URL → open payment → poll status.
  - `compareService` / `favoriteService` — optimistic store update + api call + reconcile/rollback.
- **Rule:** screens call **services** (or a single api function for trivial reads); they never inline a multi-step flow. A second copy of an orchestration is a DRY violation.

## 4. Avatar / photo upload service (3 steps — build once in `uploadService`)

1. `GET /cloudinary/sign` (Node) → `{ signature, timestamp, apiKey, cloudName, folder, eager }`.
2. `POST https://api.cloudinary.com/v1_1/<cloudName>/auto/upload` with the file + signed fields. Validate: image only, ≤ 10 MB.
3. `POST /cloudinary/photo` (Node, **auth required**) with the `publicId` → backend updates the Auth0 `picture`. Update `authStore.user.picture` + the avatar UI.

Use the same service for the profile photo and anywhere else an avatar is set. (On the web, `/cloudinary/sign` is currently unauthenticated — see §6; on mobile, always send the token if the backend later requires it.)

## 5. Mobile security rules (non-negotiable)

- **Tokens in `expo-secure-store` only.** Never AsyncStorage, never bundled, never logged. Scrub tokens from any error/analytics payload.
- **No secrets in the app bundle.** Anything in the JS bundle is public. Do **not** ship long-lived admin/service secrets. The Strapi `BEARER_TOKEN` is a shared read token — treat it as public; prefer a thin Node/Strapi **read proxy** for catalog calls if/when one exists, and never use it for anything write-capable. Flag this to the backend owner (see §6).
- **Trust the server, not the client.** Never send a `userId` you control to mutate data and assume it's honored; the authoritative identity is the Auth0 token. The mobile app must not rely on any endpoint that trusts a client-supplied `userId` (e.g. the current `/user/photo`) — push for the token-based version.
- **HTTPS only**; consider **certificate pinning** for the Node API in production.
- **Validate deep-link / OAuth callbacks** (PKCE `state`), and re-auth on token expiry rather than retrying blindly.
- **Confirm before destructive/impactful actions** (`confirmAlert`); never expose payment/booking mutations without an authenticated, owned context.
- **Biometric lock (optional):** offer Face/Touch ID to gate the app or re-confirm sensitive actions; store the preference, not a secret.

## 6. Backend hardening backlog (shared backend — affects mobile go-live)

> These are **existing backend issues** found during audit. They are **not** mobile code, but the mobile app integrates with the same API, so they must be fixed before mobile go-live. Surfaced here so the migration doesn't silently depend on insecure behaviour. **Do not "work around" them on the client** — fix them on the backend (`unifind/backend/`).

| Sev | Endpoint / area | Issue | Fix |
|-----|-----------------|-------|-----|
| 🔴 | `PATCH /user/photo` | No `verifyToken`; takes `userId` from the request body → anyone can change any user's photo | Add `verifyToken`; force `userId === req.user.sub` |
| 🔴 | `POST /api/auth/token` | Mints a token from a client-supplied `userId` (verify) | Remove or lock down — never issue tokens for arbitrary users |
| 🔴 | `POST/GET/PUT/DELETE /payments` | No auth on payment CRUD | Add `verifyToken` + ownership |
| 🔴 | `GET /webhook/payment/callback/{success,failure}/:id` | No signature/auth — anyone can mark a booking paid by guessing `externalPaymentId` | Verify Whish signature (HMAC) + idempotency/replay protection |
| 🔴 | `GET /cloudinary/sign` | Unauthenticated signed-upload generation | Add `verifyToken` |
| 🔴 | `NEXT_PUBLIC_BEARER_TOKEN` | Shared Strapi token shipped to every browser (and would be in the app bundle) | Proxy catalog reads server-side, or scope the token to read-only and rotate |
| 🟡 | CORS `origin: true` + `credentials: true` | Any origin can call the API with credentials | Restrict to known origins / app domains |
| 🟡 | Admin (`/admin`) | Single env email/password, no MFA | MFA / stronger admin auth |
| 🟠 | Auth0 Management API | Called per `userinfo` request, no cache | Cache metadata (5–15 min) to avoid rate limits |
| 🟠 | Booking creation | Status-based duplicate check, possible race | Unique index / transaction on the time slot |

Ownership **is** correctly enforced on bookings, favorites, compares, and reviews (server reads `req.user.sub`) — those are fine.

---

## Parity / review hooks
- `auth-login` is built before any gated feature; gated features reuse `useAuthGate` + `SignInSheet` (never re-implement the gate).
- The parity-reviewer flags: token in AsyncStorage, secrets in the bundle, any client-`userId`-trusting call, a missing auth gate on a web-gated action, and any duplicated auth/upload/booking orchestration.
