import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="border border-[#F59E0B]/20 bg-[#F59E0B]/5 rounded px-4 py-3 flex gap-3">
      <AlertTriangle size={16} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
      <div className="text-xs text-[#94A3B8] space-y-0.5">
        <p><strong className="text-[#F59E0B]">Disclaimer:</strong> Trace does not certify food as legally safe.</p>
        <p>Trace does not replace regulators, qualified inspectors, or lab testing.</p>
        <p>Trace provides bounded evidence classification based on submitted and public information.</p>
        <p>Critical or uncertain cases must be escalated to qualified human authorities.</p>
      </div>
    </div>
  );
}
