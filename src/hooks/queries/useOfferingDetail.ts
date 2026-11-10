/**
 * useOfferingDetail — server state for OfferingDetailScreen (React Query).
 * Strapi content (per locale) + Node offering (per user: the request carries the
 * token) + average ratings. A revisit renders from cache (QA 2026-11-10 RQ-02);
 * a failed request now ends in the not-found state instead of an endless skeleton.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { offeringDetailApi } from "@/api/offeringDetailApi";
import { nodeOfferingApi } from "@/api/nodeOfferingApi";
import { reviewsApi } from "@/api/reviewsApi";
import { qk } from "./keys";

export function useOfferingDetail(slug: string | undefined, locale: "en" | "ar", userId: string | undefined) {
  const queryClient = useQueryClient();

  const strapiQuery = useQuery({
    queryKey: qk.offering(slug ?? "", locale),
    queryFn: () => offeringDetailApi.getBySlug(slug!, locale),
    enabled: !!slug,
  });
  const nodeQuery = useQuery({
    queryKey: qk.user(userId, "nodeOffering", slug ?? ""),
    queryFn: () => nodeOfferingApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const strapiOffering = strapiQuery.data ?? null;
  const nodeOffering = nodeQuery.data ?? null;
  const ratingId = strapiOffering ? String(strapiOffering.id) : "";
  const averagesKey = qk.averageRating("Offering", ratingId);
  const averagesQuery = useQuery({
    queryKey: averagesKey,
    queryFn: () => reviewsApi.getAllAverageRating("Offering", ratingId),
    enabled: !!ratingId,
  });

  const pending = strapiQuery.isPending || nodeQuery.isPending;
  const settled = !pending;

  return {
    strapiOffering,
    nodeOffering,
    specialists: nodeOffering?.specialists ?? [],
    averages: averagesQuery.data,
    loading: pending && !!slug,
    notFound:
      strapiQuery.isError || nodeQuery.isError || (settled && (!strapiOffering || !nodeOffering)),
    refetchAll: () => Promise.all([strapiQuery.refetch(), nodeQuery.refetch(), averagesQuery.refetch()]),
    refreshAverages: () => queryClient.invalidateQueries({ queryKey: averagesKey }),
  };
}
