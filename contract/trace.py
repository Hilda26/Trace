# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

import json
import typing
from datetime import datetime, timezone


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class TraceContract(gl.Contract):
    """
    TraceContract

    A GenLayer-native food safety evidence protocol on StudioNet.

    Product purpose:
    Trace lets manufacturers, distributors, inspectors, retailers, restaurants,
    and public observers submit structured Safety Cases containing batch records,
    inspection photos, temperature logs, recall notices, PDFs, and public
    advisories. GenLayer validators reach consensus on whether a food batch,
    shipment, storage event, or safety claim is clear, risky, compromised,
    unverifiable, or safe to proceed.

    The contract returns an authoritative on-chain safety verdict and enforces
    bounded canonical enums for every verdict field.

    What belongs on-chain:
    - safety case registry and state machine
    - case owner and visibility metadata
    - batch / lot identifiers and chain stage
    - public evidence URL lists
    - private evidence commitment hashes (not raw private content)
    - GenLayer consensus safety verdicts
    - review notes (owner-private, shared, or public)
    - wallet activity index
    - admin monitor aggregates
    - immutable audit trail

    What should stay off-chain:
    - raw private supplier documents, lab reports, large image sets, PDFs,
      detailed temperature tables. Store those off-chain and put commitment
      hashes or public URLs here.

    Safety disclaimer (enforced in UI):
    Trace does not certify food as legally safe.
    Trace does not replace regulators or qualified inspectors.
    Trace does not replace laboratory testing.
    Trace provides bounded evidence classification only.
    Critical or uncertain cases must be escalated to qualified human authorities.
    """

    deployer: str
    paused: bool

    case_counter: u256
    verdict_counter: u256
    note_counter: u256
    activity_counter: u256
    audit_counter: u256

    # Core registries — all values are JSON strings
    cases: TreeMap[str, str]              # case_id -> SafetyCase JSON
    verdicts: TreeMap[str, str]           # case_id -> Verdict JSON
    notes: TreeMap[str, str]              # note_id -> ReviewNote JSON
    activities: TreeMap[str, str]         # activity_id -> Activity JSON
    audit_logs: TreeMap[str, str]         # audit_id -> AuditLog JSON

    # Indices — pipe-separated lists of IDs
    all_case_index: str                   # all submitted case_ids
    public_case_index: str                # public-visibility case_ids
    owner_case_index: TreeMap[str, str]   # owner_address -> case_ids
    status_case_index: TreeMap[str, str]  # status -> case_ids
    case_note_index: TreeMap[str, str]    # case_id -> note_ids
    wallet_activity_index: TreeMap[str, str]  # wallet_address -> activity_ids
    case_audit_index: TreeMap[str, str]   # case_id -> audit_ids

    def __init__(self) -> None:
        self.deployer = gl.message.sender_address.as_hex
        self.paused = False

        self.case_counter = u256(0)
        self.verdict_counter = u256(0)
        self.note_counter = u256(0)
        self.activity_counter = u256(0)
        self.audit_counter = u256(0)

        self.cases = TreeMap()
        self.verdicts = TreeMap()
        self.notes = TreeMap()
        self.activities = TreeMap()
        self.audit_logs = TreeMap()

        self.all_case_index = ""
        self.public_case_index = ""
        self.owner_case_index = TreeMap()
        self.status_case_index = TreeMap()
        self.case_note_index = TreeMap()
        self.wallet_activity_index = TreeMap()
        self.case_audit_index = TreeMap()

    # ──────────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _sender(self) -> str:
        return gl.message.sender_address.as_hex.lower()

    def _json(self, value: typing.Any) -> str:
        return json.dumps(value, sort_keys=True)

    def _load(self, raw: str) -> typing.Any:
        if raw is None or raw == "":
            return {}
        return json.loads(raw)

    def _require_not_paused(self) -> None:
        if self.paused:
            raise gl.vm.UserError("Contract is paused")

    def _require_deployer(self) -> None:
        if self._sender() != self.deployer.lower():
            raise gl.vm.UserError("Only deployer")

    def _require_non_empty(self, value: str, field_name: str) -> None:
        if value is None or len(value.strip()) == 0:
            raise gl.vm.UserError(field_name + " is required")

    def _limit(self, value: typing.Any, max_len: int) -> str:
        text = str(value) if value is not None else ""
        if len(text) > max_len:
            return text[:max_len]
        return text

    def _to_int(self, value: typing.Any, fallback: int) -> int:
        try:
            return int(value)
        except Exception:
            return fallback

    def _bounded_score(self, value: typing.Any, fallback: int) -> int:
        score = self._to_int(value, fallback)
        if score < 0:
            return 0
        if score > 100:
            return 100
        return score

    def _append(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return item
        return existing + "|" + item

    def _append_unique(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return item
        parts = existing.split("|")
        for part in parts:
            if part == item:
                return existing
        return existing + "|" + item

    def _remove_from_pipe_list(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return ""
        parts = [p for p in existing.split("|") if p != item]
        return "|".join(parts)

    def _next_case_id(self) -> str:
        self.case_counter = self.case_counter + u256(1)
        return "CASE-" + str(self.case_counter)

    def _next_verdict_id(self) -> str:
        self.verdict_counter = self.verdict_counter + u256(1)
        return "VRD-" + str(self.verdict_counter)

    def _next_note_id(self) -> str:
        self.note_counter = self.note_counter + u256(1)
        return "NOTE-" + str(self.note_counter)

    def _next_activity_id(self) -> str:
        self.activity_counter = self.activity_counter + u256(1)
        return "ACT-" + str(self.activity_counter)

    def _next_audit_id(self) -> str:
        self.audit_counter = self.audit_counter + u256(1)
        return "AUDIT-" + str(self.audit_counter)

    def _require_case_exists(self, case_id: str) -> typing.Any:
        raw = self.cases.get(case_id, "")
        if raw == "":
            raise gl.vm.UserError("Safety case not found: " + case_id)
        return self._load(raw)

    def _require_case_owner(self, case: typing.Any) -> None:
        if case.get("owner", "").lower() != self._sender():
            raise gl.vm.UserError("Only case owner")

    def _normalise_chain_stage(self, value: str) -> str:
        allowed = [
            "farm_source", "processing_facility", "manufacturer", "cold_storage",
            "transport", "warehouse", "retailer", "restaurant",
            "consumer_complaint", "public_advisory", "recall_review",
            "import_export_check",
        ]
        v = value.strip().lower()
        if v not in allowed:
            raise gl.vm.UserError("Invalid chain_stage: " + value)
        return v

    def _normalise_food_category(self, value: str) -> str:
        allowed = [
            "meat", "poultry", "seafood", "dairy", "eggs", "fresh_produce",
            "frozen_food", "packaged_food", "beverage", "baby_food", "grains",
            "spices", "ready_to_eat", "unknown_or_mixed",
        ]
        v = value.strip().lower()
        if v not in allowed:
            raise gl.vm.UserError("Invalid food_category: " + value)
        return v

    def _normalise_review_focus(self, value: str) -> str:
        allowed = [
            "recall_applicability", "cold_chain_integrity", "inspection_evidence",
            "supplier_documentation", "packaging_damage", "contamination_risk",
            "label_mismatch", "expiry_or_shelf_life", "allergen_risk",
            "hygiene_complaint", "shipment_hold_decision", "public_safety_bulletin",
        ]
        v = value.strip().lower()
        if v not in allowed:
            raise gl.vm.UserError("Invalid review_focus: " + value)
        return v

    def _normalise_visibility_mode(self, value: str) -> str:
        v = value.strip().lower()
        if v not in ["public", "private"]:
            raise gl.vm.UserError("visibility_mode must be public or private")
        return v

    def _normalise_note_visibility(self, value: str) -> str:
        v = value.strip().lower()
        if v not in ["public", "shared", "private"]:
            raise gl.vm.UserError("note visibility must be public, shared, or private")
        return v

    def _normalise_safety_status(self, value: typing.Any) -> str:
        allowed = [
            "clear_to_proceed", "proceed_with_conditions", "hold_required",
            "recall_match_likely", "recall_match_possible", "no_recall_match",
            "compromised", "high_risk", "critical_risk", "insufficient_evidence",
            "specialist_review_required",
        ]
        v = str(value).strip().lower()
        if v in allowed:
            return v
        # Normalise common variants from AI
        mapping = {
            "clear": "clear_to_proceed",
            "proceed": "clear_to_proceed",
            "hold": "hold_required",
            "recall_likely": "recall_match_likely",
            "recall_possible": "recall_match_possible",
            "no_recall": "no_recall_match",
            "high": "high_risk",
            "critical": "critical_risk",
            "insufficient": "insufficient_evidence",
            "specialist": "specialist_review_required",
        }
        if v in mapping:
            return mapping[v]
        return "insufficient_evidence"

    def _normalise_risk_tier(self, value: typing.Any) -> str:
        v = str(value).strip().lower()
        if v in ["low", "medium", "high", "critical", "unknown"]:
            return v
        return "unknown"

    def _normalise_evidence_quality(self, value: typing.Any) -> str:
        v = str(value).strip().lower()
        if v in ["strong", "medium", "weak", "missing"]:
            return v
        return "weak"

    def _normalise_recall_match(self, value: typing.Any) -> str:
        allowed = ["likely_match", "possible_match", "no_match", "unclear", "not_applicable"]
        v = str(value).strip().lower()
        if v in allowed:
            return v
        return "unclear"

    def _normalise_cold_chain_assessment(self, value: typing.Any) -> str:
        allowed = ["intact", "minor_excursion", "material_excursion", "severe_excursion", "unclear", "not_applicable"]
        v = str(value).strip().lower()
        if v in allowed:
            return v
        return "unclear"

    def _normalise_documentation_completeness(self, value: typing.Any) -> str:
        allowed = ["complete", "partial", "weak", "missing", "not_applicable"]
        v = str(value).strip().lower()
        if v in allowed:
            return v
        return "partial"

    def _normalise_inspection_signal(self, value: typing.Any) -> str:
        allowed = ["clean", "minor_issue", "concerning", "severe", "unclear", "not_applicable"]
        v = str(value).strip().lower()
        if v in allowed:
            return v
        return "unclear"

    def _normalise_required_action(self, value: typing.Any) -> str:
        allowed = [
            "none", "proceed_with_documentation", "hold_for_manual_review",
            "quarantine_batch", "quarantine_batch_and_verify_lot_code",
            "request_temperature_logs", "request_supplier_certificate",
            "request_lab_test", "request_human_inspection", "issue_public_bulletin",
            "escalate_to_authority", "reject_or_return_shipment",
            "update_recall_matching_details", "provide_more_evidence",
        ]
        v = str(value).strip().lower()
        if v in allowed:
            return v
        return "hold_for_manual_review"

    def _normalise_verdict_payload(self, raw: typing.Any) -> typing.Any:
        if isinstance(raw, str):
            parsed = json.loads(raw)
        else:
            parsed = raw

        return {
            "safety_status": self._normalise_safety_status(parsed.get("safety_status", "insufficient_evidence")),
            "risk_tier": self._normalise_risk_tier(parsed.get("risk_tier", "unknown")),
            "evidence_quality": self._normalise_evidence_quality(parsed.get("evidence_quality", "weak")),
            "recall_match": self._normalise_recall_match(parsed.get("recall_match", "unclear")),
            "cold_chain_assessment": self._normalise_cold_chain_assessment(parsed.get("cold_chain_assessment", "unclear")),
            "documentation_completeness": self._normalise_documentation_completeness(parsed.get("documentation_completeness", "partial")),
            "inspection_signal": self._normalise_inspection_signal(parsed.get("inspection_signal", "unclear")),
            "required_action": self._normalise_required_action(parsed.get("required_action", "hold_for_manual_review")),
            "confidence": self._bounded_score(parsed.get("confidence", 50), 50),
            "short_reason": self._limit(parsed.get("short_reason", ""), 600),
        }

    def _inconclusive_verdict(self) -> typing.Any:
        return {
            "safety_status": "insufficient_evidence",
            "risk_tier": "unknown",
            "evidence_quality": "weak",
            "recall_match": "unclear",
            "cold_chain_assessment": "unclear",
            "documentation_completeness": "partial",
            "inspection_signal": "unclear",
            "required_action": "provide_more_evidence",
            "confidence": 0,
            "short_reason": "Consensus could not be reached; please resubmit with more evidence.",
        }

    def _status_from_verdict(self, safety_status: str) -> str:
        mapping = {
            "clear_to_proceed": "clear_to_proceed",
            "proceed_with_conditions": "proceed_with_conditions",
            "hold_required": "hold_required",
            "recall_match_likely": "hold_required",
            "recall_match_possible": "recall_match_possible",
            "no_recall_match": "clear_to_proceed",
            "compromised": "high_risk",
            "high_risk": "high_risk",
            "critical_risk": "critical_risk",
            "insufficient_evidence": "insufficient_evidence",
            "specialist_review_required": "specialist_review_required",
        }
        return mapping.get(safety_status, "under_review")

    def _record_activity(
        self,
        wallet: str,
        action: str,
        case_id: str,
        tx_summary: str,
    ) -> None:
        activity_id = self._next_activity_id()
        record = {
            "activity_id": activity_id,
            "wallet": wallet.lower(),
            "action": action,
            "case_id": case_id,
            "tx_summary": self._limit(tx_summary, 300),
            "created_at": _now(),
        }
        self.activities[activity_id] = self._json(record)
        self.wallet_activity_index[wallet.lower()] = self._append(
            self.wallet_activity_index.get(wallet.lower(), ""),
            activity_id,
        )

    def _record_audit(
        self,
        case_id: str,
        event_type: str,
        actor: str,
        summary: str,
    ) -> str:
        audit_id = self._next_audit_id()
        entry = {
            "audit_id": audit_id,
            "case_id": case_id,
            "event_type": event_type,
            "actor": actor.lower(),
            "summary": self._limit(summary, 600),
            "created_at": _now(),
        }
        self.audit_logs[audit_id] = self._json(entry)
        if case_id != "":
            self.case_audit_index[case_id] = self._append(
                self.case_audit_index.get(case_id, ""),
                audit_id,
            )
        return audit_id

    def _update_status_index(self, old_status: str, new_status: str, case_id: str) -> None:
        if old_status != "":
            self.status_case_index[old_status] = self._remove_from_pipe_list(
                self.status_case_index.get(old_status, ""), case_id
            )
        self.status_case_index[new_status] = self._append_unique(
            self.status_case_index.get(new_status, ""), case_id
        )

    def _build_public_view(self, case: typing.Any) -> typing.Any:
        return {
            "case_id": case.get("case_id", ""),
            "title": case.get("title", ""),
            "food_category": case.get("food_category", ""),
            "chain_stage": case.get("chain_stage", ""),
            "review_focus": case.get("review_focus", ""),
            "product_summary": case.get("product_summary", ""),
            "public_evidence_urls": case.get("public_evidence_urls", ""),
            "recall_or_advisory_urls": case.get("recall_or_advisory_urls", ""),
            "status": case.get("status", ""),
            "visibility_mode": case.get("visibility_mode", ""),
            "created_at": case.get("created_at", ""),
            "submitted_at": case.get("submitted_at", ""),
            "latest_verdict_id": case.get("latest_verdict_id", ""),
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Contract status
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_deployer(self) -> str:
        return self.deployer

    @gl.public.view
    def get_contract_version(self) -> str:
        return "1.0.0"

    @gl.public.view
    def is_paused(self) -> bool:
        return self.paused

    @gl.public.write
    def pause_contract(self) -> None:
        self._require_deployer()
        self.paused = True
        self._record_audit("", "CONTRACT_PAUSED", self._sender(), "Contract paused by deployer")

    @gl.public.write
    def unpause_contract(self) -> None:
        self._require_deployer()
        self.paused = False
        self._record_audit("", "CONTRACT_UNPAUSED", self._sender(), "Contract unpaused by deployer")

    # ──────────────────────────────────────────────────────────────────────────
    # Case Lifecycle — submit, withdraw, archive
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.write
    def submit_case(
        self,
        case_id: str,
        title: str,
        food_category: str,
        product_summary: str,
        batch_or_lot_reference: str,
        supplier_or_facility_summary: str,
        chain_stage: str,
        review_focus: str,
        safety_question: str,
        claimed_status: str,
        public_evidence_urls: str,
        image_urls: str,
        pdf_report_urls: str,
        recall_or_advisory_urls: str,
        temperature_log_summary: str,
        transport_storage_notes: str,
        inspection_notes: str,
        private_evidence_commitment_hash: str,
        visibility_mode: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(title, "title")
        self._require_non_empty(food_category, "food_category")
        self._require_non_empty(chain_stage, "chain_stage")
        self._require_non_empty(review_focus, "review_focus")
        self._require_non_empty(safety_question, "safety_question")

        final_food_category = self._normalise_food_category(food_category)
        final_chain_stage = self._normalise_chain_stage(chain_stage)
        final_review_focus = self._normalise_review_focus(review_focus)
        final_visibility = self._normalise_visibility_mode(visibility_mode)

        final_case_id = case_id.strip()
        if final_case_id == "":
            final_case_id = self._next_case_id()
        if self.cases.get(final_case_id, "") != "":
            raise gl.vm.UserError("Safety case already exists: " + final_case_id)

        sender = self._sender()
        now = _now()

        record = {
            "case_id": final_case_id,
            "owner": sender,
            "title": self._limit(title, 220),
            "food_category": final_food_category,
            "product_summary": self._limit(product_summary, 1200),
            "batch_or_lot_reference": self._limit(batch_or_lot_reference, 240),
            "supplier_or_facility_summary": self._limit(supplier_or_facility_summary, 1200),
            "chain_stage": final_chain_stage,
            "review_focus": final_review_focus,
            "safety_question": self._limit(safety_question, 800),
            "claimed_status": self._limit(claimed_status, 120),
            "public_evidence_urls": self._limit(public_evidence_urls, 2400),
            "image_urls": self._limit(image_urls, 2400),
            "pdf_report_urls": self._limit(pdf_report_urls, 2400),
            "recall_or_advisory_urls": self._limit(recall_or_advisory_urls, 2400),
            "temperature_log_summary": self._limit(temperature_log_summary, 1600),
            "transport_storage_notes": self._limit(transport_storage_notes, 1200),
            "inspection_notes": self._limit(inspection_notes, 1200),
            "private_evidence_commitment_hash": self._limit(private_evidence_commitment_hash, 256),
            "visibility_mode": final_visibility,
            "status": "submitted",
            "created_at": now,
            "submitted_at": now,
            "latest_verdict_id": "",
        }

        self.cases[final_case_id] = self._json(record)

        self.all_case_index = self._append_unique(self.all_case_index, final_case_id)

        if final_visibility == "public":
            self.public_case_index = self._append_unique(self.public_case_index, final_case_id)

        self.owner_case_index[sender] = self._append_unique(
            self.owner_case_index.get(sender, ""), final_case_id
        )

        self._update_status_index("", "submitted", final_case_id)

        self._record_activity(sender, "submit_case", final_case_id, "Safety case submitted")
        self._record_audit(final_case_id, "CASE_SUBMITTED", sender, "Safety case submitted: " + title)

        return final_case_id

    @gl.public.write
    def withdraw_case(self, case_id: str) -> None:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        self._require_case_owner(case)

        current_status = case.get("status", "")
        if current_status in ["withdrawn", "archived"]:
            raise gl.vm.UserError("Safety case is already closed")

        old_status = current_status
        case["status"] = "withdrawn"
        case["withdrawn_at"] = _now()
        self.cases[case_id] = self._json(case)

        self._update_status_index(old_status, "withdrawn", case_id)

        self._record_activity(self._sender(), "withdraw_case", case_id, "Safety case withdrawn")
        self._record_audit(case_id, "CASE_WITHDRAWN", self._sender(), "Case withdrawn by owner")

    @gl.public.write
    def archive_case(self, case_id: str) -> None:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        self._require_case_owner(case)

        if case.get("status", "") == "withdrawn":
            raise gl.vm.UserError("Cannot archive a withdrawn case")

        old_status = case.get("status", "")
        case["status"] = "archived"
        case["archived_at"] = _now()
        self.cases[case_id] = self._json(case)

        self._update_status_index(old_status, "archived", case_id)

        # Remove from public index if applicable
        if case.get("visibility_mode", "") == "public":
            self.public_case_index = self._remove_from_pipe_list(self.public_case_index, case_id)

        self._record_activity(self._sender(), "archive_case", case_id, "Safety case archived")
        self._record_audit(case_id, "CASE_ARCHIVED", self._sender(), "Case archived by owner")

    # ──────────────────────────────────────────────────────────────────────────
    # Review Notes — add, read
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.write
    def add_review_note(
        self,
        case_id: str,
        note_id: str,
        note_type: str,
        note_summary: str,
        visibility: str,
    ) -> str:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        self._require_non_empty(note_summary, "note_summary")

        if case.get("status", "") in ["withdrawn", "archived"]:
            raise gl.vm.UserError("Cannot add notes to a closed case")

        final_note_id = note_id.strip()
        if final_note_id == "":
            final_note_id = self._next_note_id()
        if self.notes.get(final_note_id, "") != "":
            raise gl.vm.UserError("Note already exists: " + final_note_id)

        final_visibility = self._normalise_note_visibility(visibility)

        record = {
            "note_id": final_note_id,
            "case_id": case_id,
            "author": self._sender(),
            "note_type": self._limit(note_type, 80),
            "note_summary": self._limit(note_summary, 1200),
            "visibility": final_visibility,
            "created_at": _now(),
        }

        self.notes[final_note_id] = self._json(record)
        self.case_note_index[case_id] = self._append(
            self.case_note_index.get(case_id, ""), final_note_id
        )

        self._record_activity(self._sender(), "add_review_note", case_id, "Review note added")
        self._record_audit(case_id, "REVIEW_NOTE_ADDED", self._sender(), "Note added: " + final_visibility)

        return final_note_id

    @gl.public.view
    def get_review_notes(self, case_id: str, requester: str) -> str:
        if self.cases.get(case_id, "") == "":
            return "[]"

        case = self._load(self.cases.get(case_id, ""))
        is_owner = case.get("owner", "").lower() == requester.strip().lower()

        note_ids_raw = self.case_note_index.get(case_id, "")
        if note_ids_raw == "":
            return "[]"

        note_ids = note_ids_raw.split("|")
        result: typing.List[typing.Any] = []

        for note_id in note_ids:
            note_id = note_id.strip()
            if note_id == "":
                continue
            raw = self.notes.get(note_id, "")
            if raw == "":
                continue
            note = self._load(raw)
            note_visibility = note.get("visibility", "private")

            if is_owner:
                result.append(note)
            elif note_visibility == "public":
                result.append(note)
            elif note_visibility == "shared" and requester.strip().lower() != "":
                # Shared notes visible to any authenticated address — reviewer invitation is off-chain in MVP
                result.append(note)

        return self._json(result)

    # ──────────────────────────────────────────────────────────────────────────
    # GenLayer Judgment — request_safety_verdict, store_safety_verdict
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.write
    def request_safety_verdict(self, case_id: str) -> str:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        self._require_case_owner(case)

        current_status = case.get("status", "")
        if current_status in ["withdrawn", "archived"]:
            raise gl.vm.UserError("Cannot request verdict for a closed case")

        # Collect up to 2 shared/public notes (truncated) for context
        note_ids_raw = self.case_note_index.get(case_id, "")
        shared_notes: typing.List[str] = []
        if note_ids_raw != "":
            for note_id in note_ids_raw.split("|")[:4]:
                note_id = note_id.strip()
                if note_id == "":
                    continue
                raw = self.notes.get(note_id, "")
                if raw == "":
                    continue
                note = self._load(raw)
                if note.get("visibility", "") in ["shared", "public"]:
                    summary = note.get("note_summary", "")[:200]
                    shared_notes.append(summary)
                    if len(shared_notes) >= 2:
                        break

        # Build compact case context — hard-cap each field to avoid prompt bloat
        def _cap(s: str, n: int = 200) -> str:
            return s[:n] if s else "not provided"

        title_val         = _cap(case.get("title", ""), 100)
        category_val      = case.get("food_category", "unknown")
        stage_val         = case.get("chain_stage", "unknown")
        focus_val         = case.get("review_focus", "general")
        question_val      = _cap(case.get("safety_question", ""), 300)
        temp_val          = _cap(case.get("temperature_log_summary", ""), 200)
        transport_val     = _cap(case.get("transport_storage_notes", ""), 200)
        inspection_val    = _cap(case.get("inspection_notes", ""), 200)
        notes_text        = "; ".join(shared_notes) if shared_notes else "none"

        def evaluate_once() -> str:
            prompt = (
                f"Food safety case classifier. Return ONLY filled JSON.\n"
                f"Title: {title_val}\n"
                f"Category: {category_val} | Stage: {stage_val} | Focus: {focus_val}\n"
                f"Question: {question_val}\n"
                f"Temp log: {temp_val}\n"
                f"Transport: {transport_val}\n"
                f"Inspection: {inspection_val}\n"
                f"Notes: {notes_text}\n\n"
                '{"safety_status":"<clear_to_proceed|proceed_with_conditions|hold_required|high_risk|critical_risk|insufficient_evidence>",'
                '"risk_tier":"<low|medium|high|critical|unknown>",'
                '"required_action":"<none|proceed_with_documentation|hold_for_manual_review|quarantine_batch|request_temperature_logs|request_lab_test|request_human_inspection|escalate_to_authority|provide_more_evidence>",'
                '"evidence_quality":"<strong|medium|weak|missing>",'
                '"cold_chain_assessment":"<intact|minor_excursion|material_excursion|severe_excursion|not_applicable>",'
                '"documentation_completeness":"<complete|partial|weak|missing|not_applicable>",'
                '"inspection_signal":"<clean|minor_issue|concerning|severe|not_applicable>",'
                '"recall_match":"not_applicable",'
                '"confidence":<0-100>,'
                '"short_reason":"<one sentence>"}'
            )
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            try:
                data = json.loads(raw) if isinstance(raw, str) else raw
                v = self._normalise_verdict_payload(data)
            except Exception:
                v = self._inconclusive_verdict()
            return json.dumps({
                "safety_status": v["safety_status"],
                "risk_tier": v["risk_tier"],
                "required_action": v["required_action"],
                "evidence_quality": v["evidence_quality"],
                "cold_chain_assessment": v["cold_chain_assessment"],
                "documentation_completeness": v["documentation_completeness"],
                "inspection_signal": v["inspection_signal"],
                "recall_match": v["recall_match"],
                "confidence": v["confidence"],
                "short_reason": v["short_reason"],
            }, sort_keys=True)

        consensus_json = gl.eq_principle.prompt_comparative(
            evaluate_once,
            principle="Outputs are equivalent if safety_status and risk_tier match.",
        )

        try:
            normalised_verdict = self._normalise_verdict_payload(consensus_json)
        except Exception:
            normalised_verdict = self._inconclusive_verdict()

        verdict_id = self._next_verdict_id()
        now = _now()

        verdict_record = {
            "verdict_id": verdict_id,
            "case_id": case_id,
            "safety_status": normalised_verdict["safety_status"],
            "risk_tier": normalised_verdict["risk_tier"],
            "evidence_quality": normalised_verdict["evidence_quality"],
            "recall_match": normalised_verdict["recall_match"],
            "cold_chain_assessment": normalised_verdict["cold_chain_assessment"],
            "documentation_completeness": normalised_verdict["documentation_completeness"],
            "inspection_signal": normalised_verdict["inspection_signal"],
            "required_action": normalised_verdict["required_action"],
            "confidence": normalised_verdict["confidence"],
            "short_reason": normalised_verdict["short_reason"],
            "adjudicated_by": "GENLAYER_CONSENSUS",
            "created_at": now,
        }

        self.verdicts[case_id] = self._json(verdict_record)

        # Update case status
        new_case_status = self._status_from_verdict(normalised_verdict["safety_status"])
        old_case_status = case.get("status", "")
        case["status"] = new_case_status
        case["latest_verdict_id"] = verdict_id
        case["verdict_at"] = now
        self.cases[case_id] = self._json(case)

        self._update_status_index(old_case_status, new_case_status, case_id)

        self._record_activity(
            self._sender(),
            "request_safety_verdict",
            case_id,
            "GenLayer consensus verdict: " + normalised_verdict["safety_status"],
        )
        self._record_audit(
            case_id,
            "GENLAYER_SAFETY_VERDICT",
            "GENLAYER_CONSENSUS",
            "Consensus verdict: " + normalised_verdict["safety_status"] + " / risk: " + normalised_verdict["risk_tier"],
        )

        return self._json(verdict_record)

    @gl.public.write
    def store_safety_verdict(self, case_id: str, verdict_json: str) -> None:
        """Deployer-only override for storing a pre-validated verdict (e.g. retry path)."""
        self._require_not_paused()
        self._require_deployer()

        case = self._require_case_exists(case_id)
        self._require_non_empty(verdict_json, "verdict_json")

        parsed = json.loads(verdict_json)
        normalised = self._normalise_verdict_payload(parsed)

        verdict_id = self._next_verdict_id()
        now = _now()

        verdict_record = {
            "verdict_id": verdict_id,
            "case_id": case_id,
            "safety_status": normalised["safety_status"],
            "risk_tier": normalised["risk_tier"],
            "evidence_quality": normalised["evidence_quality"],
            "recall_match": normalised["recall_match"],
            "cold_chain_assessment": normalised["cold_chain_assessment"],
            "documentation_completeness": normalised["documentation_completeness"],
            "inspection_signal": normalised["inspection_signal"],
            "required_action": normalised["required_action"],
            "confidence": normalised["confidence"],
            "short_reason": normalised["short_reason"],
            "adjudicated_by": "DEPLOYER_OVERRIDE",
            "created_at": now,
        }

        self.verdicts[case_id] = self._json(verdict_record)

        new_case_status = self._status_from_verdict(normalised["safety_status"])
        old_case_status = case.get("status", "")
        case["status"] = new_case_status
        case["latest_verdict_id"] = verdict_id
        case["verdict_at"] = now
        self.cases[case_id] = self._json(case)

        self._update_status_index(old_case_status, new_case_status, case_id)

        self._record_audit(
            case_id,
            "DEPLOYER_VERDICT_STORED",
            self._sender(),
            "Deployer stored override verdict: " + normalised["safety_status"],
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Read — cases
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        return self.cases.get(case_id, "{}")

    @gl.public.view
    def get_public_cases(self) -> str:
        if self.public_case_index == "":
            return "[]"

        result: typing.List[typing.Any] = []
        for case_id in self.public_case_index.split("|"):
            case_id = case_id.strip()
            if case_id == "":
                continue
            raw = self.cases.get(case_id, "")
            if raw == "":
                continue
            case = self._load(raw)
            status = case.get("status", "")
            if status in ["withdrawn", "draft_offchain"]:
                continue
            if case.get("visibility_mode", "") != "public":
                continue
            result.append(self._build_public_view(case))

        return self._json(result)

    @gl.public.view
    def get_cases_by_owner(self, owner: str) -> str:
        owner_lower = owner.strip().lower()
        raw_index = self.owner_case_index.get(owner_lower, "")
        if raw_index == "":
            return "[]"

        result: typing.List[typing.Any] = []
        for case_id in raw_index.split("|"):
            case_id = case_id.strip()
            if case_id == "":
                continue
            raw = self.cases.get(case_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))

        return self._json(result)

    @gl.public.view
    def get_cases_by_status(self, status: str) -> str:
        raw_index = self.status_case_index.get(status.strip().lower(), "")
        if raw_index == "":
            return "[]"

        result: typing.List[typing.Any] = []
        for case_id in raw_index.split("|"):
            case_id = case_id.strip()
            if case_id == "":
                continue
            raw = self.cases.get(case_id, "")
            if raw == "":
                continue
            case = self._load(raw)
            if case.get("visibility_mode", "") == "public":
                result.append(self._build_public_view(case))

        return self._json(result)

    # ──────────────────────────────────────────────────────────────────────────
    # Read — verdicts
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_case_verdict(self, case_id: str) -> str:
        return self.verdicts.get(case_id, "{}")

    @gl.public.view
    def get_verdict_public(self, case_id: str) -> str:
        raw = self.verdicts.get(case_id, "")
        if raw == "":
            return "{}"
        verdict = self._load(raw)
        # Check case is public before returning
        case_raw = self.cases.get(case_id, "")
        if case_raw == "":
            return "{}"
        case = self._load(case_raw)
        if case.get("visibility_mode", "") != "public":
            return "{}"
        # Return full verdict for public cases — short_reason never contains private info
        return raw

    # ──────────────────────────────────────────────────────────────────────────
    # Read — activity and audit
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_wallet_activity(self, wallet_address: str) -> str:
        wallet_lower = wallet_address.strip().lower()
        raw_index = self.wallet_activity_index.get(wallet_lower, "")
        if raw_index == "":
            return "[]"

        result: typing.List[typing.Any] = []
        ids = raw_index.split("|")
        # Return most recent first — reverse iteration
        for i in range(len(ids) - 1, -1, -1):
            activity_id = ids[i].strip()
            if activity_id == "":
                continue
            raw = self.activities.get(activity_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))

        return self._json(result)

    @gl.public.view
    def get_case_audit_log(self, case_id: str) -> str:
        raw_index = self.case_audit_index.get(case_id, "")
        if raw_index == "":
            return "[]"

        result: typing.List[typing.Any] = []
        for audit_id in raw_index.split("|"):
            audit_id = audit_id.strip()
            if audit_id == "":
                continue
            raw = self.audit_logs.get(audit_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))

        return self._json(result)

    # ──────────────────────────────────────────────────────────────────────────
    # Read — admin monitor (read-only, no write controls)
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_admin_monitor_stats(self) -> str:
        total = 0
        if self.all_case_index != "":
            total = len([x for x in self.all_case_index.split("|") if x.strip() != ""])

        public_count = 0
        if self.public_case_index != "":
            public_count = len([x for x in self.public_case_index.split("|") if x.strip() != ""])

        pending_verdicts = 0
        submitted_raw = self.status_case_index.get("submitted", "")
        if submitted_raw != "":
            pending_verdicts = len([x for x in submitted_raw.split("|") if x.strip() != ""])

        under_review_raw = self.status_case_index.get("under_review", "")
        if under_review_raw != "":
            pending_verdicts += len([x for x in under_review_raw.split("|") if x.strip() != ""])

        stuck_reviews = pending_verdicts

        status_distribution: typing.Dict[str, int] = {}
        all_statuses = [
            "submitted", "under_review", "clear_to_proceed", "proceed_with_conditions",
            "hold_required", "recall_match_possible", "high_risk", "critical_risk",
            "insufficient_evidence", "specialist_review_required", "withdrawn", "archived",
        ]
        for s in all_statuses:
            raw = self.status_case_index.get(s, "")
            if raw != "":
                count = len([x for x in raw.split("|") if x.strip() != ""])
                if count > 0:
                    status_distribution[s] = count

        risk_distribution: typing.Dict[str, int] = {}
        if self.all_case_index != "":
            for case_id in self.all_case_index.split("|"):
                case_id = case_id.strip()
                if case_id == "":
                    continue
                verdict_raw = self.verdicts.get(case_id, "")
                if verdict_raw == "":
                    continue
                verdict = self._load(verdict_raw)
                tier = verdict.get("risk_tier", "unknown")
                risk_distribution[tier] = risk_distribution.get(tier, 0) + 1

        return self._json({
            "total_cases": total,
            "public_cases": public_count,
            "private_cases": total - public_count,
            "pending_verdicts": pending_verdicts,
            "stuck_reviews": stuck_reviews,
            "safety_status_distribution": status_distribution,
            "risk_distribution": risk_distribution,
            "contract_version": "1.0.0",
            "deployer": self.deployer,
            "paused": self.paused,
        })

    @gl.public.view
    def get_contract_summary(self) -> str:
        return self._json({
            "deployer": self.deployer,
            "paused": self.paused,
            "contract_version": "1.0.0",
            "case_counter": str(self.case_counter),
            "verdict_counter": str(self.verdict_counter),
            "note_counter": str(self.note_counter),
            "activity_counter": str(self.activity_counter),
            "audit_counter": str(self.audit_counter),
        })

    # ──────────────────────────────────────────────────────────────────────────
    # Read — index helpers for frontend
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_all_case_index(self) -> str:
        return self.all_case_index

    @gl.public.view
    def get_public_case_index(self) -> str:
        return self.public_case_index

    @gl.public.view
    def get_owner_case_index(self, owner: str) -> str:
        return self.owner_case_index.get(owner.strip().lower(), "")

    @gl.public.view
    def get_status_case_index(self, status: str) -> str:
        return self.status_case_index.get(status.strip().lower(), "")

    @gl.public.view
    def get_case_note_index(self, case_id: str) -> str:
        return self.case_note_index.get(case_id, "")

    @gl.public.view
    def get_note(self, note_id: str) -> str:
        return self.notes.get(note_id, "{}")

    @gl.public.view
    def get_audit_entry(self, audit_id: str) -> str:
        return self.audit_logs.get(audit_id, "{}")
