import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  organizations: {
    all: ["organizations"] as const,
    list: (page: number, search?: string) =>
      ["organizations", "list", page, search ?? ""] as const,
    detail: (uid: string) => ["organizations", "detail", uid] as const,
  },
  properties: {
    all: ["properties"] as const,
    byOrg: (organizationUid: string) =>
      ["properties", "org", organizationUid] as const,
    detail: (uid: string) => ["properties", "detail", uid] as const,
  },
  platform: {
    overview: ["platform-overview"] as const,
  },
};
