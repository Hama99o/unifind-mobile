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
- **Status**: DONE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: -
- **ReviewNotes**: Scaffolded: i18n/index, locales/en+ar, useCustomTranslation, useLocalization.
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
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S003
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `reference-data`. GET /country (dial codes), currencies (symbols → useLocalization), GET /language; fetch once + cache.
- **Acceptance**: dial codes + currency symbols sourced from backend, never hardcoded.

## TASK-S006
- **Title**: auth-login — Auth0 PKCE native + secure-store + authStore + SignInSheet + useAuthGate
- **Type**: foundation
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S003
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `auth-login` + AUTH_SECURITY.md. Auth0 PKCE login+signup, refresh on expiry/foreground, token in expo-secure-store, authStore, SignInSheet, useAuthGate, whole-page gating. Implement authService (currently a skeleton).
- **Acceptance**: login/logout/refresh work; token only in secure-store; gated actions show SignInSheet.

## TASK-S007
- **Title**: upload-service — 3-step Cloudinary avatar upload
- **Type**: foundation
- **Priority**: P1
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S006
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `upload-service` + AUTH_SECURITY §4. uploadService.uploadAvatar: sign → Cloudinary → /cloudinary/photo → update authStore picture.
- **Acceptance**: reusable service; image-only ≤10MB; used by profile photo.

## TASK-S008
- **Title**: universal-list — UniversalList<T> (search/sort/filter/infinite-scroll/states)
- **Type**: foundation
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S004
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `universal-list` + prompts/UNIVERSAL_LIST.md. Generic list with search, sort, filter hook-in, infinite scroll, pull-to-refresh, skeleton/empty/error.
- **Acceptance**: every feature list uses it; never a hand-written FlatList.

## TASK-S009
- **Title**: filter-system — FilterDrawer (Actionsheet) + FilterTags + configs
- **Type**: foundation
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `filter-system` + prompts/FILTER_DRAWER.md. multiSelect/singleSelect/range/toggle filters, locale-aware Strapi sources + counts, Apply/Clear, FilterTags chips.
- **Acceptance**: drives find-programs/find-institutions filters exactly.

## TASK-S010
- **Title**: compare-favorites-infra — stores + buttons + CompareBar (max 5)
- **Type**: foundation
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S006
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `compare-favorites-infra` + prompts/COMPARE_FAVORITES.md. favoritesStore, compareStore (max 5 + toast), FavoriteButton, CompareButton, sticky CompareBar. All auth-gated.
- **Acceptance**: favorite/compare work across all cards; max-5 enforced.

## TASK-S011
- **Title**: shared-cards — ProgramCard/InstitutionCard/OfferingCard/SpecialistCard/ReviewSection/InfoCard/RatingStars
- **Type**: foundation
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008
- **ReviewNotes**: -
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
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008, TASK-S009, TASK-S010, TASK-S011
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `find-programs` Detailed scope (search; 6 filters w/ Strapi sources; sort tuition asc/desc/default; ProgramCard fields; favorite/compare auth-gated; infinite scroll; empty state).
- **Acceptance**: every filter/sort/field/action present; UniversalList + FilterDrawer + shared-cards reused.

## TASK-F003
- **Title**: find-institutions — list + search + filters + sort + favorite/compare + ratings
- **Type**: frontend
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008, TASK-S009, TASK-S010, TASK-S011
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `find-institutions` Detailed scope.
- **Acceptance**: every filter/sort/field/action present; reuses shared infra.

## TASK-F004
- **Title**: find-offerings — Growth-Center hub (categories/fields, tabs, search)
- **Type**: frontend
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S008, TASK-S011
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `find-offerings` Detailed scope (Offerings/Specialists tabs, category+field grids, search).
- **Acceptance**: tabs + grids + search match web; Specialists tab disabled like web.

## TASK-F005
- **Title**: institution-detail — header, overview, programs tabs, tuition, reviews + add-review
- **Type**: frontend
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S011, TASK-S010
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `institution-detail` Detailed scope.
- **Acceptance**: every section/field/action present incl. review form validation; favorite/compare gated.

## TASK-F006
- **Title**: offering-detail — specialist select + availability + booking + reviews
- **Type**: frontend
- **Priority**: P0
- **Status**: AVAILABLE
- **Session**: -
- **Blocks**: -
- **BlockedBy**: TASK-S011, TASK-S006
- **ReviewNotes**: -
- **Description**: See MIGRATION_QUEUE `offering-detail` Detailed scope (modes, specialist cards, Beirut-time day/slot pickers, pricing, book→checkout, reviews).
- **Acceptance**: full booking flow works; auth-gated; Beirut TZ via useLocalization.
