import { useMutation } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api";

export const useInviteAdmin = () => {
  return useMutation({
    mutationFn: usersApi.inviteAdmin,
  });
};
