# Smart Contracts Changelog

This document provides a detailed log of upgrades to the smart contract suite, ensuring clear tracking of changes, improvements, bug fixes, and versioning across all contracts.

## Version History

| Date                | Contract(s)                                               | Summary                                        |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| 29th August 2024    | `B3TRGovernor` version `2`                                | Updated access control modifiers               |
| 31st August 2024    | `VoterRewards` version `2`                                | Added quadratic rewarding features             |
| 4th September 2024  | `X2EarnRewardsPool` version `2`                           | Added impact key management and proof building |
| 13th September 2024 | `B3TRGovernor` version `3`, `XAllocationPool` version `2` | Added toggling of quadratic voting and funding |
| 27th September 2024 | `Emissions` version `2`                                   | Aligned emissions with the expected schedule   |

---

## Upgrade `B3TRGovernor` to Version 2 (29th August 2024)

This upgrade enhances access control by allowing the `DEFAULT_ADMIN_ROLE` to execute critical functions without requiring a governance proposal.

### Changes 🚀

- **Upgraded Contract(s):** `B3TRGovernor.sol` to version `2`

### Storage Changes 📦

- **Storage Changes:** None.

### New Features 🚀

- Updated functions previously restricted by `onlyGovernance` to use `onlyRoleOrGovernance`, permitting `DEFAULT_ADMIN_ROLE` direct access.

### Bug Fixes 🐛

- None.

### Backward Compatibility ✅

- Fully backward compatible with version 1.0.

### Migration Details 🔄

- **Deprecated Contracts:**
  - Moved previous `B3TRGovernor` contracts to [`deprecated/V1/`](contracts/deprecated/V1/) and suffixed with `V1`.
  - Moved `GovernorStorage` to [`deprecated/V1/governance`](contracts/deprecated/V1/governance/) and renamed to `GovernorStorageV1`.
  - Moved `IB3TRGovernor` to [`deprecated/V1/`](contracts/deprecated/V1/) and renamed to `IB3TRGovernorV1`.
- **Migration Scripts:**
  - Migration scripts run to preserve existing storage.
  - Added `b3tr-governor-v2.ts` script to upgrade to version 2.

### Testing Information 🧪

- **Unit Tests:**
  - All existing tests passed after migration.

---

## Upgrade `VoterRewards` to Version 2 (31st August 2024)

This upgrade adds the ability to disable quadratic rewarding for specific cycles, providing greater flexibility in reward distribution. Introduced as first step of sybil mitigation.

### Changes 🚀

- **Upgraded Contract(s):** `VoterRewards.sol` to version `2`

### Storage Changes 📦

- Added `quadraticRewardingDisabled` checkpoints to store the quadratic rewarding status for each cycle.

### New Features 🚀

- Added functions to:
  - Disable or re-enable quadratic rewarding for specific cycles.
  - Check if quadratic rewarding is disabled at a specific block number or for the current cycle.
- Added the `clock` function to get the current block number.

### Bug Fixes 🐛

- None.

### Backward Compatibility ✅

- Fully backward compatible with version 1.0.

### Migration Details 🔄

- **Deprecated Contracts:**
  - Moved previous `VoterRewards` contracts to [`deprecated/V1/`](contracts/deprecated/V1/) and suffixed with `V1`.
  - Moved `IVoterRewards` to [`deprecated/V1/`](contracts/deprecated/V1/) and renamed to `IVoterRewardsV1`.
- **Migration Scripts:**
  - Migration scripts run to preserve existing storage.
  - Added `voter-rewards-v2.ts` script to upgrade to version 2.

### Testing Information 🧪

- **Unit Tests:**
  - All tests pass after migration.
- **New Test Cases:**
  - Added tests for quadratic rewarding disabling functionality.

---

## Upgrade `X2EarnRewardsPool` to Version 2 (4th September 2024)

This upgrade introduces impact key management and the ability to build proofs of sustainable impact.

### Changes 🚀

- **Upgraded Contract(s):** `X2EarnRewardsPool.sol` to version `2`

### Storage Changes 📦

- Added `impactKeyIndex` to store allowed impact keys index for proof of sustainable impact building.
- Added `allowedImpactKeys` to store the array of allowed impact keys.

### New Features 🚀

- Introduced the `IMPACT_KEY_MANAGER_ROLE` to manage allowed impact keys.
- Introduced the `onlyRoleOrAdmin` modifier to restrict access to the `IMPACT_KEY_MANAGER_ROLE` or admin.
- Added `buildProof` function to build proof of sustainable impact.

### Bug Fixes 🐛

- None.

### Backward Compatibility ✅

- Fully backward compatible with previous versions, with the introduction of `distributeRewardDeprecated` function, which is planned to be made obsolete in future versions.

### Migration Details 🔄

