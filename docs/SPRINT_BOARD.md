# SPRINT_BOARD.md — unifind-mobile (software-house execution board)

The live task board the **unifind-software-house** workflow executes. Derived from
`MIGRATION_QUEUE.md` (the exhaustive backlog + Detailed scope per feature — the
master spec). Each task is one `## TASK-XXXX` section. The Product Owner agent
refills it; the houses claim/build/review/update it.

**Status:** AVAILABLE · IN_PROGRESS · CHANGES_REQUESTED · DONE · STUCK
**Type:** foundation · frontend · design · backend
**Session:** the house id that holds the task (`-` when free).
**Builders read the feature's full Detailed scope in MIGRATION_QUEUE.md.**

> Foundation `S001–S004` are already scaffolded in the repo (Expo + Gluestack/NativeWind
> + tabs + i18n + api layer) and marked DONE. The remaining foundation must be built
> before the features that depend on it (enforced via BlockedBy).

---

## TASK-S001
- **Title**: app-scaffold — Expo + Gluestack + NativeWind + theme + global providers
- **Type**: foundation
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: Scaffolded in repo (app/, babel/metro/tailwind, global.css brand tokens, providers in app/_layout).
- **Description**: Expo SDK 54 app, Gluestack/NativeWind, brand tokens (prussian/turquoise/barc) light+dark, root providers (QueryClient, SafeArea, GestureHandler, i18n, auth bootstrap), confirmAlert helper.
- **Acceptance**: app boots on web (port 3010) and Expo Go; typecheck clean.

