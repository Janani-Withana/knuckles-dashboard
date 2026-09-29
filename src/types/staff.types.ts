export interface InviteAdminRequest {
  propertyUid: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface InviteAdminResponse {
  staffUid?: string;
  email?: string;
  emailSent?: boolean;
  temporaryPassword?: string;
  message?: string;
}

export interface RegisterAdminRequest extends InviteAdminRequest {
  password: string;
}

export interface RegisterStaffRequest {
  propertyUid: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}
