import { ProductStatus } from "@/services/mockData";

interface StatusBadgeProps {
  status: ProductStatus;
  showDays?: number | null;
}

const statusConfig = {
  ok: {
    label: "OK",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  atencao: {
    label: "Atenção",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  critico: {
    label: "Crítico",
    className: "bg-orange-100 text-orange-800 border border-orange-200",
  },
  vencido: {
    label: "Vencido",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

export function StatusBadge({ status, showDays }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}
      data-testid={`badge-status-${status}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === "ok" ? "bg-emerald-500" :
        status === "atencao" ? "bg-amber-500" :
        status === "critico" ? "bg-orange-500" :
        "bg-red-500"
      }`} />
      {config.label}
      {showDays !== null && showDays !== undefined && status !== "ok" && (
        <span className="ml-0.5 opacity-75">
          {status === "vencido" ? `(${Math.abs(showDays)}d)` : `(${showDays}d)`}
        </span>
      )}
    </span>
  );
}
