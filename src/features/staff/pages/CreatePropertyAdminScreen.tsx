import { useState } from "react";
import { PageError } from "@/components/common/PageState";
import InviteAdminForm from "@/features/staff/components/InviteAdminForm";
import { useOrganizations } from "@/features/organizations/hooks/useOrganizations";
import { useOrganizationProperties } from "@/features/properties/hooks/useOrganizationProperties";
import { getApiErrorMessage } from "@/utils/errors";
import "@/styles/reservations.css";
import "@/styles/superAdmin.css";

export default function CreatePropertyAdminScreen() {
  const [orgUid, setOrgUid] = useState("");
  const [propertyUid, setPropertyUid] = useState("");

  const organizationsQuery = useOrganizations(1, undefined, 100);
  const propertiesQuery = useOrganizationProperties(orgUid);

  const organizations = organizationsQuery.data?.items ?? [];
  const properties = propertiesQuery.data ?? [];
  const error = organizationsQuery.error ?? propertiesQuery.error;

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <p className="rsv-eyebrow">Super admin</p>
          <h2>Invite property admin</h2>
          <p className="rsv-sub">
            Choose the organization and property, then send the admin
            invitation. The backend creates or reuses the admin for that
            property.
          </p>
        </div>
      </div>

      {error && (
        <PageError
          message={getApiErrorMessage(error, "Could not load organizations.")}
        />
      )}

      <section className="sa-section">
        <div className="rsv-form sa-flat">
          <div className="rsv-grid">
            <label>
              Organization
              <select
                value={orgUid}
                onChange={(e) => {
                  setOrgUid(e.target.value);
                  setPropertyUid("");
                }}
              >
                <option value="">Select an organization…</option>
                {organizations.map((organization) => (
                  <option key={organization.uid} value={organization.uid}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Property
              <select
                value={propertyUid}
                onChange={(e) => setPropertyUid(e.target.value)}
                disabled={!orgUid}
              >
                <option value="">
                  {orgUid && properties.length === 0
                    ? "No properties in this organization"
                    : "Select a property…"}
                </option>
                {properties.map((property) => (
                  <option key={property.uid} value={property.uid}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {propertyUid && (
        <InviteAdminForm key={propertyUid} propertyUid={propertyUid} />
      )}
    </div>
  );
}
