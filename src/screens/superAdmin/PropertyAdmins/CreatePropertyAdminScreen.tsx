import { useEffect, useState, type ChangeEvent } from "react";
import { PageError } from "../../../components/common/PageState";
import PropertyAdminPanel from "../../../components/superAdmin/PropertyAdminPanel";
import { ApiError } from "../../../lib/api";
import { listOrganizations } from "../../../services/superAdmin/organizationService.service";
import { listOrganizationProperties } from "../../../services/superAdmin/propertyService.service";
import type { Organization } from "../../../types/superAdmin/organization";
import type { Property } from "../../../types/superAdmin/property";
import "../../admin/Reservations/reservations.css";
import "../superAdmin.css";

export default function CreatePropertyAdminScreen() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgUid, setOrgUid] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyUid, setPropertyUid] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listOrganizations()
      .then((orgs) => {
        if (!cancelled) setOrganizations(orgs);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load organizations.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOrgChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const uid = e.target.value;
    setOrgUid(uid);
    setPropertyUid("");
    setProperties([]);
    if (!uid) return;
    try {
      setProperties(await listOrganizationProperties(uid));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load properties.",
      );
    }
  };

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <p className="rsv-eyebrow">Super admin</p>
          <h2>Create property admin</h2>
          <p className="rsv-sub">
            Choose the organization and property, then register and invite its
            admin.
          </p>
        </div>
      </div>

      {error && <PageError message={error} />}

      <section className="sa-section">
        <div className="rsv-form sa-flat">
          <div className="rsv-grid">
            <label>
              Organization
              <select value={orgUid} onChange={handleOrgChange}>
                <option value="">Select an organization…</option>
                {organizations.map((o) => (
                  <option key={o.uid} value={o.uid}>
                    {o.name}
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
                {properties.map((p) => (
                  <option key={p.uid} value={p.uid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {propertyUid && (
        <PropertyAdminPanel key={propertyUid} propertyUid={propertyUid} />
      )}
    </div>
  );
}
