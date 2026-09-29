import { z } from "zod";

export const createOrganizationSchema = z.object({
  code: z.string().trim().min(2, "Code must be at least 2 characters.").max(20),
  name: z.string().trim().min(2, "Enter the organization name."),
  legalName: z.string().trim().optional(),
  defaultCurrency: z.string().min(3),
  timezone: z.string().min(1, "Enter a timezone."),
});

export type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;
