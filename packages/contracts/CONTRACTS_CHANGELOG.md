# Smart Contracts Changelog

This document provides a detailed log of upgrades to the smart contract suite, ensuring clear tracking of changes, improvements, bug fixes, and versioning across all contracts.

## Upgrade History

Every time contract(s) are upgraded, a new upgrade version is created and documented here. Each version includes a detailed list of changes, storage modifications, new features, bug fixes, backward compatibility, migration details, and testing information.
A snapshot of the contract(s) at the time of the upgrade is stored in the `deprecated` directory named with the version number of the contract(s) at the time of the upgrade.

### Upgrade `B3TRGovernor`

**Changes:**

- **Upgraded Contract(s):** `B3TRGovernor.sol`
- **Storage Changes:** No storage changes in this version.
- **New Features:**
  - All functions which required a governance proposal through the `onlyGovernance` modifier have been updated to use the `onlyRoleOrGovernance` modifier. This allows the `DEFAULT_ADMIN_ROLE` to execute these functions without requiring a proposal.
- **Bug Fixes:** No bug fixes in this version.
- **Backward Compatibility:** Fully backward compatible.
- **Migration Details:**
  - All prior contract versions moved to `deprecated/V1` directory.
  - Import statements updated to reflect the new contract versions.
- **Testing Information:**
  - Migration scripts run to preserve existing storage.
  - All previous contract versions tested against new versions to ensure compatibility.
- **Current Upgraded Contract Versions:** 
  - `B3TRGovernor.sol` - `version 2`

---

### Upgrade `VoterRewards`

**Changes:**

- **Upgraded Contract(s):**
  - `VoterRewards.sol`
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
  - All prior contract versions moved to `deprecated/V2` directory.
  - Import statements in associated contracts have been updated to reflect version suffixes.
- **Testing Information:**
  - Migration scripts run to preserve existing storage.
  - All tests pass after migration.
- **Current Upgraded Contract Versions:** 
  - `B3TRGovernor.sol` - `version 2`
  - `VoterRewards.sol` - `version 2`

---

### Upgrade `X2EarnRewardsPool`

**Changes:**

- **Upgraded Contract(s):** `X2EarnRewardsPool.sol`
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
  - All prior contract versions moved to `deprecated/V3` directory.
  - Import statements updated to reflect the new contract versions.
- **Testing Information:**
  - Migration scripts run to preserve existing storage.
  - All previous contract versions tested against new versions to ensure compatibility.
- **Current Upgraded Contract Versions:** 
  - `B3TRGovernor.sol` - `version 2`
  - `VoterRewards.sol` - `version 2`
  - `X2EarnRewardsPool.sol` - `version 2`

---
