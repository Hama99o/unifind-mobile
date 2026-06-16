# MIGRATE_FEATURE.md — Web → Mobile migration process (authoritative)

This is the binding process for porting a unifind web feature (`unifind/frontend/`, Next.js) into `unifind-mobile/` (Expo + Gluestack UI) at **100% parity**. The `migrate-feature` skill and all agents enforce it.

---

## The Completion Contract (overrides everything)

1. **Do not stop until the feature is 100% done.** "List now, detail later" or "the rest follows the same pattern" is a failure.
2. **Nothing is skipped or deferred.** Every column/field, filter, sort, tab, action, detail section, form field, endpoint, and translation key the web has → mobile gets it.
3. **A question is not an exit.** You may ask **one** focused question if genuinely ambiguous, then continue to done.
4. **Review against web before declaring done.** Parity is verified field-by-field and action-by-action by `parity-reviewer`.

---

## Step 1 — Locate & read the web feature

Find the route under `unifind/frontend/src/app/[locale]/<feature>/` and its `'use client'` component. Read the API calls in `unifind/frontend/src/app/controllers/` and the translation keys used. Determine **which backend** each call hits:
- **Strapi CMS** (catalog) — institutions, programs, offerings, degrees, fields, campuses, languages.
- **Node API** (user data) — favorites, compares, reviews, bookings, payments, userinfo. These need the **Auth0 token**.

## Step 2 — Build the inventory

Use the `web-analyst` output (or build it yourself). Capture: data model (both shapes), every endpoint (unifind/backend/verb/url/params/response/auth), Index Audit (card fields, search, filters, sort, tabs, actions, pagination, detail-page?, form?, empty state, auth-gated actions), detail sections, form fields + validation, all translation keys.

## Step 3 — Implement on mobile (in this order)

1. **API** — `src/api/<feature>.ts`: typed interfaces; correct backend (`http`/`nodeApi`); Auth0 token for user-data; pagination params per backend.
2. **List screen + card** — `UniversalList<T>` + a card composition in `src/components/cards/`.
3. **Filters** — `FilterDrawer` config if the web has filters; `FilterTags` for active filters; `sort` config.
4. **Detail screen** — every section + field; related lists; reviews/ratings; actions.
5. **Form** — every field, same validation, correct create/update backend; post-success navigation.
6. **Routes** — thin wrappers under `app/`.
7. **Navigation** — entry in `src/config/nav.ts` for top-level screens.
8. **Translations** — every key in `en` AND `ar`; verify RTL.
9. **Favorites / Compare** — wire `FavoriteButton` / `CompareButton` (auth-gated) if the web has them.
10. **Gluestack checklist** — tick any component you add.

## Step 4 — Self-review

Walk the inventory: every card field, filter, sort, tab, action, detail field, form field present? Both locales? RTL? Loading/empty/error states? Correct backend + auth? Report file-by-file.

## Step 5 — Parity review

`parity-reviewer` returns PASS/FAIL + gap list. Loop build↔review until PASS.

## Step 6 — Design polish

`mobile-designer` refines hierarchy, spacing, states, RTL, dark mode, motion within Gluestack tokens.

---

## Web → Mobile pattern mapping (canonical)

| Web (unifind) | Mobile (unifind-mobile) |
|-----|--------|
| `UFLayoutWithSidebar` list + sidebar filters | `UniversalList<T>` + `FilterDrawer` (Actionsheet) |
| `UFDataTable` (compare table) | compare screen — `UniversalList` cards or a scrollable comparison table |
| `UFFilterAccordion` / `UFFilterDropDown` | filter items in `FilterDrawer` |
| `UFFilterTags` | `FilterTags` chip row |
| `UFSort` | `sort` config in `UniversalListConfig` |
| `UFPagination` | infinite scroll + pull-to-refresh in `UniversalList` |
| `UFCard1` / `UFCard2` / `UFCardOffering` | `ProgramCard` / `InstitutionCard` / `OfferingCard` |
| Next `<Link>` / `router.push` | Expo Router `router.push('/...')` |
| Radix `Dialog` (create/edit/confirm) | Gluestack `Modal` / `AlertDialog`, or full screen for big forms |
| `SignInModal` (auth gate) | `SignInSheet` (Actionsheet) → Auth0 native login |
| `UFBottomSheet` | Gluestack `Actionsheet` |
| `UFToast` | Gluestack `Toast` |
| `UFModalRadix` (confirm) | `confirmAlert` (Gluestack `AlertDialog`) — never raw `Alert.alert` |
| `useCustomTranslation` | `useCustomTranslation` from `@/hooks` |
| `http` (Strapi axios) | `http` from `@/api/http` |
| Node API call + token | `nodeApi` from `@/api/nodeApi` |
| favorite button | `FavoriteButton` → `favorites` API (auth-gated) |
| add-to-compare (max 5) | `CompareButton` + `compareStore` → `compares` API |
| `UFDayTimeSlots` (booking calendar) | `DayTimeSlots` (Gluestack + date picker) |
| `UFGoogleMap` | `react-native-maps` |
| `UFReviews` / review form | `ReviewSection` + review form |
| Print / export | **Omit** unless explicitly requested |

---

## Parity checklist (must all be true to declare done)

- [ ] Every web card field on the mobile card (or intentionally summarized + noted)
- [ ] Search, every filter, every sort option, every tab present
- [ ] Every action present (favorite, compare, book, view, review, …) and auth-gated where web gates it
- [ ] Detail page: every section + field; related lists; reviews/ratings
- [ ] Form: every field, same validation, correct backend, post-success nav, server errors surfaced
- [ ] Loading skeleton + empty state + error state
- [ ] Both backends used correctly (Strapi `http` vs Node `nodeApi` + Auth0 token)
- [ ] Auth0: protected actions show sign-in sheet when logged out; token in secure store
- [ ] All copy via `t('...')`; keys in `en` AND `ar`; RTL verified
- [ ] Dates/numbers/currency via `useLocalization()`
- [ ] UI all Gluestack; no hand-rolled primitives; no raw RN `Text` for copy; no hardcoded hex; light+dark OK
- [ ] `confirmAlert` (not raw `Alert.alert`) for destructive/impactful actions
- [ ] **DRY:** reused the shared cards / `UniversalList` / `FilterDrawer` / compare-favorite components — no duplicated/copy-pasted component; refactored an existing screen instead of forking a pattern where needed
- [ ] **No big files:** every file ≤ ~300 lines; screens split into section/subcomponent files; nothing left broken (typecheck/lint clean)
- [ ] Every item in this feature's **Detailed scope** in `MIGRATION_QUEUE.md` is built (or explicitly "web has none")
- [ ] Route is a thin wrapper; navigation entry exists; queue row ticked ✅
