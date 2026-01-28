# Navigator POC Implementation

## Overview

The **Navigator Role** allows users to delegate their x-allocation voting power to trusted navigators who vote on their behalf. This is a Proof of Concept implementation.

---

## Core Contracts

### Navigator.sol (NEW)

Location: `/packages/contracts/contracts/Navigator.sol`

Standalone UUPS upgradeable contract managing:

- Navigator registration with profile (IPFS CID) and fee percentage
- VOT3 staking to define delegation capacity (stake × ratio = capacity)
- Aggregate voting power using `Checkpoints.Trace208` (O(1) lookups, no loops)
- `refreshDelegation()` to sync if delegator's VOT3 balance changes
- Fee recording for locked fees per round

**Key storage:**

- `navigatorVotingPower[navigator]` - checkpointed aggregate power
- `delegationCheckpoints[user]` - which navigator user was delegated to at timepoint
- `delegatedAmount[user]` - amount user delegated (for accurate removal)

**Note:** Personhood verification was removed from delegation - delegators no longer need to be verified persons.

### XAllocationVotingGovernor.sol (MODIFIED - V9)

- Added `castVoteAsNavigator()` - navigators vote with aggregate power
- Added `_countNavigatorVote()` - calls vote counting + navigator reward registration
- Blocked delegated users from voting directly (`DelegatedToNavigator` error)
- Blocked delegated users from auto-voting (delegation takes precedence)

### XAllocationVoting.sol (MODIFIED - V9)

- Added `initializeV9(INavigator _nav, IB3TRGovernor _b3trGovernor)` reinitializer
  - Sets both Navigator and B3TRGovernor (required for vote counting)
- **Size optimization:** Removed contract address setters (under 24 KiB limit)
- Removed `CONTRACTS_ADDRESS_MANAGER_ROLE` and individual setters

### VoterRewards.sol (MODIFIED - V7)

- `registerNavigatorVote()` - tracks navigator's total power per cycle
- `claimDelegatorReward()` - delegators claim proportional share of navigator rewards
- `setNavigator()` - sets the Navigator contract address

**Reward flow:** Navigator votes → rewards registered under navigator → delegators claim proportionally → navigator fee deducted at claim time → fee sent to Navigator contract

### ExternalContractsUpgradeable.sol (MODIFIED)

- Removed internal setter functions and events (size optimization)
- Kept only getters
- Added `_navigator` storage field

### Interfaces (NEW/MODIFIED)

- `INavigator.sol` - Full interface for Navigator contract (removed `NotAPerson` error)
- `IVoterRewards.sol` - Added `registerNavigatorVote()`, `claimDelegatorReward()`
- `IXAllocationVotingGovernor.sol` - Added `DelegatedToNavigator` error, `NavigatorVoteCast` event

---

## Design Decisions

| Aspect | Decision |
|--------|----------|
| **Voting model** | Aggregate power - navigator casts single vote with total delegated power |
| **Reward ownership** | Delegators own rewards - claim via `claimDelegatorReward()` |
| **Navigator fee** | Deducted at delegator claim time, sent to Navigator contract |
| **Gas efficiency** | O(1) checkpoint lookups, no loops over delegators |
| **Personhood** | NOT required for delegation (removed) |
| **Unstake protection** | Navigators cannot unstake below capacity needed for delegations |

---

## Checkpoint Design (Timing Edge Cases)

All voting power and delegation lookups use **round snapshot** (block at round start). This ensures:

| Scenario | Behavior |
|----------|----------|
| **Delegation AFTER round snapshot** | User can vote directly; navigator power excludes them |
| **Delegation removed mid-round** | User still blocked (snapshot shows delegated); navigator keeps power |
| **VOT3 balance change after delegation** | Power at snapshot is what counts for voting/rewards |

**Implementation verification:**

| Check | Location | Uses Snapshot |
|-------|----------|---------------|
| `getNavigatorAtTimepoint(user, snapshot)` | XAllocationVotingGovernor L141, L166 | ✅ |
| `getNavigatorVotingPower(nav, snapshot)` | XAllocationVotingGovernor L223 | ✅ |
| `getNavigatorAtTimepoint(delegator, snapshot)` | VoterRewards L506 | ✅ |
| `getVotes(delegator, snapshot)` | VoterRewards L512 | ✅ |

