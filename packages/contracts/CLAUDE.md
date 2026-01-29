# Smart Contract Development

Instructions specific to `packages/contracts` directory.

## Stack

- Solidity 0.8.20 with Paris EVM
- Hardhat + VeChain SDK plugin
- OpenZeppelin Contracts 5.0.2 (upgradeable)
- TypeChain for type generation

## Commands

**Run all commands from monorepo root**, not from `packages/contracts`:

```bash
yarn contracts:compile          # Compile contracts
yarn contracts:test             # Run tests (Hardhat network)
yarn contracts:test:thor-solo   # Run tests (Thor solo - requires make solo-up)
yarn contracts:upgrade:<env>    # Interactive upgrade
yarn contracts:call:<env>       # Interactive contract call
yarn contracts:generate-docs    # Generate NatSpec docs
```

Run single test: `yarn contracts:test --grep "test name"`

## Contract Structure

```
contracts/
├── *.sol                    # Main contracts (current versions)
├── deprecated/V1/           # V1 contracts (reference only)
├── deprecated/V2/           # V2 contracts (reference only)
├── governance/libraries/    # Governor logic libraries
├── ve-better-passport/      # Passport contract + libraries
├── x-2-earn-apps/          # X2Earn apps modules
├── x-allocation-voting-governance/  # Allocation voting modules
├── interfaces/             # Contract interfaces
├── libraries/              # Shared libraries
└── mocks/                  # Test mocks
```

## Deployment Scripts

### Key Files to Keep in Sync

When upgrading contracts, **always update both**:

1. **`scripts/deploy/deployAll.ts`** - Production deployment
   - Used by `yarn contracts:deploy`
   - Auto-runs via `yarn dev` if contracts not deployed

2. **`test/helpers/deploy.ts`** - Test fixture deployment
   - Similar structure but with test-specific roles/variables
   - Used by all contract tests

These files must stay aligned - changes to one usually require changes to the other.

### Library Deployment

Specific scripts exist for deploying contract libraries:
- `scripts/libraries/governanceLibraries.ts`
- `scripts/libraries/passportLibraries.ts`
- `scripts/libraries/x2EarnLibraries.ts`
- `scripts/libraries/autoVotingLibraries.ts`

### Custom Proxy Deployment

**Always use helpers in `scripts/helpers/upgrades.ts`** for deployment:

```typescript
import { deployProxy, deployProxyOnly, initializeProxy, upgradeProxy } from "../helpers"

// Deploy proxy + implementation together
const contract = await deployProxy("ContractName", [initArg1, initArg2])

// Or deploy proxy first, then initialize separately
const proxy = await deployProxyOnly("ContractName")
await initializeProxy("ContractName", await proxy.getAddress(), [initArg1, initArg2])

// Upgrade existing contract
const upgraded = await upgradeProxy("OldVersion", "NewVersion", proxyAddress, [reinitArgs], { version: N })
```

## Upgrade Rules

### CRITICAL: Storage Safety

- **NEVER modify existing storage variable order** - causes storage collision
- **NEVER remove storage variables** - only add new ones at the end
- **NEVER change types of existing variables**
- Use storage gaps for future upgrades: `uint256[50] private __gap;`
- After adding new storage, reduce gap: `uint256[49] private __gap;`

### Version Pattern

1. Copy current contract to `deprecated/V{N}/` before modifying
2. Increment `version()` return value
3. Create upgrade script: `scripts/upgrade/upgrades/{contract}/{contract}-v{N}.ts`
4. Register in `scripts/upgrade/upgradesConfig.ts` for CLI selection
5. Update `scripts/deploy/deployAll.ts` with new deployment logic
6. Update `test/helpers/deploy.ts` to mirror deployment changes
7. Create upgrade test: `test/{contract}/v{N}-upgrade.test.ts`
8. Create compatibility test: `test/{contract}/v{N}-compatibility.test.ts`

### CLI Upgrade System

Upgrades are executed via interactive CLI:

```bash
yarn contracts:upgrade:<env>  # env: local, testnet-staging, testnet, mainnet
```

This runs `scripts/upgrade/select-and-upgrade.ts` which reads from `upgradesConfig.ts` to present available upgrades.

### Upgrade Script Template

```typescript
import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { ethers } from "hardhat"

async function main() {
  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  // Check current version
  const contract = await ethers.getContractAt("ContractName", config.contractAddress)
  const currentVersion = await contract.version()
  console.log("Current version:", currentVersion)

  // Upgrade
  const upgraded = await upgradeProxy(
    "ContractNameV{N-1}",  // Previous version
    "ContractName",        // New version
    config.contractAddress,
    [initArg1, initArg2],  // reinitializer args
    { version: N }
  )

  // Verify
  const newVersion = await upgraded.version()
  if (parseInt(newVersion) !== N) throw new Error("Upgrade failed")
}
```

### Reinitializer Pattern

Use `reinitializer(N)` for upgrade initialization:

```solidity
function initializeV2(address newParam) public reinitializer(2) {
    _newStorage = newParam;
}
```

## Test Writing Guide

### Running Tests

Run single test file from monorepo root:
```bash
yarn contracts:test --grep "test name"
```

Or directly (from `packages/contracts`):
```bash
NEXT_PUBLIC_APP_ENV=local npx hardhat test --network hardhat test/YourTest.test.ts
```

### Test File Naming

- `{Contract}.test.ts` - Main contract tests
- `{contract}/v{N}-upgrade.test.ts` - Upgrade tests
- `{contract}/v{N}-compatibility.test.ts` - Backward compatibility tests
- `{contract}/{feature}.test.ts` - Feature-specific tests

