import { Link, useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "@/components/common/PageState";
import { useOrganization } from "@/features/organizations/hooks/useOrganization";
import { useOrganizationProperties } from "@/features/properties/hooks/useOrganizationProperties";
import { usePermissions } from "@/hooks/usePermissions";
import {
  ROUTES,
  superPropertyNewPath,
  superPropertyPath,
} from "@/routes/paths";
import { propertyStatusLabel } from "@/types/property.types";
import { getApiErrorMessage } from "@/utils/errors";
import "@/styles/reservations.css";
import "@/styles/superAdmin.css";

export default function OrganizationDetailScreen() {
  const { organizationUid = "" } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const organizationQuery = useOrganization(organizationUid);
  const propertiesQuery = useOrganizationProperties(organizationUid);

  const org = organizationQuery.data;
  const properties = propertiesQuery.data ?? [];
  const loading = organizationQuery.isLoading || propertiesQuery.isLoading;
  const error = organizationQuery.error ?? propertiesQuery.error;

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <Link className="rsv-back" to={ROUTES.SUPER_ORGANIZATIONS}>
            ← Back to organizations
          </Link>
          <p className="rsv-eyebrow">Organization</p>
          <h2>{org?.name ?? "Organization"}</h2>
          {org && (
            <p className="rsv-sub">
              {org.code} · {org.legalName}
            </p>
          )}
        </div>
        {can("property.create") && (
          <button
            className="rsv-btn"
            onClick={() => navigate(superPropertyNewPath(organizationUid))}
          >
            + Add Property
          </button>
        )}
      </div>

      {loading && <PageLoading />}
      {!loading && error && (
        <PageError
          message={getApiErrorMessage(error, "Could not load this organization.")}
          onRetry={() => {
            void organizationQuery.refetch();
            void propertiesQuery.refetch();
          }}
        />
      )}

      {!loading && !error && (
        <>
          {org && (
            <section className="sa-section">
              <dl className="sa-kv">
                <div>
                  <dt>Legal name</dt>
                  <dd>{org.legalName || "—"}</dd>
                </div>
                <div>
                  <dt>Currency</dt>
                  <dd>{org.defaultCurrency}</dd>
                </div>
                <div>
                  <dt>Timezone</dt>
                  <dd>{org.timezone}</dd>
                </div>
              </dl>
            </section>
          )}

          <section className="sa-section">
            <div className="sa-section-head">
              <h3>Properties</h3>
            </div>

            {properties.length === 0 ? (
              <p className="rsv-empty">
                No properties yet. Add the first property for this organization.
              </p>
            ) : (
              <div className="rsv-table-wrap sa-embedded">
                <table className="rsv-table">
                  <thead>
                    <tr>
                      <th>Property name</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.uid}>
                        <td>{property.name}</td>
                        <td>{property.city || "—"}</td>
                        <td>
                          <span
                            className={`sa-badge ${property.status === 1 ? "" : "sa-badge-muted"}`}
                          >
                            {propertyStatusLabel(property.status)}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="sa-link"
                            to={superPropertyPath(organizationUid, property.uid)}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
