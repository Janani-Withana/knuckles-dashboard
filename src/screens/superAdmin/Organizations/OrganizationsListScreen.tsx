import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "../../../components/common/PageState";
import { usePlatformData } from "../../../hooks/usePlatformData";
import {
  ROUTES,
  superOrganizationPath,
  superPropertyNewPath,
} from "../../../routes/paths";
import "../../admin/Reservations/reservations.css";
import "../superAdmin.css";

export default function OrganizationsListScreen() {
  const navigate = useNavigate();
  const { organizations, properties, loading, error, reload } =
    usePlatformData();
  const [query, setQuery] = useState("");

  const counts = new Map<string, number>();
  properties.forEach((p) =>
    counts.set(p.organizationUid, (counts.get(p.organizationUid) ?? 0) + 1),
  );

  const q = query.trim().toLowerCase();
  const filtered = organizations.filter((o) =>
    `${o.name} ${o.code} ${o.legalName}`.toLowerCase().includes(q),
  );

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <p className="rsv-eyebrow">Platform</p>
          <h2>Organizations</h2>
          <p className="rsv-sub">
            Each organization owns its properties. Create one, then add its
            properties and admins.
          </p>
        </div>
        <button
          className="rsv-btn"
          onClick={() => navigate(ROUTES.SUPER_ORGANIZATION_NEW)}
        >
          + New organization
        </button>
      </div>

      <div className="sa-toolbar">
        <input
          className="sa-search"
          placeholder="Search by name or code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <PageLoading />}
      {!loading && error && <PageError message={error} onRetry={reload} />}

      {!loading && !error && filtered.length === 0 && (
        <p className="rsv-empty">
          {organizations.length === 0
            ? "No organizations yet. Create your first one."
            : "No organizations match your search."}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="rsv-table-wrap">
          <table className="rsv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Legal name</th>
                <th>Currency</th>
                <th>Timezone</th>
                <th>Properties</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.uid}>
                  <td>{o.name}</td>
                  <td>{o.code}</td>
                  <td>{o.legalName}</td>
                  <td>{o.defaultCurrency}</td>
                  <td>{o.timezone}</td>
                  <td>{counts.get(o.uid) ?? 0}</td>
                  <td>
                    <span className="sa-links">
                      <Link
                        className="sa-link"
                        to={superOrganizationPath(o.uid)}
                      >
                        Open
                      </Link>
                      <Link
                        className="sa-link"
                        to={superPropertyNewPath(o.uid)}
                      >
                        + Property
                      </Link>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
