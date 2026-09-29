export interface Organization {
  uid: string;
  code: string;
  name: string;
  legalName: string;
  defaultCurrency: string;
  timezone: string;
}

/** Body for POST /api/v1/platform/organizations */
export interface CreateOrganizationPayload {
  code: string;
  name: string;
  legalName: string;
  defaultCurrency: string;
  timezone: string;
}