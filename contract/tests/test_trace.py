# Trace Contract — Direct Tests

import json
import pytest

# These tests use the GenLayer test runner (genlayer test).
# Run: genlayer test contract/tests/

class ContractCallerWrapper:
    def __init__(self, contract, direct_vm):
        self._contract = contract
        self._direct_vm = direct_vm

    def __getattr__(self, name):
        attr = getattr(self._contract, name)
        if not callable(attr):
            return attr

        def call_with_optional_sender(*args, **kwargs):
            caller = kwargs.pop("caller", None)
            if caller is None:
                return attr(*args, **kwargs)
            with self._direct_vm.prank(caller):
                return attr(*args, **kwargs)

        return call_with_optional_sender


@pytest.fixture
def contract(direct_deploy, direct_vm, monkeypatch):
    import os

    original_unlink = os.unlink

    def unlink_ignoring_windows_stdin_lock(path):
        try:
            original_unlink(path)
        except PermissionError:
            pass

    monkeypatch.setattr(os, "unlink", unlink_ignoring_windows_stdin_lock)
    return ContractCallerWrapper(direct_deploy("contract/trace.py"), direct_vm)


@pytest.fixture
def accounts(direct_accounts):
    return direct_accounts

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
    result = json.loads(contract.get_cases_by_owner(str(accounts[1]), caller=accounts[0]))
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
    with pytest.raises(Exception, match="Only case owner"):
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


def test_private_case_requires_actual_sender(contract, accounts):
    contract.submit_case(**{**VALID_CASE, "case_id": "private_sender", "visibility_mode": "private"}, caller=accounts[0])

    non_owner_view = json.loads(contract.get_case("private_sender", caller=accounts[1]))
    assert non_owner_view == {}

    owner_view = json.loads(contract.get_case_private("private_sender", caller=accounts[0]))
    assert owner_view["case_id"] == "private_sender"
    assert owner_view["owner"] == str(accounts[0]).lower()


def test_non_owner_cannot_add_review_note(contract, accounts):
    contract.submit_case(**{**VALID_CASE, "case_id": "note_auth"}, caller=accounts[0])
    with pytest.raises(Exception, match="Only case owner"):
        contract.add_review_note(
            case_id="note_auth", note_id="n2", note_type="internal",
            note_summary="Should be rejected", visibility="private",
            caller=accounts[1],
        )


def test_deployer_verdict_override_removed(contract):
    assert not hasattr(contract._contract, "store_safety_verdict")


def test_submission_records_source_and_private_commitment_metadata(contract):
    contract.submit_case(**{
        **VALID_CASE,
        "case_id": "source_meta",
        "public_evidence_urls": "https://example.com/evidence/1, https://example.com/evidence/2",
        "pdf_report_urls": "https://example.com/report.pdf",
        "recall_or_advisory_urls": "https://example.com/recall",
        "private_evidence_commitment_hash": "0xabc",
    })
    result = json.loads(contract.get_case_private("source_meta"))
    assert result["evidence_source_count"] == 4
    assert result["private_evidence_commitment_present"] is True


def test_private_indices_and_note_getters_are_sender_filtered(contract, accounts):
    contract.submit_case(**{**VALID_CASE, "case_id": "idx_private", "visibility_mode": "private"}, caller=accounts[0])
    contract.add_review_note(
        case_id="idx_private", note_id="idx_note", note_type="internal",
        note_summary="Private indexed note", visibility="private",
        caller=accounts[0],
    )

    assert "idx_private" not in contract.get_all_case_index(caller=accounts[1]).split("|")
    assert "idx_private" not in contract.get_status_case_index("submitted", caller=accounts[1]).split("|")
    assert contract.get_owner_case_index(str(accounts[0]), caller=accounts[1]) == ""
    assert contract.get_case_note_index("idx_private", caller=accounts[1]) == ""
    assert contract.get_note("idx_note", caller=accounts[1]) == "{}"

    assert "idx_private" in contract.get_all_case_index(caller=accounts[0]).split("|")
    assert "idx_private" in contract.get_status_case_index("submitted", caller=accounts[0]).split("|")
    assert "idx_private" in contract.get_owner_case_index(str(accounts[1]), caller=accounts[0]).split("|")
    assert contract.get_case_note_index("idx_private", caller=accounts[0]) == "idx_note"
    assert json.loads(contract.get_note("idx_note", caller=accounts[0]))["note_id"] == "idx_note"


def test_wallet_activity_and_audit_are_sender_filtered(contract, accounts):
    contract.submit_case(**{**VALID_CASE, "case_id": "activity_private", "visibility_mode": "private"}, caller=accounts[0])

    assert json.loads(contract.get_wallet_activity(str(accounts[0]), caller=accounts[1])) == []
    owner_activity = json.loads(contract.get_wallet_activity(str(accounts[0]), caller=accounts[0]))
    assert any(a["case_id"] == "activity_private" for a in owner_activity)

    assert json.loads(contract.get_case_audit_log("activity_private", caller=accounts[1])) == []
    owner_audit = json.loads(contract.get_case_audit_log("activity_private", caller=accounts[0]))
    assert any(a["case_id"] == "activity_private" for a in owner_audit)
    audit_id = owner_audit[0]["audit_id"]
    assert contract.get_audit_entry(audit_id, caller=accounts[1]) == "{}"
    assert json.loads(contract.get_audit_entry(audit_id, caller=accounts[0]))["audit_id"] == audit_id


def test_admin_stats_and_summary_require_deployer(contract, accounts):
    with pytest.raises(Exception, match="Only deployer"):
        contract.get_admin_monitor_stats(caller=accounts[1])
    with pytest.raises(Exception, match="Only deployer"):
        contract.get_contract_summary(caller=accounts[1])

    stats = json.loads(contract.get_admin_monitor_stats())
    summary = json.loads(contract.get_contract_summary())
    assert "total_cases" in stats
    assert "case_counter" in summary


def test_source_binding_normalisation_constrains_urls(contract):
    rows = contract._contract._normalise_source_bindings([
        {
            "url": "https://authority.example/recall-a",
            "issuer": "Food Safety Authority",
            "publication_date": "2026-09-12",
            "mentions_product": True,
            "mentions_batch": True,
        },
        {
            "url": "https://attacker.example/other",
            "issuer": "Injected",
            "publication_date": "2099-01-01",
            "mentions_product": True,
            "mentions_batch": True,
        },
    ], ["https://authority.example/recall-a"])

    assert rows == [{
        "url": "https://authority.example/recall-a",
        "issuer": "Food Safety Authority",
        "publication_date": "2026-09-12",
        "mentions_product": True,
        "mentions_batch": True,
    }]
    assert contract._contract._normalise_binding("conflict") == "conflict"
    assert contract._contract._normalise_binding("anything else") == "missing"
