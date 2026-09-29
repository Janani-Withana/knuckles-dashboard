import { Link, useNavigate } from "react-router-dom";
import DonutChart from "../../../components/charts/DonutChart";
import { PageError, PageLoading } from "../../../components/common/PageState";
import StatCard from "../../../components/common/StatCard";
import { usePlatformData } from "../../../hooks/usePlatformData";
import { ROUTES, superOrganizationPath } from "../../../routes/paths";
import {
  propertyStatusLabel,
  propertyTypeLabel,
} from "../../../types/superAdmin/property";
import "../../admin/Reservations/reservations.css";
import "../superAdmin.css";

interface Slice {
  label: string;
  value: number;
}

function countBy<T>(items: T[], key: (item: T) => string): Slice[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const k = key(item) || "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return [...map]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function topWithOther(items: Slice[], max = 4): Slice[] {
  if (items.length <= max + 1) return items;
  const rest = items.slice(max).reduce((s, i) => s + i.value, 0);
  return [...items.slice(0, max), { label: "Other", value: rest }];
}

export default function SuperDashboardScreen() {
  const navigate = useNavigate();
  const { organizations, properties, loading, error, reload } =
    usePlatformData();

  const orgName = new Map(organizations.map((o) => [o.uid, o.name]));
  const propertyCount = new Map<string, number>();
  properties.forEach((p) =>
    propertyCount.set(
      p.organizationUid,
      (propertyCount.get(p.organizationUid) ?? 0) + 1,
    ),
  );

  const activeCount = properties.filter((p) => p.status === 1).length;
  const cityCount = new Set(properties.map((p) => p.city).filter(Boolean)).size;

  const byOrg = topWithOther(
    countBy(properties, (p) => orgName.get(p.organizationUid) ?? "Unknown"),
  );
  const byType = topWithOther(
    countBy(properties, (p) => propertyTypeLabel(p.propertyType)),
  );
  const byProvince = topWithOther(countBy(properties, (p) => p.province));
  const byStatus = topWithOther(
    countBy(properties, (p) => propertyStatusLabel(p.status)),
  );

  return (
    <div className="rsv-page">
      <div className="rsv-header">
        <div>
          <p className="rsv-eyebrow">Platform</p>
          <h2>Dashboard</h2>
          <p className="rsv-sub">
            Overview of every organization and property on the platform.
          </p>
        </div>
        <button
          className="rsv-btn"
          onClick={() => navigate(ROUTES.SUPER_ORGANIZATION_NEW)}
        >
          + New organization
        </button>
      </div>

      {loading && <PageLoading label="Loading platform data…" />}
      {!loading && error && <PageError message={error} onRetry={reload} />}

      {!loading && !error && organizations.length === 0 && (
        <div className="rsv-empty">
          <p>No organizations yet. Create the first one to get started.</p>
          <button
            className="rsv-btn"
            onClick={() => navigate(ROUTES.SUPER_ORGANIZATION_NEW)}
          >
            Create organization
          </button>
        </div>
      )}

      {!loading && !error && organizations.length > 0 && (
        <>
          <div className="rsv-summary">
            <StatCard
              label="Organizations"
              value={organizations.length}
              tone="teal"
            />
            <StatCard
              label="Properties"
              value={properties.length}
              tone="sage"
            />
            <StatCard
              label="Active properties"
              value={activeCount}
              tone="teal"
            />
            <StatCard label="Cities covered" value={cityCount} tone="sand" />
          </div>

          <div className="rsv-charts">
            <DonutChart
              title="Properties by organization"
              data={byOrg}
              centerLabel="properties"
              emptyText="Add a property to an organization to see this chart."
            />
            <DonutChart
              title="Property types"
              data={byType}
              centerLabel="properties"
            />
            <DonutChart
              title="Properties by province"
              data={byProvince}
              centerLabel="properties"
            />
            <DonutChart
              title="Status"
              data={byStatus}
              centerLabel="properties"
            />
          </div>

          <section className="sa-section">
            <div className="sa-section-head">
              <h3>Organizations</h3>
              <Link className="sa-link" to={ROUTES.SUPER_ORGANIZATIONS}>
                View all →
              </Link>
            </div>
            <div className="rsv-table-wrap sa-embedded">
              <table className="rsv-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Currency</th>
                    <th>Properties</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.slice(0, 6).map((o) => (
                    <tr key={o.uid}>
                      <td>
                        <Link
                          className="sa-link"
                          to={superOrganizationPath(o.uid)}
                        >
                          {o.name}
                        </Link>
                      </td>
                      <td>{o.code}</td>
                      <td>{o.defaultCurrency}</td>
                      <td>{propertyCount.get(o.uid) ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
