import { apiFetch } from "../../lib/api";
import {
  asRecord,
  pickCreatedUid,
  pickList,
  pickUid,
  str,
  type Raw,
} from "../../lib/normalize";
import type { CreatePropertyPayload, Property } from "../../types/superAdmin/property";

export const toProperty = (raw: Raw, fallbackOrgUid = ""): Property => ({
  uid: pickUid(raw, ["propertyUid"]),
  organizationUid: str(raw.organizationUid, fallbackOrgUid),
  code: str(raw.code),
  name: str(raw.name),
  slug: str(raw.slug),
  propertyType: Number(raw.propertyType ?? 0),
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
  status: Number(raw.status ?? 0),
});

export async function listOrganizationProperties(
  organizationUid: string,
): Promise<Property[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/organizations/${organizationUid}/properties`,
  );
  return pickList(data).map((r) => toProperty(r, organizationUid));
}

export async function getProperty(propertyUid: string): Promise<Property> {
  const data = await apiFetch<unknown>(`/api/v1/properties/${propertyUid}`);
  const raw = asRecord(data);
  const body = raw.property
    ? asRecord(raw.property)
    : raw.data
      ? asRecord(raw.data)
      : raw;
  const property = toProperty(body);
  return { ...property, uid: property.uid || propertyUid };
}

/** Returns the new property's uid ("" if the API doesn't return one). */
export async function createProperty(
  organizationUid: string,
  payload: CreatePropertyPayload,
): Promise<string> {
  const data = await apiFetch<unknown>(
    `/api/v1/organizations/${organizationUid}/properties`,
    { method: "POST", body: payload },
  );
  return pickCreatedUid(data, ["propertyUid"]);
}