---

## Setup Requirements

When setting up Navigator in tests or deployment:

```solidity
// 1. Deploy Navigator
navigator = deployProxy("Navigator", [...]);

// 2. Set Navigator on XAllocationVoting via initializeV9
// IMPORTANT: Also pass b3trGovernor address (required for vote counting)
xAllocationVoting.initializeV9(navigatorAddress, b3trGovernorAddress);

// 3. Set Navigator on VoterRewards
voterRewards.setNavigator(navigatorAddress);
```

---

## File Structure

```
packages/contracts/contracts/
├── Navigator.sol                    # NEW
├── XAllocationVoting.sol            # MODIFIED (V9)
├── VoterRewards.sol                 # MODIFIED (V7)
├── interfaces/
│   ├── INavigator.sol               # NEW
│   ├── IVoterRewards.sol            # MODIFIED
│   └── IXAllocationVotingGovernor.sol # MODIFIED
└── x-allocation-voting-governance/
    ├── XAllocationVotingGovernor.sol # MODIFIED
    └── modules/
        └── ExternalContractsUpgradeable.sol # MODIFIED

packages/contracts/test/
├── Navigator.test.ts                # NEW
└── helpers/
    └── deploy.ts                    # MODIFIED
```

---

## Test Coverage

The `Navigator.test.ts` covers the full flow:

1. Navigator registration & staking
2. Delegators delegate to navigator
3. Start voting round
4. **Delegators cannot vote directly** (reverts with `DelegatedToNavigator`)
5. **Delegators cannot use auto-voting** (reverts with `AutoVotingNotEnabled` or `DelegatedToNavigator`)
6. Navigator votes with aggregate power via `castVoteAsNavigator`
7. Round ends & emissions distributed
8. Delegators claim rewards via `claimDelegatorReward`
9. Navigator fee is automatically collected during delegator claims

---

## Commands

```bash
# Compile contracts
yarn contracts:compile

# Run Navigator tests
cd packages/contracts
NEXT_PUBLIC_APP_ENV=local npx hardhat test --network hardhat test/Navigator.test.ts
```

---

## Implementation Plan (TODO)

### Phase 1: Core Fixes (Required for Production)

#### 1. `refreshDelegation()` - Only Allow Decrease

**Current:** Allows both increase and decrease of delegated power.
**Desired:** Only decrease (when user loses VOT3).

**Option A - In Navigator.sol:**
```solidity
function refreshDelegation(address user) external {
    // ... existing code ...
    require(newAmount <= oldAmount, "Navigator: use delegateTo to increase");
    // ... rest of code ...
}
```

**Option B - In VOT3.sol (preferred):**
Add hook to block transfer/conversion of delegated VOT3:
```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal {
    if (from != address(0)) { // not minting
        uint256 delegated = navigator.getDelegatedAmount(from);
        uint256 available = balanceOf(from) - delegated;
        require(amount <= available, "VOT3: cannot transfer delegated amount");
    }
}
```

#### 2. Auto-voting + Delegation Interaction

**Current:** User with auto-voting enabled can delegate (no check).
**Desired:** Disable auto-voting when delegating.

**Implementation in Navigator.delegateTo():**
```solidity
function delegateTo(address navigator) external override {
    NavigatorStorage storage $ = _getNavigatorStorage();
    
    // Disable auto-voting if enabled
    if ($.xAllocationVotingContract.isAutoVotingEnabled(msg.sender)) {
        // Option 1: Revert
        revert AutoVotingMustBeDisabled();
        
        // Option 2: Auto-disable (requires interface change)
        // $.xAllocationVotingContract.disableAutoVotingFor(msg.sender);
    }
    
    // ... rest of existing code ...
}
```

**Note:** XAllocationVoting needs `isAutoVotingEnabled(address)` getter if not exists.

### Phase 2: Edge Case Handling

#### 3. Minimum Delegation Amount

Prevent dust delegations that result in 0 rewards:

