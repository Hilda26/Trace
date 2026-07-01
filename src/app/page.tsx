import Link from "next/link";
import Nav from "@/components/Nav";
import Disclaimer from "@/components/Disclaimer";
import { Shield, Thermometer, Search, FileText, ChevronRight, AlertTriangle, Activity, Layers } from "lucide-react";

const sampleVerdict = {
  safety_status: "hold_required",
  risk_tier: "high",
  evidence_quality: "medium",
  recall_match: "possible_match",
  cold_chain_assessment: "not_applicable",
  documentation_completeness: "partial",
  inspection_signal: "concerning",
  required_action: "quarantine_batch_and_verify_lot_code",
  confidence: 82,
  short_reason: "The recall notice may match the submitted batch pattern, but lot evidence is incomplete."
};

const features = [
  {
    icon: AlertTriangle,
    color: "#EF4444",
    title: "Recall Radar",
    desc: "Submit batch codes and recall URLs. GenLayer judges whether a recall likely applies, is unclear, or has no match."
  },
  {
    icon: Thermometer,
    color: "#38BDF8",
    title: "Cold-Chain Flight Recorder",
    desc: "Upload temperature logs, transport notes, and cold-storage events. Get a bounded cold-chain excursion verdict."
  },
  {
    icon: Search,
    color: "#8B5CF6",
    title: "Evidence Microscope",
    desc: "Inspection photos, PDFs, supplier certificates, and hygiene reports reviewed as structured evidence packets."
  },
  {
    icon: FileText,
    color: "#22C55E",
    title: "Public Proof Reports",
    desc: "Publish sanitized case summaries with verified verdicts. Keep private batch details and notes sealed on-chain."
  },
];

const stages = [
  "Farm Source", "Processing", "Manufacturer", "Cold Storage",
  "Transport", "Warehouse", "Retailer", "Restaurant"
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden grid-bg">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(56,189,248,0.12) 0%, transparent 60%)" }} />
        <div className="max-w-6xl mx-auto px-6 py-24 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/8 text-[#14B8A6] text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] pulse-dot" />
            GenLayer · StudioNet · Food Safety Protocol
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Food safety should not depend on
            <span className="block" style={{ color: "#38BDF8" }}>scattered evidence.</span>
          </h1>

          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Submit batches, recalls, cold-chain logs, inspection photos, PDFs, and public advisories.
            Trace uses GenLayer consensus to classify risk, evidence quality, and required action.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/create"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
              style={{ background: "#38BDF8", color: "#05080A" }}>
              Submit a Safety Case <ChevronRight size={16} />
            </Link>
            <Link href="/explore"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border border-[rgba(56,189,248,0.3)] text-[#38BDF8] hover:bg-[#38BDF8]/8 transition-all">
              Explore Public Cases
            </Link>
          </div>
        </div>
      </section>

      {/* Chain Stage Timeline */}
      <section className="border-y border-white/5 bg-[#0F172A]/50 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs text-[#64748B] font-mono uppercase tracking-widest mb-4 text-center">Supply Chain Coverage</p>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center flex-shrink-0">
                <div className="px-3 py-1.5 rounded border border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.04)]">
                  <span className="text-xs text-[#94A3B8] font-medium whitespace-nowrap">{s}</span>
                </div>
                {i < stages.length - 1 && (
                  <div className="w-6 h-px bg-gradient-to-r from-[#38BDF8]/40 to-[#38BDF8]/10 flex-shrink-0" />
                )}
              </div>
            ))}
            <div className="flex items-center flex-shrink-0">
              <div className="w-6 h-px bg-[#38BDF8]/10" />
              <span className="text-xs text-[#64748B] px-2">+ 4 more</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Why food evidence fails
        </h2>
        <p className="text-[#64748B] text-sm text-center mb-12">
          Traditional systems store records. They cannot reliably judge messy evidence.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="panel p-5 hover:border-[rgba(56,189,248,0.25)] transition-all">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="font-semibold text-sm mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Verdict */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="panel p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#38BDF8] pulse-dot" />
            <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest">Sample Verdict — Safety Verdict Chamber</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]">
              ● hold_required
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]">
              High Risk
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(sampleVerdict).filter(([k]) => !["safety_status","risk_tier","confidence","short_reason"].includes(k)).map(([k, v]) => (
              <div key={k} className="bg-white/3 rounded p-2">
                <p className="text-[10px] text-[#64748B] mb-0.5">{k.replace(/_/g, " ")}</p>
                <p className="text-xs font-mono text-[#F8FAFC]">{String(v).replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-[#64748B]">Confidence</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: "82%" }} />
            </div>
            <span className="text-xs font-mono text-[#F59E0B]">82%</span>
          </div>

          <p className="text-xs text-[#94A3B8] italic">&ldquo;{sampleVerdict.short_reason}&rdquo;</p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-[#0F172A]/60 border-y border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-10 text-center" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            How Safety Cases Work
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { num: "01", title: "Recall Applicability", desc: "A retailer submits batch codes and recall links. GenLayer judges whether the recall likely matches." },
              { num: "02", title: "Cold-Chain Excursion", desc: "A distributor submits temperature logs. Trace judges whether the breach is minor, material, or critical." },
              { num: "03", title: "Shipment Hold Decision", desc: "A warehouse submits damaged packaging photos and delivery notes. Get a bounded hold or proceed verdict." },
            ].map(({ num, title, desc }) => (
              <div key={num} className="panel p-5">
                <span className="font-mono text-xs text-[#14B8A6] mb-3 block">{num}</span>
                <h3 className="font-semibold text-sm mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Ready to trace your first case?
        </h2>
        <p className="text-[#64748B] mb-8">Connect your wallet and submit a Safety Case on StudioNet.</p>
        <Link href="/create"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-sm"
          style={{ background: "#38BDF8", color: "#05080A" }}>
          <Layers size={16} /> Submit Safety Case
        </Link>
      </section>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <Disclaimer />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs font-mono text-[#64748B]">TRACE · Food Safety Evidence Protocol · StudioNet</span>
          <div className="flex gap-4">
            <Link href="/explore" className="text-xs text-[#64748B] hover:text-[#F8FAFC] transition-colors">Explore</Link>
            <Link href="/admin" className="text-xs text-[#64748B] hover:text-[#F8FAFC] transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
