import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@/api/organizations.api";
import { propertiesApi } from "@/api/properties.api";
import { queryKeys } from "@/api/queryClient";
import type { Property } from "@/types/property.types";

export const usePlatformOverview = () => {
  return useQuery({
    queryKey: queryKeys.platform.overview,
    queryFn: async () => {
      const orgs = await organizationsApi.getOrganizations(1, 100);
      const lists = await Promise.all(
        orgs.items.map((org) =>
          propertiesApi
            .getOrganizationProperties(org.uid)
            .catch(() => [] as Property[]),
        ),
      );
      return {
        organizations: orgs.items,
        properties: lists.flat(),
      };
    },
  });
};
