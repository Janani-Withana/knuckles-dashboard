import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import PropertyAdminPanel from "../../../components/superAdmin/PropertyAdminPanel";
import { ApiError } from "../../../lib/api";
import { ROUTES, superOrganizationPath } from "../../../routes/paths";
import { getProperty } from "../../../services/superAdmin/propertyService.service";
import {
  propertyStatusLabel,
  propertyTypeLabel,
  type Property,
} from "../../../types/superAdmin/property";
import "../../admin/Reservations/reservations.css";
import "../superAdmin.css";

export default function PropertyDetailScreen() {
  const { propertyId = "" } = useParams();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const p = await getProperty(propertyId);
        if (!cancelled) setProperty(p);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this property.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [propertyId, tick]);

  const backTo = property?.organizationUid
    ? superOrganizationPath(property.organizationUid)
    : ROUTES.SUPER_PROPERTIES;

  const fields: [string, string][] = property
    ? [
        ["Code", property.code],
        ["Type", propertyTypeLabel(property.propertyType)],
        ["Address", property.addressLine1],
        ["City", property.city],
        ["District", property.district],
        ["Province", property.province],
        ["Postal code", property.postalCode],
        ["Country", property.countryCode],
        ["Phone", property.phone],
        ["Email", property.email],
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

      {loading && <PageLoading />}
      {!loading && error && (
        <PageError message={error} onRetry={() => setTick((t) => t + 1)} />
      )}

      {!loading && !error && property && (
        <>
          <section className="sa-section">
            <dl className="sa-kv">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <PropertyAdminPanel propertyUid={propertyId} />
        </>
      )}
    </div>
  );
}
