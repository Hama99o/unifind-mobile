/** Normalized paginated result — both backends flatten into this. */
export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
}

/** Strapi list response → Page<T>. */
export function fromStrapi<T>(res: {
  data: T[];
  meta?: { pagination?: { page: number; pageCount: number; total: number } };
}): Page<T> {
  const p = res.meta?.pagination;
  return {
    items: res.data ?? [],
    page: p?.page ?? 1,
    pageCount: p?.pageCount ?? 1,
    total: p?.total ?? (res.data?.length ?? 0),
  };
}
