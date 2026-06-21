# TEST_PLAN.md — unifind-mobile

Checkbox test plan. Each item is annotated with its coverage layer:
- **(unit)** = Jest unit / component / integration test (`npm test`)
- **(e2e)** = Maestro flow (`maestro test .maestro/flows`, runs on a device/emulator)
- `[x]` = covered by a passing jest test, or by an authored Maestro flow whose
  `testID`s were validated against the real source.
- `[ ]` = not yet covered (see **Known gaps** at the bottom).

## Status

- **96 jest suites · 1067 tests · 100% passing** (`docker compose run --rm --no-deps -e NODE_ENV=test web npx jest --ci --runInBand`).
- **14 Maestro e2e flows** (`.maestro/flows/00…13`), all referencing real testIDs.
- Infra: `jest.config.js` + `jest.setup.ts` (global mocks) + `src/test-utils/renderWithProviders.tsx`. NativeWind's babel transform is disabled under `NODE_ENV=test` (see `babel.config.js`).

---

## 1. Foundation — Jest infrastructure

- [x] Jest runs with zero config errors (`jest.config.js` + `jest.setup.ts`) **(unit)**
- [x] `@/` path alias resolves to `src/` **(unit)**
- [x] Platform splits resolve (haste `defaultPlatform: ios`) **(unit)**
- [x] `@/api/http` mock returns empty response by default (offline) **(unit)**
- [x] `@/api/nodeApi` mock returns empty response by default (offline) **(unit)**
- [x] `expo-secure-store` in-memory mock works (get/set/delete) **(unit)**
- [x] i18n hook mock returns identity `t()` + `isRtl: false` synchronously **(unit)**
- [x] React 19 + react-test-renderer 19.1.0 compatibility verified (1067 tests run) **(unit)**
- [x] `@testing-library/react-native` 13.x renders Gluestack components without errors **(unit) `InstitutionCard.test.tsx`**

---

## 2. Utils — Pure helpers

- [x] `formatTuitionRange` / `formatInstitutionTuition` / `formatDuration` / `formatCredits` / `formatCampusLabel` / `formatLanguageLabel` / `formatLocation` **(unit) `utils/__tests__/catalogFormat.test.ts`**
- [x] `ratings.ts` — avg-rating injection + star math **(unit) `utils/__tests__/ratings.test.ts`**
- [x] `faIconToLucide.ts` — icon mappings + unknown fallback **(unit) `utils/__tests__/faIconToLucide.test.ts`**
- [x] `offeringMerge.ts` — `mergeOfferingsByContentId`, duplicate IDs **(unit) `utils/__tests__/offeringMerge.test.ts`**
- [x] `share.ts` — message/url building, iOS vs web branch **(unit) `utils/__tests__/share.test.ts`**
- [x] `secure-storage.ts` — native + web localStorage fallback round-trips **(unit) `utils/__tests__/secure-storage.test.ts`**
- [x] `formatReviewerName` / `extractExperience` / `extractStudyPeriod` **(unit) `api/__tests__/reviewComment.test.ts`**
- [ ] `richText.tsx` — renders rich-text nodes without crash **(unit)** — *gap*

---

## 3. API helpers (Strapi `http` + Node `nodeApi`, all mocked offline)

- [x] `strapiQuery.ts` — query builder (filters/pagination/populate/sort/locale/status) **(unit)**
- [x] `programsFilterApi` / `offeringsFilterApi` — filter → Strapi query mapping **(unit)**
- [x] `programExplorerApi` / `catalog` / `catalogItemsApi` / `catalog.say` **(unit)**
- [x] `institutionsApi` / `institutionDetailApi` / `programsApi` / `programDetailApi` **(unit)**
- [x] `offeringsApi` / `offeringDetailApi` / `nodeOfferingApi` / `academicApi` / `availabilityApi` **(unit)**
- [x] `bookingsApi` (status helpers) / `favoritesApi` / `comparesApi` / `reviewsApi` **(unit)**
- [x] `profileApi` / `paymentApi` / `promoCodeApi` / `newsletterApi` — endpoint, payload, return shape, error path **(unit)**

---

## 4. Stores — Zustand state

