import {
  parsePropertyStatus,
  parsePropertyType,
  type CreatePropertyRequest,
  type Property,
} from "../types/property.types";
import {
  asRecord,
  pickCreatedUid,
  pickList,
  pickUid,
  str,
  type Raw,
} from "../utils/normalize";
import { apiClient } from "./client";

const toProperty = (raw: Raw, fallbackOrgUid = ""): Property => ({
  uid: pickUid(raw, ["propertyUid"]),
  organizationUid: str(raw.organizationUid, fallbackOrgUid),
  code: str(raw.code),
  name: str(raw.name),
  slug: str(raw.slug),
  propertyType: parsePropertyType(raw.propertyType),
  description: str(raw.description),
  addressLine1: str(raw.addressLine1),
  city: str(raw.city),
  district: str(raw.district),
  province: str(raw.province),
  postalCode: str(raw.postalCode),
  countryCode: str(raw.countryCode),
  phone: str(raw.phone),
  email: str(raw.email),
  timezone: str(raw.timezone),
  defaultCurrency: str(raw.defaultCurrency),
  status: parsePropertyStatus(raw.status),
});

export const propertiesApi = {
  getOrganizationProperties: async (
    organizationUid: string,
  ): Promise<Property[]> => {
    const response = await apiClient.get<unknown>(
      `/api/v1/organizations/${organizationUid}/properties`,
    );
    return pickList(response.data).map((raw) =>
      toProperty(raw, organizationUid),
    );
  },

  getProperty: async (propertyUid: string): Promise<Property> => {
    const response = await apiClient.get<unknown>(
      `/api/v1/properties/${propertyUid}`,
    );
    const raw = asRecord(response.data);
    const body = raw.property
      ? asRecord(raw.property)
      : raw.data
        ? asRecord(raw.data)
        : raw;
    const property = toProperty(body);
    return { ...property, uid: property.uid || propertyUid };
  },

  createProperty: async (
    organizationUid: string,
    data: CreatePropertyRequest,
  ): Promise<Property> => {
    const response = await apiClient.post<unknown>(
      `/api/v1/organizations/${organizationUid}/properties`,
      data,
    );
    const raw = asRecord(response.data);
    const body = raw.data ? asRecord(raw.data) : raw;
    const property = toProperty(body, organizationUid);
    const uid =
      property.uid || pickCreatedUid(response.data, ["propertyUid"]);
    return { ...property, uid, organizationUid };
  },
};
