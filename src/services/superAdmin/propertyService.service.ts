import { apiFetch } from "../../lib/api";
import {
  asRecord,
  pickCreatedUid,
  pickList,
  pickUid,
  str,
  type Raw,
} from "../../lib/normalize";
import {
  parsePropertyStatus,
  parsePropertyType,
  type CreatePropertyPayload,
  type Property,
  type PropertySettings,
  type UpdatePropertyPayload,
  type UpdatePropertySettingsPayload,
} from "../../types/superAdmin/property";

const optionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const toProperty = (raw: Raw, fallbackOrgUid = ""): Property => {
  const status = parsePropertyStatus(raw.status, raw.isActive);
  return {
    uid: pickUid(raw, ["propertyUid"]),
    organizationUid: str(raw.organizationUid, fallbackOrgUid),
    code: str(raw.code),
    name: str(raw.name),
    slug: str(raw.slug),
    propertyType: parsePropertyType(raw.propertyType),
    description: str(raw.description),
    addressLine1: str(raw.addressLine1),
    addressLine2: str(raw.addressLine2),
    city: str(raw.city),
    district: str(raw.district),
    province: str(raw.province),
    postalCode: str(raw.postalCode),
    countryCode: str(raw.countryCode),
    latitude: optionalNumber(raw.latitude),
    longitude: optionalNumber(raw.longitude),
    phone: str(raw.phone),
    email: str(raw.email),
    timezone: str(raw.timezone),
    defaultCurrency: str(raw.defaultCurrency),
    status,
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : status === 1,
    creationDate: str(raw.creationDate),
  };
};

/** Properties the signed-in admin can access. */
export async function listMyProperties(): Promise<Property[]> {
  const data = await apiFetch<unknown>("/api/v1/me/properties");
  return pickList(data).map((raw) => toProperty(raw));
}

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

/** PUT /api/v1/properties/{propertyUid}. */
export async function updateProperty(
  propertyUid: string,
  payload: UpdatePropertyPayload,
): Promise<void> {
  await apiFetch(`/api/v1/properties/${propertyUid}`, {
    method: "PUT",
    body: payload,
  });
}

const parseExtraSettings = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
};

export const toPropertySettings = (
  raw: Raw,
  fallbackUid = "",
): PropertySettings => ({
  propertyUid: str(raw.propertyUid, fallbackUid),
  checkInTime: str(raw.checkInTime),
  checkOutTime: str(raw.checkOutTime),
  bookingNumberPrefix: str(raw.bookingNumberPrefix),
  invoiceNumberPrefix: str(raw.invoiceNumberPrefix),
  taxRate: optionalNumber(raw.taxRate) ?? 0,
  serviceChargeRate: optionalNumber(raw.serviceChargeRate) ?? 0,
  allowOverbooking: raw.allowOverbooking === true,
  extraSettings: parseExtraSettings(raw.extraSettings ?? raw.extraSettingsJson),
});

/** GET /api/v1/properties/{propertyUid}/settings */
export async function getPropertySettings(
  propertyUid: string,
): Promise<PropertySettings> {
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/settings`,
  );
  const raw = asRecord(data);
  const body = raw.settings
    ? asRecord(raw.settings)
    : raw.data
      ? asRecord(raw.data)
      : raw;
  const settings = toPropertySettings(body, propertyUid);
  return { ...settings, propertyUid: settings.propertyUid || propertyUid };
}

/** PUT /api/v1/properties/{propertyUid}/settings */
export async function updatePropertySettings(
  propertyUid: string,
  payload: UpdatePropertySettingsPayload,
): Promise<void> {
  await apiFetch(`/api/v1/properties/${propertyUid}/settings`, {
    method: "PUT",
    body: payload,
  });
}