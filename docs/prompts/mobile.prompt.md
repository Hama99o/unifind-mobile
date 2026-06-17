# mobile.prompt.md — unifind-mobile coding rules (authoritative)

> This is the single source of truth for **how** to write code in `unifind-mobile/`. The migrator, parity-reviewer, and designer all defer to it. When the mobile app is scaffolded, keep this file in sync with reality; until then it defines the **target** architecture.

The mobile app is **React Native + Expo + Gluestack UI (v2) + NativeWind**, re-implementing the unifind web frontend (`unifind/frontend/`, Next.js) feature-by-feature with mobile-native patterns. It talks to the **same two backends** the web does (Strapi CMS + Node API) and the **same Auth0** tenant.

---

## §0 — Golden rules (the ones most often broken)

1. **Gluestack UI is the only UI library.** Every visible element is a Gluestack component (`@/components/ui/*`) or a composition of them. No hand-rolled buttons/inputs/modals/badges. No raw RN `Text` for copy.
2. **Two backends, never confused.** Catalog (read-only) = Strapi via `http`. User data = Node via `nodeApi` (with the Auth0 token).
3. **No hardcoded strings.** Everything through `t('...')` in **both** locales (`en`, `ar`). Keys are **flat camelCase** in a single `translation` namespace (same as web).
4. **No hardcoded hex.** NativeWind theme tokens via `className`, or `useColors()` for inline styles. Light + dark both correct.
5. **No raw dates/numbers/currency.** Always `useLocalization()`.
6. **`UniversalList<T>` for every list.** Never a hand-written `FlatList` for feature lists.
7. **Auth0 token in `expo-secure-store`.** Never AsyncStorage for tokens.
8. **`confirmAlert` for confirms**, never raw `Alert.alert`.
9. **Never duplicate a component (DRY).** Build a component **once** in `src/components/` and reuse it everywhere. If two screens need the same card/row/section/field, extract one shared component — never copy-paste. If an existing screen must be refactored to reuse the shared component, **refactor it** (then re-verify it still works). A second copy of an existing pattern is a bug.
10. **No big files.** Keep every file focused and small (**hard cap ~300 lines**). Split screens into section/subcomponent files; split API files by domain; split long forms into step files. A big file is a refactor signal, not an acceptable state.
11. **Nothing broken, everything well-coded.** Strongly typed (no `any`), imports resolve, typecheck/lint clean, and light + dark + RTL all verified before a feature is "done".

---

## §1 — Project structure & file naming

```
unifind-mobile/
  app/                  ← Expo Router (file = route); thin wrappers only
  src/
    api/                ← http.ts (Strapi) · nodeApi.ts (Node+Auth0) · <domain>.ts
    auth/               ← Auth0 login + secure token store + auth gate
    components/
      ui/               ← Gluestack components (added via gluestack-ui CLI)
      common/           ← UniversalList, FilterDrawer, FilterTags, Pagination, CompareBar, ...
      cards/            ← ProgramCard, InstitutionCard, OfferingCard, SpecialistCard
      shared/           ← ScreenContainer, AppHeader, EmptyState, SignInSheet, ...
    config/             ← nav.ts, filter configs
    hooks/              ← useColors, useLocalization, useCustomTranslation, useAuth, ...
    i18n/locales/{en,ar}/translation.json
    screens/            ← one business-logic screen per web page
    stores/             ← Zustand: authStore, compareStore, favoritesStore
    types/              ← shared TS types
    utils/              ← pure helpers
```

- **Route files** in `app/` are thin: `export { default } from '@/screens/<Name>';`
- **Screens** in `src/screens/` hold all business logic.
- **API files** in `src/api/` — one file per domain (**transport only**).
- **Service files** in `src/services/` — multi-step domain orchestration (see §2.5).

---

## §2 — API layer (two backends)

### Strapi CMS — catalog, read-only — `@/api/http`
- Institutions, programs, offerings, degree levels, study fields, campuses, languages, tags.
- Public Bearer token in the default header (mirrors web `http-common.tsx`).
- Strapi query syntax: `populate`, `filters[field][$in]`, `sort`, `pagination[page]`, `pagination[pageSize]`.
- Response shape: `{ data: [...], meta: { pagination: { page, pageCount, total } } }`.

