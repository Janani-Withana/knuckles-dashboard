import type {
  CreateOrganizationRequest,
  Organization,
  OrganizationListResponse,
} from "../types/organization.types";
import {
  asRecord,
  pickCreatedUid,
  pickList,
  pickPageMeta,
  pickUid,
  str,
  type Raw,
} from "../utils/normalize";
import { apiClient } from "./client";

const toOrganization = (raw: Raw): Organization => ({
  uid: pickUid(raw, ["organizationUid"]),
  code: str(raw.code),
  name: str(raw.name),
  legalName: str(raw.legalName),
  defaultCurrency: str(raw.defaultCurrency),
  timezone: str(raw.timezone),
});

export const organizationsApi = {
  getOrganizations: async (
    page = 1,
    pageSize = 20,
    search?: string,
  ): Promise<OrganizationListResponse> => {
    const response = await apiClient.get<unknown>(
      "/api/v1/platform/organizations",
      {
        params: {
          page,
          pageSize,
          ...(search ? { search } : {}),
        },
      },
    );
    const items = pickList(response.data).map(toOrganization);
    const meta = pickPageMeta(response.data, {
      page,
      pageSize,
      totalCount: items.length,
    });
    return { items, ...meta };
  },

  createOrganization: async (
    data: CreateOrganizationRequest,
  ): Promise<Organization> => {
    const response = await apiClient.post<unknown>(
      "/api/v1/platform/organizations",
      data,
    );
    const raw = asRecord(response.data);
    const body = raw.data ? asRecord(raw.data) : raw;
    const organization = toOrganization(body);
    const uid =
      organization.uid || pickCreatedUid(response.data, ["organizationUid"]);
    return { ...organization, uid };
  },
};
