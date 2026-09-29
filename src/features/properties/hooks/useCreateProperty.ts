import { useMutation, useQueryClient } from "@tanstack/react-query";
import { propertiesApi } from "@/api/properties.api";
import { queryKeys } from "@/api/queryClient";
import type { CreatePropertyRequest } from "@/types/property.types";

export const useCreateProperty = (organizationUid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePropertyRequest) =>
      propertiesApi.createProperty(organizationUid, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.properties.byOrg(organizationUid),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.platform.overview,
      });
    },
  });
};
