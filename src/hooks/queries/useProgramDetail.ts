/**
 * useProgramDetail — server state for ProgramDetailScreen (React Query).
 *
 * Replaces the screen's manual useState + useEffect loader so that a revisit
 * shows cached data at once (QA 2026-11-10 RQ-02: full skeleton on every revisit).
 */

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { programDetailApi } from "@/api/programDetailApi";
import { reviewsApi } from "@/api/reviewsApi";
import { qk } from "./keys";

const RELATED_PAGE_SIZE = 5;

export function useProgramDetail(programSlug: string | undefined, locale: "en" | "ar") {
  const programQuery = useQuery({
    queryKey: qk.program(programSlug ?? "", locale),
    queryFn: () => programDetailApi.getBySlug(programSlug!, locale),
    enabled: !!programSlug,
  });
  const program = programQuery.data ?? null;

  const institutionDocId = program?.institution?.documentId;
  const ratingQuery = useQuery({
    queryKey: qk.averageRating("Institution", institutionDocId ?? ""),
    queryFn: () => reviewsApi.getAllAverageRating("Institution", institutionDocId!),
    enabled: !!institutionDocId,
  });

  const studyFieldIds: number[] = (program?.specialisations ?? [])
    .map((s) => s.studyField?.id)
    .filter((id): id is number => id != null);

  const relatedQuery = useInfiniteQuery({
    queryKey: qk.relatedPrograms(studyFieldIds, locale, programSlug ?? ""),
    queryFn: ({ pageParam }) =>
      programDetailApi.getRelated(studyFieldIds, locale, pageParam, RELATED_PAGE_SIZE, programSlug),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pageCount ? last.page + 1 : undefined),
    enabled: studyFieldIds.length > 0,
  });

  return {
    program,
    /** True only while there is nothing to show yet (cached revisits skip the skeleton). */
    loading: programQuery.isPending && !!programSlug,
    notFound: programQuery.isError || (programQuery.isSuccess && !program),
    rating: ratingQuery.data?.averageGeneralRating ?? 0,
    nbReviews: ratingQuery.data?.totalReviews ?? 0,
    related: relatedQuery.data?.pages.flatMap((p) => p.items) ?? [],
    hasMoreRelated: !!relatedQuery.hasNextPage,
    isLoadingMore: relatedQuery.isFetchingNextPage,
    loadMoreRelated: () => {
      if (relatedQuery.hasNextPage && !relatedQuery.isFetchingNextPage) void relatedQuery.fetchNextPage();
    },
    refetchAll: () => Promise.all([programQuery.refetch(), ratingQuery.refetch(), relatedQuery.refetch()]),
  };
}
