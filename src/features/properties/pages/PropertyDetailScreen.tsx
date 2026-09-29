import { Link, useParams } from "react-router-dom";
import { PageError, PageLoading } from "@/components/common/PageState";
import InviteAdminForm from "@/features/staff/components/InviteAdminForm";
import { useProperty } from "@/features/properties/hooks/useProperty";
import { usePermissions } from "@/hooks/usePermissions";
import { ROUTES, superOrganizationPath } from "@/routes/paths";
import {
  propertyStatusLabel,
  propertyTypeLabel,
} from "@/types/property.types";
import { getApiErrorMessage } from "@/utils/errors";
import "@/styles/reservations.css";
import "@/styles/superAdmin.css";

export default function PropertyDetailScreen() {
  const { propertyUid = "", propertyId = "", organizationUid = "" } =
    useParams();
  const uid = propertyUid || propertyId;
  const { can } = usePermissions();
  const { data: property, isLoading, isError, error, refetch } = useProperty(uid);

  const backTo =
    property?.organizationUid || organizationUid
      ? superOrganizationPath(property?.organizationUid || organizationUid)
      : ROUTES.SUPER_PROPERTIES;

  const fields: [string, string][] = property
    ? [
        ["Name", property.name],
        ["Address", property.addressLine1],
        ["Contact", [property.phone, property.email].filter(Boolean).join(" · ")],
        ["Type", propertyTypeLabel(property.propertyType)],
        ["City", property.city],
        ["Timezone", property.timezone],
        ["Currency", property.defaultCurrency],
      ]
    : [];

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <Link className="rsv-back" to={backTo}>
            ← Back
          </Link>
          <p className="rsv-eyebrow">Property</p>
          <h2>{property?.name ?? "Property"}</h2>
          {property?.description && (
            <p className="rsv-sub">{property.description}</p>
          )}
        </div>
        {property && (
          <span
            className={`sa-badge ${property.status === 1 ? "" : "sa-badge-muted"}`}
          >
            {propertyStatusLabel(property.status)}
          </span>
        )}
      </div>

      {isLoading && <PageLoading />}
      {isError && (
        <PageError
          message={getApiErrorMessage(error, "Could not load this property.")}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && property && (
        <>
          <section className="sa-section">
            <h3>Property information</h3>
            <dl className="sa-kv">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          {can("admin.invite") && <InviteAdminForm propertyUid={uid} />}
        </>
      )}
    </div>
  );
}
