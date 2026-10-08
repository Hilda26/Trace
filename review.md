# TRACE Review Response

## Reviewer Feedback

The team reported that the dashboard loaded infinitely and that there was no clear place in the UI for a case owner to request a review after submitting a case.

## Fixes Implemented

- Fixed the owner dashboard loading flow so wallet and private contract read failures no longer leave the page stuck in an infinite loading state.
- Added error handling and final loading cleanup around dashboard case retrieval.
- Added a visible `Request Review` button on dashboard case cards for submitted cases that do not yet have a verdict.
- Added a post-submission `Request Review` call to action after a case is submitted, with a direct link into the case room.
- Updated the case room loading flow so private reads resolve cleanly with either case data, access messaging, or a visible error.
- Renamed the case-room action from `Request Verdict` to `Request Review` so the user flow matches the product/reviewer language.
- Kept the case room owner-only, matching the current contract authorization rules.

## GenLayer / Contract Notes

- The safety verdict path remains contract-driven through `request_safety_verdict`.
- Deployer verdict override language was removed from the contract comment surface.
- Existing privacy and provenance tests remain in place for sender-filtered private views, note visibility, deployer-only admin reads, and source-binding normalization.

## Verification

The following checks passed locally:

```bash
genvm-lint check contract\trace.py --json
pytest contract\tests -v -p no:cacheprovider
npm run build
```

Results:

- GenVM lint passed.
- Direct contract tests passed: 19/19.
- Production Next.js build passed.

## Commit

Implemented and pushed in commit:

```text
11086b6 Fix review request dashboard flow
```