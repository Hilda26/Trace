"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import BatchDNACard from "@/components/BatchDNACard";
import { getPublicCases } from "@/lib/contract";
import type { SafetyCase } from "@/lib/types";
import { FOOD_CATEGORIES, CHAIN_STAGES, REVIEW_FOCUS_OPTIONS } from "@/lib/constants";
import { Search, Filter } from "lucide-react";

export default function ExplorePage() {
  const [cases, setCases] = useState<SafetyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [focusFilter, setFocusFilter] = useState("");

  useEffect(() => {
    getPublicCases().then(c => { setCases(c); setLoading(false); });
  }, []);

  const filtered = cases.filter(c => {
    const matchQ = !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.batch_or_lot_reference?.includes(q);
    const matchCat = !catFilter || c.food_category === catFilter;
    const matchStage = !stageFilter || c.chain_stage === stageFilter;
    const matchFocus = !focusFilter || c.review_focus === focusFilter;
    return matchQ && matchCat && matchStage && matchFocus;
  });

  return (
    <div className="min-h-screen bg-[#05080A]">
      <Nav />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Public Safety Cases
          </h1>
          <p className="text-sm text-[#64748B]">
            Browse publicly submitted food safety evidence cases and GenLayer verdicts.
          </p>
        </div>

        {/* Filters */}
        <div className="panel p-4 mb-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search size={14} className="text-[#64748B]" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search cases, batch IDs…"
              className="flex-1 bg-transparent text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-[#64748B]" />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="bg-[#0F172A] border border-white/10 text-xs rounded px-2 py-1.5 text-[#F8FAFC] outline-none">
              <option value="">All Categories</option>
              {FOOD_CATEGORIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
              className="bg-[#0F172A] border border-white/10 text-xs rounded px-2 py-1.5 text-[#F8FAFC] outline-none">
              <option value="">All Stages</option>
              {CHAIN_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={focusFilter} onChange={e => setFocusFilter(e.target.value)}
              className="bg-[#0F172A] border border-white/10 text-xs rounded px-2 py-1.5 text-[#F8FAFC] outline-none">
              <option value="">All Focus</option>
              {REVIEW_FOCUS_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="panel p-4 h-40 animate-pulse">
                <div className="h-3 bg-white/5 rounded mb-3 w-1/3" />
                <div className="h-4 bg-white/5 rounded mb-2 w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Search size={20} className="text-[#64748B]" />
            </div>
            <p className="text-[#64748B] text-sm">
              {cases.length === 0 ? "No public cases yet. Be the first to submit." : "No cases match your filters."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#64748B] mb-4 font-mono">{filtered.length} case{filtered.length !== 1 ? "s" : ""} found</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => <BatchDNACard key={c.case_id} c={c} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
