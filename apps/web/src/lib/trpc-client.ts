/**
 * tRPC client configuration.
 * Creates the tRPC client and React Query client instances.
 */
import { QueryClient } from '@tanstack/react-query';
import { type TRPCClient, type TRPCLink, httpBatchLink } from '@trpc/client';
import { config } from './config';
import { type AppRouter, trpc } from './trpc';

/**
 * React Query client with defaults optimized for this application.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus during development
      refetchOnWindowFocus: false,
      // Retry failed queries once
      retry: 1,
      // Consider data stale after 30 seconds
      staleTime: 30 * 1000,
    },
  },
});

/**
 * tRPC link configuration for cookie-based authentication.
 */
const links: TRPCLink<AppRouter>[] = [
  httpBatchLink({
    url: `${config.apiUrl}/trpc`,
    // Include cookies in cross-origin requests for session auth
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: 'include',
      });
    },
  }),
];

/**
 * tRPC client configured for cookie-based authentication.
 *
 * Critical: `credentials: 'include'` ensures session cookies are sent
 * with every request, enabling the backend to identify the user.
 */
export const trpcClient: TRPCClient<AppRouter> = trpc.createClient({ links });
