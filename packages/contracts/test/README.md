# Smart Contract Tests

Each test describe block is marked with a shard name. This is needed to split large test suites into smaller, parallel runs for faster CI execution and to prevent timeouts.

## Active Shards

The following shards are currently active:

```
shard0  shard2  shard3a shard3b  shard4  shard4a shard4b shard4c shard4d shard4e
shard5  shard6  shard7  shard8  shard8a shard8b shard8c shard9  shard10 shard11
shard12 shard13 shard14 shard15 shard16 shard17a shard17b
```

## Shard Assignments

- **shard0**: B3TR Token, B3TR Multi Sig
- **shard2**: Emissions
- **shard3a**: (available for assignment)
- **shard3b**: Galaxy Member
- **shard4**: Governor and TimeLock (main governance tests)
- **shard4a**: Governance - Voting power with proposal deposit
- **shard4b**: Governance - Milestone Creation
- **shard4c**: Governance - Proposer requirement
- **shard4d**: Governance - Compatibility & Thresholds
- **shard4e**: Governance - Upgrades
- **shard5**: Node Management (skipped)
- **shard6**: TimeLock
- **shard7**: Treasury
- **shard8**: VeBetterPassport
- **shard8a**: VeBetterPassport Upgrade
- **shard8b**: VeBetterPassport Signaling
- **shard8c**: VeBetterPassport Reset Signal Count
- **shard9**: VOT3
- **shard10**: VoterRewards
- **shard11**: X2EarnCreator
- **shard12**: X2EarnRewardsPool
- **shard13**: X-Allocation Pool
- **shard14**: X-Allocation Voting
- **shard15**: X-Apps
- **shard16**: VeBetterPassport (additional tests)
- **shard17a**: X-Apps (additional tests)
- **shard17b**: X-Apps (additional tests)

When adding new tests, assign them to an appropriate shard to maintain balanced execution times across all shards.
