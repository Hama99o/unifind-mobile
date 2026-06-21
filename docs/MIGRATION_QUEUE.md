# MIGRATION_QUEUE.md — unifind web → mobile backlog (source of truth)

This board is the **single source of truth** for what is migrated from the web frontend (`unifind/frontend/`) into `unifind-mobile/`. Every page/feature has a stable kebab **slug** and a status. `/migrate-loop` and `/migrate-next` read and write this file.

Two layers:
1. **The board** (status tables) — what `/migrate-loop` claims, in priority order.
2. **Detailed scope per feature** (lower section) — the EXHAUSTIVE checklist of every search, filter, sort, tab, card field, action, detail section, form field, and option. **A feature is not done until every item in its scope is built or explicitly marked "web has none".** Nothing is dropped silently.

**Status legend:** ⬜ pending · 🚧 in_progress · ✅ done · ⛔ blocked
(The legend row's slug is the literal word `pending` and is excluded by the claim grep.)

---

## Claim protocol (atomic, parallel-safe)

Claiming a feature is an atomic `mkdir` of `unifind-mobile/docs/.migration-locks/<slug>.lock` (gitignored). The **lock** — not this markdown — is the real mutex. Locks older than **90 min** are abandoned and reclaimable. See `/migrate-next` for the exact bash.

1. Pick the first `⬜ pending` row in board order (top to bottom). 2. `mkdir` its lock. 3. Flip to 🚧 + add yourself under **Active runners**. 4. Migrate to 100% against its **Detailed scope** until parity PASS. 5. Flip to ✅ (or ⛔ + reason), `rm -rf` the lock, remove your Active-runner line.

> **Order is priority.** Foundation first — nothing else can be migrated until the shell, API layer, auth, i18n, and shared list/filter/compare infra exist. **DRY:** the shared cards/components built in early features are reused by later ones — never rebuild them.

---

## Board

### 0. Foundation (must come first — blocks everything)

| St | Slug | Feature |
|----|------|---------|
| ✅ | `app-scaffold` | Expo app + Gluestack UI + NativeWind + theme tokens (turquoise/prussian/barc) + **global providers** (auth, splash, Toast host, AlertDialog host, SignInSheet host, RTL dir). NOTE: **light-mode only** (web app has no dark mode — intentional parity, not a gap) |
| ✅ | `i18n-setup` | i18n en + ar, flat camelCase `translation` namespace, RTL, `useCustomTranslation` + `useLocalization` (incl. **Asia/Beirut** TZ) |
| ✅ | `api-layer` | `http` (Strapi) + `nodeApi` (Node + Auth0 interceptor + 401 refresh-retry) + service layer (api/ vs services/) |
| ✅ | `reference-data` | countries + dial codes (`/country`), currencies (USD/LBP via useLocalization), languages (`/language`) — used in profile + filters |
| ✅ | `auth-login` | Auth0 PKCE (expo-auth-session AuthRequest) login/signup/refresh/logout + expo-secure-store (web localStorage fallback) + `authStore` + `SignInSheet` + `useAuthGate` + `/auth/callback` web route — see `prompts/AUTH_SECURITY.md`. **Needs Auth0 dashboard callback/Google config to run** |
| ✅ | `upload-service` | `avatarService` — 3-step Cloudinary (sign → upload → `/cloudinary/photo`), used by profile photo |
| ✅ | `navigation-shell` | Bottom tabs (Home · Program Explorer · Growth · Profile) + `ScreenContainer` + `AppHeader` + `EmptyState` + breadcrumbs |
| ✅ | `universal-list` | `UniversalList<T>` (search/sort/filter/infinite-scroll/pull-refresh/states) — built in find-institutions |
| ✅ | `filter-system` | `FilterDrawer` (Actionsheet) + `FilterTags` + filter configs (multi/single/range) — built in find-institutions |
| ✅ | `compare-favorites-infra` | `favoritesStore` + `compareStore` (max 5) + `CompareBar` + `useSelection` hook — built across profile + find-institutions |
| ✅ | `shared-cards` | `ProgramCard` · `InstitutionCard` · `OfferingCard` · `SpecialistCard` · `ReviewSection` · `RatingStars` · `InfoCard` — all built + reused |

### 1. Discovery (lists)

| St | Slug | Feature | Web route |
|----|------|---------|-----------|
| ✅ | `home` | Home — hero, featured, numbers, guide steps, testimonials, welcome popup | `/[locale]` |
| ✅ | `find-programs` | Find Programs list | `/[locale]/find/programs` |
| ✅ | `find-institutions` | Find Institutions list | `/[locale]/find/institutions` |
| ✅ | `find-offerings` | Find Offerings / Growth-Center hub | `/[locale]/find/offerings`, `/[locale]/growth-center` |
| ✅ | `program-explorer` | Program Explorer landing | `/[locale]/program-explorer` |

### 2. Detail pages

| St | Slug | Feature | Web route |
|----|------|---------|-----------|
| ✅ | `institution-detail` | Institution detail | `/[locale]/program-explorer/institutions/[slug]` |
| ✅ | `program-detail` | Program detail | `.../institutions/[slug]/programs/[id]` |
| ✅ | `offering-detail` | Offering detail (specialist + booking) | `/[locale]/growth-center/offerings/[slug]` |

### 3. Booking & Payment

| St | Slug | Feature | Web route |
|----|------|---------|-----------|
| ✅ | `offering-checkout` | Checkout (promo + payment) | `/[locale]/find/offerings/checkout/[id]` |
| ✅ | `payment-status` | Payment success/failure | `.../checkout/payment-status` |

### 4. Profile (auth-gated)

| St | Slug | Feature | Web location |
|----|------|---------|-----------|
| ✅ | `profile-shell` | Profile shell — tabs, editable photo, name, sign-out | `/[locale]/profile` |
| ✅ | `profile-information` | Profile info form | `UFProfileInformation` |
| ✅ | `account-credentials` | Password change | `UFAccountCredentials` |
| ✅ | `about-profile` | About — overview + academic + professional background | `UFAboutProfile` |
| ✅ | `profile-activity` | Activity — reviews / comments / reactions | `UFProfileActivity` |
| ✅ | `profile-notifications` | Intentionally OMITTED — disabled/commented-out on web (no live data) → parity is to not show it. Not a gap. | `UFProfileNotifications` |
| ✅ | `profile-favorites` | Favorites — programs / institutions / offerings | `UFProfileFavorites` |
| ✅ | `profile-comparisons` | Comparisons — programs / institutions | `UFProfileComparisons` |
| ✅ | `profile-bookings` | Bookings history | `UFProfileBookings` |
| ✅ | `booking-detail` | Booking detail | `/[locale]/profile/booking` |

### 5. Compare

| St | Slug | Feature | Web route |
|----|------|---------|-----------|
| ✅ | `compare` | Compare — programs / institutions tables | `/[locale]/compare` |

### 6. Static / misc

| St | Slug | Feature | Web route |
|----|------|---------|-----------|
| ✅ | `footer-newsletter-contact` | `AppFooter` (logo, contact info, social links, nav, newsletter subscribe → `/newsletter/subscribe`, Terms link) on Home. NOTE: web "Contact Us" = the footer (no contact form); FAQ = dead stub on web (never rendered) → both correctly omitted |
| ✅ | `terms-conditions` | Terms & Conditions screen — static `terms.*` i18n (en+ar), all sections | `/[locale]/terms-conditions` |
| ✅ | `not-found` | 404 screen (`app/+not-found.tsx`) — branded, "Go to Home" | `not-found.tsx` |

---

## Active runners
<!-- one line per in-flight feature: `slug — RUNNER_ID — startedAt` -->
_(none)_

---
{"error":"Not found"}
# Detailed scope per feature (EXHAUSTIVE — nothing dropped silently)

> Legend: **🔎 search · 🧰 filters · ↕️ sort · 🗂 tabs · 🃏 card/columns · ⚡ actions · 📄 detail sections · 📝 form · ➕ other · ∅ empty · 🔐 auth-gated**.
> "**(omit — web has none)**" means the web page does not have it; do not invent it. **Print / export / import do NOT exist** in the consumer web app — never add them.

## Foundation

- **app-scaffold** — Expo Router project; install Gluestack UI + NativeWind; theme tokens for brand colors (turquoise `#44DED1`, prussian `#023055`, barc `#F29049`, lightGreen, …) in light + dark; Poppins (en) + Tajawal (ar) fonts; `confirmAlert` helper over Gluestack `AlertDialog`; **global providers**: AuthProvider, global loading/spinner (web `UFLoadingContext` equivalent — counter-based overlay), Toast host (Gluestack), RTL `dir` per locale. (Analytics: web uses GTM `dataLayer` events e.g. `Subscribe` — mobile equivalent (Firebase/Segment) optional; confirm before adding.)
- **i18n-setup** — `en` + `ar` JSON (flat camelCase, reuse web keys verbatim); `useCustomTranslation`; `useLocalization` (date / number / USD+LBP currency / percent / **Asia/Beirut** TZ, 12-hour); RTL flip util; language switch.
- **api-layer** — `http` (Strapi: baseURL + Bearer, populate/filter/sort/`pagination[page|pageSize]`); `nodeApi` (Node: baseURL + Auth0 token interceptor); `Page<T>` normalizer flattening Strapi `{data,meta.pagination}` and Node `{success,data}` into `{items,page,pageCount,total}`; typed error surfacing; **service-layer split** (`api/` transport vs `services/` orchestration — see prompts/AUTH_SECURITY.md §3).
- **reference-data** — `GET /country` (countryName, countryCode, **countryDialCode** for the phone field), currencies (USD/LBP + symbols, feed `useLocalization`), `GET /language`. Fetch once + cache; never hardcode dial codes or currency symbols.
- **auth-login** — see `prompts/AUTH_SECURITY.md` (authoritative). Auth0 PKCE native login + signup; token refresh on expiry + foreground; logout (Auth0 `/v2/logout`); token in `expo-secure-store`; `authStore` (`isLoggedIn,user,accessToken,refresh`); `SignInSheet` (Actionsheet → Sign in / Create account, resume pending action); `useAuthGate()` wrapping protected actions; whole-page-gated screens redirect to sign-in when logged out. `userID` = Auth0 `sub` split on `|`.
- **upload-service** — `uploadService.uploadAvatar(file)`: `GET /cloudinary/sign` → direct Cloudinary upload (image only, ≤10MB) → `POST /cloudinary/photo` (auth) → update `authStore.user.picture`. Reused for the profile photo. See AUTH_SECURITY.md §4.
- **navigation-shell** — bottom tabs Home / Find / Growth-Center / Profile; `ScreenContainer` (+`padded`); `AppHeader` (title, `showBack`, RTL-flipped back); breadcrumb-equivalent; `EmptyState` (icon+title+desc+CTA).
- **universal-list** — see UNIVERSAL_LIST.md. Owns 🔎/🧰/↕️/🗂, infinite scroll (replaces UFPagination), pull-to-refresh, skeleton/empty/error.
- **filter-system** — see FILTER_DRAWER.md. `FilterDrawer` renders multiSelect (checkbox, accordion-grouped) / singleSelect / range (slider) / toggle; option sources from Strapi, locale-aware, with counts; Apply + Clear-all + count badge; `FilterTags` removable chips.
- **compare-favorites-infra** — see COMPARE_FAVORITES.md. `favoritesStore`, `compareStore` (max 5 + overflow toast), `FavoriteButton`, `CompareButton` (toggles "In Compare List"), sticky `CompareBar` (count + Compare CTA + clear). All 🔐.
- **shared-cards** — `ProgramCard`(UFCard1), `InstitutionCard`(UFCard2), `OfferingCard`(UFCardOffering), `SpecialistCard`(UFSpecialistOfferingCard), `RatingStars`, `ReviewSection` (avg + distribution 5→1 + category ratings + paginated reviews + add-review form), `InfoCard`(UFCard4: icon+title+desc+optional URL), `RankingCard`(UFCard5). **Reused by all detail/list features — never duplicated.**

## home  (`/[locale]`)
- 📄 sections: hero "find your…" CTA; **featured programs** carousel (`ProgramCard`); **numbers** stats (institutions / programs / registered users / yearly visitors); **guide steps** (Explore / Compare / Choose / Apply / Discover / Connect / Look-into / Request — each title+desc); **why-us** cards; **latest articles**; **testimonials** (student say); **welcome popup** (2026 release: Arabic, Whish, Growth Center — confetti optional, show once).
- ⚡ CTAs route to find-programs / find-offerings. 🔎/🧰/↕️ (omit — web has none here). 🔐 none.

## find-programs  (`/[locale]/find/programs`)
- 🔎 search → program name/description, `?search=`.
- 🧰 filters (all multiSelect, options from Strapi, each with count): **Degree Level** (`APIGetDegreeProgram`), **Field of Study** (`APIGetFieldStudyProgram`), **Location** (city+governorate, `APIGProgramsLocations`), **Tuition Range** (`APIGetTuition`, "$min-$max"), **Duration** ("X-Y Years", `APIGetProgramDuration`), **Language** (`APIGetLanguagesPrograms`).
- ↕️ sort: Tuition Low→High (`tuition_asc`), Tuition High→Low (`tuition_desc`), Default.
- 🃏 `ProgramCard`: institution logo, program title, university name, description extract, degree, location, duration (formatted), fees min–max, language, favorite state.
- ⚡ Favorite 🔐, "Check Program" (→ program-detail, no auth), Add to Compare 🔐 (max 5, "In Compare List").
- pagination → infinite scroll. ∅ zero-count state. toasts on favorite add/remove/error.

## find-institutions  (`/[locale]/find/institutions`)
- 🔎 search → institution name, `?search=`.
- 🧰 filters (multiSelect + count): **Degree Level** (`APIGetProgramsInstDegree`), **Field of Study** (`APIGetFieldInstitution`), **Location** (gov+city, `APIGetCampusInstitution`), **Tuition Range**.
- ↕️ sort: Default (+ tuition asc/desc where present).
- 🃏 `InstitutionCard`: logo, name, cover photo, label, title+subtitle, ranking (position+name), description, location (city,country), fees, rating stars (avg via `fetchInstitutionRating`).
- ⚡ Favorite 🔐, "Check Institution" (→ institution-detail), Add to Compare 🔐 (max 5).
- pagination → infinite scroll. grid 2-col on wide. 🔐 favorite + compare.

## find-offerings  (`/[locale]/find/offerings` + `/[locale]/growth-center`)
- 🗂 tabs: **Offerings** (active), **Specialists** (disabled — "Coming Soon"; keep disabled).
- 🔎 search → category + field keywords ("Insert keyword here").
- 📄 Offerings tab: **"What am I looking for?"** category grid (`UFFindCard`: label+icon, → `?category=`); **Fields** grid (label+icon, → `?field=`).
- Specialists tab (disabled): 8 hardcoded skill chips (App Navigation, Business Presentation, Career Counseling, CV Writing, …) — render disabled to match web.
- ⚡ tapping a category/field navigates to the filtered offerings list. 🔐 none.

## program-explorer  (`/[locale]/program-explorer`)
- Landing/wrapper into program discovery. Mirror web behavior (likely routes to find-programs/institutions). Confirm the exact redirect/content when building.

## institution-detail  (`/[locale]/program-explorer/institutions/[slug]`)
- breadcrumb Home → Program Explorer → Institutions → name.
- header (`UFCard3`): logo, name, acronym, ratings+stars, **Know More** (opens website; lock if logged out), **Add a Review** (scroll), Favorite 🔐, **Add to Compare** 🔐, compare-limit msg.
- detail fields: Main Campus, Website (link), Email (mailto), # Programs.
- 📄 **Overview**: rich text + `InfoCard`s (institutionInfo) + `RankingCard`s (ranking-star, position, url).
- 📄 **Academic Programs & Degrees**: 🗂 degree tabs (Bachelors/Masters/PhD/Others, only if present); 🔎 in-tab faculty/degree search; per-faculty accordion (name, description, campuses, nested degrees → program-detail links).
- 📄 **Tuition Fees** (only if `showTuitionSection`): table cols **Tuition Type / Min / Max**, optional row link.
- 📄 **Reviews** (`ReviewSection`): avg+stars, total, distribution 5→1, categories **Education Quality / Campus Facilities / Student Life**, paginated reviews (5/pg: author+avatar, rating, date, category ratings, comment).
- 📝 **Leave a Review** (🔐, logged-in only): Campus Attended* (dropdown), Faculty* (dep. on campus), Program Studied* (dep. on faculty), Start Year* (1950→now), End Year* (dep. on start), General Rating* (≥1), Education Quality* (≥1), Campus Facilities* (≥1), Student Life* (≥1), Experience (textarea, optional); Submit; validation error if any rating <1. Logged-out → "Sign in to Submit a Review" CTA.

## program-detail  (`.../institutions/[slug]/programs/[id]`)
- breadcrumb Home → Program Explorer → institution → program.
- header (`UFCard3`): institution logo, program title, institution name, ratings+stars, **Know More** (knowMoreURL), **University Page** (→ institution-detail), Favorite 🔐, **Add to Compare** 🔐, rating count.
- detail fields: Main Campus, Degree, # Years (range), # Credits (range), Fees/Credit (min–max), Language.
- 📄 **Program Overview**: rich text; language `InfoCard`s; programInfo `InfoCard`s; **campus selector** (radio) + **Google map** (→ `react-native-maps`) for selected campus coords.
- 📄 **Admission Requirements** (if any): `InfoCard` grid.
- 📄 **Similar Programs** (if any): horizontal slider of `UFSingleProgramCard` (logo, title, institution, degree, location, duration, fees, language; Favorite 🔐; "Check Program"; Add to Compare 🔐) — load more on scroll.

## offering-detail  (`/[locale]/growth-center/offerings/[slug]`)  — web enforces `/en` only
- breadcrumb Home → Growth Center → Offering → title.
- header (`UFCard3` offering): title, specialists (avatars+names), ratings+stars, **Book a seat** (scroll), Favorite 🔐, rating count.
- detail fields: Current Location, Available Online (Y/N), Session Duration (min), # Sessions, Certificate of Attendance (Y/N).
- 📄 **Offering Overview** (if desc/info): rich text + `InfoCard`s (icon/title/desc/url).
- 📄 **Core Learnings** (if results): `InfoCard` grid.
- 📄 **Recommended To Have** (if requirements): `InfoCard` grid.
- 📄 **Choose Your Specialist**: mode selector tabs (**Group Live / Group Online / 1-on-1**, only existing modes else `EmptyState`); specialist grid (`SpecialistCard`: name, headline, bio, avatar, "+"; **Book Now / Selected**; Favorite 🔐; selecting resets date/time); **Available Sessions (Lebanon time)**: day cards (date, weekday, slot count, selected) → time slots ("HH:MM-HH:MM", selected) → pricing (base struck + discounted in barc, or single) → **Book a Session** (POST `/booking` → checkout; toast on error). 🔐 booking requires login.
- 📄 **Reviews** (`ReviewSection`, if any): categories **Helpfulness / Specialist / Recommend Offering**.

## offering-checkout  (`.../checkout/[id]`)  — `/en` only; 🔐 redirect home if logged out; if already paid → not-found
- breadcrumb Home → Offering → Checkout.
- left: **Booking Session Card** (title, image, meeting link, original+discounted price, specialist, date, time (12h + range), currency symbol, session mode, duration); **Booking Details** (Questions textarea, optional); **Promo Code** (input "Apply Here" + **Apply** [tags icon]; error display) → applied state shows promo name+code, discount, **Remove** (X).
- right: **Pricing** (Subtotal; Promo Discount −amount if applied; **Total** bold); **Payment Method** tabs: **Whish Money** (active → **Pay Now**, gradient, → Whish collect URL), **Card** (disabled "Soon"). toasts on promo apply/remove/error.

## payment-status  (`.../checkout/payment-status?status&bookingRef`)  — `/en` only
- success: circle-check (turquoise), "Congratulations!", message, **Go To Bookings** (→ profile bookings).
- failure: circle-xmark (red), "Payment Failed", message, **Try To Pay** (→ checkout).

## profile-shell  (`/[locale]/profile`)  — 🔐 redirect home if logged out
- header: gradient bg, **editable photo** (tap → **`upload-service`** → update avatar in `authStore`), user full name.
- 🗂 tabs (sidebar on wide / horizontal on narrow): Profile Information, Account Credentials, About Me, Activity, My Favorites, My Comparisons, My Bookings. (Notifications tab exists but is **disabled** on web — keep disabled; slug `profile-notifications` tracks it.)
- **Sign-Out** → confirm modal (Cancel / Sign-Out → logout). Each tab body is its own slug below — build as separate small files mounted in the shell.

## profile-information  (`UFProfileInformation`)  — 🔐
- 📝 First Name*, Last Name*, Email (read-only), Phone Number + **dial-code selector** (searchable, from `reference-data` `/country`), Date of Birth (date), Role (searchable, API options), Country (searchable, `countriesOptions`), City, Gender (Male/Female). Save → `PATCH /userinfo`; success/error toast.
- editable avatar uses **`upload-service`** (do not re-implement the upload flow).

## account-credentials  (`UFAccountCredentials`)  — 🔐
- 📝 Email (read-only), Old Password* (non-empty), New Password* (≥8, upper, lower, number, special, ≠ old). **Change Password** → Auth0 change_password; status message.

## about-profile  (`UFAboutProfile`)  — 🔐
- 🗂 sub-tabs: **Overview / Academic Background / Professional Background**.
- Overview: bio rich-text; **Skills** (add input + chips w/ remove); **Languages** (add + level: Beginner/Intermediate/Advanced/Native, chips w/ remove).
- Academic Background: "+ Add"; card per entry (school/university, degree, field, start year, end year, grade/GPA optional) + Edit/Delete. API `/academic-backgrounds`.
- Professional Background: "+ Add"; card per entry (company, job title, employment type dropdown, start, end + "Currently working" checkbox, description) + Edit/Delete. API `/professional-backgrounds`.

## profile-activity  (`UFProfileActivity`)  — 🔐
- 🗂 sub-tabs: **Reviews / Comments / Reactions** (each paginated ~4/pg).
- Reviews card: target type+name, rating, category ratings, comment, date, **Delete**.
- Comments card: parent item, text, date, **Delete**.
- Reactions card: reaction type, item, date.

## profile-notifications  (`UFProfileNotifications`)  — 🔐
- Notifications list (unread + all). **Currently disabled on web** — build the screen but keep the tab disabled to match web; parity = disabled. Confirm endpoint before enabling.

## profile-favorites  (`UFProfileFavorites`)  — 🔐
- 🗂 sub-tabs: **Programs** (`ProgramCard`), **Institutions** (`InstitutionCard`), **Offerings** (`OfferingCard`). Each via `UniversalList`.
- ⚡ Remove-favorite (heart toggle), View, Add to Compare 🔐 (max 5). API `GET /favorites/:id/:type` (paginated).

## profile-comparisons  (`UFProfileComparisons`)  — 🔐
- 🗂 tabs: **Programs / Institutions** tables; columns dynamic from attributes; row actions **Remove**, **View More**. (Shares logic with `compare`.)

## profile-bookings  (`UFProfileBookings`)  — 🔐
- list (paginated). row: booking ref, offering title+image, specialist, date, time (12h), duration, price, **status badge** (Pending=orange, Requested=teal, Scheduled=blue, Completed=green, Canceled=red), **View Details** → booking-detail.

## booking-detail  (`/[locale]/profile/booking?bookingReference`)  — 🔐, `/en` only
- breadcrumb Home → Profile → My Bookings → Booking Details.
- status badge; **Session Card** (offering title+image, specialist, date+time, mode, duration, original+discounted price, currency); **progress bar** (status); **payment info** (status + method); **meeting link** (if any); **notes/description** (if any).

## compare  (`/[locale]/compare`)  — 🔐 redirect home if logged out
- sub-nav: Programs / Institutions / Offering (links to find pages). 🗂 header tabs: **Programs / Institutions**.
- **Programs** table cols: University, University rating (stars), Location, Degree, Department, Duration, # Credits, Tuition Fees, Language, Specialisations, + dynamic (programInfo, requirements). row: **Remove**, **View More**. ∅ "Please select programs to compare." + link to find-programs.
- **Institutions** table cols: Acronym, Location, Foundation Year, Website, Email, Phone, Ranking, Tuition, Tags, + dynamic (institutionInfo). row: **Remove**, **View More**. ∅ "Please select institutions to compare." + link to find-institutions.
- Mobile: render as horizontally-scrollable comparison (Gluestack cells) or stacked per-attribute cards on narrow widths; every column above is a row label.

## footer-newsletter-contact  (`UFContactUs`, `UFFAQ`)
- **Newsletter subscribe**: email input + subscribe button → `POST /newsletter/subscribe`; success/error toast. (Web fires a GTM `Subscribe` event — analytics optional on mobile.)
- **Contact Us**: name + email + message form → backend email endpoint (`/email/...` contact submission); confirmation toast. Validate email.
- **FAQ**: accordion (`UFFAQ`) — content from i18n keys; Gluestack `Accordion`.
- Surface these where the web shows them (footer / about / home). Build once, reuse.

## terms-conditions  (`/[locale]/terms-conditions`)
- gradient heading; Section 1 (intro + sub1.1 title+3 bullets, sub1.2 3 bullets, sub1.3 title+text); Section 2 (sub2.1 title+text+6 bullets, sub2.2 title+text+5 bullets, sub2.3/2.4/2.5 title+text); Conclusion (title+text). All from `terms.*` keys; RTL-aware. Static.

## not-found  (`not-found.tsx`)
- 404 UI: illustration + message + CTA back home.

---

## Notes
- **Two backends:** catalog (institutions/programs/offerings/degrees/fields/campuses) = **Strapi** via `http`; user data (favorites/compares/reviews/bookings/payments/userinfo/backgrounds/skills) = **Node** via `nodeApi` (+ Auth0 token).
- **Auth0** gates favorite/compare/book/review/profile/checkout/compare-page. Logged out → `SignInSheet` (or redirect for whole-page-gated screens, matching web).
- **No print / export / import** anywhere in the consumer app — do not add them.
- Locales **en + ar** (ar RTL); every key in both files.
- **DRY:** `shared-cards` + `universal-list` + `filter-system` + `compare-favorites-infra` are built once and reused; rebuilding any of them in a later feature is a parity/quality FAIL. Keep every file ≤ ~300 lines.
