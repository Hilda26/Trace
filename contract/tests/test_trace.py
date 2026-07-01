# Trace Contract — Direct Tests

import json
import pytest

# These tests use the GenLayer test runner (genlayer test).
# Run: genlayer test contract/tests/

VALID_CASE = {
    "case_id": "test_case_001",
    "title": "Cold Chain Review — Frozen Salmon Lot 7",
    "food_category": "seafood",
    "product_summary": "Frozen Atlantic Salmon, 1kg packs, vacuum-sealed.",
    "batch_or_lot_reference": "LOT-SAL-7-2024",
    "supplier_or_facility_summary": "Nordic Seafood AS, Bergen, Norway. BRC Grade A.",
    "chain_stage": "cold_storage",
    "review_focus": "cold_chain_integrity",
    "safety_question": "Did the cold chain remain intact throughout the storage event?",
    "claimed_status": "clear to proceed",
    "public_evidence_urls": "https://example.com/evidence/1",
    "image_urls": "https://example.com/images/1",
    "pdf_report_urls": "https://example.com/reports/1",
    "recall_or_advisory_urls": "",
    "temperature_log_summary": "Spike to -10C for 45 min. Returned to -18C.",
    "transport_storage_notes": "Stored at -18C. One 45-min excursion on 2024-01-15.",
    "inspection_notes": "Packaging intact. No visible damage.",
    "private_evidence_commitment_hash": "",
    "visibility_mode": "public",
}


def test_valid_submission(contract):
    contract.submit_case(**VALID_CASE)
    result = json.loads(contract.get_case("test_case_001"))
    assert result["case_id"] == "test_case_001"
    assert result["status"] == "submitted"
    assert result["food_category"] == "seafood"


def test_invalid_food_category_rejected(contract):
    bad = {**VALID_CASE, "case_id": "bad_cat", "food_category": "pizza"}
    with pytest.raises(Exception, match="Invalid food_category"):
        contract.submit_case(**bad)


def test_invalid_chain_stage_rejected(contract):
    bad = {**VALID_CASE, "case_id": "bad_stage", "chain_stage": "spaceship"}
    with pytest.raises(Exception, match="Invalid chain_stage"):
        contract.submit_case(**bad)


def test_invalid_review_focus_rejected(contract):
    bad = {**VALID_CASE, "case_id": "bad_focus", "review_focus": "vibes_check"}
    with pytest.raises(Exception, match="Invalid review_focus"):
        contract.submit_case(**bad)


def test_owner_sees_own_cases(contract, accounts):
    contract.submit_case(**{**VALID_CASE, "case_id": "owner_case_1"}, caller=accounts[0])
    result = json.loads(contract.get_cases_by_owner(str(accounts[0])))
    ids = [c["case_id"] for c in result]
    assert "owner_case_1" in ids


def test_owner_cannot_see_others_private_cases(contract, accounts):
    contract.submit_case(**{**VALID_CASE, "case_id": "private_other", "visibility_mode": "private"}, caller=accounts[1])
    public_cases = json.loads(contract.get_public_cases())
    ids = [c["case_id"] for c in public_cases]
    assert "private_other" not in ids


def test_public_report_hides_private_notes(contract, accounts):
    contract.submit_case(**{**VALID_CASE, "case_id": "note_test"}, caller=accounts[0])
    contract.add_review_note(
        case_id="note_test", note_id="n1", note_type="internal",
        note_summary="Private internal note", visibility="private",
        caller=accounts[0]
    )
    # Public read should not return private notes
    notes = json.loads(contract.get_review_notes("note_test", "0x0000000000000000000000000000000000000001"))
    for n in notes:
        assert n["visibility"] != "private"


def test_withdraw_case(contract, accounts):
    contract.submit_case(**{**VALID_CASE, "case_id": "withdraw_test"}, caller=accounts[0])
    contract.withdraw_case("withdraw_test", caller=accounts[0])
    result = json.loads(contract.get_case("withdraw_test"))
    assert result["status"] == "withdrawn"


def test_non_owner_cannot_withdraw(contract, accounts):
    contract.submit_case(**{**VALID_CASE, "case_id": "auth_test"}, caller=accounts[0])
    with pytest.raises(Exception, match="Not case owner"):
        contract.withdraw_case("auth_test", caller=accounts[1])


def test_admin_stats_readable(contract):
    stats = json.loads(contract.get_admin_monitor_stats())
    assert "total_cases" in stats
    assert "contract_version" in stats
    assert "deployer" in stats


def test_verdict_not_present_initially(contract):
    contract.submit_case(**{**VALID_CASE, "case_id": "no_verdict"})
    result = contract.get_case_verdict("no_verdict")
    assert result == "{}"
