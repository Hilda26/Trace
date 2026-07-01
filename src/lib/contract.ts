"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { SafetyCase, SafetyVerdict, AdminStats, WalletActivity } from "./types";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

const EXPLORER = "https://explorer-studio.genlayer.com";

// StudioNet chain params for wallet_addEthereumChain
const STUDIONET_CHAIN_PARAMS = {
  chainId: "0xF22F", // 61999 in hex
  chainName: "Genlayer Studio Network",
  nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://studio.genlayer.com/api"],
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

export function getExplorerTxLink(txHash: string): string {
  return `${EXPLORER}/tx/${txHash}`;
}

export function getExplorerAddressLink(address: string): string {
  return `${EXPLORER}/address/${address}`;
}

// ─── Network switch (EIP-3326 / EIP-3085, NO Snaps) ──────────────────────────

async function ensureStudioNet(eth: any) {
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CHAIN_PARAMS.chainId }],
    });
  } catch (err: any) {
    // 4902 = chain not added yet — add it then switch
    if (err?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [STUDIONET_CHAIN_PARAMS],
      });
    } else {
      throw err;
    }
  }
}

// ─── Wallet helpers ───────────────────────────────────────────────────────────

function getEth(): any {
  if (typeof window === "undefined") throw new Error("No browser environment");
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask.");
  return eth;
}

export async function getConnectedAddress(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;
  try {
    const accounts: string[] = await eth.request({ method: "eth_accounts" });
    return accounts[0] || null;
  } catch {
    return null;
  }
}

// ─── Clients ──────────────────────────────────────────────────────────────────

// Read client — no wallet needed
const readClient = createClient({ chain: studionet });

async function getWriteClient() {
  const eth = getEth();

  // 1. Request account access (no-op if already connected)
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  if (!accounts[0]) throw new Error("No wallet connected");

  // 2. Switch/add StudioNet using standard EIP methods — no Snaps, no plugin
  await ensureStudioNet(eth);

  // 3. Build write client with injected provider
  return createClient({
    chain: studionet,
    account: accounts[0] as `0x${string}`,
    provider: eth,
  });
}

// ─── Write helper ─────────────────────────────────────────────────────────────

async function write(functionName: string, args: unknown[]): Promise<{ txHash: string; explorerLink: string }> {
  const client = await getWriteClient();
  // @ts-expect-error args typing
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: BigInt(0),
  });
  return { txHash: txHash as string, explorerLink: getExplorerTxLink(txHash as string) };
}

// ─── Read helper ──────────────────────────────────────────────────────────────

async function read(functionName: string, args: unknown[]): Promise<unknown> {
  // @ts-expect-error args typing
  return readClient.readContract({ address: CONTRACT_ADDRESS, functionName, args });
}

// ─── Contract write functions ─────────────────────────────────────────────────

export async function submitCase(params: {
  case_id: string; title: string; food_category: string; product_summary: string;
  batch_or_lot_reference: string; supplier_or_facility_summary: string;
  chain_stage: string; review_focus: string; safety_question: string;
  claimed_status: string; public_evidence_urls: string; image_urls: string;
  pdf_report_urls: string; recall_or_advisory_urls: string;
  temperature_log_summary: string; transport_storage_notes: string;
  inspection_notes: string; private_evidence_commitment_hash: string;
  visibility_mode: string;
}): Promise<{ txHash: string; explorerLink: string }> {
  return write("submit_case", [
    params.case_id, params.title, params.food_category, params.product_summary,
    params.batch_or_lot_reference, params.supplier_or_facility_summary,
    params.chain_stage, params.review_focus, params.safety_question,
    params.claimed_status, params.public_evidence_urls, params.image_urls,
    params.pdf_report_urls, params.recall_or_advisory_urls,
    params.temperature_log_summary, params.transport_storage_notes,
    params.inspection_notes, params.private_evidence_commitment_hash,
    params.visibility_mode,
  ]);
}

export async function withdrawCase(caseId: string): Promise<{ txHash: string; explorerLink: string }> {
  return write("withdraw_case", [caseId]);
}

export async function archiveCase(caseId: string): Promise<{ txHash: string; explorerLink: string }> {
  return write("archive_case", [caseId]);
}

export async function addReviewNote(params: {
  case_id: string; note_id: string; note_type: string; note_summary: string; visibility: string;
}): Promise<{ txHash: string; explorerLink: string }> {
  return write("add_review_note", [params.case_id, params.note_id, params.note_type, params.note_summary, params.visibility]);
}

export async function requestSafetyVerdict(caseId: string): Promise<{ txHash: string; explorerLink: string }> {
  return write("request_safety_verdict", [caseId]);
}

// ─── Contract read functions ──────────────────────────────────────────────────

export async function getCase(caseId: string): Promise<SafetyCase | null> {
  const r = await read("get_case", [caseId]) as string;
  if (!r || r === "{}") return null;
  try { return JSON.parse(r); } catch { return null; }
}

export async function getPublicCases(): Promise<SafetyCase[]> {
  const r = await read("get_public_cases", []) as string;
  try { return JSON.parse(r || "[]"); } catch { return []; }
}

export async function getCasesByOwner(owner: string): Promise<SafetyCase[]> {
  const r = await read("get_cases_by_owner", [owner]) as string;
  try { return JSON.parse(r || "[]"); } catch { return []; }
}

export async function getCaseVerdict(caseId: string): Promise<SafetyVerdict | null> {
  const r = await read("get_case_verdict", [caseId]) as string;
  if (!r || r === "{}") return null;
  try { return JSON.parse(r); } catch { return null; }
}

export async function getVerdictPublic(caseId: string): Promise<SafetyVerdict | null> {
  const r = await read("get_verdict_public", [caseId]) as string;
  if (!r || r === "{}") return null;
  try { return JSON.parse(r); } catch { return null; }
}

export async function getWalletActivityFn(address: string): Promise<WalletActivity[]> {
  const r = await read("get_wallet_activity", [address]) as string;
  try { return JSON.parse(r || "[]"); } catch { return []; }
}

export async function getAdminStats(): Promise<AdminStats | null> {
  const r = await read("get_admin_monitor_stats", []) as string;
  try { return JSON.parse(r || "{}"); } catch { return null; }
}

export async function getReviewNotes(caseId: string, requester: string) {
  const r = await read("get_review_notes", [caseId, requester]) as string;
  try { return JSON.parse(r || "[]"); } catch { return []; }
}

export async function getCasesByStatus(status: string): Promise<SafetyCase[]> {
  const r = await read("get_cases_by_status", [status]) as string;
  try { return JSON.parse(r || "[]"); } catch { return []; }
}

export async function getCaseAuditLog(caseId: string) {
  const r = await read("get_case_audit_log", [caseId]) as string;
  try { return JSON.parse(r || "[]"); } catch { return []; }
}

export async function getContractSummary() {
  const r = await read("get_contract_summary", []) as string;
  try { return JSON.parse(r || "{}"); } catch { return {}; }
}
