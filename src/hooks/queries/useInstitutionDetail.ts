/**
 * useInstitutionDetail — server state for InstitutionDetailScreen (React Query).
 * Cached per slug + locale: a revisit renders at once (QA 2026-11-10 RQ-02).
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { institutionDetailApi, type AcademicData } from "@/api/institutionDetailApi";
import { reviewsApi } from "@/api/reviewsApi";
import { qk } from "./keys";

const EMPTY_ACADEMIC: AcademicData = { Bachelors: [], Masters: [], PhD: [], Others: [] };

export function useInstitutionDetail(slug: string | undefined, locale: "en" | "ar") {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: qk.institution(slug ?? "", locale),
    queryFn: async () => {
      const [institution, academicData, nbPrograms] = await Promise.all([
        institutionDetailApi.getInstitutionBySlug(slug!, locale),
        institutionDetailApi.getAcademicUnitsInfo(slug!, locale),
        institutionDetailApi.getInstitutionProgramCount(slug!, locale),
      ]);
      return { institution, academicData, nbPrograms };
    },
    enabled: !!slug,
  });
  const institution = detailQuery.data?.institution ?? null;
  const documentId = institution?.documentId;

  const averagesKey = qk.averageRating("Institution", documentId ?? "");
  const averagesQuery = useQuery({
    queryKey: averagesKey,
    queryFn: () => reviewsApi.getAllAverageRating("Institution", documentId!),
    enabled: !!documentId,
  });

  return {
    institution,
    academicData: detailQuery.data?.academicData ?? EMPTY_ACADEMIC,
    nbPrograms: detailQuery.data?.nbPrograms ?? 0,
    averages: averagesQuery.data,
    loading: detailQuery.isPending && !!slug,
    notFound: detailQuery.isError || (detailQuery.isSuccess && !institution),
    refetchAll: () => Promise.all([detailQuery.refetch(), averagesQuery.refetch()]),
    /** After a review is submitted: refresh the averages everywhere they are shown. */
    refreshAverages: () => queryClient.invalidateQueries({ queryKey: averagesKey }),
  };
}
