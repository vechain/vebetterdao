// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IB3TR } from "../../interfaces/IB3TR.sol";
import { IVeBetterPassport } from "../../interfaces/IVeBetterPassport.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { ChallengeTypes } from "./ChallengeTypes.sol";

library ChallengeStorageTypes {
  /// @custom:storage-location erc7201:b3tr.storage.Challenges
  struct ChallengesStorage {
    IB3TR b3tr;
    IVeBetterPassport veBetterPassport;
    IXAllocationVotingGovernor xAllocationVoting;
    IX2EarnApps x2EarnApps;
    uint256 maxChallengeDuration;
    uint256 maxSelectedApps;
    uint256 challengeCount;
    uint256 maxParticipants;
    mapping(uint256 challengeId => ChallengeTypes.Challenge challenge) challenges;
    mapping(uint256 challengeId => mapping(address account => ChallengeTypes.ParticipantStatus status)) participantStatus;
    mapping(uint256 challengeId => mapping(address account => bool eligible)) invitationEligible;
    mapping(uint256 challengeId => mapping(address account => uint256 indexPlusOne)) participantIndexPlusOne;
    mapping(uint256 challengeId => mapping(address account => uint256 indexPlusOne)) invitedIndexPlusOne;
    mapping(uint256 challengeId => mapping(address account => uint256 indexPlusOne)) declinedIndexPlusOne;
    mapping(uint256 challengeId => mapping(address account => bool claimed)) hasClaimed;
    mapping(uint256 challengeId => mapping(address account => bool refunded)) hasRefunded;
    uint256 minBetAmount;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.Challenges")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant ChallengesStorageLocation =
    0x4602c7a79eac2c186a5049fa18aa513e24b689a1ed3277f24b1e5b426612d100;

  function getChallengesStorage() internal pure returns (ChallengesStorage storage $) {
    assembly {
      $.slot := ChallengesStorageLocation
    }
  }
}
