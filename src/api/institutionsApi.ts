/**
 * institutionsApi — Strapi CMS transport for the Find Institutions list.
 * Backend: Strapi (http). No user-data here.
 *
 * Exact Strapi query mirrors web API.service.tsx getInstitutions().
 * Endpoint: /api/instituitions (note: intentional Strapi typo in plural)
 */

import { http } from "@/api/http";
import { addPopulate } from "@/api/strapiQuery";
import type { Page } from "@/types/page";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstitutionRanking {
  position?: number;
  name?: string;
  year?: number;
  url?: string;
  organizations?: Array<{ rankingCategory?: string }>;
}

export interface InstitutionTuition {
  minTuition?: number;
  maxTuition?: number;
  tuitionType?: string;
  degree?: { title?: string; informationalText?: string };
}

export interface InstitutionMainLocation {
  street?: string;
  city?: { name?: string };
  country?: { name?: string };
  district?: { governorate?: string };
  region?: { region?: string };
}

export interface InstitutionListItem {
  id: number;
  documentId: string;
  acronym?: string;
  name: string;
  slug: string;
  about?: unknown; // rich-text blocks → extractPlainText
  email?: string;
  phone?: string;
  foundationYear?: number;
  website?: string;
  featured?: boolean;
  order?: number;
  logo?: { url?: string };
  photoCover?: { url?: string };
  institutionInfo?: Array<{
    info?: string;
    url?: string;
    type?: { type?: string; icon?: string; iconPrefix?: string };
  }>;
  tuition?: InstitutionTuition[];
  mainLocation?: InstitutionMainLocation;
  ranking?: InstitutionRanking[];
  tags?: Array<{ name?: string; description?: string }>;
  /** Injected after fetch — not from Strapi */
  ratingStars?: number;
}

export interface InstitutionsListParams {
  locale: "en" | "ar";
  page: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  /** Merged degree∩field∪location institution ids */
  idIn?: string[];
  tuitionMin?: number | null;
  tuitionMax?: number | null;
}

// ─── Filter-source types ──────────────────────────────────────────────────────

/** Generic filter option (value + display label + optional count) */
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface DegreeFilterOption {
  /** Degree title (for display) */
  degree: { title: string };
  /** Comma-separated institution ids that have this degree */
  institutions: string;
  count: number;
}

export interface FieldFilterOption {
  fieldOfStudy: { name: string };
  /** Comma-separated institution ids that have this field */
  institutions: string;
  count: number;
}

