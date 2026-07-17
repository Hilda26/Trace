"use client";

import { useState, useEffect, use } from "react";
import Nav from "@/components/Nav";
import { StatusBadge, RiskBadge } from "@/components/StatusBadge";
import VerdictChamber from "@/components/VerdictChamber";
import Disclaimer from "@/components/Disclaimer";
import { getCase, getCasePrivate, getCaseVerdict, getCaseVerdictPrivate, getConnectedAddress, requestSafetyVerdict } from "@/lib/contract";
import type { SafetyCase, SafetyVerdict } from "@/lib/types";
import { CHAIN_STAGES, FOOD_CATEGORIES, REVIEW_FOCUS_OPTIONS, NETWORK } from "@/lib/constants";

function fmtDate(val: string): string {
  if (!val) return "—";
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleDateString();
  const n = Number(val);
  if (!isNaN(n)) return new Date(n * 1000).toLocaleDateString();
  return val;
};
import { TxPanel } from "@/components/ExplorerLink";
import { ExternalLink, Thermometer, FileText, Image, AlertTriangle, Loader2 } from "lucide-react";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [c, setCase] = useState<SafetyCase | null>(null);
  const [verdict, setVerdict] = useState<SafetyVerdict | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [tx, setTx] = useState<{ txHash: string; explorerLink: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCase() {
      const addr = await getConnectedAddress();
      const [publicCase, publicVerdict] = await Promise.all([getCase(id), getCaseVerdict(id)]);
      let resolvedCase = publicCase;
      let resolvedVerdict = publicVerdict;

      if (addr) {
        const [privateCase, privateVerdict] = await Promise.all([
          getCasePrivate(id).catch(() => null),
          getCaseVerdictPrivate(id).catch(() => null),
        ]);
        resolvedCase = privateCase || publicCase;
        resolvedVerdict = privateVerdict || publicVerdict;
      }

      setCase(resolvedCase); setVerdict(resolvedVerdict); setWalletAddress(addr); setLoading(false);
    }
    loadCase();
  }, [id]);

  const isOwner = c && walletAddress && c.owner.toLowerCase() === walletAddress.toLowerCase();

  async function handleRequestVerdict() {
    setRequesting(true); setError("");
    try {
      const result = await requestSafetyVerdict(id);
      setTx(result);
      setTimeout(() => getCaseVerdictPrivate(id).then(setVerdict).catch(() => getCaseVerdict(id).then(setVerdict)), 3000);
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    } finally {
      setRequesting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="text-[#38BDF8] animate-spin" />
      </div>
    </div>
  );

  if (!c) return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-[#64748B]">Case not found or not public.</p>
      </div>
    </div>
  );

  const stageLbl   = CHAIN_STAGES.find(s => s.value === c.chain_stage)?.label || c.chain_stage;
  const catLbl     = FOOD_CATEGORIES.find(f => f.value === c.food_category)?.label || c.food_category;
  const focusLbl   = REVIEW_FOCUS_OPTIONS.find(r => r.value === c.review_focus)?.label || c.review_focus;

  const evidenceLinks = c.public_evidence_urls ? c.public_evidence_urls.split(",").filter(Boolean) : [];
  const imageLinks    = c.image_urls ? c.image_urls.split(",").filter(Boolean) : [];
  const pdfLinks      = c.pdf_report_urls ? c.pdf_report_urls.split(",").filter(Boolean) : [];
  const recallLinks   = c.recall_or_advisory_urls ? c.recall_or_advisory_urls.split(",").filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-[#14B8A6]">{c.case_id}</span>
            <StatusBadge status={c.status} />
            {verdict && <RiskBadge tier={verdict.risk_tier} />}
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{c.title}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-[#64748B]">
            <span>{catLbl}</span>
            <span>·</span>
            <span>{stageLbl}</span>
            <span>·</span>
            <span>{focusLbl}</span>
            <span>·</span>
            <span>{fmtDate(c.created_at)}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Case Details */}
          <div className="lg:col-span-2 space-y-4">

            {/* Batch DNA */}
            <div className="panel p-5">
              <h3 className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest mb-4">Batch DNA Card</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Product Summary</p>
                  <p className="text-[#F8FAFC]">{c.product_summary || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] mb-1">Batch / Lot Reference</p>
                  <p className="font-mono text-[#38BDF8]">{c.batch_or_lot_reference || "—"}</p>
                </div>
                {isOwner && c.supplier_or_facility_summary && (
                  <div className="col-span-2">
                    <p className="text-xs text-[#64748B] mb-1">Supplier / Facility</p>
                    <p className="text-[#F8FAFC]">{c.supplier_or_facility_summary}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-[#64748B] mb-1">Safety Question</p>
                  <p className="text-[#F8FAFC] italic">"{c.safety_question}"</p>
                </div>
              </div>
            </div>

            {/* Cold-Chain Flight Recorder */}
            {c.temperature_log_summary && (
              <div className="panel p-5">
                <h3 className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Thermometer size={12} /> Cold-Chain Flight Recorder
                </h3>
                <div className="bg-[#05080A] rounded p-3 font-mono text-xs text-[#22C55E] leading-relaxed mb-3">
                  {c.temperature_log_summary}
                </div>
                <div className="h-2 rounded-full heat-strip opacity-60" />
              </div>
            )}

            {/* Transport Notes */}
            {c.transport_storage_notes && (
              <div className="panel p-5">
                <h3 className="text-xs font-mono text-[#64748B] uppercase tracking-widest mb-2">Transport / Storage Notes</h3>
                <p className="text-sm text-[#F8FAFC]/80">{c.transport_storage_notes}</p>
              </div>
            )}

            {/* Inspection Notebook */}
            {c.inspection_notes && (
              <div className="panel p-5">
                <h3 className="text-xs font-mono text-[#64748B] uppercase tracking-widest mb-2">Inspection Notebook</h3>
                <p className="text-sm text-[#F8FAFC]/80">{c.inspection_notes}</p>
              </div>
            )}

            {/* Evidence Microscope */}
            {(evidenceLinks.length > 0 || imageLinks.length > 0 || pdfLinks.length > 0) && (
              <div className="panel p-5">
                <h3 className="text-xs font-mono text-[#8B5CF6] uppercase tracking-widest mb-4">Evidence Microscope</h3>
                <div className="space-y-3">
                  {evidenceLinks.length > 0 && (
                    <div>
                      <p className="text-xs text-[#64748B] mb-2">Evidence Links</p>
                      {evidenceLinks.map((u, i) => (
                        <a key={i} href={u.trim()} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-[#38BDF8] hover:underline mb-1">
                          <ExternalLink size={11} /> {u.trim().slice(0, 80)}{u.trim().length > 80 ? "…" : ""}
                        </a>
                      ))}
                    </div>
                  )}
                  {imageLinks.length > 0 && (
                    <div>
                      <p className="text-xs text-[#64748B] mb-2 flex items-center gap-1"><Image size={11} /> Image URLs</p>
                      {imageLinks.map((u, i) => (
                        <a key={i} href={u.trim()} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-[#8B5CF6] hover:underline mb-1">
                          <ExternalLink size={11} /> {u.trim().slice(0, 80)}{u.trim().length > 80 ? "…" : ""}
                        </a>
                      ))}
                    </div>
                  )}
                  {pdfLinks.length > 0 && (
                    <div>
                      <p className="text-xs text-[#64748B] mb-2 flex items-center gap-1"><FileText size={11} /> PDF Reports</p>
                      {pdfLinks.map((u, i) => (
                        <a key={i} href={u.trim()} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-[#14B8A6] hover:underline mb-1">
                          <ExternalLink size={11} /> {u.trim().slice(0, 80)}{u.trim().length > 80 ? "…" : ""}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recall Radar */}
            {recallLinks.length > 0 && (
              <div className="panel p-5 border-[rgba(239,68,68,0.2)]">
                <h3 className="text-xs font-mono text-[#EF4444] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle size={12} /> Recall Radar
                </h3>
                {recallLinks.map((u, i) => (
                  <a key={i} href={u.trim()} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#EF4444] hover:underline mb-1">
                    <ExternalLink size={11} /> {u.trim().slice(0, 80)}{u.trim().length > 80 ? "…" : ""}
                  </a>
                ))}
              </div>
            )}

            {/* Explorer link */}
            <div className="panel p-3 flex items-center justify-between">
              <span className="text-xs text-[#64748B]">Case on StudioNet Explorer</span>
              <a href={`${NETWORK.explorer}/address/${c.owner}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#38BDF8] hover:underline">
                <ExternalLink size={11} /> View on Explorer
              </a>
            </div>
          </div>

          {/* Right: Verdict + Actions */}
          <div className="space-y-4">
            {verdict ? (
              <VerdictChamber verdict={verdict} />
            ) : (
              <div className="panel p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#64748B] pulse-dot" />
                  <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest">Verdict Pending</span>
                </div>
                <p className="text-xs text-[#64748B] mb-4">No GenLayer verdict has been issued for this case yet.</p>
                {isOwner && (
                  <button
                    onClick={handleRequestVerdict}
                    disabled={requesting}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                    style={{ background: "#38BDF8", color: "#05080A" }}
                  >
                    {requesting ? <><Loader2 size={14} className="animate-spin" /> Requesting…</> : "Request GenLayer Verdict"}
                  </button>
                )}
                {error && <p className="text-xs text-[#EF4444] mt-2">{error}</p>}
                {tx && <TxPanel txHash={tx.txHash} explorerLink={tx.explorerLink} />}
              </div>
            )}

            {/* Required Action Siren */}
            {verdict && verdict.required_action !== "none" && (
              <div className="panel p-4 border-[#F59E0B]/30" style={{ background: "rgba(245,158,11,0.05)" }}>
                <h4 className="text-xs font-mono text-[#F59E0B] uppercase tracking-widest mb-2">Required Action Siren</h4>
                <p className="text-sm font-semibold text-[#F59E0B]">
                  {verdict.required_action.replace(/_/g, " ")}
                </p>
              </div>
            )}

            <Disclaimer />
          </div>
        </div>
      </div>
    </div>
  );
}
