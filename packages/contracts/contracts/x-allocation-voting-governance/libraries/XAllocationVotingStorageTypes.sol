// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { IERC5805 } from "@openzeppelin/contracts/interfaces/IERC5805.sol";
import { IEmissions } from "../../interfaces/IEmissions.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { IVeBetterPassport } from "../../interfaces/IVeBetterPassport.sol";
import { IB3TRGovernor } from "../../interfaces/IB3TRGovernor.sol";
import { IRelayerRewardsPool } from "../../interfaces/IRelayerRewardsPool.sol";

/// @title XAllocationVotingStorageTypes
/// @notice Defines all storage types and getters for the XAllocationVoting system.
/// @dev Uses ERC-7201 namespaced storage pattern. Slot constants MUST NOT change across upgrades.
library XAllocationVotingStorageTypes {
  // ======================== Storage Location Constants ======================== //

  bytes32 private constant GovernorStorageLocation =
    0x7fb63bcd433c69110ad961bfbe38aef51814cbb9e11af6fe21011ae43fb4be00;
  bytes32 private constant VotingSettingsStorageLocation =
    0xd69d068053671881d25a4d751dcad1e692749d9b24184f608cb1d01af3a99900;
  bytes32 private constant VotesStorageLocation =
    0x6eb1bf0a160cdf1b5e63f5e5c6b310f6c2542cd9e2a47ff1bc977c526dfab500;
  bytes32 private constant VotesQuorumFractionStorageLocation =
    0x49d99284d013647f52e2a267fd5944583bd36be17443e784ec3e86bbd4c32400;
  bytes32 private constant RoundVotesCountingStorageLocation =
    0xa760c041d4a9fa3a2c67d0d325f3592ba2c7e4330f7ba2283ebf9fe63913d500;
  bytes32 private constant EarningsSettingsStorageLocation =
    0xc74db4e191410c7a6c18f14684e1218b5e87c449d0f81ab47e8c67bf971c3500;
  bytes32 private constant RoundFinalizationStorageLocation =
    0x7dd3251b9882a8b07dc283a0b43197aa2be3a6af1a7f0284070fe5d86e502500;
  bytes32 private constant RoundsStorageStorageLocation =
    0x0f5210c47c3bb73c471770a1cbb5b7ddc03c0ec886694cc17ae21d1f595f1900;
  bytes32 private constant ExternalContractsStorageLocation =
    0x1da8cbbb2b12987a437595605432a6bbe84c08e9685afaaee593f05659f50d00;
  bytes32 private constant AutoVotingStorageLocation =
    0x38ba4d920474025bc119851d51630794ab25dc91b5f613afc3c0e85f09fdc100;

  // ======================== Storage Structs ======================== //

  struct GovernorStorage {
    string _name;
  }

  struct VotingSettingsStorage {
    uint32 _votingPeriod;
  }

  struct VotesStorage {
    IERC5805 _token;
  }

  struct VotesQuorumFractionStorage {
    Checkpoints.Trace208 _quorumNumeratorHistory;
  }

  struct RoundVote {
    // Total votes received for each app
    mapping(bytes32 appId => uint256) votesReceived;
    // Total votes received for each app in quadratic funding
    mapping(bytes32 appId => uint256) votesReceivedQF; // ∑(sqrt(votes)) -> sqrt(votes1) + sqrt(votes2) + ...
    // Total votes cast in the round
    uint256 totalVotes;
    // Total votes cast in the round in quadratic funding
    uint256 totalVotesQF; // ∑(∑sqrt(votes))^2 -> (sqrt(votesAppX1) + sqrt(votesAppX2) + ...)^2 + (sqrt(votesAppY1) + sqrt(votesAppY2) + ...)^2 + ...
    // Mapping to store if a user has voted
    mapping(address user => bool) hasVoted;
    // Total number of voters in the round
    uint256 totalVoters;
  }

  struct RoundVotesCountingStorage {
    mapping(address user => bool) _hasVotedOnce;
    mapping(uint256 roundId => RoundVote) _roundVotes;
    uint256 votingThreshold;
  }

  struct EarningsSettingsStorage {
    uint256 baseAllocationPercentage;
    uint256 appSharesCap;
    mapping(uint256 roundId => uint256) _roundBaseAllocationPercentage;
    mapping(uint256 roundId => uint256) _roundAppSharesCap;
  }

  struct RoundFinalizationStorage {
    mapping(uint256 roundId => uint256) _latestSucceededRoundId;
    mapping(uint256 roundId => bool) _roundFinalized;
  }

  struct RoundCore {
    address proposer;
    uint48 voteStart;
    uint32 voteDuration;
  }

  struct RoundsStorageStorage {
    uint256 _roundCount;
    mapping(uint256 roundId => RoundCore) _rounds;
    mapping(uint256 roundId => bytes32[]) _appsEligibleForVoting;
  }

  struct ExternalContractsStorage {
    IX2EarnApps _x2EarnApps;
    IEmissions _emissions;
    IVoterRewards _voterRewards;
    IVeBetterPassport _veBetterPassport;
    IB3TRGovernor _b3trGovernor;
    IRelayerRewardsPool _relayerRewardsPool;
  }

  struct AutoVotingStorage {
    mapping(address => Checkpoints.Trace208) _autoVotingEnabled;
    mapping(address => bytes32[]) _userVotingPreferences;
    Checkpoints.Trace208 _totalAutoVotingUsers;
  }

  // ======================== Storage Getters ======================== //

  function _getGovernorStorage() internal pure returns (GovernorStorage storage $) {
    assembly {
      $.slot := GovernorStorageLocation
    }
  }

  function _getVotingSettingsStorage() internal pure returns (VotingSettingsStorage storage $) {
    assembly {
      $.slot := VotingSettingsStorageLocation
    }
  }

  function _getVotesStorage() internal pure returns (VotesStorage storage $) {
    assembly {
      $.slot := VotesStorageLocation
    }
  }

  function _getVotesQuorumFractionStorage() internal pure returns (VotesQuorumFractionStorage storage $) {
    assembly {
      $.slot := VotesQuorumFractionStorageLocation
    }
  }

  function _getRoundVotesCountingStorage() internal pure returns (RoundVotesCountingStorage storage $) {
    assembly {
      $.slot := RoundVotesCountingStorageLocation
    }
  }

  function _getEarningsSettingsStorage() internal pure returns (EarningsSettingsStorage storage $) {
    assembly {
      $.slot := EarningsSettingsStorageLocation
    }
  }

  function _getRoundFinalizationStorage() internal pure returns (RoundFinalizationStorage storage $) {
    assembly {
      $.slot := RoundFinalizationStorageLocation
    }
  }

  function _getRoundsStorageStorage() internal pure returns (RoundsStorageStorage storage $) {
    assembly {
      $.slot := RoundsStorageStorageLocation
    }
  }

  function _getExternalContractsStorage() internal pure returns (ExternalContractsStorage storage $) {
    assembly {
      $.slot := ExternalContractsStorageLocation
    }
  }

  function _getAutoVotingStorage() internal pure returns (AutoVotingStorage storage $) {
    assembly {
      $.slot := AutoVotingStorageLocation
    }
  }
}
