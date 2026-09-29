export interface Organization {
  uid: string;
  code: string;
  name: string;
  legalName: string;
  defaultCurrency: string;
  timezone: string;
}

export interface CreateOrganizationRequest {
  code: string;
  name: string;
  legalName?: string;
  defaultCurrency: string;
  timezone: string;
}

export interface OrganizationListResponse {
  items: Organization[];
  page: number;
  pageSize: number;
  totalCount: number;
}