### Node API — user-owned data — `@/api/nodeApi`
- Bookings, favorites, compares, reviews, payments, userinfo, academic/professional background, skills.
- An **interceptor attaches the Auth0 access token**: `Authorization: Bearer <token>` read from the auth store / secure storage.
- Endpoints (see `unifind/backend/src/routes/`): `/userinfo`, `/favorites`, `/compares`, `/reviews/...`, `/booking/...`, `/payments`, `/availability/...`, `/promocode`, `/academic-backgrounds`, `/professional-backgrounds`, `/skill`, `/language`, `/country`.
- Node responses commonly look like `{ success, data, message }`.

**Rules:** typed interfaces for every entity and list/detail response — no `any`. Pick the correct backend per call. Never create ad-hoc axios instances — use `http` or `nodeApi`.

### Reference data (shared, fetch once)
Some screens need backend reference data: **countries + dial codes** (`GET /country` — for the phone field), **currencies** (USD/LBP + symbols — drive `useLocalization` currency), **languages** (`GET /language`). Catalog filter options (degree levels, study fields, locations) come from **Strapi**. Fetch reference data once and cache (it rarely changes); never hardcode dial codes or currency symbols.

---

## §2.5 — Service layer (api/ vs services/) — DRY

Separate **transport** from **orchestration** (full detail in `AUTH_SECURITY.md` §3):
- `src/api/<domain>.ts` — one endpoint → typed result, via `http`/`nodeApi`. No multi-step logic.
- `src/services/<domain>.ts` — multi-step flows reused across screens: `authService` (login/refresh/logout), `uploadService.uploadAvatar` (3-step Cloudinary), `bookingService.book`, `paymentService.pay` (promo → Whish URL → poll status), `favoriteService`/`compareService` (optimistic + reconcile).
- **Screens call services**, never inline a multi-step flow. A second copy of an orchestration is a DRY violation.

---

## §3 — Auth & security (Auth0)

**Authoritative detail: `AUTH_SECURITY.md`.** Summary:
- Mobile uses the **Auth0 native flow** (`expo-auth-session` + PKCE, or `react-native-auth0`) — not the web's hosted-cookie redirect. Tokens (access + refresh) in **`expo-secure-store`** only; refresh on expiry and on app foreground.
- `authStore` exposes `isLoggedIn`, `user`, `accessToken`, `login()`, `logout()`, `refresh()`; hydrate from secure-store on boot.
- **Auth gate:** protected actions (favorite, compare, book, review, profile, checkout, compare page) go through `useAuthGate` → present **`SignInSheet`** (Actionsheet, web `SignInModal` equivalent) when logged out, then resume. Whole-page-gated screens redirect to sign-in if opened logged-out.
- Profile fields live in Auth0 `user_metadata` (first_name, last_name, phone_number, dialCode, dateOfBirth, gender, country, city, role, picture) — edited via `PATCH /userinfo`; password via Auth0 `change_password`; photo via the upload service.
- **Security (see AUTH_SECURITY.md §5):** no secrets in the bundle, never trust a client-supplied `userId`, HTTPS (+ consider cert pinning), validate OAuth callbacks. Known **backend** hardening items are tracked in AUTH_SECURITY.md §6 — fix on the backend, never work around on the client.

---

## §4 — Localization (en + ar, RTL)

- Two locales: **`en`** and **`ar`**. `ar` is **right-to-left**.
- Translation files: `src/i18n/locales/en/translation.json` and `ar/translation.json`. **Single `translation` namespace, flat camelCase keys** (identical convention to web — reuse the web keys where they already exist).
- **Never hardcode copy** — `const { t } = useCustomTranslation();` then `t('btnAddToCompare')`, etc. Add every new key to **both** files.
- **RTL:** detect with the locale; mirror row direction (`flex-row` ↔ `flex-row-reverse`), never hard-code `left`/`right`. Icons that imply direction (chevrons, back arrows) must flip.
- **`useLocalization()`** is the only way to render dates, numbers, currency (USD + LBP), and percentages — never `toLocaleDateString()` or raw `date-fns`.
- **Timezone:** booking/session times are stored UTC but shown in **Beirut time (Asia/Beirut)** with a 12-hour format — exactly like web. `useLocalization` owns this conversion; never display a raw UTC string. Booking creation sends Beirut-local date/time as the backend expects.

---

## §5 — UI components (Gluestack UI v2) — STRICT