## TASK-S002
- **Title**: i18n-setup — en + ar, flat camelCase, RTL, useLocalization (Beirut TZ)
- **Type**: foundation
- **Priority**: P0
- **Status**: IN_PROGRESS
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: QA 2026-11-10: language not persisted, native RTL never applied (TASK-Q002 / FlowApp #395). Scaffolded: i18n/index, locales/en+ar, useCustomTranslation, useLocalization.
- **Description**: i18next en+ar single `translation` namespace, RTL helper, useLocalization (date/number/USD+LBP/percent, Asia/Beirut).
- **Acceptance**: t() works in both locales; RTL flips for ar.

## TASK-S003
- **Title**: api-layer — http (Strapi) + nodeApi (Node+Auth0) + Page<T> + services split
- **Type**: foundation
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: Scaffolded: api/http, api/nodeApi (token interceptor), types/page, services/ started.
- **Description**: Strapi axios + Node axios with Auth0 token interceptor; Page<T> normalizer; api/ transport vs services/ orchestration.
- **Acceptance**: typed instances; no ad-hoc axios; both backends reachable.

## TASK-S004
- **Title**: navigation-shell — bottom tabs + ScreenContainer + AppHeader + EmptyState
- **Type**: foundation
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: Scaffolded: (main)/(tabs) Home/Program Explorer/Growth Center/Profile + shared shell components.
- **Description**: Bottom tabs (Home · Program Explorer · Growth Center · Profile); ScreenContainer, AppHeader (RTL back), EmptyState.
- **Acceptance**: 4 tabs render and switch; back is RTL-aware.

## TASK-S005
- **Title**: reference-data — countries+dial codes, currencies (USD/LBP), languages
- **Type**: foundation
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S003
- **ReviewNotes**: QA 2026-11-10: degree levels/fields/locations load in FindBar + filter drawer. -
- **Description**: See MIGRATION_QUEUE `reference-data`. GET /country (dial codes), currencies (symbols → useLocalization), GET /language; fetch once + cache.
- **Acceptance**: dial codes + currency symbols sourced from backend, never hardcoded.

## TASK-S006
- **Title**: auth-login — Auth0 PKCE native + secure-store + authStore + SignInSheet + useAuthGate
- **Type**: foundation
- **Priority**: P0
- **Status**: STUCK
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S003
- **ReviewNotes**: QA 2026-11-10: Auth0 'Callback URL mismatch' on device (TASK-Q001 / FlowApp #394). Implemented: authService (PKCE login/signup/refresh/logout via expo-auth-session + expo-crypto + expo-web-browser), authStore (bootstrap with token validation + refresh injection), nodeApi (401→refresh-and-retry interceptor), SignInSheet (Actionsheet upsell, RTL-safe), useAuthGate, useSignInSheet, SignInSheetHost, AlertDialog + confirmAlert + AlertDialogHost, useTokenForegroundRefresh, ProfileScreen (logged-out → SignInSheet, logged-in → user info + confirmAlert sign-out). All translation keys en+ar. packages added to package.json (expo-auth-session@~7.0.11, expo-crypto@~15.0.9). TypeScript clean (zero new errors, 3 pre-existing).
- **Description**: See MIGRATION_QUEUE `auth-login` + AUTH_SECURITY.md. Auth0 PKCE login+signup, refresh on expiry/foreground, token in expo-secure-store, authStore, SignInSheet, useAuthGate, whole-page gating. Implement authService (currently a skeleton).
- **Acceptance**: login/logout/refresh work; token only in secure-store; gated actions show SignInSheet.

## TASK-S007
- **Title**: upload-service — 3-step Cloudinary avatar upload
- **Type**: foundation
- **Priority**: P1
- **Status**: STUCK
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S006
- **ReviewNotes**: QA 2026-11-10: needs login (Auth0 blocked). -
- **Description**: See MIGRATION_QUEUE `upload-service` + AUTH_SECURITY §4. uploadService.uploadAvatar: sign → Cloudinary → /cloudinary/photo → update authStore picture.
- **Acceptance**: reusable service; image-only ≤10MB; used by profile photo.

## TASK-S008
- **Title**: universal-list — UniversalList<T> (search/sort/filter/infinite-scroll/states)
- **Type**: foundation
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S004
- **ReviewNotes**: DONE — Built as part of find-institutions. Generic FlatList with debounced search, sort Actionsheet, filter drawer trigger + badge, FilterTags chip row, infinite scroll (onEndReached), pull-to-refresh, skeleton/empty/error states. Config-driven; screens are thin.
- **Description**: See MIGRATION_QUEUE `universal-list` + prompts/UNIVERSAL_LIST.md. Generic list with search, sort, filter hook-in, infinite scroll, pull-to-refresh, skeleton/empty/error.
- **Acceptance**: every feature list uses it; never a hand-written FlatList.

## TASK-S009
- **Title**: filter-system — FilterDrawer (Actionsheet) + FilterTags + configs
- **Type**: foundation
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008
- **ReviewNotes**: DONE — Built as part of find-institutions. FilterDrawer (Actionsheet + accordion sections, multiSelect checkboxes, singleSelect range picker, async fetchOptions), FilterTags (removable chips, clear-all), institutionFilterConfig (4 filters: degreeLevel, fieldOfStudy, location, tuition). Apply+Clear footer.
- **Description**: See MIGRATION_QUEUE `filter-system` + prompts/FILTER_DRAWER.md. multiSelect/singleSelect/range/toggle filters, locale-aware Strapi sources + counts, Apply/Clear, FilterTags chips.
- **Acceptance**: drives find-programs/find-institutions filters exactly.

## TASK-S010
- **Title**: compare-favorites-infra — stores + buttons + CompareBar (max 5)
- **Type**: foundation
- **Priority**: P0
- **Status**: STUCK
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S006
- **ReviewNotes**: QA 2026-11-10: guest gate OK; logged-in paths blocked by Auth0. DONE — Stores pre-existed (favoritesStore, compareStore). CompareBar built as part of find-institutions: sticky bottom bar, count/5, Compare Now CTA (comingSoon toast), clear action. Favorite/compare inline in InstitutionCard + useInstitutionsData hook (optimistic + rollback + max-5 toast). Auth-gated via useAuthGate.
- **Description**: See MIGRATION_QUEUE `compare-favorites-infra` + prompts/COMPARE_FAVORITES.md. favoritesStore, compareStore (max 5 + toast), FavoriteButton, CompareButton, sticky CompareBar. All auth-gated.
- **Acceptance**: favorite/compare work across all cards; max-5 enforced.

## TASK-S011
- **Title**: shared-cards — ProgramCard/InstitutionCard/OfferingCard/SpecialistCard/ReviewSection/InfoCard/RatingStars
- **Type**: foundation
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008
- **ReviewNotes**: QA 2026-11-10: cards render en + ar with fav/compare/CTA. -
- **Description**: See MIGRATION_QUEUE `shared-cards`. Build the reusable cards ONCE; reused by all list/detail features. DRY — never duplicated later.
- **Acceptance**: cards match web fields; reused by find-* and detail screens.

## TASK-F001
- **Title**: home — hero, featured, numbers, guide steps, testimonials, welcome popup
- **Type**: frontend
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S011
- **ReviewNotes**: PASS — parity verified, code-review clean, design polished. All 6 sections + WelcomeModal. Built ahead of S008–S011 (cards/list/filter infra seeded by this feature: FeaturedCard, TestimonialCard, RatingStars, SelectField, Input, Actionsheet). Find-button deep-links to find-* are interim TODO until those screens exist.
- **Description**: See MIGRATION_QUEUE `home` Detailed scope.
- **Acceptance**: all sections present; en+ar+RTL; reuses shared-cards; no file >300 lines.

## TASK-F002
- **Title**: find-programs — list + search + 6 filters + sort + favorite/compare
- **Type**: frontend
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008, TASK-S009, TASK-S010, TASK-S011
- **ReviewNotes**: QA 2026-11-10: 2,741 programs, search, filters, detail nav OK. -
- **Description**: See MIGRATION_QUEUE `find-programs` Detailed scope (search; 6 filters w/ Strapi sources; sort tuition asc/desc/default; ProgramCard fields; favorite/compare auth-gated; infinite scroll; empty state).
- **Acceptance**: every filter/sort/field/action present; UniversalList + FilterDrawer + shared-cards reused.

## TASK-F003
- **Title**: find-institutions — list + search + filters + sort + favorite/compare + ratings
- **Type**: frontend
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008, TASK-S009, TASK-S010, TASK-S011
- **ReviewNotes**: DONE — Built end-to-end: UniversalList<T> (generic, infinite scroll, search, sort, FilterDrawer, FilterTags), FilterDrawer (multiSelect/singleSelect/accordion), FilterTags, CompareBar, SubNavBar, institutionsApi (exact Strapi parity), findInstitutionsScreen, useInstitutionsData hook, InstitutionCard (ranking badges, rating, fees, cover, favorite heart), reviewsApi.getInstitutionAvgRating shape-fixed. Deep-link params (level/field/location). Both locales en+ar. TypeScript clean.
- **Description**: See MIGRATION_QUEUE `find-institutions` Detailed scope.
- **Acceptance**: every filter/sort/field/action present; reuses shared infra.

## TASK-F004
- **Title**: find-offerings — Growth-Center hub (categories/fields, tabs, search)
- **Type**: frontend
- **Priority**: P0
- **Status**: IN_PROGRESS
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008, TASK-S011
- **ReviewNotes**: QA 2026-11-10: offerings empty in Arabic (TASK-Q003 / FlowApp #396). Built 2026-06-19. Two-step fetch (Node→Strapi→merge). FilterDrawer (category multiSelect, fieldOfStudy intersection, price range). Sort (default/price_asc/price_desc) client-side. GrowthCenterScreen hub with gradient hero + grids + search. FindOfferingsScreen in FindScreen SubNavBar. Route /(main)/find/offerings. Offering detail → comingSoon. Specialists tab → disabled (web parity). TypeScript clean.
- **Description**: See MIGRATION_QUEUE `find-offerings` Detailed scope (Offerings/Specialists tabs, category+field grids, search).
- **Acceptance**: tabs + grids + search match web; Specialists tab disabled like web.

## TASK-F005
- **Title**: institution-detail — header, overview, programs tabs, tuition, reviews + add-review
- **Type**: frontend
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S011, TASK-S010
- **ReviewNotes**: All 5 sections built (Hero, Overview, Academic Programs, Tuition, Reviews+Form). All TypeScript errors in institution files resolved.
- **Description**: See MIGRATION_QUEUE `institution-detail` Detailed scope.
- **Acceptance**: every section/field/action present incl. review form validation; favorite/compare gated.

## TASK-F006
- **Title**: offering-detail — specialist select + availability + booking + reviews
- **Type**: frontend
- **Priority**: P0
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S011, TASK-S006
- **ReviewNotes**: QA 2026-11-10: offering detail, specialists, Book Now gate OK. -
- **Description**: See MIGRATION_QUEUE `offering-detail` Detailed scope (modes, specialist cards, Beirut-time day/slot pickers, pricing, book→checkout, reviews).
- **Acceptance**: full booking flow works; auth-gated; Beirut TZ via useLocalization.

## TASK-P001
- **Title**: profile-activity — Reviews sub-tab with infinite scroll, delete, category ratings
- **Type**: frontend
- **Priority**: P1
- **Status**: STUCK
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S006
- **ReviewNotes**: QA 2026-11-10: code exists; not verifiable on device without login (Auth0 callback mismatch). DONE — infinite-scroll GET /reviews/user; delete via confirmAlert; NormalizedReview (extractExperience/extractStudyPeriod); category ratings by targetType; skeleton/empty/error. All keys en+ar.
- **Description**: See MIGRATION_QUEUE `profile-activity` Detailed scope.
- **Acceptance**: reviews list, delete, category labels, study period, pagination.

## TASK-P002
- **Title**: profile-favorites — Programs/Institutions/Offerings sub-tabs with favorite toggle + compare
- **Type**: frontend
- **Priority**: P1
- **Status**: STUCK
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S006, TASK-S010
- **ReviewNotes**: QA 2026-11-10: code exists; not verifiable on device without login (Auth0 callback mismatch). DONE — 3 sub-tabs; two-step fetch (Node IDs → Strapi catalog); optimistic favorite toggle removes card; max-5 compare guard; ProgramCard/InstitutionCard/OfferingCard reused. All keys en+ar.
- **Description**: See MIGRATION_QUEUE `profile-favorites` Detailed scope.
- **Acceptance**: 3 sub-tabs; toggle removes card; compare gated; empty+error states.

## TASK-P003
- **Title**: profile-comparisons — Programs/Institutions horizontal comparison table
- **Type**: frontend
- **Priority**: P1
- **Status**: STUCK
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S006, TASK-S010
- **ReviewNotes**: QA 2026-11-10: code exists; not verifiable on device without login (Auth0 callback mismatch). DONE — 2 sub-tabs; side-scrolling ComparisonTable (fixed label col + item cols); dynamic programInfo/requirements/institutionInfo rows; remove via confirmAlert; View More → comingSoon. All keys en+ar.
- **Description**: See MIGRATION_QUEUE `profile-comparisons` Detailed scope.
- **Acceptance**: comparison table, remove, dynamic attribute rows, mobile-native scroll.

## TASK-P004
- **Title**: profile-bookings — Bookings table with status pills + View Details + Review action
- **Type**: frontend
- **Priority**: P1
- **Status**: STUCK
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S006
- **ReviewNotes**: QA 2026-11-10: code exists; not verifiable on device without login (Auth0 callback mismatch). DONE — GET /booking/by-user; BookingRow with date/amount/status pill; View Details → booking detail screen; Review active only for Completed status. All keys en+ar.
- **Description**: See MIGRATION_QUEUE `profile-bookings` Detailed scope.
- **Acceptance**: list, status pills (5 colors), View Details, Review gate.

## TASK-P005
- **Title**: booking-detail — 4-step stepper + session card + payment card + review form
- **Type**: frontend
- **Priority**: P1
- **Status**: STUCK
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-P004
- **ReviewNotes**: QA 2026-11-10: code exists; not verifiable on device without login (Auth0 callback mismatch). DONE — route /(main)/booking/[bookingReference]; GET /booking/:ref/details; BookingProgressStepper (4 steps); BookingSessionCard (Beirut TZ times, mode labels); BookingPaymentCard (promo code, PaymentStatus pill, Go To Checkout); BookingReviewSection (check already reviewed, interactive stars, POST /reviews). All keys en+ar.
- **Description**: See MIGRATION_QUEUE `booking-detail` Detailed scope.
- **Acceptance**: full detail screen; all sections; review form; Beirut TZ; auth-gated.


## TASK-C001
- **Title**: compare — standalone full-screen compare page (Programs/Institutions tables)
- **Type**: frontend
- **Priority**: P1
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: profile-comparisons
- **ReviewNotes**: DONE — app/(main)/compare.tsx (thin wrapper) → CompareScreen → CompareTabs (reuses ProgramsCompareTab/InstitutionsCompareTab/ComparisonTable from Profile; no logic duplication). Auth-gated: logged-out shows SignedOutPlaceholder + opens SignInSheet. CompareBar 'Compare Now' now routes to /(main)/compare?tab=<type>. ProgramsCompareTab 'View More' routes to /(main)/institutions/[slug]/programs/[programSlug]; 'Explore Programs' → /(main)/find?find=programs. InstitutionsCompareTab 'Explore Institutions' → /(main)/find?find=institutions. Route param ?tab=programs|institutions sets initial tab. All keys en+ar; RTL.
- **Description**: See MIGRATION_QUEUE 'compare' Detailed scope.
- **Acceptance**: compare tables (programs+institutions); auth-gated; remove via confirmAlert; view-more navigates; empty states with Explore links; CompareBar wired.

## TASK-C002
- **Title**: program-explorer — hub screen (Fields/Degrees tile grid → find with filters)
- **Type**: frontend
- **Priority**: P1
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: find-programs
- **ReviewNotes**: DONE — ProgramExplorerHubScreen (mirrors GrowthCenter hub pattern): gradient hero, Fields|Degrees tab switcher, search box, 2-col tile grid. New API programExplorerApi.fetchFieldOptionsWithIcons (GET /api/programs/fields-program-icons) + fetchDegreeOptions (GET /api/programs/distinct-degrees-programs, guards on Array.isArray correctly unlike web bug). FA icon → lucide via faIconToLucide util. Field tile → /(main)/find?find=programs&field=<name>; Degree tile → &level=<title>. 'Browse all' → /(main)/find. New route app/(main)/find.tsx → FindScreen. FindBar deep-links updated: programs/institutions → /(main)/find; offerings → growth-center. FeaturedInstitutionsSection 'See all' → /(main)/find?find=institutions. HomeScreen handleFindProgram still → program-explorer tab (hub). Loading skeletons + empty states. All keys en+ar; RTL.
- **Description**: See MIGRATION_QUEUE 'program-explorer' Detailed scope.
- **Acceptance**: hub renders fields+degrees; search filters tiles; taps navigate to find with correct filter; Find lists still reachable; Home FindBar + See all deep-links work; TSC clean.

---

# QA 2026-11-10 findings (sprint "QA fixes & parity (Nov 2026)", FlowApp sprint 14)

Full detail, repro steps and screenshots: [`QA_REPORT_2026-11-10.md`](QA_REPORT_2026-11-10.md).

## TASK-Q001
- **Title**: BUG-01 Auth0 callback URL mismatch blocks login on device
- **Type**: frontend
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #394.
- **Description**: see FlowApp card #394 and the QA report.

## TASK-Q002
- **Title**: BUG-02 Language not persisted; native RTL never applied
- **Type**: frontend
- **Priority**: P1
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #395.
- **Description**: see FlowApp card #395 and the QA report.

## TASK-Q003
- **Title**: BUG-03 Growth Center shows no offerings in Arabic (count says 2)
- **Type**: frontend
- **Priority**: P1
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #396.
- **Description**: see FlowApp card #396 and the QA report.

## TASK-Q004
- **Title**: BUG-04 SignInSheet stays open after navigating away and blocks the tab bar
- **Type**: frontend
- **Priority**: P1
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #397.
- **Description**: see FlowApp card #397 and the QA report.

## TASK-Q005
- **Title**: BUG-05 Price ranges garbled in Arabic ($US ٣٠٠–$US ٢٢٠)
- **Type**: frontend
- **Priority**: P2
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #398.
- **Description**: see FlowApp card #398 and the QA report.

## TASK-Q006
- **Title**: BUG-06 Maestro e2e suite cannot run as written
- **Type**: frontend
- **Priority**: P2
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #399.
- **Description**: see FlowApp card #399 and the QA report.

## TASK-Q007
- **Title**: BUG-07 Footer copyright says 2025
- **Type**: frontend
- **Priority**: P3
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #400.
- **Description**: see FlowApp card #400 and the QA report.

## TASK-Q008
- **Title**: BUG-08 Offering detail hero shows an empty grey logo box
- **Type**: frontend
- **Priority**: P3
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #401.
- **Description**: see FlowApp card #401 and the QA report.

## TASK-Q009
- **Title**: PARITY-01 About Us page missing on mobile
- **Type**: frontend
- **Priority**: P1
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #402.
- **Description**: see FlowApp card #402 and the QA report.

## TASK-Q010
- **Title**: PARITY-02 Language switch only on Home
- **Type**: frontend
- **Priority**: P2
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #403.
- **Description**: see FlowApp card #403 and the QA report.

## TASK-Q011
- **Title**: RQ-01 Move server data to React Query (manual useState+useEffect fetching)
- **Type**: frontend
- **Priority**: P1
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #404.
- **Description**: see FlowApp card #404 and the QA report.

## TASK-Q012
- **Title**: RQ-02 Detail screens re-show the skeleton on every revisit
- **Type**: frontend
- **Priority**: P2
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #405.
- **Description**: see FlowApp card #405 and the QA report.

## TASK-Q013
- **Title**: PAY-01 Payment behind one switch (EXPO_PUBLIC_PAYMENTS_ENABLED, default OFF)
- **Type**: frontend
- **Priority**: P1
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #406.
- **Description**: see FlowApp card #406 and the QA report.

## TASK-Q014
- **Title**: PAY-02 Whish WebView: handle not-found/error redirects and locale
- **Type**: frontend
- **Priority**: P2
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #407.
- **Description**: see FlowApp card #407 and the QA report.

## TASK-Q015
- **Title**: DESIGN-01 Detail pages: sticky bottom CTA + clearer hero
- **Type**: frontend
- **Priority**: P2
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #408.
- **Description**: see FlowApp card #408 and the QA report.

## TASK-Q016
- **Title**: DESIGN-02 Sort as radio bottom sheet + quick filter chips
- **Type**: frontend
- **Priority**: P3
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #409.
- **Description**: see FlowApp card #409 and the QA report.

## TASK-Q017
- **Title**: DESIGN-03 Checkout: review-and-pay layout with sticky Pay bar
- **Type**: frontend
- **Priority**: P2
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #410.
- **Description**: see FlowApp card #410 and the QA report.

## TASK-Q018
- **Title**: DESIGN-04 Compare table: highlighted columns, sticky first column
- **Type**: frontend
- **Priority**: P3
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: FlowApp card #411.
- **Description**: see FlowApp card #411 and the QA report.

## TASK-Q019
- **Title**: Payment: activate live after the account purchase
- **Type**: backend
- **Priority**: P1
- **Status**: STUCK
- **Session**: -
- **Blocks**: -
- **BlockedBy**: Whish merchant account purchase
- **ReviewNotes**: FlowApp card #412.
- **Description**: see FlowApp card #412 and the QA report.
