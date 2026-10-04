# Trace Review Response

In response to the Signalock review, Trace was updated to harden privacy, provenance, and authorization across the contract and frontend.

Private case data is now consistently protected across getters, indexes, notes, wallet activity, and audit logs. Users can only see public cases or their own private records, and private notes are filtered according to the case and note visibility rules.

Verdict generation was also tightened. GenLayer consensus now treats owner-submitted text as claims to verify, not proof. Safety verdicts are bound to retrieved public evidence through product and batch binding, source issuer, publication date, and per-source product/batch mention flags.

Image URLs and private evidence commitment hashes are no longer implied as adjudicated safety evidence. They are recorded as case context and explicitly excluded from the current safety verdict unless a future adjudication path is added.

The deployer verdict override was removed so safety verdicts must be produced through GenLayer consensus. Admin monitor access was aligned with contract authorization and is deployer-only, read-only observability.

The frontend was updated to match these contract rules, including connected-wallet reads for authorized views, revised evidence wording, source provenance display, and corrected owner/admin access claims.

Focused tests were added for private index filtering, note visibility, wallet activity filtering, audit access, admin-only reads, removal of the deployer override, and source binding normalization.

Verification completed locally:

- `python -m pytest contract/tests/test_trace.py` passed with 19 tests.
- `npx tsc --noEmit` passed.
- A walkthrough video was added at `public/trace-walkthrough.webm`.

Committed and pushed:

- `81f6537 Harden Trace privacy and provenance`
