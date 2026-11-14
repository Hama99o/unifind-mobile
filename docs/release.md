# Store release

This runbook tells how a build of UniFind gets to TestFlight, to the Google
Play internal track and, later, to store review. The generic process is in the
`release-mobile-app` skill of the Candle metarepo. This file holds the facts of
this app only.

## Current status

- Gate 1 (internal): not reached. The config is ready. No store build exists.
- Gate 2 (listed): the listing text and the graphics are ready. The privacy, data safety and age rating answers are not done.
- Gate 3 (submitted): blocked. See [Blockers before public review](#blockers-before-public-review).

> **Staging only.** No production backend exists yet. The `production` build
> profile of `eas.json` uses the STAGING URLs and the development Auth0 tenant.
> Use it for TestFlight and the Play internal track only. Never send this
> build to store review. Change the URLs first (issues #1 and #2).

## App facts

| Item | Value |
| --- | --- |
| Store name | `UniFind` (`expo.name`) |
| Bundle ID and package | `online.unifind` |
| Version | `1.0.0` (`expo.version`). EAS sets the build numbers (`appVersionSource: remote`, `autoIncrement`). |
| Expo owner and project | `candledigitals` / `unifind-mobile`, project ID `5d5e254a-d07a-4dc1-9afd-1d95dc573e93` |
| Apple team | `39U48Z4U53` (Candle Digitals) |
| App Store Connect app ID (`ascAppId`) | Not known yet. The main release session creates the app record and adds the ID to `submit.production.ios` in `eas.json`. |
| SKU | `CDS-UNIFIND` |
| Primary listing language | English (`en-US`). Arabic (`ar-SA`) is the second language. |
| Category | Education (secondary: Reference) |
| Google Play track | `internal`, as a draft |

## What lives where

| Item | Where |
| --- | --- |
| App icon | `assets/icon.png`: 1024 × 1024, RGB, no alpha |
| Android adaptive icon | `assets/android-icon-*.png`, background `#023055` |
| iOS photo usage string | `app.json`, `expo-image-picker` plugin. The plugin removes the camera and microphone permissions, because the app does not use them. |
| Encryption answer | `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` in `app.json` |
| Build profiles and backend URLs | `eas.json`, `build.preview` and `build.production` |
| Submit profile | `eas.json`, `submit.production` |
| App Store text, URLs, categories, age rating, review notes | `store.config.js`, sent with `eas metadata:push` |
| Google Play listing text | Play Console, by hand. Copy the text from `store.config.js`. |
| Store screenshots and graphics | `store-assets/` (see [Store graphics](#store-graphics)) |
| Privacy, data safety and content rating answers | App Store Connect and Play Console, by hand |

## Environment variables

### Build variables (`EXPO_PUBLIC_*`)

Expo writes these values into the JavaScript bundle at build time. A change
needs a new build.

| Variable | `preview` and `production` now | Note |
| --- | --- | --- |
| `EXPO_PUBLIC_NODE_API_URL` | `https://api-stg.unifind-lb.org/api` | Staging. Change for public review (#1). |
| `EXPO_PUBLIC_STRAPI_API_URL` | `https://cms.unifind.online` | The CMS catalog. |
| `EXPO_PUBLIC_AUTH_URL` | `https://auth-stg.unifind-lb.org` | Staging auth broker. Change for public review (#1). |
| `EXPO_PUBLIC_AUTH0_DOMAIN` | `dev-gim0725gfieuvjxt.us.auth0.com` | Development tenant (#2). |
| `EXPO_PUBLIC_AUTH0_CLIENT_ID` | `lx7YKrGuk3trDoIhNESkkbxqseU7Nbpr` | Public client ID, not a secret. |
| `EXPO_PUBLIC_AUTH0_AUDIENCE` | `https://dev-gim0725gfieuvjxt.us.auth0.com/api/v2/` | Causes the consent screen (#4). |
| `EXPO_PUBLIC_APP_NAME` | `UniFind` | |
| `EXPO_PUBLIC_DEFAULT_LANG` | `en` | |
| `EXPO_PUBLIC_DEFAULT_THEME` | `system` | |
| `EXPO_PUBLIC_PAYMENTS_ENABLED` | `false` | Payments stay off until Whish works (#7). |
| `EXPO_PUBLIC_STRAPI_BEARER` | EAS environment variable, not in `eas.json` | See the warning below. |

> **Before the first production build, create the CMS token in the EAS
> `production` environment.** The token is in the EAS `preview` environment
> only. Each build profile reads the EAS environment with its own name. Without
> the token, the CMS returns 403 and the catalog screens stay empty.
>
> ```sh
> eas env:create --environment production --name EXPO_PUBLIC_STRAPI_BEARER \
>   --visibility sensitive --value '<the token of the preview environment>'
> ```

### Shell variables for the EAS commands

Put these in your shell. Never commit them. The key files are in the Candle
vault.

```sh
export ASC_API_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
export ASC_API_KEY_ID=XXXXXXXXXX
export ASC_API_KEY_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export GOOGLE_PLAY_KEY_PATH=/path/to/play-service-account.json
# Only for eas metadata:push:
export APP_REVIEW_FIRST_NAME=… APP_REVIEW_LAST_NAME=…
export APP_REVIEW_CONTACT_EMAIL=… APP_REVIEW_PHONE=+961…
export APP_REVIEW_EMAIL=… APP_REVIEW_PASSWORD=…
```

`APP_REVIEW_EMAIL` and `APP_REVIEW_PASSWORD` are a demo account on the Auth0
tenant of the build. `store.config.js` stops with an error when one of the
`APP_REVIEW_*` variables has no value.

## Steps

### Gate 1: TestFlight and the Play internal track

1. Create the app record in App Store Connect for `online.unifind`, with the SKU `CDS-UNIFIND`.
2. Add its `ascAppId` to `submit.production.ios` in `eas.json`, then commit it.
3. Create the app in Play Console for `online.unifind`. Give the Play service account access to the app.
4. Create `EXPO_PUBLIC_STRAPI_BEARER` in the EAS `production` environment (see above).
5. Build both platforms:
   `eas build -p all --profile production`
6. Upload the first Android AAB by hand in Play Console, on the internal track. The Play API refuses the first upload of an app.
7. Send the iOS build to TestFlight:
   `eas submit -p ios --profile production --latest`
8. For the next Android builds, run:
   `eas submit -p android --profile production --latest`
9. Install the build from TestFlight and from the Play internal track. Do a sign-in, a profile save, a favorite and a comparison.

### Gate 2: listing

1. Run `eas metadata:push` to send the App Store text and review details.
2. Copy the English and Arabic text from `store.config.js` into the Play Console listing.
3. Upload the screenshots and the graphics from `store-assets/`.
4. Answer App Privacy (App Store Connect) and Data safety (Play Console). The app collects account data (email, name), profile data, a profile photo (optional), reviews, favorites and comparisons. It has no ads and no tracking.
5. Answer the age rating questions. The app shows user reviews of institutions and offerings.

If someone edits the listing in App Store Connect, run `eas metadata:pull`
before the next push. If you do not, the push overwrites the edit.

### Gate 3: review

Do not start gate 3 before the team closes all the blockers. Then:

1. Get the approval of UniFind for the listing text.
2. Submit the iOS build for review in App Store Connect.
3. Promote the Android release to production in Play Console, and send it for review.
4. After approval, release the app by hand. `store.config.js` sets no automatic release.

## Store graphics

| Size | Folder | Count |
| --- | --- | --- |
| iPhone 6.9 inch, 1320 × 2868 | `store-assets/ios/iphone-6.9/<lang>/` | 4 for each language |
| iPad 13 inch, 2064 × 2752 | `store-assets/ios/ipad-13/<lang>/` | 4 for each language |
| Android phone, 1080 × 1920 | `store-assets/android/phone/<lang>/` | 4 for each language |
| Play feature graphic, 1024 × 500 | `store-assets/android/feature-graphic.png` | 1 |
| Play icon, 512 × 512 | `store-assets/android/icon-512.png` | 1 |

`<lang>` is `en` or `ar`. All files are opaque PNGs.

The screenshots show the real app screens. The capture script runs the web
export of the app and gives demo data to the CMS and Node calls. The demo
institutions are fictional. Never put the tuition of a real university in a
store screenshot.

To make them again:

```sh
npx expo export --platform web --output-dir dist
npx playwright install chromium
npm run store:capture   # writes store-assets/raw/
npm run store:assets    # writes the framed images
```

The headlines are in `scripts/generate-store-assets.mjs` (`COPY`). The
screens and the demo data are in `scripts/capture-store-screens.mjs`. The
Arabic headlines need a system font with Arabic glyphs. macOS has one.

## Blockers before public review

| Issue | Blocker |
| --- | --- |
| [#1](https://github.com/jamilalshamaa/unifind-mobile/issues/1) | No production backend (Node API and auth broker). |
| [#2](https://github.com/jamilalshamaa/unifind-mobile/issues/2) | The Auth0 tenant is the development tenant `dev-gim0725gfieuvjxt`. |
| [#3](https://github.com/jamilalshamaa/unifind-mobile/issues/3) | Allowed Logout URLs must include `unifind://auth/callback`. |
| [#4](https://github.com/jamilalshamaa/unifind-mobile/issues/4) | The `/api/v2/` audience causes a consent screen. Use a custom API audience. |
| [#5](https://github.com/jamilalshamaa/unifind-mobile/issues/5) | New accounts get no default Role, so the profile save fails. |
| [#6](https://github.com/jamilalshamaa/unifind-mobile/issues/6) | Staging `GET /availability/dates` is empty, so nobody can test a booking. |
| [#7](https://github.com/jamilalshamaa/unifind-mobile/issues/7) | Whish sandbox credentials are missing. Payments stay off. |
| [#8](https://github.com/jamilalshamaa/unifind-mobile/issues/8) | No dedicated privacy policy page or support page. `store.config.js` uses the Terms page for now. |
| [#9](https://github.com/jamilalshamaa/unifind-mobile/issues/9) | No in-app account deletion (Apple guideline 5.1.1(v), Google Play). |
| [#10](https://github.com/jamilalshamaa/unifind-mobile/issues/10) | The welcome dialog tells about Whish payments, but payments are off. |

## Known limits

- `assets/icon.png` came from a small source image, so its edges are soft at 1024 px. Make it again from a vector logo when one is available.
- `npx expo-doctor` reports old package versions (`eslint-config-expo`, `typescript`, `expo`, `expo-constants`, `jest-expo`). They do not stop a build. Update them in a separate change with `npx expo install --check`.
- `npm run lint` fails, because the repo has no ESLint config file.
