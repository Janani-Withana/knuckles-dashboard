import { useQuery } from "@tanstack/react-query";
import { propertiesApi } from "@/api/properties.api";
import { queryKeys } from "@/api/queryClient";

export const useProperty = (propertyUid: string) => {
  return useQuery({
    queryKey: queryKeys.properties.detail(propertyUid),
    enabled: Boolean(propertyUid),
    queryFn: () => propertiesApi.getProperty(propertyUid),
  });
};
