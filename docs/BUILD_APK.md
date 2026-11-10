# Building the Android APK (Expo / EAS)

UniFind mobile is an **Expo managed** project — APKs are built in the cloud with **EAS Build**. No local Android SDK needed.

## Setup (already done)

- **Expo account:** `hama990` — project page: https://expo.dev/accounts/hama990/projects/unifind-mobile
- **EAS project ID:** `05077f74-8f3c-48ff-b96a-05ffa039d153` (in `app.json` → `extra.eas.projectId`)
- **Signing keystore:** generated and stored remotely on Expo's servers
- **`eas.json`** defines the profiles:
  - `preview` → installable **`.apk`**, staging backends baked in via the `env` block
    (Node API `https://api-stg.unifind-lb.org/api`, Strapi CMS `https://cms.unifind.online`,
    Auth0 public client config)
  - `production` → `.aab` (Play Store format)
- **`EXPO_PUBLIC_STRAPI_BEARER`** is stored as a **sensitive EAS environment variable**
  (preview environment) on Expo's servers — NOT in `eas.json`. Manage it with
  `eas env:list preview` / `eas env:update`. Rotate it there when the token rotates.

## How to build an APK

```bash
cd unifind-mobile
nvm use 22          # Node 22 required — Node 18 fails with "configs.toReversed is not a function"
eas build -p android --profile preview
```

Runs on Expo's servers (free tier queues 10–60 min, build ~10–15 min). The finished
build page gives a direct APK download link (valid ~30 days) — shareable as-is via
WhatsApp/email. Recipients install by opening the APK and allowing "unknown sources".

```bash
eas build:list                 # recent builds + status
eas build:view <build-id>      # details / artifact URL
```

## Local build (no Expo queue)

The Android SDK is installed at `~/Android/Sdk` (`ANDROID_HOME` set in `~/.bashrc`). Java 17.

```bash
cd unifind-mobile
nvm use 22
npm install --legacy-peer-deps        # if node_modules is stale (Docker installs drift)
npx expo prebuild -p android          # regenerates android/ (gitignored)
cd android && ./gradlew assembleRelease
# → app/build/outputs/apk/release/app-release.apk
```

The `EXPO_PUBLIC_*` values come from `.env` at bundle time (or export them in the shell
to override). Release APKs are signed with the auto-generated **debug keystore** — fine
for direct sharing, NOT for the Play Store. Note the EAS cloud APK uses a **different**
key: a phone can't upgrade from one to the other without uninstalling — pick one channel
per tester. First build ~20 min (downloads Gradle/NDK); later builds are a few minutes.

## Env var rules

- `.env` is **gitignored and never uploaded** to EAS — local dev only.
- Shipped APKs get their env from `eas.json` `env` + EAS server env vars (preview environment).
- Anything `EXPO_PUBLIC_*` is **baked into the APK and extractable** — only non-secret
  config belongs there (the Strapi bearer is a public read-only token per AUTH_SECURITY §6).

## Payments switch

- `EXPO_PUBLIC_PAYMENTS_ENABLED` (see `src/config/payments.ts`) is the ONE switch for
  booking → Whish payment. Anything but `"true"` (including unset) = OFF: the Book /
  Pay buttons are replaced by a "coming soon" notice and no pending booking is created.
- It is `"false"` in the `preview` profile. The `production` profile has no `env`
  block yet, so it is OFF there too. Turn it on only after the Whish merchant
  account is live (steps: `docs/QA_REPORT_2026-11-10.md` §3.5). It is baked in at
  build time, so changing it needs a rebuild.

## Auth0 caveat (standalone builds)

Login in a standalone APK redirects via the `unifind://` scheme instead of the Expo Go
proxy. If login fails with a "callback URL mismatch" error, add the app's callback URL
(shown in the Auth0 error message) to **Allowed Callback URLs** of the Auth0 application
`lx7YKrGuk3trDoIhNESkkbxqseU7Nbpr` in the Auth0 dashboard.

## Versioning

- User-visible version: `app.json` → `expo.version` — bump manually per release.
- Android `versionCode`: managed **remotely by EAS** (`cli.appVersionSource: "remote"`);
  the `versionCode` in `app.json` is ignored by EAS builds.
