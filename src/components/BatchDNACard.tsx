import type { SafetyCase } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { CHAIN_STAGES, FOOD_CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

function fmtDate(val: string): string {
  if (!val) return "—";
  // ISO string (from _now())
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleDateString();
  // Legacy unix timestamp
  const n = Number(val);
  if (!isNaN(n)) return new Date(n * 1000).toLocaleDateString();
  return val;
}

export default function BatchDNACard({ c }: { c: SafetyCase }) {
  const stageLbl = CHAIN_STAGES.find(s => s.value === c.chain_stage)?.label || c.chain_stage;
  const catLbl   = FOOD_CATEGORIES.find(f => f.value === c.food_category)?.label || c.food_category;

  return (
    <div className="panel p-4 hover:border-[rgba(56,189,248,0.3)] transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-[#14B8A6] mb-1 truncate">{c.case_id}</p>
          <h3 className="font-semibold text-sm text-[#F8FAFC] truncate" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            {c.title}
          </h3>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/3 rounded p-2">
          <p className="text-[10px] text-[#64748B] mb-0.5">Category</p>
          <p className="text-xs text-[#F8FAFC] font-medium">{catLbl}</p>
        </div>
        <div className="bg-white/3 rounded p-2">
          <p className="text-[10px] text-[#64748B] mb-0.5">Chain Stage</p>
          <p className="text-xs text-[#F8FAFC] font-medium">{stageLbl}</p>
        </div>
      </div>

      {c.batch_or_lot_reference && (
        <div className="mb-3">
          <p className="text-[10px] text-[#64748B] mb-0.5">Lot / Batch</p>
          <p className="text-xs font-mono text-[#38BDF8]">{c.batch_or_lot_reference}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#64748B] font-mono">{fmtDate(c.created_at)}</span>
        <Link
          href={`/cases/${c.case_id}`}
          className="flex items-center gap-1 text-xs text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
