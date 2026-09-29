import { useQuery } from "@tanstack/react-query";
import { propertiesApi } from "@/api/properties.api";
import { queryKeys } from "@/api/queryClient";

export const useOrganizationProperties = (organizationUid: string) => {
  return useQuery({
    queryKey: queryKeys.properties.byOrg(organizationUid),
    enabled: Boolean(organizationUid),
    queryFn: () => propertiesApi.getOrganizationProperties(organizationUid),
  });
};
