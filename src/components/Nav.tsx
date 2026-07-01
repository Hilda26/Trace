"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, Activity, Plus, LayoutDashboard, DoorOpen, Eye, ExternalLink } from "lucide-react";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import { NETWORK } from "@/lib/constants";

export default function Nav() {
  const pathname = usePathname();
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accs: string[]) => {
      if (accs[0]) setAddress(accs[0]);
    });
  }, []);

  async function connect() {
    const eth = (window as any).ethereum;
    if (!eth) { alert("No wallet detected. Install MetaMask."); return; }
    setConnecting(true);
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
    } finally {
      setConnecting(false);
    }
  }

  const nav = [
    { href: "/explore", label: "Explore", icon: Eye },
    { href: "/create", label: "Submit Case", icon: Plus },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/admin", label: "Admin", icon: DoorOpen },
  ];

  return (
    <nav className="border-b border-[rgba(56,189,248,0.12)] bg-[#0F172A]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center">
              <Shield size={14} className="text-[#38BDF8]" />
            </div>
            <span className="font-semibold text-sm tracking-wide" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              TRACE
            </span>
          </Link>
          {CONTRACT_ADDRESS ? (
            <a
              href={`${NETWORK.explorer}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View contract on StudioNet Explorer"
              className="hidden md:flex items-center gap-1 text-[10px] font-mono text-[#14B8A6] hover:text-[#14B8A6]/80 transition-colors border border-[#14B8A6]/20 bg-[#14B8A6]/5 px-2 py-0.5 rounded"
            >
              <ExternalLink size={9} />
              {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
            </a>
          ) : (
            <span className="hidden md:inline text-[10px] text-[#64748B] font-mono">StudioNet</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-[#38BDF8]/10 text-[#38BDF8]"
                  : "text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/5"
              }`}
            >
              <Icon size={12} />
              {label}
            </Link>
          ))}
        </div>

        <button
          onClick={connect}
          disabled={connecting}
          className="text-xs px-3 py-1.5 rounded border font-mono transition-all"
          style={{
            borderColor: address ? "rgba(34,197,94,0.4)" : "rgba(56,189,248,0.3)",
            color: address ? "#22C55E" : "#38BDF8",
            background: address ? "rgba(34,197,94,0.08)" : "rgba(56,189,248,0.08)",
          }}
        >
          {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    </nav>
  );
}
