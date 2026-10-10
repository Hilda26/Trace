"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getCase, getCasePrivate, getReviewNotes, addReviewNote, getConnectedAddress, requestSafetyVerdict, getCaseVerdictPrivate } from "@/lib/contract";
import type { SafetyCase, ReviewNote, SafetyVerdict } from "@/lib/types";
import VerdictChamber from "@/components/VerdictChamber";
import { TxPanel } from "@/components/ExplorerLink";
import { StatusBadge } from "@/components/StatusBadge";
import { Loader2, Lock, Send, Clock3 } from "lucide-react";

type RoomState = "loading" | "connect" | "pending" | "restricted" | "ready";

function readableLoadError(e: any): string {
  const raw = String(e?.shortMessage || e?.message || "");
  if (!raw) return "This case is not available yet. Wait for the submit transaction to finalize, then refresh or open it from your dashboard.";
  if (raw.includes("Missing or invalid parameters") || raw.includes("execution failed")) {
    return "This case is not available yet. The submit transaction may still be finalizing. Wait a moment, then refresh or open it from your dashboard.";
  }
  return raw;
}

export default function CaseRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [c, setCase] = useState<SafetyCase | null>(null);
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState>("loading");
  const [noteSummary, setNoteSummary] = useState("");
  const [noteType, setNoteType] = useState("internal");
  const [noteVisibility, setNoteVisibility] = useState("private");
  const [submitting, setSubmitting] = useState(false);
  const [tx, setTx] = useState<{ txHash: string; explorerLink: string } | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [requestingVerdict, setRequestingVerdict] = useState(false);
  const [verdict, setVerdict] = useState<SafetyVerdict | null>(null);

  async function loadRoom() {
    setRoomState("loading");
    setError("");
    setWarning("");
    setCase(null);
    setNotes([]);
    setVerdict(null);

    const addr = await getConnectedAddress();
    setAddress(addr);
    if (!addr) {
      setRoomState("connect");
      return;
    }

    let privateCase: SafetyCase | null = null;
    try {
      privateCase = await getCasePrivate(id);
    } catch (e: any) {
      setError(readableLoadError(e));
      setRoomState("pending");
      return;
    }

    if (!privateCase) {
      const publicCase = await getCase(id).catch(() => null);
      if (publicCase && publicCase.owner && publicCase.owner.toLowerCase() !== addr.toLowerCase()) {
        setCase(publicCase);
        setRoomState("restricted");
        return;
      }

      setError("This case is not available yet. Wait for the submit transaction to finalize, then refresh or open it from your dashboard.");
      setRoomState("pending");
      return;
    }

    setCase(privateCase);
    setRoomState("ready");

    const [notesResult, verdictResult] = await Promise.allSettled([
      getReviewNotes(id, addr),
      getCaseVerdictPrivate(id),
    ]);

    if (notesResult.status === "fulfilled") setNotes(notesResult.value);
    else setWarning("Case loaded, but notes are temporarily unavailable. Refresh after the transaction finalizes.");

    if (verdictResult.status === "fulfilled") setVerdict(verdictResult.value);
  }

  useEffect(() => {
    let alive = true;
    loadRoom().catch((e: any) => {
      if (!alive) return;
      setError(readableLoadError(e));
      setRoomState("pending");
    });
    return () => { alive = false; };
  }, [id]);

  const isOwner = c && address && c.owner.toLowerCase() === address.toLowerCase();

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteSummary.trim()) return;
    setSubmitting(true); setError("");
    try {
      const noteId = `note_${Date.now()}`;
      const result = await addReviewNote({
        case_id: id,
        note_id: noteId,
        note_type: noteType,
        note_summary: noteSummary,
        visibility: noteVisibility,
      });
      setTx(result);
      setNotes(prev => [...prev, {
        note_id: noteId,
        case_id: id,
        author: address || "",
        note_type: noteType,
        note_summary: noteSummary,
        visibility: noteVisibility as any,
        created_at: String(Date.now()),
      }]);
      setNoteSummary("");
    } catch (e: any) {
      setError(e?.message || "Unable to add this note.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestVerdict() {
    setRequestingVerdict(true); setError("");
    try {
      const result = await requestSafetyVerdict(id);
      setTx(result);
      const [updatedCase, updatedVerdict] = await Promise.all([getCasePrivate(id), getCaseVerdictPrivate(id)]);
      if (updatedCase) setCase(updatedCase);
      if (updatedVerdict) setVerdict(updatedVerdict);
    } catch (e: any) {
      setError(e?.message || "Unable to request review for this case.");
    } finally {
      setRequestingVerdict(false);
    }
  }

  if (roomState === "loading") return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="text-[#38BDF8] animate-spin" />
      </div>
    </div>
  );

  if (roomState === "connect") return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />
      <div className="flex flex-col items-center justify-center py-32 gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center">
          <Lock size={22} className="text-[#64748B]" />
        </div>
        <p className="text-[#64748B] text-sm">Connect the wallet that submitted this case to open the Case Room.</p>
      </div>
    </div>
  );

  if (roomState === "pending") return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />
      <div className="flex flex-col items-center justify-center py-32 gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-full border border-[#38BDF8]/20 flex items-center justify-center">
          <Clock3 size={22} className="text-[#38BDF8]" />
        </div>
        <div>
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Case Not Ready Yet</h1>
          <p className="text-[#64748B] text-sm max-w-lg">{error || "The submit transaction may still be finalizing. Wait a moment, then refresh or open the case from your dashboard."}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={loadRoom} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#38BDF8", color: "#05080A" }}>Refresh</button>
          <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-[#64748B] hover:text-[#F8FAFC] transition-colors">Open Dashboard</Link>
        </div>
      </div>
    </div>
  );

  if (roomState === "restricted") return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />
      <div className="flex flex-col items-center justify-center py-32 gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-full border border-[#8B5CF6]/20 flex items-center justify-center">
          <Lock size={22} className="text-[#8B5CF6]" />
        </div>
        <p className="text-[#64748B] text-sm">Case Room is restricted to the wallet that submitted this case.</p>
        <p className="text-xs text-[#64748B] max-w-md">Connected wallet: {address || "not connected"}</p>
      </div>
    </div>
  );

  if (!c) return null;

  const visColor = (v: string) => v === "private" ? "#EF4444" : "#22C55E";

  return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] pulse-dot" />
          <span className="text-xs font-mono text-[#8B5CF6] uppercase tracking-widest">Case Room - Owner Only</span>
        </div>
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{c.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={c.status} />
              <span className="text-xs text-[#64748B] font-mono break-all">{c.case_id}</span>
            </div>
          </div>
          {isOwner && (
            <button onClick={handleRequestVerdict} disabled={requestingVerdict}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
              style={{ background: "#38BDF8", color: "#05080A", opacity: requestingVerdict ? 0.7 : 1 }}>
              {requestingVerdict ? <><Loader2 size={13} className="animate-spin" /> Requesting...</> : "Request Review"}
            </button>
          )}
        </div>

        {warning && <p className="text-xs text-[#F59E0B] mb-4">{warning}</p>}
        {error && roomState === "ready" && <p className="text-xs text-[#EF4444] mb-4">{error}</p>}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="panel p-5">
              <h3 className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest mb-4">Full Batch Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-[#64748B] mb-0.5">Food Category</p><p>{c.food_category}</p></div>
                <div><p className="text-xs text-[#64748B] mb-0.5">Chain Stage</p><p>{c.chain_stage}</p></div>
                <div><p className="text-xs text-[#64748B] mb-0.5">Review Focus</p><p>{c.review_focus}</p></div>
                <div><p className="text-xs text-[#64748B] mb-0.5">Visibility</p><p>{c.visibility_mode}</p></div>
                <div className="col-span-2"><p className="text-xs text-[#64748B] mb-0.5">Batch / Lot Reference</p><p className="font-mono text-[#38BDF8] break-all">{c.batch_or_lot_reference || "-"}</p></div>
                <div className="col-span-2"><p className="text-xs text-[#64748B] mb-0.5">Supplier / Facility</p><p>{c.supplier_or_facility_summary || "-"}</p></div>
                <div className="col-span-2"><p className="text-xs text-[#64748B] mb-0.5">Product Summary</p><p className="text-[#F8FAFC]/80">{c.product_summary || "-"}</p></div>
                <div className="col-span-2"><p className="text-xs text-[#64748B] mb-0.5">Safety Question</p><p className="italic">{c.safety_question || "-"}</p></div>
              </div>
            </div>

            {c.private_evidence_commitment_hash && (
              <div className="panel p-4">
                <p className="text-xs text-[#64748B] mb-1">Private Evidence Commitment Hash</p>
                <p className="text-xs font-mono text-[#8B5CF6] break-all">{c.private_evidence_commitment_hash}</p>
              </div>
            )}

            {verdict && (
              <div className="panel p-5">
                <h3 className="text-xs font-mono text-[#22C55E] uppercase tracking-widest mb-4">GenLayer Verdict</h3>
                <VerdictChamber verdict={verdict} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="panel p-4">
              <h3 className="text-xs font-mono text-[#8B5CF6] uppercase tracking-widest mb-4">Owner Notes</h3>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-xs text-[#64748B]">No notes yet.</p>
                ) : notes.map(n => (
                  <div key={n.note_id} className="bg-white/3 rounded p-2.5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#64748B] font-mono">{n.note_type}</span>
                      <span className="text-[10px]" style={{ color: visColor(n.visibility) }}>{n.visibility}</span>
                    </div>
                    <p className="text-xs text-[#F8FAFC]/80">{n.note_summary}</p>
                    <p className="text-[10px] text-[#64748B] mt-1 font-mono">{n.author.slice(0, 8)}...</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={noteSummary}
                  onChange={e => setNoteSummary(e.target.value)}
                  placeholder="Add internal note..."
                  rows={3}
                  className="w-full bg-[#05080A] border border-white/10 rounded px-3 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#8B5CF6]/40 placeholder-[#64748B] resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select value={noteType} onChange={e => setNoteType(e.target.value)}
                    className="bg-[#05080A] border border-white/10 rounded px-2 py-1.5 text-xs text-[#F8FAFC] outline-none">
                    <option value="internal">Internal</option>
                    <option value="assumption">Assumption</option>
                    <option value="missing_evidence">Missing Evidence</option>
                    <option value="batch_identity">Batch Identity</option>
                    <option value="recall_matching">Recall Matching</option>
                    <option value="operational_step">Operational Step</option>
                  </select>
                  <select value={noteVisibility} onChange={e => setNoteVisibility(e.target.value)}
                    className="bg-[#05080A] border border-white/10 rounded px-2 py-1.5 text-xs text-[#F8FAFC] outline-none">
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <button type="submit" disabled={submitting || !noteSummary.trim()}
                  className="w-full py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#8B5CF6" }}>
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <><Send size={12} /> Add Note</>}
                </button>
              </form>

              {error && roomState === "ready" && <p className="text-xs text-[#EF4444] mt-2">{error}</p>}
              {tx && <TxPanel txHash={tx.txHash} explorerLink={tx.explorerLink} />}
            </div>

            <div className="panel p-4">
              <h4 className="text-xs font-mono text-[#F59E0B] uppercase tracking-widest mb-3">Missing Evidence Checklist</h4>
              <div className="space-y-2">
                {[
                  { label: "Temperature logs", filled: !!c.temperature_log_summary },
                  { label: "Recall / advisory URLs", filled: !!c.recall_or_advisory_urls },
                  { label: "Image URLs recorded, not adjudicated", filled: !!c.image_urls },
                  { label: "PDF reports", filled: !!c.pdf_report_urls },
                  { label: "Inspection notes", filled: !!c.inspection_notes },
                  { label: "Supplier summary", filled: !!c.supplier_or_facility_summary },
                ].map(({ label, filled }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: filled ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)", border: `1px solid ${filled ? "#22C55E" : "#EF4444"}40` }}>
                      {filled ? <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1 4 3 6 7 2" stroke="#22C55E" strokeWidth="1.5" fill="none"/></svg>
                        : <span className="text-[#EF4444] text-[8px]">-</span>}
                    </div>
                    <span className="text-xs" style={{ color: filled ? "#94A3B8" : "#F8FAFC" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}