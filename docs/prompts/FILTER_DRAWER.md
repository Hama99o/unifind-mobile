# FILTER_DRAWER.md — Filter system (authoritative)

The mobile filter system replaces the web's `UFFilterAccordion` + `UFFilterDropDown` + `UFFilterTags` (the sidebar filters on Find Programs / Find Institutions / Find Offerings). It is presented as a Gluestack `Actionsheet` ("filter drawer") opened from `UniversalList`'s filter button, plus a `FilterTags` chip row for active filters.

Built entirely on Gluestack UI + NativeWind.

---

## Filter config (target API)

A list screen declares its filters as a typed config, passed to `UniversalList` (`config.filters`):

```ts
type FilterType = 'multiSelect' | 'singleSelect' | 'range' | 'toggle';

interface FilterItem {
  key: string;                 // maps to the backend filter param
  label: string;               // t('...') key already resolved
  type: FilterType;
  // option source — static or fetched (Strapi catalog endpoints)
  options?: { value: string; label: string }[];
  fetchOptions?: () => Promise<{ value: string; label: string }[]>;
  // range bounds (e.g. tuition, duration)
  min?: number; max?: number; step?: number;
  unit?: string;               // e.g. '$', 'yrs'
  presentation?: 'accordion' | 'dropdown';   // matches web UFFilterAccordion vs UFFilterDropDown
}

type FilterValues = Record<string, string[] | [number, number] | boolean>;
```

Example (institutions, mirroring the web Find Institutions filters):
```ts
export const institutionFilterConfig: FilterItem[] = [
  { key: 'degreeLevel', label: t('degreeLevel'), type: 'multiSelect', fetchOptions: degreeLevelsApi.options, presentation: 'accordion' },
  { key: 'fieldOfStudy', label: t('fields'),     type: 'multiSelect', fetchOptions: studyFieldsApi.options, presentation: 'accordion' },
  { key: 'location',     label: t('location'),    type: 'multiSelect', fetchOptions: locationsApi.options,   presentation: 'accordion' },
  { key: 'tuition',      label: t('tuitionFees'), type: 'range', min: 0, max: 50000, step: 500, unit: '$' },
];
```

---

## Behaviour

- The **filter drawer** (`FilterDrawer`, an Actionsheet) renders each `FilterItem` by type:
  - `multiSelect` → checkbox list (Gluestack `Checkbox`), accordion-grouped when `presentation: 'accordion'`.
  - `singleSelect` → radio list / `Select`.
  - `range` → a dual slider with localized bounds (`useLocalization` for the currency/number labels).
  - `toggle` → Gluestack `Switch`.
- Option sources for catalog filters come from **Strapi** endpoints (degree levels, study fields, locations, languages) — fetched once, **locale-aware** (pass current `lng`).
- Footer: **Apply** (commits values → refetch) and **Clear all**. Apply count badge on the filter button.
- **`FilterTags`** renders active filters as removable chips above the list; removing a chip updates `FilterValues` and refetches.
- Filter values are translated into the correct **backend query** in the API file:
  - **Strapi**: `filters[field][$in]=...`, range → `filters[field][$gte]`/`[$lte]`.
  - **Node**: query params per endpoint.

---

## Rules

- All filter UI is Gluestack; no hand-rolled checkboxes/sliders.
- Every label and option through `t('...')`; both locales; RTL-correct.
- Range bounds and any numbers/currency via `useLocalization()`.
- The screen does not build filter UI itself — it provides the config; `UniversalList` + `FilterDrawer` render it.
- Parity rule: **every web filter must appear on mobile** with the same options and operator. A missing filter is a parity FAIL.
