// SPDX-License-Identifier: MIT

//                                      #######
//                                 ################
//                               ####################
//                             ###########   #########
//                            #########      #########
//          #######          #########       #########
//          #########       #########      ##########
//           ##########     ########     ####################
//            ##########   #########  #########################
//              ################### ############################
//               #################  ##########          ########
//                 ##############      ###              ########
//                  ############                       #########
//                    ##########                     ##########
//                     ########                    ###########
//                       ###                    ############
//                                          ##############
//                                    #################
//                                   ##############
//                                   #########

pragma solidity 0.8.20;

import { PassportStorageTypes } from "./PassportStorageTypes.sol";
import { PassportTypes } from "./PassportTypes.sol";

library PassportPoPScoreLogic {
  // ---------- Events ---------- //
  /// @notice Emitted when a user registers an action
  /// @param user - the user that registered the action
  /// @param appId - the app id of the action
  /// @param round - the round of the action
  /// @param actionScore - the score of the action
  event RegisteredAction(address indexed user, bytes32 indexed appId, uint256 indexed round, uint256 actionScore);
  // ---------- Constants ---------- //

  /// @dev Scaling factor for the exponential decay
  uint256 private constant scalingFactor = 1e18;

  // ---------- Getters ---------- //
  /// @notice Gets the cumulative score of a user based on exponential decay for a number of last roundst
  /// @param user - the user address
  /// @param lastRound - the round to consider as a starting point for the cumulative score
  function getCumulativeScoreWithDecay(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    uint256 lastRound
  ) external view returns (uint256) {
    return _cumulativeScoreWithDecay(self, user, lastRound);
  }

  /// @notice Gets the round score of a user
  /// @param user - the user address
  /// @param round - the round
  function userRoundScore(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    uint256 round
  ) internal view returns (uint256) {
    return self.userRoundScore[user][round];
  }

  /// @notice Gets the total score of a user
  /// @param user - the user address
  function userTotalScore(
    PassportStorageTypes.PassportStorage storage self,
    address user
  ) internal view returns (uint256) {
    return self.userTotalScore[user];
  }

  /// @notice Gets the score of a user for an app in a round
  /// @param user - the user address
  /// @param round - the round
  /// @param appId - the app id
  function userRoundScoreApp(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    uint256 round,
    bytes32 appId
  ) internal view returns (uint256) {
    return self.userAppRoundScore[user][round][appId];
  }

  /// @notice Gets the total score of a user for an app
  /// @param user - the user address
  /// @param appId - the app id
  function userAppTotalScore(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    bytes32 appId
  ) internal view returns (uint256) {
    return self.userAppTotalScore[user][appId];
  }

  /// @notice Gets the threshold for a user to be considered a person
  function thresholdParticipationScore(
    PassportStorageTypes.PassportStorage storage self
  ) internal view returns (uint256) {
    return self.popScoreThreshold;
  }

  /// @notice Gets the security multiplier for an app security
  /// @param security - the app security between LOW, MEDIUM, HIGH
  function securityMultiplier(
    PassportStorageTypes.PassportStorage storage self,
    PassportTypes.APP_SECURITY security
  ) internal view returns (uint256) {
    return self.securityMultiplier[security];
  }

  /// @notice Gets the security level of an app
  /// @param appId - the app id
  function appSecurity(
    PassportStorageTypes.PassportStorage storage self,
    bytes32 appId
  ) internal view returns (PassportTypes.APP_SECURITY) {
    return self.appSecurity[appId];
  }

  /// @notice Gets the round threshold for a user to be considered a person
  function roundsForCumulativeScore(PassportStorageTypes.PassportStorage storage self) internal view returns (uint256) {
    return self.roundsForCumulativeScore;
  }

  // ---------- Setters ---------- //

  /// @notice Registers an action for a user
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  function registerAction(PassportStorageTypes.PassportStorage storage self, address user, bytes32 appId) external {
    _registerAction(self, user, appId, self.xAllocationVoting.currentRoundId());
  }

  /// @notice Registers an action for a user in a round
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  /// @param round - the round id of the action
  function registerActionForRound(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    bytes32 appId,
    uint256 round
  ) external {
    _registerAction(self, user, appId, round);
  }

  /// @notice Sets the threshold for a user to be considered a person
  /// @param threshold - the round threshold
  function setThreshold(PassportStorageTypes.PassportStorage storage self, uint256 threshold) external {
    require(threshold > 0, "ProofOfParticipation: threshold is zero");

    self.popScoreThreshold = threshold;
  }

  /// @notice Sets the number of rounds to consider for the cumulative score
  /// @param rounds - the number of rounds
  function setRoundsForCumulativeScore(PassportStorageTypes.PassportStorage storage self, uint256 rounds) external {
    require(rounds > 0, "ProofOfParticipation: rounds is zero");

    self.roundsForCumulativeScore = rounds;
  }

  /// @notice Sets the  security multiplier
  /// @param security - the app security between LOW, MEDIUM, HIGH
  /// @param multiplier - the multiplier
  function setSecurityMultiplier(
    PassportStorageTypes.PassportStorage storage self,
    PassportTypes.APP_SECURITY security,
    uint256 multiplier
  ) external {
    require(multiplier > 0, "ProofOfParticipation: multiplier is zero");

    self.securityMultiplier[security] = multiplier;
  }

  /// @dev Sets the security level of an app
  /// @param appId - the app id
  /// @param security  - the security level
  function setAppSecurity(
    PassportStorageTypes.PassportStorage storage self,
    bytes32 appId,
    PassportTypes.APP_SECURITY security
  ) external {
    self.appSecurity[appId] = security;
  }

  /// @notice Sets the decay rate for the exponential decay
  /// @param decayRate - the decay rate
  function setDecayRate(PassportStorageTypes.PassportStorage storage self, uint256 decayRate) external {
    require(decayRate > 0, "ProofOfParticipation: decay rate is zero");

    self.decayRate = decayRate;
  }

  // ---------- Internal & Private ---------- //

  /// @dev Gets the cumulative score of a user based on exponential decay for a number of last rounds
  /// @dev This function calculates the decayed score f(t) = a * (1 - r)^t
  /// @param user - the user address
  /// @param lastRound - the round to consider as a starting point for the cumulative score
  function _cumulativeScoreWithDecay(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    uint256 lastRound
  ) internal view returns (uint256) {
    // Calculate the starting round for the cumulative score. If the last round is less than the rounds for cumulative score, start from the first round
    uint256 startingRound = lastRound <= self.roundsForCumulativeScore
      ? 1
      : lastRound - self.roundsForCumulativeScore + 1;

    uint256 decayFactor = ((100 - self.decayRate) * scalingFactor) / 100;

    // Calculate the cumulative score with exponential decay
    uint256 cumulativeScore = 0;
    for (uint256 round = startingRound; round <= lastRound; round++) {
      cumulativeScore = self.userRoundScore[user][round] + (cumulativeScore * decayFactor) / scalingFactor;
    }

    return cumulativeScore;
  }

  /// @dev Registers an action for a user in a round
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  /// @param round - the round id of the action
  function _registerAction(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    bytes32 appId,
    uint256 round
  ) private {
    require(user != address(0), "ProofOfParticipation: user is the zero address");

    require(self.x2EarnApps.appExists(appId), "ProofOfParticipation: app does not exist");

    // If app was just added and the security level is not set, set it to LOW by default
    if (self.appSecurity[appId] == PassportTypes.APP_SECURITY.NONE) {
      return;
    }

    // Calculate the action score, can be min 0, max 6
    uint256 actionScore = self.securityMultiplier[self.appSecurity[appId]];

    // Update the user's score for the round
    self.userRoundScore[user][round] += actionScore;
    // Update the user's total score
    self.userTotalScore[user] += actionScore;
    // Update the user's score for the app in the round
    self.userAppRoundScore[user][round][appId] += actionScore;
    // Update the user's total score for the app
    self.userAppTotalScore[user][appId] += actionScore;

    emit RegisteredAction(user, appId, round, actionScore);
  }
}
