export type Raw = Record<string, unknown>;

export const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Raw)
    : {};

export const str = (value: unknown, fallback = ""): string =>
  value === null || value === undefined ? fallback : String(value);

/** Accepts [..], { items: [..] }, { data: [..] }, { data: { items: [..] } } ... */
export function pickList(data: unknown): Raw[] {
  if (Array.isArray(data)) return data.map(asRecord);
  const d = asRecord(data);
  for (const key of [
    "items",
    "data",
    "results",
    "organizations",
    "properties",
    "value",
  ]) {
    const v = d[key];
    if (Array.isArray(v)) return v.map(asRecord);
    const inner = asRecord(v);
    if (Array.isArray(inner.items)) return inner.items.map(asRecord);
  }
  return [];
}

export function pickUid(raw: Raw, extraKeys: string[] = []): string {
  for (const key of [...extraKeys, "uid", "id"]) {
    if (raw[key]) return String(raw[key]);
  }
  return "";
}

/** Create endpoints may return a bare GUID string or an object. */
export function pickCreatedUid(
  data: unknown,
  extraKeys: string[] = [],
): string {
  if (typeof data === "string") return data;
  const d = asRecord(data);
  return pickUid(d, extraKeys) || pickUid(asRecord(d.data), extraKeys);
}

export function pickPageMeta(
  data: unknown,
  fallback: { page: number; pageSize: number; totalCount: number },
) {
  const d = asRecord(data);
  const nested = asRecord(d.data);
  return {
    page: Number(d.page ?? nested.page ?? fallback.page),
    pageSize: Number(d.pageSize ?? nested.pageSize ?? fallback.pageSize),
    totalCount: Number(
      d.totalCount ?? d.total ?? nested.totalCount ?? nested.total ?? fallback.totalCount,
    ),
  };
}