- **Gluestack is the ONLY UI library.** Components live in `src/components/ui/` (added via `npx gluestack-ui add <component>`). Use `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Radio`, `Actionsheet`, `Modal`, `AlertDialog`, `Tabs` (or a tab control), `Badge`, `Card`, `Avatar`, `Image`, `Heading`, `Text`, `Spinner`, `Toast`, `Accordion`, `Divider`, `Box`, `HStack`, `VStack`, `Pressable`, `FormControl`, etc.
- **Custom components are compositions of Gluestack components only** — e.g. `InstitutionCard` = `Card` + `Image` + `Heading` + `Badge` + rating stars built from Gluestack `Icon`.
- **Raw RN `Text` is forbidden for copy** — use Gluestack `Text`/`Heading`. Allowed raw primitives (non-UI only): `View`, `ScrollView`, `FlatList`, `ActivityIndicator`, `RefreshControl`, `Image` (when Gluestack `Image` doesn't fit), `Pressable` as a touch wrapper.
- **Styling:** NativeWind `className` with Gluestack theme tokens. Never inline hex.
- Missing a component? `npx gluestack-ui add <component>`, then tick it in `docs/GLUESTACK_MIGRATION_CHECKLIST.md`.

### Web `UF*` → mobile mapping
| Web `UF*` | Mobile |
|---|---|
| `UFButton` | Gluestack `Button` |
| `UFInputs` / `UFTextarea` | Gluestack `Input` / `Textarea` |
| `UFModal` / `UFModalRadix` | Gluestack `Modal` / `AlertDialog` |
| `UFBottomSheet` | Gluestack `Actionsheet` |
| `UFBadge` / `UFBadge2` | Gluestack `Badge` |
| `UFCard1`/`UFCard2`/`UFCardOffering` | `ProgramCard`/`InstitutionCard`/`OfferingCard` (compositions) |
| `UFTabButton`/`UFRadixTabs`/`UFAcademicTabs` | Gluestack `Tabs` / segmented control |
| `UFToast` | Gluestack `Toast` |
| `UFSpinner`/`UFLoading`/`UFSkeleton` | Gluestack `Spinner` + Skeleton composition |
| `UFEmptyState` | `EmptyState` (shared, Gluestack composition) |
| `UFPagination` | infinite scroll in `UniversalList` |
| `UFGoogleMap` | `react-native-maps` |
| `UFDayTimeSlots` | `DayTimeSlots` (Gluestack + date picker) |

---

## §6 — Screen layout

- Every screen: `<ScreenContainer>` outermost + `<AppHeader title={t('...')} />` (with `showBack` on detail/form screens).
- **List screens** → `UniversalList<T>` (see `UNIVERSAL_LIST.md`). Filters via `FilterDrawer` (see `FILTER_DRAWER.md`).
- **Detail screens** → `<ScreenContainer padded>` with sectioned `Card`s; breadcrumb-equivalent via `AppHeader showBack`.
- **Forms** → grouped `FormControl` fields, inline validation, sticky primary action, disabled/loading on submit.
- Every screen needs **loading** (skeleton), **empty** (`EmptyState`), and **error** states.

---

## §7 — Theming & colors

- NativeWind theme tokens only. Brand: turquoise `#44DED1`, prussian `#023055`, barc `#F29049` — defined as theme tokens in the NativeWind/Gluestack config, **never** inlined as hex in components.
- Code that must use inline styles → `useColors()` from `@/hooks/useColors`.
- **LIGHT MODE ONLY — no dark mode.** The unifind **web** app has no dark mode (no `darkMode` in its Tailwind config, no theme toggle), so mobile mirrors it: the app is locked to light (`userInterfaceStyle: "light"` in `app.json`, and `useColors()` always returns the light palette). Do **not** add dark-mode styling, theme toggles, or `dark:` variants. The `darkColors` map / `.dark` CSS block are intentionally unused (kept only so tokens resolve). Because there's exactly one background (white surfaces / prussian bands), every text/icon must be a **dark** color on light surfaces and a **light** color on the prussian bands — pick the token that contrasts the surface it sits on.

### §7.1 — Color clarity (NON-NEGOTIABLE — text/icons must be clearly noticeable)

The #1 design complaint is washed-out, hard-to-read text and "invisible" icons. Every color choice must pass these:

- **Only real tokens exist.** Use the semantic set from `tailwind.config.js`/`global.css`: `text-foreground` / `text-card-foreground` (primary text), `text-muted-foreground` (secondary/metadata — the ONLY soft text token), `bg-background`, `bg-card`, `border-border`, `bg-primary`/`text-primary-foreground`, `bg-secondary`, `bg-accent`/`text-accent-foreground`, `bg-destructive`. **There is NO `text-typography-*` scale** — those classes resolve to nothing and render colorless text. Never use them.
- **Never same-hue-on-same-hue.** A turquoise icon on a `turquoise/NN` chip, prussian on prussian, grey text on a grey track — all invisible. Put a brand-colored icon on a *neutral or contrasting* surface (e.g. turquoise icon on `bg-white/10` over prussian; prussian icon on the `lightgreen` `#D9F8F5` chip on white). The pale-mint chip token is `bg-lightgreen` — use it instead of `bg-turquoise/12`.
- **Don't lighten text to "soften" it.** Faint opacities (`text-white/65`, `/12` tints) read as broken. Floor for readable text on a dark band is `text-white/85`; for an icon `/10` fill keep the icon itself solid. Prefer a real token (`text-muted-foreground`) over an opacity hack.
- **On the active `primary` fill use `text-primary-foreground` / `colors.primaryForeground`**, never literal `text-white` — primary is prussian in light but turquoise in dark, so `text-white` becomes unreadable in dark mode.
- **Squint test, both themes.** If you can't immediately read a label or spot an icon at arm's length in light AND dark, the contrast is wrong — fix the token, don't ship it.

### §7.2 — Loading states & skeletons (REQUIRED on every screen)

- **Every screen and async section must show a skeleton while loading** — never a blank screen, a bare spinner, or a layout that pops in. Use a skeleton whose shape matches the real content (list rows, cards, hero) so nothing shifts when data arrives. `SectionSkeleton` is the pattern for carousels; build matching skeletons for hero/stat/detail layouts.
- A screen is not done until **loading (skeleton) + empty (icon + title + one line + action) + error (message + retry)** are all designed and wired. This is part of the Completion Contract — see `MIGRATE_FEATURE.md`.

---

## §8 — Compare & Favorites (the unifind selection model)

See `COMPARE_FAVORITES.md`. In short:
- **Favorite**: toggle (auth-gated) on Institution / Program / Offering / Specialist → `POST /favorites` (Node). Optimistic UI via `favoritesStore`.
- **Compare**: add/remove (max 5) Institution or Program → `POST /compares` (Node) + `compareStore`. A `CompareBar` shows the current cart and a "Compare" CTA → the compare screen.

---

## §9 — Destructive / impactful actions

- Always `confirmAlert(title, message, [{ text, style: 'destructive', onPress }])` (a helper over Gluestack `AlertDialog`) before delete / cancel-booking / remove. **Never raw `Alert.alert`** (no-op on web preview, inconsistent styling).

---

## §10 — What NOT to do (mobile)

```
❌ Copy Next.js/Radix/HTML JSX into RN
❌ Hand-roll a primitive Gluestack provides
❌ FlatList for a feature list — use UniversalList
❌ Hardcode hex — theme tokens / useColors()
❌ Use text-typography-* — NOT a real token (renders colorless); use text-foreground / text-muted-foreground
❌ Same-hue-on-same-hue (turquoise icon on turquoise chip, grey on grey) — invisible; contrast it
❌ Faint text to "soften" (text-white/65, /12 tints) — washed out; floor /85, prefer real tokens
❌ Literal text-white on a primary fill — use text-primary-foreground (breaks in dark mode)
❌ Hardcode strings — t('...') in en AND ar
❌ Raw dates/numbers/currency — useLocalization()
❌ Confuse Strapi (http) with Node (nodeApi)
❌ Token in AsyncStorage — use expo-secure-store
❌ Skip skeleton/empty/error states — skeleton REQUIRED on every screen (no blank/spinner-only)
❌ Dead/no-op onPress — every control that is clickable on web must respond here: navigate if the target route exists, else `showToast(\`${name} · ${t("common.comingSoon")}\`)` (global toast in `@/stores/toastStore`). Never leave a TODO no-op tap.
❌ Raw Alert.alert — use confirmAlert (use the global toast for transient "coming soon"/info feedback)
❌ Business logic in app/ route files — put it in src/screens/
```