```solidity
uint256 public constant MIN_DELEGATION = 1e18; // 1 VOT3

function delegateTo(address navigator) external override {
    // ...
    uint256 userVotingPower = $.vot3Token.balanceOf(msg.sender);
    require(userVotingPower >= MIN_DELEGATION, "Navigator: below minimum");
    // ...
}
```

#### 4. Navigator Deactivation Handling

When navigator goes inactive, delegators should be able to:
- ✅ `removeDelegation()` - already works
- ❓ `refreshDelegation()` - consider blocking on inactive navigator

```solidity
function refreshDelegation(address user) external {
    // ...
    require($.navigators[currentNavigator].active, "Navigator: navigator inactive");
    // ...
}
```

### Phase 3: Additional Considerations

#### 5. Fee Lock Validation

Ensure `feeLockRounds` cannot be set to 0 by governance:

```solidity
function setFeeLockRounds(uint256 newFeeLockRounds) external onlyRole(GOVERNANCE_ROLE) {
    require(newFeeLockRounds > 0, "Navigator: fee lock must be > 0");
    // ...
}
```

#### 6. Navigator Fee Cap Enforcement

Consider minimum delegator reward (e.g., navigator fee cannot exceed 90%):

```solidity
uint256 public constant MAX_NAVIGATOR_FEE = 9000; // 90%

function registerNavigator(string calldata profile, uint256 feePercentage) external {
    require(feePercentage <= MAX_NAVIGATOR_FEE, "Navigator: fee too high");
    // ...
}
```

---

## Gas Consumption Analysis

### Safe Operations (O(1) or O(log n)):

| Operation | Complexity | Reason |
|-----------|------------|--------|
| `delegateTo()` | O(1) | Single checkpoint push, no loops |
| `removeDelegation()` | O(1) | Single checkpoint push |
| `refreshDelegation()` | O(1) | Balance read + checkpoint update |
| `claimDelegatorReward()` | O(log n) | Checkpoint lookups via `upperLookupRecent` |
| `getNavigatorVotingPower()` | O(log n) | Checkpoint binary search |

**Key safety:** No loops over delegators. Navigator with 10,000 delegators still has O(1) vote cost.

### Potential Concern - Vote Counting:

`_countVote()` in `RoundVotesCountingUpgradeable.sol` has **O(n²)** duplicate check:

```solidity
for (uint256 i; i < apps.length; i++) {
    for (uint256 j; j < i; j++) {
        if (apps[i] == apps[j]) revert DuplicateAppVote();
    }
}
```

| # Apps | Loop Iterations | Risk |
|--------|----------------|------|
| 5 | 10 | ✅ Safe |
| 20 | 190 | ⚠️ Medium |
| 50 | 1,225 | ⚠️ High |
| 100 | 4,950 | ❌ OOG risk |

### Recommendations:

#### 1. Add App Limit Per Vote (if not exists)

```solidity
uint256 public constant MAX_APPS_PER_VOTE = 20;

function castVoteAsNavigator(...) public virtual {
    require(appIds.length <= MAX_APPS_PER_VOTE, "Too many apps");
    // ...
}
```

#### 2. Optimize Duplicate Check (O(n²) → O(n))

Replace nested loops with bitmap or mapping:

```solidity
function _countVote(...) internal virtual override {
    // O(n) duplicate check using transient mapping
    mapping(bytes32 => bool) storage seen = ...; // or use bitmap
    for (uint256 i; i < apps.length; i++) {
        require(!seen[apps[i]], "DuplicateAppVote");
        seen[apps[i]] = true;
        // ... rest of logic
    }
}
```

---

## Known Issues / Current Status

| Issue | Status | Priority |
|-------|--------|----------|
| Contract size ~23.9 KiB | ⚠️ Tight | Low |
| Deploy scripts need update for `initializeV9` | ❌ Not done | Medium |
| `refreshDelegation` allows increases | ❌ Not done | High |
| Auto-voting not disabled on delegation | ❌ Not done | High |
| VOT3 transfer of delegated amount | ❌ Not done | High |
| Minimum delegation amount | ❌ Not done | Medium |
| Fee lock = 0 protection | ❌ Not done | Medium |
| App limit per vote (gas) | ❓ Check if exists | Medium |
| O(n²) duplicate check optimization | ❌ Not done | Low |