- [x] `compareStore` — setCompared / addCompare (max-5) / removeCompare / isCompared / getCount **(unit)**
- [x] `favoritesStore` — add/remove, isFavorite, setFavorites, dedup **(unit)**
- [x] `authStore` — login/logout transitions, token set/clear, JWT decode, isAuthenticated **(unit)**
- [x] `toastStore` — show / auto-dismiss (fake timers) / queue **(unit)**

---

## 5. Hooks · Services · Auth

- [x] `useSelection` — add/dedup/remove/clear/isSelected/max-cap **(unit)**
- [x] `useAsyncResource` — loading/success/error/refetch **(unit)**
- [x] `usePressScale` / `useReviewList` **(unit)**
- [x] `useLocalization` (real impl) — currency USD/LBP, number, percent, date/time **(unit)**
- [x] `authService` — Auth0 PKCE login, token persistence, logout, refresh **(unit)**
- [x] `avatarService` — pick + upload, cancel path **(unit)**
- [x] `testimonialsService` — transform, locale en/ar, empty **(unit)**
- [x] `signInSheetStore` / `useSignInSheet` / `useAuthGate` / `useTokenForegroundRefresh` **(unit)**

---

## 6. Home screen + tab navigation

- [x] App launches, home screen visible **(e2e) `00-launch.yaml`**
- [x] FindBar renders hero + 3 segmented tabs + Find CTA **(unit) `home/__tests__/FindBarSection.test.tsx`**
- [x] FindBar: Programs tab → `/(main)/find?find=programs` **(unit + e2e) `02-findbar-programs.yaml`**
- [x] FindBar: Institutions tab → `/(main)/find?find=institutions` **(unit)**
- [x] FindBar: Offerings tab → growth-center hub **(unit)**
- [x] Bottom tabs: Home / Program Explorer / Growth Center / Profile navigate **(e2e) `01-tab-navigation.yaml`**

---

## 7. Discovery — Programs / Institutions / Offerings

- [x] `FindScreen` SubNavBar (programs/institutions/offerings) + in-place switch **(unit) `find/__tests__/FindScreen.test.tsx`**
- [x] `FindInstitutionsScreen` — search bar, filter trigger, empty state **(unit)**
- [x] `UniversalList` — skeleton(loading) / empty / error+retry / search / load-more / refresh **(unit) `common/__tests__/UniversalList.test.tsx`**
- [x] `FilterDrawer` — sections, toggle, apply, clear, active-count **(unit)**
- [x] `ProgramCard` / `InstitutionCard` / `OfferingCard` — fields, fav, compare, primary CTA, a11y labels **(unit)**
- [x] `ProgramExplorerHubScreen` — hub tiles render **(unit) `explorer/__tests__/ProgramExplorerHubScreen.test.tsx`**
- [x] Browse institutions + apply filter **(e2e) `05-browse-institutions.yaml`**
- [x] Card → detail navigation **(e2e) `06-program-detail-nav.yaml`**
- [x] Growth-center hub **(e2e) `11-explorer-hub.yaml`**

---

## 8. Detail pages

- [x] Program / Institution / Offering detail **data layer** (`*DetailApi`) **(unit)**
- [x] Detail navigation + sections visible **(e2e) `06-program-detail-nav.yaml`**
- [ ] Per-section component unit tests (hero/overview/requirements/faculty/availability) **(unit)** — *gap (covered via screen/e2e, not per-section)*

---

## 9. Auth — SignInSheet & gating

- [x] SignInSheet renders Sign In + Create Account **(e2e) `04-signin-sheet.yaml`**
- [x] Protected action while logged out opens SignInSheet **(unit `useAuthGate` + e2e `08-auth-gate.yaml`)**
- [x] `authStore` restores/clears session via secure store **(unit)**
- [x] Token foreground refresh wiring **(unit `useTokenForegroundRefresh`)**
- [ ] Live Auth0 PKCE round-trip (needs real creds) **(e2e — manual)**

---

## 10. Booking → Checkout → Payment

