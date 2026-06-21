# Maestro E2E Tests — unifind-mobile

## Requirements

- Maestro CLI installed: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- The app installed on a running device or emulator.
- For Expo Go: the app must be running (started with `expo start`).

## Run all flows

```bash
# Run the whole suite (against a connected device / running emulator)
maestro test .maestro/flows

# Against a specific flow
maestro test .maestro/flows/00-launch.yaml

# Run only smoke-tagged flows
maestro test --tags smoke .maestro/flows/
```

## Flows

Flows are numbered to encode a rough journey order; each is independent and
self-launches the app.

| # | File | What it covers |
|---|------|----------------|
| 00 | `00-launch.yaml` | Cold start: app launches, home screen + tab bar + FindBar render. |
| 01 | `01-tab-navigation.yaml` | Bottom tabs: Home · Program Explorer · Growth Center · Profile navigate correctly. |
| 02 | `02-findbar-programs.yaml` | Home FindBar: select the Programs segment, press Find, land on the Find screen. |
| 03 | `03-filter-drawer.yaml` | Open the filter drawer on Find Programs and apply. |
| 04 | `04-signin-sheet.yaml` | Logged-out Profile shows the SignInSheet (Sign In + Create Account). |
| 05 | `05-browse-institutions.yaml` | Switch the SubNavBar to Institutions, see the list, open + apply the filter drawer. |
| 06 | `06-program-detail-nav.yaml` | Open a program card → detail (Overview, Admission Requirements, Similar Programs), scroll, back. |
| 07 | `07-favorites-and-compare.yaml` | Toggle a favorite, add 2 programs to compare, open the CompareBar + compare screen, clear. |
| 08 | `08-auth-gate.yaml` | Logged out, a protected action (favorite/compare) opens the SignInSheet; dismiss it. |
| 09 | `09-booking-checkout.yaml` | Open an offering → booking section → checkout screen (summary, promo, Pay Now). |
| 10 | `10-profile-tabs.yaml` | Profile tab bar: switch across profile/bookings/favorites/comparisons/activity/credentials/about. |
| 11 | `11-explorer-hub.yaml` | Growth Center / Program Explorer hub tiles render; tap a tile to drill in. |
| 12 | `12-newsletter-contact-terms.yaml` | Footer: newsletter signup + Contact Us + Terms link → open the Terms screen. |
| 13 | `13-not-found.yaml` | Deep-link an unknown route (`unifind://…`) → 404 / Not Found screen; recover via Home. |

Many later flows are **auth-gated** (favorite, compare, booking/checkout, the
logged-in Profile tabs). Where a step only succeeds for a logged-in user (or
depends on live catalog/availability data), it is marked `optional: true` so the
flow stays resilient on either auth state. To exercise the full logged-in paths,
sign in first (or run against a build with a seeded session) before launching
flows 07, 09, and 10.

## Running with Expo Go

Maestro can drive Expo Go via its `appId`. Set the appId to the Expo Go bundle:

- iOS:     `host.exp.Exponent`
- Android: `host.exp.exponent`

Override in the flow file or via `--app-id`:

```bash
maestro test --app-id host.exp.exponent .maestro/flows/
```

Note: clearState: true does not work with Expo Go (it would clear Expo Go itself).
Use `clearState: false` for Expo Go runs.

## Running against a production/standalone build

Use the app's own bundle identifier (`org.unifind.app`) — already set in
`.maestro/config.yaml`. Build with EAS or locally:

```bash
eas build --profile preview --platform android
# install the .apk, then:
maestro test .maestro/flows/
```

## testID reference

All stable testIDs used by Maestro flows:

| testID | Element |
|--------|---------|
| `home-screen` | HomeScreen root SafeAreaView |
| `home-scroll` | HomeScreen ScrollView |
| `tab-home` | Bottom tab — Home |
| `tab-program-explorer` | Bottom tab — Program Explorer |
| `tab-growth-center` | Bottom tab — Growth Center |
| `tab-profile` | Bottom tab — Profile |
| `findbar-tab-program` | FindBar segment — Programs |
| `findbar-tab-institution` | FindBar segment — Institutions |
| `findbar-tab-offering` | FindBar segment — Offerings |
| `findbar-find` | FindBar "Find" button |
| `subnav-tab-programs` | SubNavBar — Programs tab |
| `subnav-tab-institutions` | SubNavBar — Institutions tab |
| `subnav-tab-offerings` | SubNavBar — Offerings tab |
| `list-search-input` | Search input in UniversalList |
| `filter-drawer-trigger` | Filter button in ListSearchBar |
| `filter-drawer-apply` | Apply button in FilterDrawer |
| `card-program-favorite` | Favorite heart button on ProgramCard |
| `card-program-compare` | Compare button on ProgramCard |
| `card-program-primary` | Primary CTA ("Check Program") on ProgramCard |
| `signin-sheet-signin` | "Sign In" button in SignInSheet |
| `signin-sheet-create-account` | "Create Account" button in SignInSheet |
| `profile-tab-profile` | ProfileTabBar — Profile Information tab |
| `profile-tab-credentials` | ProfileTabBar — Account Credentials tab |
| `profile-tab-about` | ProfileTabBar — About Me tab |
| `profile-tab-activity` | ProfileTabBar — Activity tab |
| `profile-tab-favorites` | ProfileTabBar — Favorites tab |
| `profile-tab-comparisons` | ProfileTabBar — Comparisons tab |
| `profile-tab-bookings` | ProfileTabBar — Bookings tab |
| `profile-sign-out` | Sign Out button in ProfileTabBar |
| `compare-bar-compare-now` | CompareBar "Compare Now" button |
| `compare-bar-clear` | CompareBar clear (X) button |
| `specialist-book-session` | "Book Now" / "Selected" in SpecialistCard |
| `checkout-pay-now` | "Pay Now" button in OfferingCheckoutScreen |

## Adding new flows

1. Create a new `.yaml` file in `.maestro/flows/` with a numeric prefix.
2. Reference elements by `testID` (`id:` in Maestro) for i18n/RTL stability.
3. Add the flow to `docs/TEST_PLAN.md` with `(e2e)` annotation and check its box.