- **Deprecated Contracts:**
  - Moved previous `X2EarnRewardsPool` contracts to [`deprecated/V1/`](contracts/deprecated/V1/) and suffixed with `V1`.
  - Moved `IX2EarnRewardsPool` to [`deprecated/V1/`](contracts/deprecated/V1/) and renamed to `IX2EarnRewardsPoolV1`.
- **Migration Scripts:**
  - Migration scripts run to preserve existing storage.
  - Added `x2Earn-rewards-pool-v2.ts` script to upgrade to version 2.

### Testing Information 🧪

- **Unit Tests:**
  - All existing tests passed after migration.
- **Integration Tests:**
  - Tested compatibility with dependent contracts.
- **New Test Cases:**
  - Added tests for `buildProof` functionality.
  - Added tests for impact key management.

---

## Upgrade `B3TRGovernor` to Version 3 and `XAllocationPool` to Version 2 (13th September 2024)

This upgrade adds the ability to toggle quadratic voting and quadratic funding on or off, providing greater control over governance and allocation mechanisms.

### Changes 🚀

- **Upgraded Contract(s):**
  - `B3TRGovernor.sol` to version `3`
  - `XAllocationPool.sol` to version `2`

### Storage Changes 📦

- **`B3TRGovernor.sol`**:
  - Added `quadraticVotingDisabled` checkpoints to store the quadratic voting disabled status.
- **`XAllocationPool.sol`**:
  - Added `quadraticFundingDisabled` checkpoints to store the quadratic funding disabled status.

### New Features 🚀

- **`B3TRGovernor`**:
  - Ability to toggle quadratic voting on or off.
- **`XAllocationPool`**:
  - Ability to toggle quadratic funding on or off.

### Bug Fixes 🐛

- None.

### Backward Compatibility ✅

- **`B3TRGovernor`**:
  - Fully backward compatible; voting weight is calculated based on the quadratic voting status.
- **`XAllocationPool`**:
  - Fully backward compatible; funding weight is calculated based on the quadratic funding status.

### Migration Details 🔄

- **Deprecated Contracts:**
  - Moved previous `B3TRGovernor` contracts to [`deprecated/V2/`](contracts/deprecated/V2/) and suffixed with `V2`.
  - Moved previous `XAllocationPool` contracts to [`deprecated/V1/`](contracts/deprecated/V1/) and suffixed with `V1`.
  - Moved all prior `B3TRGovernor` libraries to [`deprecated/V1/governance/libraries`](contracts/deprecated/V1/governance/libraries/) and suffixed with `V1`.
  - Moved `IB3TRGovernor` to [`deprecated/V1/`](contracts/deprecated/V1/) and renamed to `IB3TRGovernorV1`.
  - Moved `IXAllocationPool` to [`deprecated/V1/`](contracts/deprecated/V1/) and renamed to `IXAllocationPoolV1`.
- **Migration Scripts:**
  - Migration scripts run to preserve existing storage.

### Testing Information 🧪

- **Unit Tests:**
  - All existing tests passed after migration.
- **Integration Tests:**
  - Verified interaction between `B3TRGovernor` and `XAllocationPool`.
- **New Test Cases:**
  - Added tests to validate linear and quadratic voting functionality.
  - Added tests to validate linear and quadratic funding functionality.

---

## Upgrade `Emissions` to Version 2 (27th September 2024)

This upgrade aligns the emissions with the expected schedule by correcting previous configuration errors.

### Changes 🚀

- **Upgraded Contract(s):** `Emissions.sol` to version `2`

### Storage Changes 📦

- Added `_isEmissionsNotAligned` to store the emissions alignment status.

### New Features 🚀

- In `_calculateNextXAllocation` function, added logic to calculate the next X Allocation based on the emissions alignment status.

### Bug Fixes 🐛

- Corrected `xAllocationsDecay` from `912` to `12`, fixing the erroneous value set in version `1`.
- Applied a reduction of `200,000` B3TR emissions for round `14` to align with the expected emissions schedule.

### Backward Compatibility ✅

- Fully backward compatible.

### Migration Details 🔄

- **Deprecated Contracts:**
  - Moved previous `Emissions` contracts to [`deprecated/V1/`](contracts/deprecated/V1/) and suffixed with `V1`.
  - Moved `IEmissions` to [`deprecated/V1/`](contracts/deprecated/V1/) and renamed to `IEmissionsV1`.
- **Migration Scripts:**
  - Migration scripts run to preserve existing storage.

### Testing Information 🧪

- **Unit Tests:**
  - All tests passed after migration.
- **New Test Cases:**
  - Added test case: `Should perform all cycles until reaching B3TR supply cap with emissions alignment`.

---

## Glossary

- **Quadratic Voting**: A voting system where the cost of votes increases quadratically with the number of votes cast.
- **Quadratic Funding**: A funding mechanism that allocates resources based on the square of contributions received.
- **Checkpoint**: A recorded state at a specific point in time for tracking changes or status.
