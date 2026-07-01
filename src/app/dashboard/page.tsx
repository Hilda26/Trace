"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import BatchDNACard from "@/components/BatchDNACard";
import { getCasesByOwner, getConnectedAddress, withdrawCase, archiveCase } from "@/lib/contract";
import type { SafetyCase } from "@/lib/types";
import { TxPanel } from "@/components/ExplorerLink";
import { Loader2, AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [cases, setCases] = useState<SafetyCase[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [tx, setTx] = useState<{ txHash: string; explorerLink: string } | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    getConnectedAddress().then(addr => {
      setAddress(addr);
      if (addr) {
        getCasesByOwner(addr).then(c => { setCases(c); setLoading(false); });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const tabs = [
    { key: "all", label: "All Cases" },
    { key: "active", label: "Active" },
    { key: "public", label: "Public" },
    { key: "private", label: "Private" },
    { key: "high_risk", label: "High Risk" },
    { key: "archived", label: "Archived" },
  ];

  const filtered = cases.filter(c => {
    if (activeTab === "all") return c.status !== "archived";
    if (activeTab === "active") return ["submitted","under_review"].includes(c.status);
    if (activeTab === "public") return c.visibility_mode === "public";
    if (activeTab === "private") return c.visibility_mode === "private";
    if (activeTab === "high_risk") return ["high_risk","critical_risk","hold_required","recall_match_likely"].includes(c.status);
    if (activeTab === "archived") return c.status === "archived";
    return true;
  });

  const highRiskCount = cases.filter(c => ["high_risk","critical_risk","hold_required","recall_match_likely"].includes(c.status)).length;

  async function handleWithdraw(caseId: string) {
    setActionError(""); setTx(null);
    try {
      const result = await withdrawCase(caseId);
      setTx(result);
      setCases(prev => prev.map(c => c.case_id === caseId ? { ...c, status: "withdrawn" } : c));
    } catch (e: any) {
      setActionError(e.message);
    }
  }

  async function handleArchive(caseId: string) {
    setActionError(""); setTx(null);
    try {
      const result = await archiveCase(caseId);
      setTx(result);
      setCases(prev => prev.map(c => c.case_id === caseId ? { ...c, status: "archived" } : c));
    } catch (e: any) {
      setActionError(e.message);
    }
  }

  if (!address) return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center">
          <Lock size={22} className="text-[#64748B]" />
        </div>
        <p className="text-[#64748B] text-sm">Connect your wallet to view your private dashboard.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Owner Dashboard</h1>
            <p className="text-xs font-mono text-[#64748B]">{address}</p>
          </div>
          <Link href="/create" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#38BDF8", color: "#05080A" }}>
            + New Case
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Cases",   value: cases.length,     color: "#38BDF8" },
            { label: "Pending Review",value: cases.filter(c => ["submitted","under_review"].includes(c.status)).length, color: "#8B5CF6" },
            { label: "High Risk",     value: highRiskCount,    color: "#EF4444" },
            { label: "Archived",      value: cases.filter(c => c.status === "archived").length, color: "#64748B" },
          ].map(({ label, value, color }) => (
            <div key={label} className="panel p-4">
              <p className="text-xs text-[#64748B] mb-1">{label}</p>
              <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* High risk alert */}
        {highRiskCount > 0 && (
          <div className="flex items-center gap-3 p-3 rounded border border-[#EF4444]/20 bg-[#EF4444]/5 mb-6">
            <AlertTriangle size={15} className="text-[#EF4444]" />
            <p className="text-sm text-[#EF4444] font-medium">{highRiskCount} case{highRiskCount !== 1 ? "s" : ""} require immediate attention.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: activeTab === key ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${activeTab === key ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: activeTab === key ? "#38BDF8" : "#64748B",
              }}>
              {label}
            </button>
          ))}
        </div>

        {tx && <TxPanel txHash={tx.txHash} explorerLink={tx.explorerLink} />}
        {actionError && <p className="text-xs text-[#EF4444] mb-4">{actionError}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-[#38BDF8] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#64748B] text-sm">No cases in this view.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div key={c.case_id} className="relative group">
                <BatchDNACard c={c} />
                <div className="absolute bottom-3 right-3 hidden group-hover:flex gap-1.5">
                  <Link href={`/room/${c.case_id}`}
                    className="px-2 py-1 rounded text-[10px] border border-[#8B5CF6]/30 text-[#8B5CF6] bg-[#05080A] hover:bg-[#8B5CF6]/10 transition-colors">
                    Case Room
                  </Link>
                  {c.status !== "withdrawn" && c.status !== "archived" && (
                    <button onClick={() => handleWithdraw(c.case_id)}
                      className="px-2 py-1 rounded text-[10px] border border-[#EF4444]/30 text-[#EF4444] bg-[#05080A] hover:bg-[#EF4444]/10 transition-colors">
                      Withdraw
                    </button>
                  )}
                  {c.status !== "archived" && (
                    <button onClick={() => handleArchive(c.case_id)}
                      className="px-2 py-1 rounded text-[10px] border border-white/10 text-[#64748B] bg-[#05080A] hover:bg-white/5 transition-colors">
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
