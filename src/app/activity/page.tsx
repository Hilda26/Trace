"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import { getWalletActivityFn, getConnectedAddress } from "@/lib/contract";
import type { WalletActivity } from "@/lib/types";
import { Lock, Activity, Loader2 } from "lucide-react";
import { NETWORK } from "@/lib/constants";

function fmtDate(val: string): string {
  if (!val) return "—";
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleString();
  const n = Number(val);
  if (!isNaN(n)) return new Date(n * 1000).toLocaleString();
  return val;
}

const ACTION_COLOR: Record<string, string> = {
  submit_case: "#38BDF8",
  withdraw_case: "#EF4444",
  archive_case: "#64748B",
  request_safety_verdict: "#8B5CF6",
  add_review_note: "#14B8A6",
};

export default function ActivityPage() {
  const [activity, setActivity] = useState<WalletActivity[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConnectedAddress().then(addr => {
      setAddress(addr);
      if (addr) {
        getWalletActivityFn(addr).then(a => { setActivity(a.reverse()); setLoading(false); });
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (!address) return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Lock size={22} className="text-[#64748B]" />
        <p className="text-[#64748B] text-sm">Connect your wallet to view wallet activity.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Activity size={20} className="text-[#38BDF8]" />
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Wallet Activity</h1>
            <p className="text-xs font-mono text-[#64748B]">{address}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="text-[#38BDF8] animate-spin" /></div>
        ) : activity.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#64748B] text-sm">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map((a, i) => {
              const color = ACTION_COLOR[a.action] || "#64748B";
              return (
                <div key={i} className="panel p-4 flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium font-mono" style={{ color }}>
                        {a.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-[#64748B] truncate">{a.case_id}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[#64748B] font-mono">
                      {fmtDate(a.timestamp)}
                    </p>
                    <a href={`${NETWORK.explorer}/address/${address}`} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-[#38BDF8] hover:underline">
                      View on Explorer
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
