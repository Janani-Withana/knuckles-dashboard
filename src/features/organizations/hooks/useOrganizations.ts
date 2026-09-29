import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@/api/organizations.api";
import { queryKeys } from "@/api/queryClient";

export const useOrganizations = (
  page: number,
  search?: string,
  pageSize = 20,
) => {
  const trimmed = search?.trim() || undefined;
  return useQuery({
    queryKey: queryKeys.organizations.list(page, trimmed),
    queryFn: () => organizationsApi.getOrganizations(page, pageSize, trimmed),
  });
};
