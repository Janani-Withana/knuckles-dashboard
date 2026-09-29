import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@/api/organizations.api";
import { queryKeys } from "@/api/queryClient";
import { ApiError } from "@/utils/errors";

export const useOrganization = (organizationUid: string) => {
  return useQuery({
    queryKey: queryKeys.organizations.detail(organizationUid),
    enabled: Boolean(organizationUid),
    queryFn: async () => {
      const result = await organizationsApi.getOrganizations(1, 100);
      const organization = result.items.find(
        (item) => item.uid === organizationUid,
      );
      if (!organization) {
        throw new ApiError("Organization not found.", 404);
      }
      return organization;
    },
  });
};
