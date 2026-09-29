import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationsApi } from "@/api/organizations.api";
import { queryKeys } from "@/api/queryClient";

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationsApi.createOrganization,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.platform.overview,
      });
    },
  });
};
