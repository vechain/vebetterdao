// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

/// @title NavigatorStorageTypes
/// @notice Defines storage types and ERC-7201 namespaced getter for the NavigatorRegistry system.
/// @dev Single namespace for all navigator state. Field order MUST NOT change across upgrades.
library NavigatorStorageTypes {
  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.NavigatorRegistry")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant NavigatorStorageLocation =
    0x2556f61b975c74e3f128bbc478158bc306f6253c34d95084531f202ce74e5700;

  struct NavigatorStorage {
    // ======================== Staking ======================== //
    // navigator => staked B3TR amount
    mapping(address => uint256) stakedAmount;
    // minimum B3TR to register as navigator (default: 50000e18)
    uint256 minStake;
    // max stake as basis points of VOT3 total supply (default: 100 = 1%)
    uint256 maxStakePercentage;
    // total B3TR staked across all navigators
    uint256 totalStaked;
    // B3TR token address (for stake transfers)
    address b3trToken;
    // VOT3 token address (for supply cap check and delegation)
    address vot3Token;
    // treasury address (receives slashed funds)
    address treasury;

    // ======================== Delegation ======================== //
    // citizen => navigator they delegated to
    mapping(address => address) citizenToNavigator;
    // citizen => checkpointed VOT3 delegation amount (current via latest(), past via upperLookupRecent)
    mapping(address => Checkpoints.Trace208) delegatedAmount;
    // navigator => total VOT3 delegated to them
    mapping(address => uint256) totalDelegatedToNavigator;
    // navigator => list of citizens delegating to them
    mapping(address => address[]) navigatorCitizens;
    // navigator => citizen => index in navigatorCitizens array (+ 1, so 0 means not present)
    mapping(address => mapping(address => uint256)) citizenIndex;
    // citizen => navigator pending for next round (address(0) = no pending change)
    mapping(address => address) pendingNavigator;
    // citizen => pending delegation amount for next round
    mapping(address => uint256) pendingDelegatedAmount;
    // round ID when delegation snapshots were last taken
    uint256 lastSnapshotRound;

    // ======================== Voting Decisions ======================== //
    // navigator => round => app preferences (bytes32[] of app IDs)
    mapping(address => mapping(uint256 => bytes32[])) roundAppPreferences;
    // navigator => round => allocation percentage per app in basis points (must sum to 10000)
    mapping(address => mapping(uint256 => uint256[])) roundAppPercentages;
    // navigator => proposalId => vote decision (0=not set, 1=Against, 2=For, 3=Abstain)
    // Offset by 1 so 0 means "decision not set"
    mapping(address => mapping(uint256 => uint8)) proposalDecision;
    // navigator => round => whether allocation preferences were set for this round
    mapping(address => mapping(uint256 => bool)) preferencesSet;
    // navigator => round => block number when preferences were set (0 = not set)
    mapping(address => mapping(uint256 => uint256)) preferencesSetBlock;
    // blocks before round deadline by which preferences must be set (default: 8640 = ~24hr at 10s/block)
    uint256 preferenceCutoffPeriod;

    // ======================== Fees ======================== //
    // navigator => round => accumulated fee amount (B3TR)
    mapping(address => mapping(uint256 => uint256)) roundFees;
    // number of rounds fees are locked before claimable (default: 4)
    uint256 feeLockPeriod;
    // navigator fee percentage in basis points (default: 2000 = 20%)
    uint256 feePercentage;
    // navigator => whether all unclaimed fees have been forfeited (major slash)
    mapping(address => bool) feesForfeited;

    // ======================== Slashing ======================== //
    // navigator => total amount slashed over lifetime
    mapping(address => uint256) totalSlashed;
    // minor slash percentage in basis points (default: 1000 = 10% of current stake)
    uint256 minorSlashPercentage;
    // navigator => round => slashed for missed allocation vote
    mapping(address => mapping(uint256 => bool)) slashedForMissedAllocationVote;
    // navigator => proposalId => slashed for missed governance vote
    mapping(address => mapping(uint256 => bool)) slashedForMissedGovernanceVote;
    // navigator => round => slashed for stale preferences (no update >= 3 rounds)
    mapping(address => mapping(uint256 => bool)) slashedForStalePreferences;
    // navigator => round => slashed for missed report
    mapping(address => mapping(uint256 => bool)) slashedForMissedReport;
    // navigator => round => slashed for late preferences (set after cutoff)
    mapping(address => mapping(uint256 => bool)) slashedForLatePreferences;

    // ======================== Lifecycle ======================== //
    // navigator => whether registered (active or in exit process)
    mapping(address => bool) isRegistered;
    // navigator => whether deactivated by governance
    mapping(address => bool) isDeactivated;
    // navigator => round when exit was announced (0 = not exiting)
    mapping(address => uint256) exitAnnouncedRound;
    // number of rounds for exit notice period (default: 1)
    uint256 exitNoticePeriod;

    // ======================== Profile & Reports ======================== //
    // navigator => metadata URI (IPFS or similar)
    mapping(address => string) metadataURI;
    // navigator => round of last report submission
    mapping(address => uint256) lastReportRound;
    // navigator => latest report metadata URI
    mapping(address => string) lastReportURI;
    // number of rounds between required reports (default: 2)
    uint256 reportInterval;

    // ======================== External Contracts ======================== //
    // XAllocationVoting contract address (for round/snapshot queries)
    address xAllocationVoting;
    // RelayerRewardsPool contract address (for preferredRelayer management)
    address relayerRewardsPool;
    // VoterRewards contract address (only this address can deposit navigator fees)
    address voterRewards;
  }

  /// @notice Returns the navigator storage slot
  /// @return $ The NavigatorStorage struct at the namespaced storage slot
  function getNavigatorStorage() internal pure returns (NavigatorStorage storage $) {
    assembly {
      $.slot := NavigatorStorageLocation
    }
  }
}
