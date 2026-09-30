export const isoDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const parseIso = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const addDays = (iso: string, days: number) => {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

export const nightsBetween = (from: string, to: string) => {
  const start = parseIso(from);
  const end = parseIso(to);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
};

export const formatDate = (iso: string) =>
  parseIso(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const monthBounds = (anchor: Date) => {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  const days: string[] = [];
  for (let cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(isoDate(cursor));
  }
  return {
    from: isoDate(start),
    to: isoDate(end),
    label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    days,
  };
};

/** A segment covers a night when start is inclusive and end is exclusive. */
export const coversDay = (start: string, end: string, day: string) => start <= day && day < end;

export const overlapsStay = (start: string, end: string, checkIn: string, checkOut: string) =>
  start < checkOut && end > checkIn;
