import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageError, PageLoading } from "@/components/common/PageState";
import { useOrganizations } from "@/features/organizations/hooks/useOrganizations";
import { usePlatformOverview } from "@/features/platform/hooks/usePlatformOverview";
import { usePermissions } from "@/hooks/usePermissions";
import {
  ROUTES,
  superOrganizationPath,
  superPropertyNewPath,
} from "@/routes/paths";
import "@/styles/reservations.css";
import "@/styles/superAdmin.css";

export default function OrganizationsListScreen() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [submittedSearch, setSubmittedSearch] = useState<string | undefined>();

  const { data, isLoading, isError, error, refetch } = useOrganizations(
    page,
    submittedSearch,
  );
  const overview = usePlatformOverview();

  const counts = new Map<string, number>();
  overview.data?.properties.forEach((property) =>
    counts.set(
      property.organizationUid,
      (counts.get(property.organizationUid) ?? 0) + 1,
    ),
  );

  const organizations = data?.items ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil((data?.totalCount ?? 0) / (data?.pageSize || 20)),
  );

  const applySearch = () => {
    setPage(1);
    setSubmittedSearch(query.trim() || undefined);
  };

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
        {can("organization.create") && (
          <button
            className="rsv-btn"
            onClick={() => navigate(ROUTES.SUPER_ORGANIZATION_NEW)}
          >
            + Create Organization
          </button>
        )}
      </div>

      <div className="sa-toolbar">
        <input
          className="sa-search"
          placeholder="Search organizations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applySearch();
          }}
        />
        <button className="rsv-btn rsv-btn-ghost" onClick={applySearch}>
          Search
        </button>
      </div>

      {isLoading && <PageLoading />}
      {isError && (
        <PageError
          message={error instanceof Error ? error.message : "Could not load organizations."}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && organizations.length === 0 && (
        <p className="rsv-empty">
          {submittedSearch
            ? "No organizations match your search."
            : "No organizations yet. Create your first one."}
        </p>
      )}

      {!isLoading && !isError && organizations.length > 0 && (
        <>
          <div className="rsv-table-wrap">
            <table className="rsv-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Organization</th>
                  <th>Properties</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr key={organization.uid}>
                    <td>{organization.code}</td>
                    <td>{organization.name}</td>
                    <td>{counts.get(organization.uid) ?? "—"}</td>
                    <td>
                      <span className="sa-links">
                        <Link
                          className="sa-link"
                          to={superOrganizationPath(organization.uid)}
                        >
                          View
                        </Link>
                        {can("property.create") && (
                          <Link
                            className="sa-link"
                            to={superPropertyNewPath(organization.uid)}
                          >
                            + Property
                          </Link>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="sa-pagination">
              <button
                className="rsv-btn rsv-btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                className="rsv-btn rsv-btn-ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
