"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Disclaimer from "@/components/Disclaimer";
import { submitCase } from "@/lib/contract";
import { CHAIN_STAGES, FOOD_CATEGORIES, REVIEW_FOCUS_OPTIONS } from "@/lib/constants";
import { TxPanel } from "@/components/ExplorerLink";
import { Loader2, Plus, X, AlertTriangle } from "lucide-react";

function UrlListInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const items: string[] = value ? value.split("|") : [];

  function update(idx: number, val: string) {
    const updated = [...items]; updated[idx] = val;
    onChange(updated.join("|"));
  }
  function remove(idx: number) {
    const updated = items.filter((_, j) => j !== idx);
    onChange(updated.join("|"));
  }
  function add() {
    onChange(items.length ? items.join("|") + "|" : "|");
  }

  return (
    <div>
      <label className="block text-xs text-[#64748B] mb-2">{label}</label>
      <div className="space-y-1.5 mb-2">
        {items.map((u, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={u}
              onChange={e => update(i, e.target.value)}
              placeholder="https://…"
              className="flex-1 bg-[#0F172A] border border-white/10 rounded px-3 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#38BDF8]/40 font-mono"
            />
            <button type="button" onClick={() => remove(i)} className="text-[#64748B] hover:text-[#EF4444] transition-colors">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add}
        className="flex items-center gap-1 text-xs text-[#38BDF8] hover:text-[#38BDF8]/80 cursor-pointer">
        <Plus size={12} /> Add URL
      </button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#64748B] mb-2">
        {label}{required && <span className="text-[#EF4444] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#0F172A] border border-white/10 rounded px-3 py-2.5 text-sm text-[#F8FAFC] outline-none focus:border-[#38BDF8]/40 placeholder-[#64748B]";
const selectCls = `${inputCls} appearance-none`;
const textareaCls = `${inputCls} resize-y min-h-[80px]`;

export default function CreateCasePage() {
  const [form, setForm] = useState({
    title: "", food_category: "", product_summary: "", batch_or_lot_reference: "",
    supplier_or_facility_summary: "", chain_stage: "", review_focus: "",
    safety_question: "", claimed_status: "",
    public_evidence_urls: "", image_urls: "", pdf_report_urls: "",
    recall_or_advisory_urls: "", temperature_log_summary: "",
    transport_storage_notes: "", inspection_notes: "",
    private_evidence_commitment_hash: "", visibility_mode: "public",
  });

  const [submitting, setSubmitting] = useState(false);
  const [tx, setTx] = useState<{ txHash: string; explorerLink: string } | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function genId() {
    return `case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.food_category || !form.chain_stage || !form.review_focus) {
      setError("Title, food category, chain stage, and review focus are required."); return;
    }
    setSubmitting(true); setError("");
    try {
      const result = await submitCase({ ...form, case_id: genId() });
      setTx(result);
    } catch (e: any) {
      setError(e.message || "Transaction failed. Is your wallet connected to StudioNet?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Submit Safety Case
          </h1>
          <p className="text-sm text-[#64748B]">
            Create a food safety evidence packet for GenLayer consensus review.
          </p>
        </div>

        {/* Steps */}
        <div className="flex gap-2 mb-8">
          {[
            { n: 1, label: "Case Identity" },
            { n: 2, label: "Evidence" },
            { n: 3, label: "Notes & Submit" },
          ].map(({ n, label }) => (
            <button key={n} onClick={() => setStep(n)}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium transition-all"
              style={{
                background: step === n ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${step === n ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: step === n ? "#38BDF8" : "#64748B",
              }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: step === n ? "#38BDF8" : "rgba(255,255,255,0.08)", color: step === n ? "#05080A" : "#64748B" }}>
                {n}
              </span>
              {label}
            </button>
          ))}
        </div>

        {tx ? (
          <div className="panel p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Case Submitted</h2>
            <p className="text-sm text-[#64748B] mb-4">Your safety case has been submitted to StudioNet.</p>
            <TxPanel txHash={tx.txHash} explorerLink={tx.explorerLink} />
            <button onClick={() => { setTx(null); setForm({ ...form, title: "" }); setStep(1); }}
              className="mt-6 px-6 py-2 rounded-lg text-sm font-medium border border-white/10 text-[#64748B] hover:text-[#F8FAFC] transition-colors">
              Submit another case
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {step === 1 && (
              <div className="panel p-6 space-y-5">
                <h3 className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest">Case Identity</h3>

                <Field label="Case Title" required>
                  <input value={form.title} onChange={e => set("title", e.target.value)} className={inputCls} placeholder="e.g. Recall Review — Lot 4521B Canned Tuna" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Food Category" required>
                    <select value={form.food_category} onChange={e => set("food_category", e.target.value)} className={selectCls}>
                      <option value="">Select…</option>
                      {FOOD_CATEGORIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Chain Stage" required>
                    <select value={form.chain_stage} onChange={e => set("chain_stage", e.target.value)} className={selectCls}>
                      <option value="">Select…</option>
                      {CHAIN_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Review Focus" required>
                  <select value={form.review_focus} onChange={e => set("review_focus", e.target.value)} className={selectCls}>
                    <option value="">Select…</option>
                    {REVIEW_FOCUS_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Field>

                <Field label="Product Summary">
                  <textarea value={form.product_summary} onChange={e => set("product_summary", e.target.value)} className={textareaCls} placeholder="Describe the product, packaging, and key identifiers…" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Batch / Lot Reference">
                    <input value={form.batch_or_lot_reference} onChange={e => set("batch_or_lot_reference", e.target.value)} className={inputCls} placeholder="e.g. LOT-4521B-2024" />
                  </Field>
                  <Field label="Claimed Status">
                    <input value={form.claimed_status} onChange={e => set("claimed_status", e.target.value)} className={inputCls} placeholder="e.g. clear to proceed" />
                  </Field>
                </div>

                <Field label="Supplier / Facility Summary">
                  <textarea value={form.supplier_or_facility_summary} onChange={e => set("supplier_or_facility_summary", e.target.value)} className={textareaCls} placeholder="Supplier name, location, certifications…" />
                </Field>

                <Field label="Safety Question" required>
                  <textarea value={form.safety_question} onChange={e => set("safety_question", e.target.value)} className={textareaCls} placeholder="What specific safety question should GenLayer evaluate?" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Visibility">
                    <select value={form.visibility_mode} onChange={e => set("visibility_mode", e.target.value)} className={selectCls}>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </Field>
                </div>

                {form.visibility_mode === "public" && (
                  <div className="flex items-start gap-2 p-3 rounded border border-[#F59E0B]/20 bg-[#F59E0B]/5">
                    <AlertTriangle size={13} className="text-[#F59E0B] mt-0.5" />
                    <p className="text-xs text-[#94A3B8]">Public cases and their evidence URLs will be visible to everyone. Do not include confidential supplier documents in public evidence URLs.</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: "#38BDF8", color: "#05080A" }}>
                    Next: Evidence
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="panel p-6 space-y-5">
                <h3 className="text-xs font-mono text-[#8B5CF6] uppercase tracking-widest">Evidence — Microscope</h3>

                <UrlListInput label="Public Evidence URLs" value={form.public_evidence_urls} onChange={v => set("public_evidence_urls", v)} />
                <UrlListInput label="Image URLs (inspection photos, labels, packaging)" value={form.image_urls} onChange={v => set("image_urls", v)} />
                <UrlListInput label="PDF Report URLs (COAs, HACCP summaries, lab reports)" value={form.pdf_report_urls} onChange={v => set("pdf_report_urls", v)} />
                <UrlListInput label="Recall / Advisory URLs" value={form.recall_or_advisory_urls} onChange={v => set("recall_or_advisory_urls", v)} />

                <Field label="Private Evidence Commitment Hash (optional)">
                  <input value={form.private_evidence_commitment_hash} onChange={e => set("private_evidence_commitment_hash", e.target.value)} className={`${inputCls} font-mono`} placeholder="keccak256 or SHA256 of private evidence bundle" />
                </Field>

                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-sm text-[#64748B] hover:text-[#F8FAFC]">← Back</button>
                  <button type="button" onClick={() => setStep(3)} className="px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#38BDF8", color: "#05080A" }}>
                    Next: Notes & Submit
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="panel p-6 space-y-5">
                <h3 className="text-xs font-mono text-[#14B8A6] uppercase tracking-widest">Notes & Submit</h3>

                <Field label="Temperature Log Summary">
                  <textarea value={form.temperature_log_summary} onChange={e => set("temperature_log_summary", e.target.value)} className={textareaCls} placeholder="e.g. Spike to +9°C at 03:00 UTC for 2 hours. Returned to +3°C." />
                </Field>

                <Field label="Transport / Storage Notes">
                  <textarea value={form.transport_storage_notes} onChange={e => set("transport_storage_notes", e.target.value)} className={textareaCls} placeholder="Describe transport conditions, delays, storage events…" />
                </Field>

                <Field label="Inspection Notes">
                  <textarea value={form.inspection_notes} onChange={e => set("inspection_notes", e.target.value)} className={textareaCls} placeholder="Describe inspection findings, hygiene observations…" />
                </Field>

                <Disclaimer />

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded border border-[#EF4444]/20 bg-[#EF4444]/5">
                    <AlertTriangle size={13} className="text-[#EF4444] mt-0.5" />
                    <p className="text-xs text-[#EF4444]">{error}</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(2)} className="px-4 py-2 text-sm text-[#64748B] hover:text-[#F8FAFC]">← Back</button>
                  <button type="submit" disabled={submitting}
                    className="px-8 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
                    style={{ background: "#38BDF8", color: "#05080A", opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit to StudioNet"}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
