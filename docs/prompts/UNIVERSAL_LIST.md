# UNIVERSAL_LIST.md — `UniversalList<T>` (authoritative)

`UniversalList<T>` is the **only** component used for feature list screens in `unifind-mobile`. It replaces the web's `UFLayoutWithSidebar` + `UFCard*` + `UFSort` + `UFPagination` stack. Never hand-write a `FlatList` for a feature list — configure `UniversalList` instead.

It is built entirely on Gluestack UI + NativeWind. It owns search, filtering, sorting, pagination (infinite scroll), pull-to-refresh, and the loading/empty/error states so each screen doesn't reinvent them.

---

## Contract (target API)

```tsx
<UniversalList<Institution>
  config={{
    // data
    queryKey: ['institutions', filters, sort, search],
    fetchPage: ({ page, search, filters, sort }) =>
      institutionsApi.list({ page, search, filters, sort }),   // returns { items, page, pageCount, total }

    // header
    title: t('institutions'),
    searchPlaceholder: t('searchPlaceholder'),
    searchable: true,

    // sort (maps web UFSort)
    sort: {
      options: [
        { key: 'default',      label: t('default') },
        { key: 'tuition_asc',  label: t('lowToHigh') },
        { key: 'tuition_desc', label: t('highToLow') },
      ],
      default: 'default',
    },

    // filters → see FILTER_DRAWER.md
    filters: institutionFilterConfig,

    // tabs (optional — e.g. compare page Programs/Institutions)
    tabs: undefined,

    // rendering
    renderItem: (item) => <InstitutionCard institution={item} />,
    keyExtractor: (item) => item.id,

    // empty state
    empty: { title: t('emptyTitle'), description: t('emptyDescription') },
  }}
/>
```

`fetchPage` returns a normalized page regardless of backend:
```ts
interface Page<T> { items: T[]; page: number; pageCount: number; total: number; }
```
- **Strapi** responses (`{ data, meta.pagination }`) are normalized in the API file.
- **Node** responses (`{ success, data }` + `page`/`limit`) are normalized in the API file.

---

## Responsibilities `UniversalList` owns (so screens don't)

- **Search** — debounced search box (Gluestack `Input`), wired into `fetchPage`'s `search`.
- **Filter** — a filter button opening the `FilterDrawer` (Actionsheet); active filters shown as `FilterTags` above the list; clearing tags refetches.
- **Sort** — a sort control (Actionsheet/Select) from `config.sort`.
- **Tabs** — optional segmented control above the list.
- **Pagination** — **infinite scroll** (`onEndReached` → next page); replaces `UFPagination`. Shows a footer spinner while loading more.
- **Pull-to-refresh** — `RefreshControl` resets to page 1.
- **States** — skeleton list while loading the first page; `EmptyState` when `total === 0`; an error state with a retry button on fetch failure.
- **RTL** — list layout and card direction respect `ar`.

---

## Rules

- Cards passed to `renderItem` are compositions from `src/components/cards/` — Gluestack only.
- All copy via `t('...')`; both locales.
- Dates/numbers/currency inside cards via `useLocalization()`.
- The screen file stays thin: build the `config`, pass it in. No `FlatList`, no manual pagination math, no bespoke loading spinners in the screen.
- Data fetching uses the app's query layer (e.g. `@tanstack/react-query` if installed) keyed by `queryKey`; otherwise the list manages its own paged state — but the screen never does it by hand.

---

## When NOT to use it

- Pure **detail** screens (use `ScreenContainer` + `Card` sections).
- Small fixed lists inside a detail page (e.g. a program's campuses) — a simple mapped `VStack` of Gluestack cards is fine; `UniversalList` is for the top-level searchable/filterable/paginated feature lists (Find Programs, Find Institutions, Find Offerings, Favorites, Bookings).