export interface LocationCampusRaw {
  location?: {
    city?: { name?: string };
    district?: { governorate?: string };
  };
  instituition?: { id?: number };
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const institutionsApi = {
  /**
   * List institutions with search/sort/filter.
   * Exact parity with web API.service.tsx getInstitutions().
   */
  async list(params: InstitutionsListParams): Promise<Page<InstitutionListItem>> {
    const {
      locale,
      page,
      pageSize = 6,
      search,
      sort = "default",
      idIn,
      tuitionMin,
      tuitionMax,
    } = params;

    const fields = [
      "id",
      "documentId",
      "acronym",
      "name",
      "slug",
      "about",
      "email",
      "phone",
      "foundationYear",
      "website",
      "featured",
      "order",
    ];

    const populate: Record<string, unknown> = {
      logo: ["url"],
      photoCover: ["url"],
      institutionInfo: {
        fields: ["url", "info"],
        populate: {
          type: { fields: ["type", "icon", "iconPrefix"] },
        },
      },
      tuition: {
        fields: ["minTuition", "maxTuition", "tuitionType"],
        populate: {
          degree: { fields: ["title", "informationalText"] },
        },
      },
      mainLocation: {
        fields: ["street"],
        populate: {
          coordinates: { fields: ["latitude", "longitude"] },
          region: { fields: ["region"] },
          country: { fields: ["name"] },
          city: { fields: ["name"] },
          district: { fields: ["governorate"] },
        },
      },
      ranking: {
        fields: ["position", "year", "url"],
        populate: {
          organizations: { fields: ["rankingCategory"] },
        },
      },
      tags: ["name", "description"],
    };

    const qp = new URLSearchParams();

    // Locale filter
    qp.append("filters[locale][$eq]", locale);

    // Fields
    fields.forEach((f, i) => qp.append(`fields[${i}]`, f));

    // Populate
    Object.entries(populate).forEach(([key, val]) =>
      addPopulate(qp, key, val as string[] | { fields?: string[]; populate?: Record<string, unknown> })
    );

    // Search (OR across name/acronym/about/institutionInfo.info)
    if (search && search.trim()) {
      const s = search.trim();
      qp.append("filters[$or][0][name][$containsi]", s);
      qp.append("filters[$or][1][acronym][$containsi]", s);
      qp.append("filters[$or][2][about][$containsi]", s);
      qp.append("filters[$or][3][institutionInfo][info][$containsi]", s);
    }

    // ID filter (degree∩field ∪ location)
    if (idIn && idIn.length > 0) {
      idIn.forEach((id, i) => qp.append(`filters[id][$in][${i}]`, id));
    }

    // Tuition range
    if (tuitionMin != null && !isNaN(tuitionMin)) {
      qp.append("filters[tuition][minTuition][$gte]", String(tuitionMin));
    }
    if (tuitionMax != null && !isNaN(tuitionMax)) {
      qp.append("filters[tuition][maxTuition][$lte]", String(tuitionMax));
    }

    // Sort — web uses both sort param AND a secondary sort[1]=name:asc
    switch (sort) {
      case "tuition_asc":
        qp.append("sort[0]", "tuition.minTuition:asc");
        break;
      case "tuition_desc":
        qp.append("sort[0]", "tuition.maxTuition:desc");
        break;
      default:
        qp.append("sort[0]", "order:asc");
        qp.append("sort[1]", "name:asc");
        break;
    }

    // Pagination
    qp.append("pagination[page]", String(page));
    qp.append("pagination[pageSize]", String(pageSize));
    qp.append("status", "draft");

    const res = await http.get<{
      data: InstitutionListItem[];
      meta: { pagination: { page: number; pageCount: number; total: number } };
    }>(`/api/instituitions?${qp.toString()}`);

    const data = res.data?.data ?? [];
    const meta = res.data?.meta?.pagination ?? { page: 1, pageCount: 1, total: 0 };

    return {
      items: data,
      page: meta.page,
      pageCount: meta.pageCount,
      total: meta.total,
    };
  },

  /**
   * Fetch degree filter options for institutions.
   * Endpoint: /api/programs/distinct-degrees
   * Returns array of { degree: { title }, institutions: "id1,id2,..." }
   */
  async fetchDegreeFilterOptions(locale: "en" | "ar"): Promise<DegreeFilterOption[]> {
    const res = await http.get<DegreeFilterOption[]>(
      `/api/programs/distinct-degrees?status=draft&locale=${locale}`
    );
    return res.data ?? [];
  },

  /**
   * Fetch field-of-study filter options for institutions.
   * Endpoint: /api/programs/fields-institution-ids
   * Returns array of { fieldOfStudy: { name }, institutions: "id1,id2,..." }
   */
  async fetchFieldFilterOptions(locale: "en" | "ar"): Promise<FieldFilterOption[]> {
    const res = await http.get<FieldFilterOption[]>(
      `/api/programs/fields-institution-ids?status=draft&locale=${locale}`
    );
    return res.data ?? [];
  },

  /**
   * Fetch tuition range options from all institutions.
   * Mirrors web tuitionRangeCountMap logic (page.tsx ~506-532).
   * Fetches first large page with only tuition data, builds "min - max" bucket options.
   * Returns sorted array of { label, value, count }.
   */
  async fetchTuitionFilterOptions(
    locale: "en" | "ar"
  ): Promise<FilterOption[]> {
    const qp = new URLSearchParams();
    qp.append("filters[locale][$eq]", locale);
    qp.append("fields[0]", "id");
    qp.append("populate[tuition][fields][0]", "minTuition");
    qp.append("populate[tuition][fields][1]", "maxTuition");
    qp.append("pagination[page]", "1");
    qp.append("pagination[pageSize]", "200");
    qp.append("status", "draft");

    const res = await http.get<{
      data: Array<{ tuition?: Array<{ minTuition?: number; maxTuition?: number }> }>;
    }>(`/api/instituitions?${qp.toString()}`);

    const institutions = res.data?.data ?? [];
    const rangeCountMap: Record<string, number> = {};

    for (const inst of institutions) {
      const tuitions = inst.tuition ?? [];
      const minVals = tuitions
        .map((t) => t.minTuition)
        .filter((v): v is number => v != null);
      const maxVals = tuitions
        .map((t) => t.maxTuition)
        .filter((v): v is number => v != null);
      if (minVals.length > 0 && maxVals.length > 0) {
        const min = Math.min(...minVals);
        const max = Math.max(...maxVals);
        const key = `${min} - ${max}`;
        rangeCountMap[key] = (rangeCountMap[key] ?? 0) + 1;
      }
    }

    const opts: FilterOption[] = Object.entries(rangeCountMap).map(
      ([range, count]) => ({
        label: `${range} $`,
        value: range,
        count,
      })
    );

    opts.sort((a, b) => {
      const aMin = parseFloat(a.value.split(" - ")[0] ?? "0");
      const bMin = parseFloat(b.value.split(" - ")[0] ?? "0");
      return aMin - bMin;
    });

    return opts;
  },

  /**
   * Fetch campus-based location options for institutions.
   * Endpoint: /api/campuses — with city + governorate + institution id
   * Returns { label: city, gov: governorate, value: "gov,city", institutionId: id }
   */
  async fetchLocationFilterOptions(
    locale: "en" | "ar"
  ): Promise<Array<{ label: string; gov: string; value: string; institutionId: string }>> {
    const res = await http.get<{ data: LocationCampusRaw[] }>(
      `/api/campuses?locale=${locale}&fields[0]=id&populate[instituition][fields][0]=id&populate[location][populate][city][fields][0]=name&populate[location][populate][district][fields][0]=governorate&status=draft&pagination[page]=1&pagination[pageSize]=400`
    );
    const campuses = res.data?.data ?? [];

    const uniqueMap = new Map<
      string,
      { label: string; gov: string; value: string; institutionId: string }
    >();

    for (const campus of campuses) {
      const cityName = campus.location?.city?.name ?? "";
      const gov = campus.location?.district?.governorate ?? "";
      const institutionId = String(campus.instituition?.id ?? "");
      if (!cityName) continue;
      const key = `${gov},${cityName}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          label: cityName,
          gov,
          value: key,
          institutionId,
        });
      }
    }

    return Array.from(uniqueMap.values());
  },
};
