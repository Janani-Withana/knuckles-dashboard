import { Link, useNavigate } from "react-router-dom";
import DonutChart from "@/components/charts/DonutChart";
import { PageError, PageLoading } from "@/components/common/PageState";
import StatCard from "@/components/common/StatCard";
import { usePlatformOverview } from "@/features/platform/hooks/usePlatformOverview";
import { usePermissions } from "@/hooks/usePermissions";
import { ROUTES, superOrganizationPath } from "@/routes/paths";
import {
  propertyStatusLabel,
  propertyTypeLabel,
} from "@/types/property.types";
import { getApiErrorMessage } from "@/utils/errors";
import "@/styles/reservations.css";
import "@/styles/superAdmin.css";

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
  const rest = items.slice(max).reduce((sum, item) => sum + item.value, 0);
  return [...items.slice(0, max), { label: "Other", value: rest }];
}

export default function SuperDashboardScreen() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data, isLoading, isError, error, refetch } = usePlatformOverview();

  const organizations = data?.organizations ?? [];
  const properties = data?.properties ?? [];
  const orgName = new Map(organizations.map((org) => [org.uid, org.name]));
  const propertyCount = new Map<string, number>();
  properties.forEach((property) =>
    propertyCount.set(
      property.organizationUid,
      (propertyCount.get(property.organizationUid) ?? 0) + 1,
    ),
  );

  const activeCount = properties.filter((property) => property.status === 1)
    .length;
  const cityCount = new Set(
    properties.map((property) => property.city).filter(Boolean),
  ).size;

  const byOrg = topWithOther(
    countBy(
      properties,
      (property) => orgName.get(property.organizationUid) ?? "Unknown",
    ),
  );
  const byType = topWithOther(
    countBy(properties, (property) => propertyTypeLabel(property.propertyType)),
  );
  const byProvince = topWithOther(
    countBy(properties, (property) => property.province),
  );
  const byStatus = topWithOther(
    countBy(properties, (property) => propertyStatusLabel(property.status)),
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
        {can("organization.create") && (
          <button
            className="rsv-btn"
            onClick={() => navigate(ROUTES.SUPER_ORGANIZATION_NEW)}
          >
            + New organization
          </button>
        )}
      </div>

      {isLoading && <PageLoading label="Loading platform data…" />}
      {isError && (
        <PageError
          message={getApiErrorMessage(error, "Could not load data.")}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && organizations.length === 0 && (
        <div className="rsv-empty">
          <p>No organizations yet. Create the first one to get started.</p>
          {can("organization.create") && (
            <button
              className="rsv-btn"
              onClick={() => navigate(ROUTES.SUPER_ORGANIZATION_NEW)}
            >
              Create organization
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && organizations.length > 0 && (
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
                  {organizations.slice(0, 6).map((organization) => (
                    <tr key={organization.uid}>
                      <td>
                        <Link
                          className="sa-link"
                          to={superOrganizationPath(organization.uid)}
                        >
                          {organization.name}
                        </Link>
                      </td>
                      <td>{organization.code}</td>
                      <td>{organization.defaultCurrency}</td>
                      <td>{propertyCount.get(organization.uid) ?? 0}</td>
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
