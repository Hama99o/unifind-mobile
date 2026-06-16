# COMPARE_FAVORITES.md — Compare cart + Favorites (authoritative)

unifind's "selection" model is **Favorites** and **Compare**, not bulk admin actions. This doc defines both on mobile. They are auth-gated (Auth0) and back to the **Node API**.

Built entirely on Gluestack UI + NativeWind.

---

## Favorites

- **What:** toggle a heart on Institution / Program / Offering / Specialist cards and detail headers (mirrors the web favorite button).
- **API (Node):**
  - `POST /favorites` body `{ itemID, itemType }` → toggles (add/remove).
  - `GET /favorites/:id/:type` (paginated `page`, `limit`) → the user's favorites for a type.
- **Store:** `favoritesStore` (Zustand) holds the set of favorited `itemID`s per type for **optimistic** toggling; reconcile with server response.
- **Component:** `FavoriteButton` (Gluestack `Pressable` + heart `Icon`).
  - Logged out → opens the `SignInSheet` (do **not** silently no-op).
  - Logged in → optimistic toggle, then `POST /favorites`; revert on error and show a `Toast`.
- **Profile > Favorites** screen lists favorited items via `UniversalList`, grouped/tabbed by type (Programs / Institutions / Offerings / Specialists).

---

## Compare (max 5)

- **What:** add Institution **or** Program to a compare cart (max 5), then open the **Compare screen** to see them side by side (mirrors web `UFDataTable` compare page with Programs/Institutions tabs).
- **API (Node):**
  - `POST /compares` body `{ itemID, itemType }` → toggles membership.
  - `GET /compares/:type` → current compare list for a type.
  - `GET /compares/count/:type` → count (for the badge).
- **Store:** `compareStore` (Zustand) keyed by `itemType` (`Institution` | `Program`), enforces the **max 5** rule client-side; on overflow show a `Toast` (`t('pleaseSelectCompareLimit')`-style key).
- **Components:**
  - `CompareButton` on cards/detail — auth-gated; toggles membership; reflects "in compare list" state.
  - `CompareBar` — a sticky bottom bar (Gluestack) shown when the cart is non-empty: avatars/count + a **Compare** CTA → the Compare screen. Includes a clear action.
- **Compare screen:** tabs Programs / Institutions; for the active tab fetch the compared items and render an attribute-by-attribute comparison (a horizontally scrollable table of Gluestack cells, or stacked cards on narrow widths). Each item has a remove action and a "view detail" link. Empty state links to Find Programs / Find Institutions.

---

## Rules

- Both features require login → `SignInSheet` when logged out. Never perform the action unauthenticated.
- All copy via `t('...')`; both locales; RTL-correct.
- Optimistic UI for snappy toggles; always reconcile with the server and surface errors via `Toast`.
- All UI Gluestack; no hand-rolled hearts/badges/bars.
- Parity rule: if the web feature exposes favorite/compare, the mobile screen must too — including the max-5 limit and the cross-screen `CompareBar`.
