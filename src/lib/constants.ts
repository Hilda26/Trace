export const CHAIN_STAGES = [
  { value: "farm_source", label: "Farm Source" },
  { value: "processing_facility", label: "Processing Facility" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "cold_storage", label: "Cold Storage" },
  { value: "transport", label: "Transport" },
  { value: "warehouse", label: "Warehouse" },
  { value: "retailer", label: "Retailer" },
  { value: "restaurant", label: "Restaurant" },
  { value: "consumer_complaint", label: "Consumer Complaint" },
  { value: "public_advisory", label: "Public Advisory" },
  { value: "recall_review", label: "Recall Review" },
  { value: "import_export_check", label: "Import / Export Check" },
] as const;

export const FOOD_CATEGORIES = [
  { value: "meat", label: "Meat" },
  { value: "poultry", label: "Poultry" },
  { value: "seafood", label: "Seafood" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "fresh_produce", label: "Fresh Produce" },
  { value: "frozen_food", label: "Frozen Food" },
  { value: "packaged_food", label: "Packaged Food" },
  { value: "beverage", label: "Beverage" },
  { value: "baby_food", label: "Baby Food" },
  { value: "grains", label: "Grains" },
  { value: "spices", label: "Spices" },
  { value: "ready_to_eat", label: "Ready to Eat" },
  { value: "unknown_or_mixed", label: "Unknown / Mixed" },
] as const;

export const REVIEW_FOCUS_OPTIONS = [
  { value: "recall_applicability", label: "Recall Applicability" },
  { value: "cold_chain_integrity", label: "Cold Chain Integrity" },
  { value: "inspection_evidence", label: "Inspection Evidence" },
  { value: "supplier_documentation", label: "Supplier Documentation" },
  { value: "packaging_damage", label: "Packaging Damage" },
  { value: "contamination_risk", label: "Contamination Risk" },
  { value: "label_mismatch", label: "Label Mismatch" },
  { value: "expiry_or_shelf_life", label: "Expiry / Shelf Life" },
  { value: "allergen_risk", label: "Allergen Risk" },
  { value: "hygiene_complaint", label: "Hygiene Complaint" },
  { value: "shipment_hold_decision", label: "Shipment Hold Decision" },
  { value: "public_safety_bulletin", label: "Public Safety Bulletin" },
] as const;

export const NETWORK = {
  name: "StudioNet",
  chainId: 61999,
  rpc: "https://studio.genlayer.com/api",
  explorer: "https://explorer-studio.genlayer.com",
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft_offchain:            { label: "Draft",              color: "#64748B", bg: "rgba(100,116,139,0.1)" },
  submitted:                 { label: "Submitted",          color: "#38BDF8", bg: "rgba(56,189,248,0.1)" },
  under_review:              { label: "Under Review",       color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  clear_to_proceed:          { label: "Clear to Proceed",   color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  proceed_with_conditions:   { label: "Proceed w/ Conditions", color: "#14B8A6", bg: "rgba(20,184,166,0.1)" },
  hold_required:             { label: "Hold Required",      color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  recall_match_possible:     { label: "Recall Match Possible", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  high_risk:                 { label: "High Risk",          color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  critical_risk:             { label: "Critical Risk",      color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  insufficient_evidence:     { label: "Insufficient Evidence", color: "#64748B", bg: "rgba(100,116,139,0.1)" },
  specialist_review_required:{ label: "Specialist Review", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  withdrawn:                 { label: "Withdrawn",          color: "#64748B", bg: "rgba(100,116,139,0.1)" },
  archived:                  { label: "Archived",           color: "#64748B", bg: "rgba(100,116,139,0.1)" },
};

export const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low:      { color: "#22C55E", label: "Low" },
  medium:   { color: "#F59E0B", label: "Medium" },
  high:     { color: "#EF4444", label: "High" },
  critical: { color: "#EF4444", label: "Critical" },
  unknown:  { color: "#64748B", label: "Unknown" },
};
