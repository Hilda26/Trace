"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import { getAdminStats, getContractSummary, CONTRACT_ADDRESS, getConnectedAddress } from "@/lib/contract";
import type { AdminStats } from "@/lib/types";
import { NETWORK, STATUS_CONFIG, RISK_CONFIG } from "@/lib/constants";
import { Loader2, Eye, AlertTriangle, ExternalLink, Lock } from "lucide-react";

const DEPLOYER = "0x95b37d7bf3f1b1b9e9a1ae8300c627135c095375";

export default function AdminMonitorPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    getConnectedAddress().then(addr => {
      setWallet(addr);
      setAuthChecked(true);
      if (addr?.toLowerCase() === DEPLOYER.toLowerCase()) {
        Promise.all([getAdminStats(), getContractSummary()]).then(([s, c]) => {
          setStats(s); setSummary(c); setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (authChecked && wallet?.toLowerCase() !== DEPLOYER.toLowerCase()) {
    return (
      <div className="min-h-screen bg-[#05080A]">
        <Nav />
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center mx-auto mb-4">
            <Lock size={20} className="text-[#EF4444]" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Access Restricted</h2>
          <p className="text-sm text-[#64748B]">The Admin Monitor is only accessible to the contract deployer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#14B8A6] pulse-dot" />
          <span className="text-xs font-mono text-[#14B8A6] uppercase tracking-widest">Admin Observatory Grid</span>
        </div>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Admin Monitor</h1>
            <p className="text-sm text-[#64748B]">Read-only protocol observability. No write controls.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#64748B]/20 bg-[#64748B]/5">
            <Eye size={13} className="text-[#64748B]" />
            <span className="text-xs text-[#64748B] font-mono">MONITOR ONLY</span>
          </div>
        </div>

        <div className="panel p-3 mb-6 flex items-center gap-2">
          <AlertTriangle size={13} className="text-[#F59E0B]" />
          <p className="text-xs text-[#94A3B8]">Admin cannot approve, block, alter verdicts, view private notes, or impersonate users. This page is observability only.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="text-[#38BDF8] animate-spin" /></div>
        ) : !stats ? (
          <p className="text-[#64748B] text-sm text-center py-20">Unable to load stats. Ensure contract is deployed.</p>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Total Cases",      value: stats.total_cases,    color: "#38BDF8" },
                { label: "Pending Verdicts", value: stats.pending_verdicts, color: "#8B5CF6" },
                { label: "Stuck Reviews",    value: stats.stuck_reviews,  color: "#F59E0B" },
                { label: "Contract Version", value: stats.contract_version, color: "#14B8A6", mono: true },
              ].map(({ label, value, color, mono }) => (
                <div key={label} className="panel p-4">
                  <p className="text-xs text-[#64748B] mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${mono ? "font-mono text-lg" : ""}`} style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Safety Status Distribution */}
              <div className="panel p-5">
                <h3 className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest mb-4">Safety Status Distribution</h3>
                {Object.entries(stats.safety_status_distribution).length === 0 ? (
                  <p className="text-xs text-[#64748B]">No cases yet.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats.safety_status_distribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([status, count]) => {
                        const cfg = STATUS_CONFIG[status];
                        const total = stats.total_cases || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={status}>
                            <div className="flex justify-between text-xs mb-1">
                              <span style={{ color: cfg?.color || "#64748B" }}>{status.replace(/_/g, " ")}</span>
                              <span className="font-mono text-[#64748B]">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg?.color || "#64748B" }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Risk Distribution */}
              <div className="panel p-5">
                <h3 className="text-xs font-mono text-[#EF4444] uppercase tracking-widest mb-4">Risk Distribution</h3>
                {Object.entries(stats.risk_distribution).length === 0 ? (
                  <p className="text-xs text-[#64748B]">No verdicts yet.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.risk_distribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([tier, count]) => {
                        const cfg = RISK_CONFIG[tier];
                        const maxVal = Math.max(...Object.values(stats.risk_distribution));
                        const pct = Math.round((count / maxVal) * 100);
                        return (
                          <div key={tier}>
                            <div className="flex justify-between text-xs mb-1">
                              <span style={{ color: cfg?.color || "#64748B" }}>{tier} risk</span>
                              <span className="font-mono text-[#64748B]">{count}</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg?.color || "#64748B" }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Counters */}
              {summary && (
                <div className="panel p-5">
                  <h3 className="text-xs font-mono text-[#8B5CF6] uppercase tracking-widest mb-4">On-Chain Counters</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Cases", value: summary.case_counter },
                      { label: "Verdicts", value: summary.verdict_counter },
                      { label: "Notes", value: summary.note_counter },
                      { label: "Activities", value: summary.activity_counter },
                      { label: "Audit Logs", value: summary.audit_counter },
                      { label: "Version", value: summary.contract_version },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/3 rounded p-2.5">
                        <p className="text-[10px] text-[#64748B] mb-0.5">{label}</p>
                        <p className="text-sm font-mono text-[#8B5CF6]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contract Info */}
              <div className="panel p-5">
                <h3 className="text-xs font-mono text-[#14B8A6] uppercase tracking-widest mb-4">Contract Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-[#64748B] mb-0.5">Network</p>
                    <p className="font-mono text-[#F8FAFC]">{NETWORK.name} · Chain {NETWORK.chainId}</p>
                  </div>

                  {/* Contract address — primary clickable link */}
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Contract Address</p>
                    {CONTRACT_ADDRESS ? (
                      <a
                        href={`${NETWORK.explorer}/address/${CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-mono text-xs text-[#14B8A6] hover:text-[#14B8A6]/80 hover:underline transition-colors break-all"
                      >
                        <ExternalLink size={11} className="flex-shrink-0" />
                        {CONTRACT_ADDRESS}
                      </a>
                    ) : (
                      <p className="font-mono text-xs text-[#F59E0B]">Not deployed — set NEXT_PUBLIC_CONTRACT_ADDRESS</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-[#64748B] mb-0.5">RPC Endpoint</p>
                    <p className="font-mono text-xs text-[#64748B] break-all">{NETWORK.rpc}</p>
                  </div>

                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Deployer</p>
                    <a
                      href={`${NETWORK.explorer}/address/${stats.deployer}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 font-mono text-xs text-[#38BDF8] hover:underline break-all transition-colors"
                    >
                      <ExternalLink size={11} className="flex-shrink-0" />
                      {stats.deployer}
                    </a>
                  </div>

                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Block Explorer</p>
                    <a
                      href={NETWORK.explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#38BDF8] hover:underline transition-colors"
                    >
                      <ExternalLink size={11} /> {NETWORK.explorer}
                    </a>
                  </div>
                </div>
              </div>

              {/* No write controls notice */}
              <div className="panel p-5 border-[rgba(100,116,139,0.2)]">
                <h3 className="text-xs font-mono text-[#64748B] uppercase tracking-widest mb-4">Admin Restrictions</h3>
                <div className="space-y-2">
                  {[
                    "Cannot approve safety cases",
                    "Cannot block or reject cases",
                    "Cannot alter or edit verdicts",
                    "Cannot publish private reports",
                    "Cannot delete evidence",
                    "Cannot view private notes",
                    "Cannot impersonate users",
                    "Cannot override contract results",
                  ].map(r => (
                    <div key={r} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-[#EF4444]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#EF4444] text-[8px]">✕</span>
                      </div>
                      <span className="text-xs text-[#64748B]">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
