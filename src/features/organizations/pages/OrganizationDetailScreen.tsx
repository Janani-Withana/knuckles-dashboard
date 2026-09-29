import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { ApiError } from "../../../lib/api";
import {
  ROUTES,
  superPropertyNewPath,
  superPropertyPath,
} from "../../../routes/paths";
import { listOrganizations } from "../../../services/superAdmin/organizationService.service";
import { listOrganizationProperties } from "../../../services/superAdmin/propertyService.service";
import type { Organization } from "../../../types/superAdmin/organization";
import {
  propertyStatusLabel,
  propertyTypeLabel,
  type Property,
} from "../../../types/superAdmin/property";
import "../../admin/Reservations/reservations.css";
import "../superAdmin.css";

export default function OrganizationDetailScreen() {
  const { organizationUid = "" } = useParams();
  const navigate = useNavigate();

  const [org, setOrg] = useState<Organization | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [orgs, props] = await Promise.all([
          listOrganizations(),
          listOrganizationProperties(organizationUid),
        ]);
        if (cancelled) return;
        setOrg(orgs.find((o) => o.uid === organizationUid) ?? null);
        setProperties(props);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this organization.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationUid, tick]);

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
        <button
          className="rsv-btn"
          onClick={() => navigate(superPropertyNewPath(organizationUid))}
        >
          + Add property
        </button>
      </div>

      {loading && <PageLoading />}
      {!loading && error && (
        <PageError message={error} onRetry={() => setTick((t) => t + 1)} />
      )}

      {!loading && !error && (
        <>
          {org && (
            <section className="sa-section">
              <dl className="sa-kv">
                <div>
                  <dt>Code</dt>
                  <dd>{org.code}</dd>
                </div>
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
              <h3>Properties ({properties.length})</h3>
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
                      <th>Name</th>
                      <th>Code</th>
                      <th>City</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => (
                      <tr key={p.uid}>
                        <td>{p.name}</td>
                        <td>{p.code}</td>
                        <td>{p.city || "—"}</td>
                        <td>{propertyTypeLabel(p.propertyType)}</td>
                        <td>
                          <span
                            className={`sa-badge ${p.status === 1 ? "" : "sa-badge-muted"}`}
                          >
                            {propertyStatusLabel(p.status)}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="sa-link"
                            to={superPropertyPath(p.uid)}
                          >
                            Open & add admin
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
