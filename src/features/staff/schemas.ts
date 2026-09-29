import { z } from "zod";

export const inviteAdminSchema = z.object({
  firstName: z.string().trim().min(1, "Enter the admin's first name."),
  lastName: z.string().trim().min(1, "Enter the admin's last name."),
  email: z.string().trim().min(1, "Enter an email address."),
});

export type InviteAdminFormValues = z.infer<typeof inviteAdminSchema>;
