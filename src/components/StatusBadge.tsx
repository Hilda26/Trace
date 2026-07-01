import { STATUS_CONFIG, RISK_CONFIG } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#64748B", bg: "rgba(100,116,139,0.1)" };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-mono"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export function RiskBadge({ tier }: { tier: string }) {
  const cfg = RISK_CONFIG[tier] || { color: "#64748B", label: tier };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono"
      style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}33` }}
    >
      {cfg.label} Risk
    </span>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 80 ? "#22C55E" : value >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}
