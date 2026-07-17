export type ChainStage =
  | "farm_source" | "processing_facility" | "manufacturer" | "cold_storage"
  | "transport" | "warehouse" | "retailer" | "restaurant"
  | "consumer_complaint" | "public_advisory" | "recall_review" | "import_export_check";

export type FoodCategory =
  | "meat" | "poultry" | "seafood" | "dairy" | "eggs" | "fresh_produce"
  | "frozen_food" | "packaged_food" | "beverage" | "baby_food" | "grains"
  | "spices" | "ready_to_eat" | "unknown_or_mixed";

export type ReviewFocus =
  | "recall_applicability" | "cold_chain_integrity" | "inspection_evidence"
  | "supplier_documentation" | "packaging_damage" | "contamination_risk"
  | "label_mismatch" | "expiry_or_shelf_life" | "allergen_risk"
  | "hygiene_complaint" | "shipment_hold_decision" | "public_safety_bulletin";

export type SafetyStatus =
  | "clear_to_proceed" | "proceed_with_conditions" | "hold_required"
  | "recall_match_likely" | "recall_match_possible" | "no_recall_match"
  | "compromised" | "high_risk" | "critical_risk" | "insufficient_evidence"
  | "specialist_review_required";

export type RiskTier = "low" | "medium" | "high" | "critical" | "unknown";

export type EvidenceQuality = "strong" | "medium" | "weak" | "missing";

export type RecallMatch = "likely_match" | "possible_match" | "no_match" | "unclear" | "not_applicable";

export type ColdChainAssessment =
  | "intact" | "minor_excursion" | "material_excursion" | "severe_excursion"
  | "unclear" | "not_applicable";

export type DocumentationCompleteness =
  | "complete" | "partial" | "weak" | "missing" | "not_applicable";

export type InspectionSignal =
  | "clean" | "minor_issue" | "concerning" | "severe" | "unclear" | "not_applicable";

export type RequiredAction =
  | "none" | "proceed_with_documentation" | "hold_for_manual_review"
  | "quarantine_batch" | "quarantine_batch_and_verify_lot_code"
  | "request_temperature_logs" | "request_supplier_certificate"
  | "request_lab_test" | "request_human_inspection" | "issue_public_bulletin"
  | "escalate_to_authority" | "reject_or_return_shipment"
  | "update_recall_matching_details" | "provide_more_evidence";

export type CaseStatus =
  | "draft_offchain" | "submitted" | "under_review" | "clear_to_proceed"
  | "proceed_with_conditions" | "hold_required" | "recall_match_possible"
  | "high_risk" | "critical_risk" | "insufficient_evidence"
  | "specialist_review_required" | "withdrawn" | "archived";

export interface SafetyCase {
  case_id: string;
  owner: string;
  title: string;
  food_category: FoodCategory;
  product_summary: string;
  batch_or_lot_reference: string;
  supplier_or_facility_summary: string;
  chain_stage: ChainStage;
  review_focus: ReviewFocus;
  safety_question: string;
  claimed_status: string;
  public_evidence_urls: string;
  image_urls: string;
  pdf_report_urls: string;
  recall_or_advisory_urls: string;
  temperature_log_summary: string;
  transport_storage_notes: string;
  inspection_notes: string;
  private_evidence_commitment_hash: string;
  private_evidence_commitment_present?: boolean;
  evidence_source_count?: number;
  evidence_sources_authenticated?: boolean;
  evidence_source_digest?: string;
  visibility_mode: "public" | "private";
  status: CaseStatus;
  created_at: string;
  submitted_at: string;
  latest_verdict_id: string;
}

export interface SafetyVerdict {
  verdict_id: string;
  case_id: string;
  safety_status: SafetyStatus;
  risk_tier: RiskTier;
  evidence_quality: EvidenceQuality;
  recall_match: RecallMatch;
  cold_chain_assessment: ColdChainAssessment;
  documentation_completeness: DocumentationCompleteness;
  inspection_signal: InspectionSignal;
  required_action: RequiredAction;
  confidence: number;
  short_reason: string;
  authenticated_source_count?: number;
  source_digest?: string;
  private_evidence_commitment_present?: boolean;
  created_at: string;
}

export interface ReviewNote {
  note_id: string;
  case_id: string;
  author: string;
  note_type: string;
  note_summary: string;
  visibility: "public" | "shared" | "private";
  created_at: string;
}

export interface WalletActivity {
  action: string;
  case_id: string;
  timestamp: string;
}

export interface AdminStats {
  total_cases: number;
  pending_verdicts: number;
  stuck_reviews: number;
  safety_status_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  contract_version: string;
  deployer: string;
}
