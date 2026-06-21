/**
 * Shared test helpers for unifind-mobile.
 *
 * `renderWithProviders` wraps a component in a fresh React Query client with
 * retries disabled (so failed/mocked queries settle immediately and tests stay
 * deterministic). Use it for any component/screen that calls useQuery /
 * useMutation. Plain leaf components can use RNTL's `render` directly.
 *
 * NOTE: NativeWind's babel transform is disabled under jest (see babel.config.js),
 * so `className` is an inert prop — assert on text / testID / role, never styles.
 */

import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function withQueryClient(ui: ReactNode, client = makeTestQueryClient()): ReactElement {
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { client?: QueryClient }
) {
  const client = options?.client ?? makeTestQueryClient();
  return render(withQueryClient(ui, client), options);
}

// Re-export the RNTL surface so test files can import everything from one place.
export * from "@testing-library/react-native";
