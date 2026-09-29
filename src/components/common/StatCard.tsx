import { useCountUp } from "../../hooks/useCountUp";

interface Props {
  label: string;
  value: number;
  tone?: "teal" | "sand" | "sage" | "clay";
  format?: (n: number) => string;
}

export default function StatCard({
  label,
  value,
  tone = "teal",
  format = (n) => String(n),
}: Props) {
  const shown = Math.round(useCountUp(value));
  return (
    <div className={`rsv-card rsv-card-${tone}`}>
      <span>{label}</span>
      <strong>{format(shown)}</strong>
    </div>
  );
}
