/**
 * programDetailApi — Strapi CMS transport for the Program Detail screen.
 * Backend: Strapi (http). No user-data here.
 *
 * getBySlug: GET /api/programs?filters[slug][$eq]=&filters[locale][$eq]=&status=draft
 *            with the full PROGRAM populate (same as list but adding location coordinates).
 * getRelated: GET /api/programs by specialisations.studyField.id[] (correct bracket form).
 */

import { http } from "@/api/http";
import {
  PROGRAM_LIST_FIELDS,
  PROGRAM_LIST_POPULATE,
  addPopulate,
  type ProgramListItem,
} from "@/api/programsApiTypes";
import type { Page } from "@/types/page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildBaseParams(locale: "en" | "ar"): URLSearchParams {
  const qp = new URLSearchParams();
  qp.append("filters[locale][$eq]", locale);
  PROGRAM_LIST_FIELDS.forEach((f, i) => qp.append(`fields[${i}]`, f));
  Object.entries(PROGRAM_LIST_POPULATE).forEach(([key, val]) =>
    addPopulate(
      qp,
      key,
      val as string[] | { fields?: string[]; populate?: Record<string, unknown> }
    )
  );
  qp.append("status", "draft");
  return qp;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const programDetailApi = {
  /**
   * GET /api/programs?filters[slug][$eq]=<slug>&filters[locale][$eq]=<locale>&status=draft
   * Returns data[0] or null if not found.
   */
  async getBySlug(
    slug: string,
    locale: "en" | "ar"
  ): Promise<ProgramListItem | null> {
    const qp = buildBaseParams(locale);
    qp.append("filters[slug][$eq]", slug);
    qp.append("pagination[page]", "1");
    qp.append("pagination[pageSize]", "1");

    const res = await http.get<{ data: ProgramListItem[] }>(
      `/api/programs?${qp.toString()}`
    );
    return res.data?.data?.[0] ?? null;
  },

  /**
   * GET /api/programs filtered by specialisations.studyField.id[] (correct bracket form).
   * Used for the "Similar Programs" carousel.
   * Page size default 5.
   */
  async getRelated(
    studyFieldIds: number[],
    locale: "en" | "ar",
    page: number,
    pageSize = 5,
    excludeSlug?: string
  ): Promise<Page<ProgramListItem>> {
    if (studyFieldIds.length === 0) {
      return { items: [], page: 1, pageCount: 1, total: 0 };
    }

    const qp = buildBaseParams(locale);
    studyFieldIds.forEach((id, i) =>
      qp.append(
        `filters[specialisations][studyField][id][$in][${i}]`,
        String(id)
      )
    );
    // Exclude current program by slug if provided
    if (excludeSlug) {
      qp.append("filters[slug][$ne]", excludeSlug);
    }
    qp.append("pagination[page]", String(page));
    qp.append("pagination[pageSize]", String(pageSize));

    const res = await http.get<{
      data: ProgramListItem[];
      meta: { pagination: { page: number; pageCount: number; total: number } };
    }>(`/api/programs?${qp.toString()}`);

    const data = res.data?.data ?? [];
    const meta = res.data?.meta?.pagination ?? {
      page: 1,
      pageCount: 1,
      total: 0,
    };

    return {
      items: data,
      page: meta.page,
      pageCount: meta.pageCount,
      total: meta.total,
    };
  },
};
