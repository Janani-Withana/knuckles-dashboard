import { apiFetch } from "../../lib/api";
import { pickCreatedUid, pickList, pickUid, str, type Raw } from "../../lib/normalize";
import type {
  CreateOrganizationPayload,
  Organization,
} from "../../types/superAdmin/organization";

const toOrganization = (raw: Raw): Organization => ({
  uid: pickUid(raw, ["organizationUid"]),
  code: str(raw.code),
  name: str(raw.name),
  legalName: str(raw.legalName),
  defaultCurrency: str(raw.defaultCurrency),
  timezone: str(raw.timezone),
});

export async function listOrganizations(
  page = 1,
  pageSize = 100,
): Promise<Organization[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/platform/organizations?page=${page}&pageSize=${pageSize}`,
  );
  return pickList(data).map(toOrganization);
}

/** Returns the new organization's uid ("" if the API doesn't return one). */
export async function createOrganization(
  payload: CreateOrganizationPayload,
): Promise<string> {
  const data = await apiFetch<unknown>("/api/v1/platform/organizations", {
    method: "POST",
    body: payload,
  });
  return pickCreatedUid(data, ["organizationUid"]);
}