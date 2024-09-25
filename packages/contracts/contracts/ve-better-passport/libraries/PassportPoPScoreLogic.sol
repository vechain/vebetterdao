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
import { PassportEntityLogic } from "./PassportEntityLogic.sol";

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

    // Check if the user has attached their entity to a passport, if so, use the passport address
    address passport = PassportEntityLogic._getPassportForEntity(self, user);

    // Track unique apps core user has interacted with
    if (!self.userUniqueAppInteraction[passport][appId]) {
      updateUniqueAppInteractions(self, passport, appId);
    }

    // If the entity is not linked to a passport and the entity has not interacted with the app track interaction
    if(passport != user && !self.userUniqueAppInteraction[user][appId]) {
      updateUniqueAppInteractions(self, user, appId);
    }

    // Calculate the action score, can be min 0, max 6
    uint256 actionScore = self.securityMultiplier[self.appSecurity[appId]];

    // Update the user's score for the round
    self.userRoundScore[passport][round] += actionScore;
    // Update the user's total score
    self.userTotalScore[passport] += actionScore;
    // Update the user's score for the app in the round
    self.userAppRoundScore[passport][round][appId] += actionScore;
    // Update the user's total score for the app
    self.userAppTotalScore[passport][appId] += actionScore;

    emit RegisteredAction(passport, appId, round, actionScore);
  }

  /**
   * @notice Assigns an entity's score to a passport across specific rounds.
   * @dev Loops through the relevant rounds and adds the entity's score to the passport's total and app scores.
   * The function ensures the entity's score is assigned starting from the current round and going backward
   * for a specified number of rounds.
   * @param self The storage reference for PassportStorage.
   * @param entity The address of the entity whose score will be assigned to the passport.
   * @param passport The address of the passport whose scores will be updated.
   */
  function assignEntityScoreToPassport(
    PassportStorageTypes.PassportStorage storage self,
    address entity,
    address passport
  ) internal {
    uint256 currentRound = self.xAllocationVoting.currentRoundId();

    // Mark the round when the entity was attached to the passport
    self.entityAttachRound[entity] = currentRound;

    // Calculate the minimum round to consider (ensure no underflow)
    uint256 minRound = currentRound >= self.roundsForAssigningEntityScore
      ? currentRound - self.roundsForAssigningEntityScore
      : 0;

    // Loop through the rounds from current to minRound
    for (uint256 round = currentRound; round > minRound; round--) {
      // Check if the entity has any score in the round
      if (self.userRoundScore[entity][round] > 0) {
        // Update the passport's total score for the rounds considered
        self.userTotalScore[passport] += self.userRoundScore[entity][round];

        // Update the passport's round-specific score
        self.userRoundScore[passport][round] += self.userRoundScore[entity][round];

        // Update the passport's app-specific scores
        for (uint256 i = 0; i < self.userInteractedApps[entity].length; i++) {
          // Get the appId
          bytes32 appId = self.userInteractedApps[entity][i];

          // Update the passport's score for the app in the round
          self.userAppRoundScore[passport][round][appId] += self.userAppRoundScore[entity][round][appId];

          // Update the passport's total score for the app
          self.userAppTotalScore[passport][appId] += self.userAppRoundScore[entity][round][appId];

          // Update the passport's unique app interactions
          if (!self.userUniqueAppInteraction[passport][appId]) {
            updateUniqueAppInteractions(self, passport, appId);
          }
        }
      }
    }
  }

  /**
   * @notice Removes the entity's score from the passport's score, for specific rounds.
   * @dev Loops through the relevant rounds and deducts the entity's score from the passport's total and app scores.
   * @param self The storage reference for PassportStorage.
   * @param entity The address of the entity whose score will be removed from the passport.
   * @param passport The address of the passport whose scores will be updated.
   */
  function removeEntityScoreFromPassport(
    PassportStorageTypes.PassportStorage storage self,
    address entity,
    address passport
  ) internal {
    // Calculate the rounds to consider for removing the entity's score
    uint256 entityAttachRound = self.entityAttachRound[entity];

    uint256 minRound = entityAttachRound >= self.roundsForAssigningEntityScore
      ? entityAttachRound - self.roundsForAssigningEntityScore
      : 0; // Ensure there's no underflow

    // Loop through the rounds from when the entity was attached to the calculated round limit
    for (uint256 round = entityAttachRound; round > minRound; round--) {
      // Check if the entity has any score in the round
      if (self.userRoundScore[entity][round] > 0) {
        // Deduct the entity's score from the passport's total score
        self.userTotalScore[passport] -= self.userRoundScore[entity][round];

        // Deduct the entity's score from the passport's round-specific score
        self.userRoundScore[passport][round] -= self.userRoundScore[entity][round];

        // Loop through all apps the entity has interacted with and update the passport's app-specific scores
        for (uint256 i = 0; i < self.userInteractedApps[entity].length; i++) {
          // Get the appId
          bytes32 appId = self.userInteractedApps[entity][i];

          // Deduct the entity's app score from the passport's app score for the round
          self.userAppRoundScore[passport][round][appId] -= self.userAppRoundScore[entity][round][appId];

          // Deduct the entity's total app score from the passport's total app score
          self.userAppTotalScore[passport][appId] -= self.userAppRoundScore[entity][round][appId];
        }
      }
    }
  }

  function updateUniqueAppInteractions(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    bytes32 appId
  ) internal {
    // This is the first time the user interacts with this app
    self.userUniqueAppInteraction[user][appId] = true;

    // Add the appId to the user's interacted apps array
    self.userInteractedApps[user].push(appId);
  }
}
