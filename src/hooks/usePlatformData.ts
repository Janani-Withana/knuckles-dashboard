import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import { listOrganizations } from "../services/superAdmin/organizationService.service";
import { listOrganizationProperties } from "../services/superAdmin/propertyService.service";
import type { Organization } from "../types/superAdmin/organization";
import type { Property } from "../types/superAdmin/property";

/** Loads every organization and all of their properties. */
export function usePlatformData() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
        const orgs = await listOrganizations();
        const lists = await Promise.all(
          orgs.map((o) =>
            listOrganizationProperties(o.uid).catch(() => [] as Property[]),
          ),
        );
        if (cancelled) return;
        setOrganizations(orgs);
        setProperties(lists.flat());
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Could not load data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { organizations, properties, loading, error, reload };
}