- [x] `OfferingCheckoutScreen` — summary, promo input, pay button, signed-out state **(unit)**
- [x] `PromoBlock` — promo apply via promoCodeApi **(unit) `checkout/__tests__/PromoBlock.test.tsx`**
- [x] `paymentApi` — Whish initiation + failure toast **(unit)**
- [x] `BookingReviewSection` — required-rating validation, submit, already-reviewed state **(unit)**
- [x] Checkout journey (summary + promo + pay button) **(e2e) `09-booking-checkout.yaml`**
- [ ] `PaymentWebViewScreen` (native/web) + `PaymentStatusScreen` render **(unit)** — *gap*

---

## 11. Profile — all tabs

- [x] `ProfileTabBar` — 7 tabs (profile/credentials/about/activity/favorites/comparisons/bookings) + sign-out **(unit)**
- [x] `BookingsTab` / `FavoritesTab` / `ComparisonsTab` / `ProgramsCompareTab` — list + empty + remove(confirm) **(unit)**
- [x] Profile tab switching **(e2e) `10-profile-tabs.yaml`**
- [ ] Profile-Information / Credentials / About-Me / Activity tab bodies (per-tab unit) **(unit)** — *partial gap*

---

## 12. Compare & Favorites

- [x] `CompareBar` — count "N/5", clear, compare-now, hidden when empty **(unit)**
- [x] `CompareScreen` — signed-out placeholder, tabs, empty state **(unit)**
- [x] Favorite toggle on cards updates store; `FavoritesTab` lists & removes **(unit)**
- [x] Favorites + compare journey **(e2e) `07-favorites-and-compare.yaml`**

---

## 13. Footer / Legal / 404

- [x] `TermsScreen` renders legal text **(unit) `legal/__tests__/TermsScreen.test.tsx`**
- [x] `NotFoundScreen` renders 404 message **(unit) `screens/__tests__/NotFoundScreen.test.tsx`**
- [x] Newsletter / contact / terms / 404 journeys **(e2e) `12-newsletter-contact-terms.yaml`, `13-not-found.yaml`**
- [ ] `AppFooter` component unit test **(unit)** — *gap*

---

## 14. Cross-cutting

- [x] Loading / empty / error / retry / load-more / pull-to-refresh on `UniversalList` **(unit)**
- [x] Review subsystem — `InteractiveRatingStars`, `ReviewForm` validation, `ReviewSection` pagination, `ReviewCascadeSelects`, `ReviewRatingBlock`, `ReviewCard` **(unit)**
- [x] Shared presentational — `Logo`, `EmptyState`, `StatusPill`, `StatTile`, `IconCircle`, `InfoCard`, `RankingCard`, `SectionHeader`, `BackgroundCard`, `HubHero`, `HubTile`, `HeroDetailCard` **(unit)**
- [ ] RTL (`isRtl: true`) flip assertions for FindBar/SubNav/ProfileTabBar **(unit)** — *gap (app builds RTL via inline styles; not asserted in tests)*
- [ ] Cross-platform web splits (`PaymentWebViewScreen.web`, `date-field.web`) render-on-web tests **(unit)** — *gap*
- _Light/dark tokens: N/A — the app is locked to light mode (`userInterfaceStyle: "light"`); web has no dark mode._

---

## Known gaps (intentional / deferred)

These are explicitly **not** covered by automated tests yet (everything else above is green):

1. `richText.tsx` rich-text renderer.
2. Per-section detail components (covered indirectly via screen + e2e, not per-section units).
3. `PaymentWebViewScreen` / `PaymentStatusScreen` and the `.web` cross-platform splits.
4. `AppFooter` component unit.
5. Some profile tab bodies (Profile-Information / Credentials / About-Me / Activity) — only `ProfileTabBar` + the list tabs are unit-tested.
6. RTL-flip assertions.
7. Live Auth0 PKCE / live payment (require real credentials + a device).

---

## testID Reference

See `.maestro/README.md` for the full table of stable `testID` values used across
all Maestro flows. Dynamic testIDs follow the patterns `findbar-tab-${key}`,
`subnav-tab-${key}`, `profile-tab-${id}`.

---

*Last updated: full test pass complete — 96 jest suites / 1067 tests green + 14 Maestro flows authored.*
