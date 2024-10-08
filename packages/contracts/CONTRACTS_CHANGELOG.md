# Smart Contracts Changelog

This document provides a detailed log of upgrades to the smart contract suite, ensuring clear tracking of changes, improvements, bug fixes, and versioning across all contracts.

## Upgrade History

Every time contract(s) are upgraded, a new upgrade version is created and documented here. Each version includes a detailed list of changes, storage modifications, new features, bug fixes, backward compatibility, migration details, and testing information.
A snapshot of the contract(s) at the time of the upgrade is stored in the `deprecated` directory named with the version number of the contract(s) at the time of the upgrade.

### Upgrade `B3TRGovernor`

**Changes:**

- **Upgraded Contract(s):** `B3TRGovernor.sol` to version `2`
- **Storage Changes:** No storage changes in this version.
- **New Features:**
  - All functions which required a governance proposal through the `onlyGovernance` modifier have been updated to use the `onlyRoleOrGovernance` modifier. This allows the `DEFAULT_ADMIN_ROLE` to execute these functions without requiring a proposal.
- **Bug Fixes:** No bug fixes in this version.
- **Backward Compatibility:** Fully backward compatible.
- **Migration Details:**
  - All prior B3TRGovernor libraries moved to `deprecated/V1/governance/libraries` directory and renamed with a `V1` suffix.
  - `GovernorStorage` moved to `deprecated/V1/governance` directory and renamed to `GovernorStorageV1`.
  - `B3TRGovernor` moved to `deprecated/V1` directory and renamed to `B3TRGovernorV1`.
  - `IB3TRGovernor` moved to `deprecated/V1` directory and renamed to `IB3TRGovernorV1`.
- **Testing Information:**
  - Migration scripts run to preserve existing storage.
  - All previous contract versions tested against new versions to ensure compatibility.

---

### Upgrade `VoterRewards`

**Changes:**

- **Upgraded Contract(s):**
  - `VoterRewards.sol` to version `2`
- **Storage Changes:**
  - `VoterRewards.sol`
    - Added `quadraticRewardingDisabled` checkpoints for the quadratic rewarding status for each cycle.
- **New Features:**
  - `VoterRewards.sol`
    - Added quadratic rewarding disabled checkpoints to disable quadratic rewarding for a specific cycle.
    - Added the clock function to get the current block number.
    - Added functions to check if quadratic rewarding is disabled at a specific block number or for the current cycle.
    - Added function to disable quadratic rewarding or re-enable it.
- **Bug Fixes:** No bug fixes in this version.
- **Backward Compatibility:** Fully backward compatible.
- **Migration Details:**
  - `VoterRewards` moved to `deprecated/V1` directory and renamed to `VoterRewardsV1`.
  - `IVoterRewards` moved to `deprecated/V1` directory and renamed to `IVoterRewardsV1`.
- **Testing Information:**
  - Migration scripts run to preserve existing storage.
  - All tests pass after migration.

---

### Upgrade `X2EarnRewardsPool`

**Changes:**

- **Upgraded Contract(s):** 
  - `X2EarnRewardsPool.sol` to version `2`
- **Storage Changes:**
  - `X2EarnRewardsPool.sol`
    - Added `impactKeyIndex` to store allowed impact keys index for the proof of sustainable impact building.
    - Added `allowedImpactKeys` to store the array of allowed impact keys.
- **New Features:**
  - Introduced the `IMPACT_KEY_MANAGER_ROLE` role to manage allowed impact keys.
  - Introduced the `onlyRoleOrAdmin` modifier to restrict access to the `IMPACT_KEY_MANAGER_ROLE` role or admin.
  - Introduced `buildProof` function to build proof of sustainable impact.
- **Bug Fixes:** No bug fixes in this version.
- **Backward Compatibility:**
  - Fully backward compatible with previous versions with the introduction of `distributeRewardDeprecated` function. This function is planned to be made obsolete in future versions.
- **Migration Details:**
  - `X2EarnRewardsPool` moved to `deprecated/V1` directory and renamed to `X2EarnRewardsPoolV1`.
  - `IX2EarnRewardsPool` moved to `deprecated/V1` directory and renamed to `IX2EarnRewardsPoolV1`.
- **Testing Information:**
  - Migration scripts run to preserve existing storage.
  - All previous contract versions tested against new versions to ensure compatibility.

---

### Upgrade `B3TRGovernor`, `XAllocationPool`

**Changes:**

- **Upgraded Contract(s):** 
  - `B3TRGovernor.sol` to version `3`
  - `XAllocationPool.sol` to version `2`
- **Storage Changes:**
  - `B3TRGovernor.sol`
    - Added `quadraticVotingDisabled` checkpoints for the quadratic voting disabled status for the Governor.
  - `XAllocationPool.sol`
    - Added `quadraticFundingDisabled` checkpoints for the quadratic funding disabled status for the X Allocations Pool.
- **New Features:**
  - Ability to toggle `B3TRGovernor` quadratic voting on or off.
  - Ability to toggle `XAllocationPool` quadratic funding on or off.
- **Bug Fixes:** No bug fixes in this version.
- **Backward Compatibility:** 
  - `B3TRGovernor` fully retro-compatible with previous versions as the voting weight is calculated based on the quadratic voting status.
  - `XAllocationPool` fully retro-compatible with previous versions as the funding weight is calculated based on the quadratic funding status.
- **Migration Details:**
  - `B3TRGovernor` moved to `deprecated/V2` directory and renamed to `B3TRGovernorV2`.
  - All prior B3TRGovernor libraries moved to `deprecated/V1/governance/libraries` directory and renamed with a `V1` suffix.
  - `IB3TRGovernor` moved to `deprecated/V1` directory and renamed to `IB3TRGovernorV1`.
  - `XAllocationPool` moved to `deprecated/V1` directory and renamed to `XAllocationPoolV1`.
  - `IXAllocationPool` moved to `deprecated/V1` directory and renamed to `IXAllocationPoolV1`.
- **Testing Information:**
  - Migration scripts run to preserve existing storage.
  - All previous contract versions tested against new versions to ensure compatibility.
  - Introduced new test scenarios to validate linear voting functionality.
  - Introduced new test scenarios to validate linear funding functionality.
  - Introduced new test scenarios to validate quadratic voting functionality.
  - Introduced new test scenarios to validate quadratic funding functionality.

---

### Upgrade `Emissions`

**Changes:**

- **Upgraded Contract(s):** 
  - `Emissions.sol` to version `2`
- **Storage Changes:**
  - `Emissions.sol`
    - Added `_isEmissionsNotAligned` to store the emissions alignment status with expected emissions schedule and amounts.
- **New Features:**
  - In `_calculateNextXAllocation` function, added logic to calculate the next X Allocation based on the emissions alignment status.
- **Bug Fixes:** 
  - Sets `xAllocationsDecay` to `12` instead of `912` which was erroneously set in the deployment of `Emissions.sol` version `1`.
  - Applies a reduction of `200,000` B3TR Emissions for round `14` to align with the expected emissions schedule.
- **Backward Compatibility:** Fully backward compatible.
- **Migration Details:**
  - `Emissions` moved to `deprecated/V1` directory and renamed to `EmissionsV1`.
  - `IEmissions` moved to `deprecated/V1` directory and renamed to `IEmissionsV1`.
- **Testing Information:**
  - `Should be able to perform all cycles till reaching B3TR supply cap with Emissions alignment` test case added to validate the emissions alignment functionality with the expected emissions schedule.
