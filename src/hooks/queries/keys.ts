/**
 * React Query keys — one place so screens share cache entries and mutations can
 * invalidate them. Every catalog key includes the locale (en/ar content differs).
 */
export const qk = {
  program: (slug: string, locale: string) => ["program", slug, locale] as const,
  relatedPrograms: (fieldIds: number[], locale: string, excludeSlug: string) =>
    ["relatedPrograms", fieldIds.join(","), locale, excludeSlug] as const,
  averageRating: (type: string, documentId: string) => ["averageRating", type, documentId] as const,
  institution: (slug: string, locale: string) => ["institution", slug, locale] as const,
  offering: (slug: string, locale: string) => ["offering", slug, locale] as const,
  /** Per-user data: always scoped to the user so logout/login never mixes caches. */
  user: (userId: string | undefined, ...rest: (string | number)[]) => ["user", userId ?? "anon", ...rest] as const,
};
