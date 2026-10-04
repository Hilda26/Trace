"use client";

import type { SafetyVerdict } from "@/lib/types";
import { StatusBadge, RiskBadge, ConfidenceMeter } from "./StatusBadge";
import { CheckCircle2, Thermometer, FileText, Eye, Zap, Package, Link2, ShieldOff } from "lucide-react";

const fieldRows = [
  { key: "evidence_quality",           label: "Evidence Quality",            icon: Eye },
  { key: "recall_match",               label: "Recall Match",                icon: Zap },
  { key: "cold_chain_assessment",      label: "Cold Chain",                  icon: Thermometer },
  { key: "documentation_completeness", label: "Documentation",               icon: FileText },
  { key: "inspection_signal",          label: "Inspection Signal",           icon: CheckCircle2 },
  { key: "required_action",            label: "Required Action",             icon: Package },
] as const;

const GOOD = new Set(["clear_to_proceed", "intact", "complete", "strong", "no_match", "clean", "none", "proceed_with_documentation"]);
const WARN = new Set(["proceed_with_conditions", "minor_excursion", "partial", "medium", "unclear", "minor_issue", "hold_for_manual_review"]);

function valColor(v: string) {
  if (GOOD.has(v)) return "#22C55E";
  if (WARN.has(v)) return "#F59E0B";
  return "#EF4444";
}

export default function VerdictChamber({ verdict }: { verdict: SafetyVerdict }) {
  return (
    <div className="panel p-5 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top right, rgba(56,189,248,0.04) 0%, transparent 60%)" }} />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#38BDF8] pulse-dot" />
        <span className="text-xs font-mono text-[#38BDF8] tracking-widest uppercase">Safety Verdict Chamber</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <StatusBadge status={verdict.safety_status} />
        <RiskBadge tier={verdict.risk_tier} />
      </div>

      <div className="mb-4">
        <p className="text-xs text-[#64748B] mb-1">Confidence</p>
        <ConfidenceMeter value={verdict.confidence} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {fieldRows.map(({ key, label, icon: Icon }) => {
          const val = verdict[key as keyof SafetyVerdict] as string;
          return (
            <div key={key} className="bg-white/3 rounded p-2.5 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} className="text-[#64748B]" />
                <span className="text-[10px] text-[#64748B] uppercase tracking-wide">{label}</span>
              </div>
              <span
                className="text-xs font-mono"
                style={{ color: valColor(val) }}
              >
                {val.replace(/_/g, " ")}
              </span>
            </div>
          );
        })}
      </div>

      {(verdict.product_binding || verdict.batch_binding) && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/3 rounded p-2.5 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Link2 size={11} className="text-[#64748B]" />
              <span className="text-[10px] text-[#64748B] uppercase tracking-wide">Product Binding</span>
            </div>
            <span className="text-xs font-mono text-[#38BDF8]">{(verdict.product_binding || "missing").replace(/_/g, " ")}</span>
          </div>
          <div className="bg-white/3 rounded p-2.5 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Link2 size={11} className="text-[#64748B]" />
              <span className="text-[10px] text-[#64748B] uppercase tracking-wide">Batch Binding</span>
            </div>
            <span className="text-xs font-mono text-[#38BDF8]">{(verdict.batch_binding || "missing").replace(/_/g, " ")}</span>
          </div>
        </div>
      )}

      {verdict.source_bindings && verdict.source_bindings.length > 0 && (
        <div className="border-t border-white/8 pt-3 mb-3">
          <p className="text-xs text-[#64748B] mb-2">Source Provenance</p>
          <div className="space-y-2">
            {verdict.source_bindings.map((source) => (
              <div key={source.url} className="bg-white/3 rounded p-2 border border-white/5">
                <p className="text-xs font-mono text-[#F8FAFC] truncate">{source.issuer} · {source.publication_date}</p>
                <p className="text-[10px] text-[#64748B]">
                  Product: {source.mentions_product ? "named" : "not named"} · Batch: {source.mentions_batch ? "named" : "not named"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-white/8 pt-3">
        <p className="text-xs text-[#64748B] mb-1">Verdict Reason</p>
        <p className="text-sm text-[#F8FAFC]/90 leading-relaxed">{verdict.short_reason}</p>
      </div>

      {verdict.excluded_evidence && (
        <div className="border-t border-white/8 pt-3 mt-3 flex gap-2">
          <ShieldOff size={13} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#94A3B8]">{verdict.excluded_evidence}</p>
        </div>
      )}
    </div>
  );
}
