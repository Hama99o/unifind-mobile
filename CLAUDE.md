# unifind-mobile — Project Instructions (React Native)

The **unifind mobile app**: a React Native (Expo) port of the `unifind` web product, re-implementing every feature with mobile-native patterns at **100% parity**. UI library is **Gluestack UI (v2) + NativeWind**.

> This is one project in the `Jamil/` workspace. The shared Claude tooling and workspace overview live at [`../CLAUDE.md`](../CLAUDE.md); the web product it mirrors is [`../unifind/`](../unifind/). This is **not** a monorepo — the two apps are independent repos that share only the backend HTTP APIs and the Auth0 tenant. The app itself is **not scaffolded yet**; `docs/` defines the target architecture and the rules to build it by.

## Authoritative rule library — read before writing any code

| File | Covers |
|------|--------|
| [`docs/prompts/mobile.prompt.md`](docs/prompts/mobile.prompt.md) | All coding rules — APIs (Strapi + Node), service layer, Auth0, routing, translations (en/ar + RTL + Beirut TZ), components (Gluestack), theming, layout |
| [`docs/prompts/AUTH_SECURITY.md`](docs/prompts/AUTH_SECURITY.md) | **Auth/login flow, token lifecycle, service layer, avatar upload service, mobile security rules, and the backend hardening backlog** |
| [`docs/prompts/MIGRATE_FEATURE.md`](docs/prompts/MIGRATE_FEATURE.md) | The migration process + the Completion Contract + web→mobile pattern mapping + parity checklist |
| [`docs/prompts/UNIVERSAL_LIST.md`](docs/prompts/UNIVERSAL_LIST.md) | `UniversalList<T>` — the only component for list screens |
| [`docs/prompts/FILTER_DRAWER.md`](docs/prompts/FILTER_DRAWER.md) | Filter system (FilterDrawer + FilterTags + filter configs) |
| [`docs/prompts/COMPARE_FAVORITES.md`](docs/prompts/COMPARE_FAVORITES.md) | Compare cart (max 5) + Favorites — the unifind selection model |
| [`docs/GLUESTACK_MIGRATION_CHECKLIST.md`](docs/GLUESTACK_MIGRATION_CHECKLIST.md) | Gluestack component install/conversion tracker |
| [`docs/MIGRATION_QUEUE.md`](docs/MIGRATION_QUEUE.md) | The backlog (source of truth) + atomic claim protocol |
| [`docs/SPRINT_BOARD.md`](docs/SPRINT_BOARD.md) | The live task board the software-house executes |
| [`docs/FLOWAPP.md`](docs/FLOWAPP.md) | FlowApp Kanban mirror (project 6) — visible flow tracking; agents move cards as they work |
| [`docs/BUILD_APK.md`](docs/BUILD_APK.md) | **Building the Android APK with Expo/EAS** — cloud builds, `eas.json` profiles, staging env vars, Auth0 callback caveat |
| [`docs/release.md`](docs/release.md) | **Store release runbook**: TestFlight and the Play internal track, `store.config.js`, store graphics, env vars, blockers before public review |

## Non-negotiable golden rules (full detail in `docs/prompts/mobile.prompt.md`)

1. **Gluestack UI is the ONLY UI library** (`@/components/ui/*`). No hand-rolled primitives. No raw RN `Text` for copy.
2. **Two backends, never confused:** catalog (read-only) = Strapi via `http`; user data = Node via `nodeApi` (with the **Auth0** token). The Node API and Strapi CMS are the same ones the web app uses ([`../unifind/`](../unifind/)).
3. **Auth0** native login (`expo-auth-session` / `react-native-auth0`); token in **`expo-secure-store`** (never AsyncStorage). Protected actions show the `SignInSheet` when logged out.
4. **No hardcoded strings** — `t('...')` (flat camelCase keys) in **both** locales `en` + `ar`; verify **RTL** for `ar`.
5. **No hardcoded hex** — NativeWind/Gluestack theme tokens; light + dark both correct.
6. **No raw dates/numbers/currency** — `useLocalization()` (USD + LBP).
7. **`UniversalList<T>` for every feature list** — never a hand-written `FlatList`.
8. **`confirmAlert`** (Gluestack `AlertDialog`) for confirms — never raw `Alert.alert`.

## Target structure

```
unifind-mobile/
  app/        ← Expo Router routes (file = route); thin wrappers only
  src/
    api/      ← http.ts (Strapi) · nodeApi.ts (Node + Auth0 token) · <domain>.ts
    auth/     ← Auth0 login + secure token store + auth gate
    components/{ui,common,cards,shared}/
    config/   ← nav.ts, filter configs
    hooks/    ← useColors, useLocalization, useCustomTranslation, useAuth
    i18n/locales/{en,ar}/translation.json
    screens/  ← one business-logic screen per web page
    stores/   ← authStore, compareStore, favoritesStore (Zustand)
    types/  utils/
  docs/       ← the rule library above (already present)
```

## How work gets done here

Migration is driven from the workspace root via the shared tooling: `/migrate-feature <slug>`, `/migrate-next`, `/migrate-loop`, `/parity-check <slug>`, `/migration-status`, `/design-review-mobile <screen>`. Build order and priorities live in [`docs/MIGRATION_QUEUE.md`](docs/MIGRATION_QUEUE.md) — **Foundation** rows (`app-scaffold` → `i18n-setup` → `api-layer` → `auth-login` → `navigation-shell` → `universal-list` → `filter-system` → `compare-favorites-infra`) come before any page.
