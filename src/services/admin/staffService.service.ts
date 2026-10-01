import { apiFetch } from "../../lib/api";
import {
  asRecord,
  pickCreatedUid,
  pickList,
  pickUid,
  str,
  type Raw,
} from "../../lib/normalize";
import type {
  CreateStaffPayload,
  CreateStaffPaymentPayload,
  CreateStaffRolePayload,
  CreateWorkLogPayload,
  StaffMember,
  StaffPayment,
  StaffRole,
  UpdateStaffPayload,
  WorkLog,
} from "../../types/staff";

const toStaff = (raw: Raw, fallbackPropertyUid = ""): StaffMember => ({
  uid: pickUid(raw, ["staffUid"]),
  propertyUid: str(raw.propertyUid, fallbackPropertyUid),
  staffRoleUid: str(raw.staffRoleUid),
  employeeNumber: str(raw.employeeNumber),
  firstName: str(raw.firstName),
  lastName: str(raw.lastName),
  phone: str(raw.phone),
  email: str(raw.email),
  employmentType: Number(raw.employmentType ?? 0),
  basicSalary: Number(raw.basicSalary ?? 0),
  joinedDate: str(raw.joinedDate),
  status: Number(raw.status ?? 0),
});

const toWorkLog = (raw: Raw, fallbackStaffUid = ""): WorkLog => ({
  uid: pickUid(raw, ["workLogUid"]),
  staffUid: str(raw.staffUid, fallbackStaffUid),
  workDate: str(raw.workDate),
  startTime: str(raw.startTime),
  endTime: str(raw.endTime),
  hoursWorked: Number(raw.hoursWorked ?? 0),
  overtimeHours: Number(raw.overtimeHours ?? 0),
  bookingUid: raw.bookingUid ? str(raw.bookingUid) : null,
  notes: str(raw.notes),
});

const toPayment = (raw: Raw, fallbackStaffUid = ""): StaffPayment => ({
  uid: pickUid(raw, ["paymentUid"]),
  staffUid: str(raw.staffUid, fallbackStaffUid),
  periodStart: str(raw.periodStart),
  periodEnd: str(raw.periodEnd),
  basicAmount: Number(raw.basicAmount ?? 0),
  overtimeAmount: Number(raw.overtimeAmount ?? 0),
  bonusAmount: Number(raw.bonusAmount ?? 0),
  deductionAmount: Number(raw.deductionAmount ?? 0),
  paymentMethod: Number(raw.paymentMethod ?? 0),
  referenceNumber: str(raw.referenceNumber),
});

export async function listPropertyStaff(
  propertyUid: string,
): Promise<StaffMember[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/staff`,
  );
  return pickList(data).map((r) => toStaff(r, propertyUid));
}

export async function getStaff(staffUid: string): Promise<StaffMember> {
  const data = await apiFetch<unknown>(`/api/v1/staff/${staffUid}`);
  const raw = asRecord(data);
  const body = raw.staff
    ? asRecord(raw.staff)
    : raw.data
      ? asRecord(raw.data)
      : raw;
  const staff = toStaff(body);
  return { ...staff, uid: staff.uid || staffUid };
}

/** Returns the new staff member's uid ("" if the API doesn't return one). */
export async function createStaff(
  propertyUid: string,
  payload: CreateStaffPayload,
): Promise<string> {
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/staff`,
    { method: "POST", body: payload },
  );
  return pickCreatedUid(data, ["staffUid"]);
}

export async function updateStaff(
  staffUid: string,
  payload: UpdateStaffPayload,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/staff/${staffUid}`, {
    method: "PUT",
    body: payload,
  });
}

export async function listStaffWorkLogs(staffUid: string): Promise<WorkLog[]> {
  const data = await apiFetch<unknown>(`/api/v1/staff/${staffUid}/work-logs`);
  return pickList(data).map((r) => toWorkLog(r, staffUid));
}

export async function createWorkLog(
  staffUid: string,
  payload: CreateWorkLogPayload,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/staff/${staffUid}/work-logs`, {
    method: "POST",
    body: payload,
  });
}

/**
 * No per-staff GET exists yet — only this property-wide list.
 * Staff detail page filters it by staffUid client-side.
 */
export async function listPropertyStaffPayments(
  propertyUid: string,
): Promise<StaffPayment[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/staff-payments`,
  );
  return pickList(data).map((r) => toPayment(r));
}

export async function createStaffPayment(
  staffUid: string,
  payload: CreateStaffPaymentPayload,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/staff/${staffUid}/payments`, {
    method: "POST",
    body: payload,
  });
}
const toRole = (raw: Raw): StaffRole => ({
  uid: pickUid(raw, ["staffRoleUid"]),
  name: str(raw.name),
});

/** ASSUMED: GET /api/v1/properties/{propertyUid}/staff-roles (not in the collection you sent). */
export async function listStaffRoles(propertyUid: string): Promise<StaffRole[]> {
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/staff-roles`,
  );
  return pickList(data)
    .map(toRole)
    .filter((role) => role.uid);
}

/** POST /api/v1/properties/{propertyUid}/staff-roles. Response is { id, name }. */
export async function createStaffRole(
  propertyUid: string,
  payload: CreateStaffRolePayload,
): Promise<StaffRole> {
  const data = await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/staff-roles`,
    { method: "POST", body: { name: payload.name.trim() } },
  );
  return toRole(asRecord(data));
}

/** DELETE /api/v1/properties/{propertyUid}/staff-roles/{staffRoleUid}. Archives; returns 204. */
export async function deleteStaffRole(
  propertyUid: string,
  staffRoleUid: string,
): Promise<void> {
  await apiFetch<unknown>(
    `/api/v1/properties/${propertyUid}/staff-roles/${staffRoleUid}`,
    { method: "DELETE" },
  );
}