/**
 * programsApi — Strapi CMS transport for the Find Programs list.
 * Backend: Strapi (http). No user-data here.
 *
 * Exact Strapi query mirrors web API.service.tsx getProgramsSearch().
 * Endpoint: /api/programs (collection `programs`)
 *
 * Types and populate config live in programsApiTypes.ts (split for line limit).
 */

import { http } from "@/api/http";
import type { Page } from "@/types/page";
import {
  PROGRAM_LIST_FIELDS,
  PROGRAM_LIST_POPULATE,
  addPopulate,
} from "@/api/programsApiTypes";
import type { ProgramListItem, ProgramsListParams } from "@/api/programsApiTypes";

// Re-export all types so existing imports from "@/api/programsApi" still resolve.
export type {
  ProgramDegree,
  ProgramSpecialisation,
  ProgramInfoItem,
  ProgramRequirement,
  ProgramAcademicUnit,
  ProgramInstitution,
  ProgramCampusLocation,
  ProgramCampus,
  ProgramNbOfYears,
  ProgramNbOfCredits,
  ProgramLanguage,
  ProgramTag,
  ProgramListItem,
  ProgramsListParams,
} from "@/api/programsApiTypes";

// ─── API calls ────────────────────────────────────────────────────────────────

export const programsApi = {
  /**
   * List programs with search/sort/filter.
   * Exact parity with web API.service.tsx getProgramsSearch().
   * status=draft intentional (mirrors web).
   *
   * Tuition params are only applied when tuitionMin/Max are defined
   * (i.e. the user moved the slider away from the [0,3000] full-range default).
   * An undefined tuition range means NO tuition constraint.
   */
  async list(params: ProgramsListParams): Promise<Page<ProgramListItem>> {
    const {
      locale,
      page,
      pageSize = 5,
      search,
      sort = "default",
      degreeIds,
      fieldOfStudyIds,
      locationIds,
      nbOfYearsMins,
      nbOfYearsMaxs,
      languageIds,
      tuitionMin,
      tuitionMax,
    } = params;

    const qp = new URLSearchParams();

    // Locale filter
    qp.append("filters[locale][$eq]", locale);

    // Fields
    PROGRAM_LIST_FIELDS.forEach((f, i) => qp.append(`fields[${i}]`, f));

    // Populate
    Object.entries(PROGRAM_LIST_POPULATE).forEach(([key, val]) =>
      addPopulate(
        qp,
        key,
        val as string[] | { fields?: string[]; populate?: Record<string, unknown> }
      )
    );

    // Search — $or across name, specialisations.studyField.name, specialisations.name,
    //          about, institution.name, academicUnits.name, campus.name
    if (search && search.trim()) {
      const s = search.trim();
      qp.append("filters[$or][0][name][$containsi]", s);
      qp.append(
        "filters[$or][1][specialisations][studyField][name][$containsi]",
        s
      );
      qp.append("filters[$or][2][specialisations][name][$containsi]", s);
      qp.append("filters[$or][3][about][$containsi]", s);
      qp.append("filters[$or][4][institution][name][$containsi]", s);
      qp.append("filters[$or][5][academicUnits][name][$containsi]", s);
      qp.append("filters[$or][6][campus][name][$containsi]", s);
    }

    // Dynamic filters
    if (degreeIds && degreeIds.length > 0) {
      degreeIds.forEach((id, i) =>
        qp.append(`filters[degree][id][$in][${i}]`, id)
      );
    }
    if (fieldOfStudyIds && fieldOfStudyIds.length > 0) {
      fieldOfStudyIds.forEach((id, i) =>
        qp.append(`filters[specialisations][studyField][id][$in][${i}]`, id)
      );
    }
    if (locationIds && locationIds.length > 0) {
      locationIds.forEach((id, i) =>
        qp.append(`filters[campus][location][id][$in][${i}]`, id)
      );
    }
    if (nbOfYearsMins && nbOfYearsMins.length > 0) {
      nbOfYearsMins.forEach((v, i) =>
        qp.append(`filters[nbOfYears][min][$in][${i}]`, String(v))
      );
    }
    if (nbOfYearsMaxs && nbOfYearsMaxs.length > 0) {
      nbOfYearsMaxs.forEach((v, i) =>
        qp.append(`filters[nbOfYears][max][$in][${i}]`, String(v))
      );
    }
    if (languageIds && languageIds.length > 0) {
      languageIds.forEach((id, i) =>
        qp.append(`filters[languages][id][$in][${i}]`, id)
      );
    }

    // Sort
    switch (sort) {
      case "tuition_asc":
        qp.append("sort[0]", "institution.tuition.minTuition:asc");
        break;
      case "tuition_desc":
        qp.append("sort[0]", "institution.tuition.maxTuition:desc");
        break;
      default:
        qp.append("sort[0]", "name:asc");
        break;
    }

    // Tuition range — only applied when the user has set a range
    // (tuitionMin/Max are undefined when the slider is at its default [0,3000]).
    let tuitionQs = "";
    if (tuitionMin !== undefined && tuitionMax !== undefined) {
      tuitionQs =
        `&filters[institution][tuition][minTuition][$gte]=${tuitionMin}` +
        `&filters[institution][tuition][maxTuition][$lte]=${tuitionMax}`;
    }

    // Pagination + status
    qp.append("pagination[page]", String(page));
    qp.append("pagination[pageSize]", String(pageSize));
    qp.append("status", "draft");

    const url = `/api/programs?${qp.toString()}${tuitionQs}`;

    const res = await http.get<{
      data: ProgramListItem[];
      meta: {
        pagination: { page: number; pageCount: number; total: number };
      };
    }>(url);

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