### Helper Functions

Import from `./helpers`:

```typescript
import {
  getOrDeployContractInstances,
  bootstrapAndStartEmissions,
  waitForRoundToEnd,
  waitForNextCycle,
  getVot3Tokens,
  endorseApp,
} from "./helpers"
```

### Upgrade Test Pattern

```typescript
describe("ContractName V{N} Upgrade", () => {
  it("should upgrade from V{N-1} to V{N}", async () => {
    // Deploy V{N-1}
    const v1 = await deployProxy("ContractNameV{N-1}", [...])

    // Upgrade to V{N}
    const v2 = await upgradeProxy("ContractNameV{N-1}", "ContractName", await v1.getAddress(), [...])

    // Verify state preserved
    expect(await v2.existingData()).to.equal(expectedValue)

    // Verify new functionality
    expect(await v2.newFunction()).to.equal(expectedResult)
  })
})
```

## Common Patterns & Gotchas

### Creating X2Earn Apps

Each app requires a **unique creator** with their own **X2EarnCreator NFT**:

```typescript
// WRONG - one creator can only create one app
await x2EarnCreator.safeMint(owner.address)
await x2EarnApps.connect(owner).submitApp(owner.address, owner.address, "App1", "uri")
await x2EarnApps.connect(owner).submitApp(owner.address, owner.address, "App2", "uri") // FAILS!

// CORRECT - each app needs different creator with own NFT
const appCreator1 = otherAccounts[10]
const appCreator2 = otherAccounts[11]

await x2EarnCreator.safeMint(appCreator1.address)
await x2EarnCreator.safeMint(appCreator2.address)

await x2EarnApps.connect(appCreator1).submitApp(appCreator1.address, appCreator1.address, "App1", "uri")
await x2EarnApps.connect(appCreator2).submitApp(appCreator2.address, appCreator2.address, "App2", "uri")

// Don't forget to endorse apps (use different endorsers)
await endorseApp(app1Id, otherAccounts[12])
await endorseApp(app2Id, otherAccounts[13])
```

### Claiming Rewards - Cycle Must Be Ended

Rewards can only be claimed **after the cycle ends**:

```typescript
// Start round and vote
await bootstrapAndStartEmissions()
const roundId = await xAllocationVoting.currentRoundId()
// ... voting happens ...

// Wait for round to end
await waitForRoundToEnd(Number(roundId))

// Distribute emissions (starts new cycle)
await emissions.connect(minterAccount).distribute()

// Claim for the ENDED cycle (roundId), not getCurrentCycle()
// getCurrentCycle() returns the NEW cycle that just started
const cycleToClaimFor = roundId
await voterRewards.claimReward(cycleToClaimFor, voter.address)
```

### X2EarnCreator NFT - Check Before Minting

```typescript
// Prevent "AlreadyOwnsNFT" error
if ((await x2EarnCreator.balanceOf(user.address)) === 0n) {
  await x2EarnCreator.connect(owner).safeMint(user.address)
}
```

### Voting Power at Snapshot

For voting and rewards, power is measured at the **round snapshot**, not current block:

```typescript
const snapshot = await xAllocationVoting.roundSnapshot(roundId)
const votingPower = await navigator.getNavigatorVotingPower(navigatorAddress, snapshot)
```

### Personhood Checks

Some functions require whitelisting in VeBetterPassport:

```typescript
await veBetterPassport.connect(owner).whitelist(voter.address)
await veBetterPassport.connect(owner).toggleCheck(1) // Enable whitelist check
```

## Debugging Tips

- Add `console.log` statements liberally to understand flow
- Use `describe.only()` to run single test suite
- Check role assignments if getting "AccessControl" errors
- Verify contract addresses are set correctly before operations

## Code Style

### NatSpec Documentation

All public/external functions require NatSpec:

```solidity
/// @notice Brief description
/// @dev Implementation details
/// @param paramName Parameter description
/// @return Description of return value
function myFunction(uint256 paramName) external returns (uint256) {
```

### Events

Emit events for all state changes:

```solidity
event ActionPerformed(address indexed user, uint256 amount);

function performAction(uint256 amount) external {
    // ... logic
    emit ActionPerformed(msg.sender, amount);
}
```

### Access Control

Use OpenZeppelin AccessControl roles:

```solidity
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

function adminOnly() external onlyRole(ADMIN_ROLE) {
```

### Error Handling

Use custom errors (gas efficient):

```solidity
error InvalidAmount(uint256 provided, uint256 minimum);

function deposit(uint256 amount) external {
    if (amount < MIN_AMOUNT) revert InvalidAmount(amount, MIN_AMOUNT);
}
```

## Libraries Pattern

External libraries for code reuse and size reduction:

```solidity
// libraries/MyLogic.sol
library MyLogic {
    function calculate(uint256 a) internal pure returns (uint256) {
        return a * 2;
    }
}

// Contract.sol
import { MyLogic } from "./libraries/MyLogic.sol";

contract MyContract {
    using MyLogic for uint256;

    function doCalc(uint256 x) external pure returns (uint256) {
        return x.calculate();
    }
}
```

Deploy libraries separately and link during upgrade.

## Slither

Slither runs in CI on contract changes. Mark false positives in `slither.config.json`:

```json
{
  "suppressions": [{
    "check": "reentrancy-eth",
    "file": "contracts/MyContract.sol",
    "function": "myFunction(uint256)",
    "reason": "CEI pattern followed"
  }]
}
```
