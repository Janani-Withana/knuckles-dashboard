/** Body for POST /api/hotel/auth/admin/invite */
export interface InvitePropertyAdminPayload {
  propertyUid: string;
  email: string;
  firstName: string;
  lastName: string;
}

/** Body for POST /api/hotel/auth/admin/register */
export interface RegisterPropertyAdminPayload extends InvitePropertyAdminPayload {
  password: string;
}