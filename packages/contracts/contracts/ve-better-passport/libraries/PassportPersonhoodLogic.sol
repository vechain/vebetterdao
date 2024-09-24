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
import { PassportChecksLogic } from "./PassportChecksLogic.sol";
import { PassportSignalingLogic } from "./PassportSignalingLogic.sol";
import { PassportPoPScoreLogic } from "./PassportPoPScoreLogic.sol";
import { PassportClockLogic } from "./PassportClockLogic.sol";
import { PassportEntityLogic } from "./PassportEntityLogic.sol";
import { PassportWhitelistAndBlacklistLogic } from "./PassportWhitelistAndBlacklistLogic.sol";
import { PassportTypes } from "./PassportTypes.sol";
import "hardhat/console.sol";

library PassportPersonhoodLogic {
  /**
   * @dev Checks if a wallet is a person or not based on the participation score, blacklisting, and xnode and GM holdings
   * @return person bool representing if the user is considered a person
   * @return reason string representing the reason for the result
   */
  function isPerson(
    PassportStorageTypes.PassportStorage storage self,
    address user
  ) external view returns (bool person, string memory reason) {
    // Resolve the address of the person based on the delegation status
    user = _resolvePersonhoodAddress(self, user, PassportClockLogic.clock());

    console.log("User: %s", user);
    console.log("Timepoint: %s", PassportClockLogic.clock());
    // Check if the user has delegated their personhood to another wallet
    if (user == address(0)) {
      return (false, "User has delegated their personhood");
    }

    // If a wallet is whitelisted, it is a person
    if (
      PassportChecksLogic.whitelistCheckEnabled(self) && PassportWhitelistAndBlacklistLogic.isWhitelisted(self, user)
    ) {
      return (true, "User is whitelisted");
    }

    // If a wallet is blacklisted, it is not a person
    if (
      PassportChecksLogic.blacklistCheckEnabled(self) && PassportWhitelistAndBlacklistLogic.isBlacklisted(self, user)
    ) {
      return (false, "User is blacklisted");
    }

    // If a wallet is not whitelisted and has been signaled more than X times
    if (
      (PassportChecksLogic.signalingCheckEnabled(self) &&
        PassportSignalingLogic.signaledCounter(self, user) >= PassportSignalingLogic.signalingThreshold(self))
    ) {
      return (false, "User has been signaled too many times");
    }

    if (PassportChecksLogic.participationScoreCheckEnabled(self)) {
      uint256 participationScore = PassportPoPScoreLogic.getCumulativeScoreWithDecay(
        self,
        user,
        self.xAllocationVoting.currentRoundId()
      );

      // If the user's cumulated score in the last rounds is greater than or equal to the threshold
      if ((participationScore >= PassportPoPScoreLogic.thresholdParticipationScore(self))) {
        return (true, "User's participation score is above the threshold");
      }
    }

    // Check if user owns an economic or xnode
    if (PassportChecksLogic.nodeOwnershipCheckEnabled(self) && (self.nodeManagement.getNodeIds(user).length > 0)) {
      return (true, "User owns an economic or xnode");
    }

    // TODO: With `GalaxyMember` version 2, Check if user's selected `GalaxyMember` `tokenId` is greater than `getMinimumGalaxyMemberLevel(self)`

    // If none of the conditions are met, return false with the default reason
    return (false, "User does not meet the criteria to be considered a person");
  }

  /**
   * @dev Checks if a wallet is a person or not at a specific timepoint based on the participation score, blacklisting, and xnode and GM holdings
   * @param user address of the user
   * @param timepoint uint256 of the timepoint
   * @return person bool representing if the user is considered a person
   * @return reason string representing the reason for the result
   */
  function isPersonAtTimepoint(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    uint48 timepoint
  ) external view returns (bool person, string memory reason) {
    // Resolve the address of the person based on the delegation status
    user = _resolvePersonhoodAddress(self, user, timepoint);

    console.log("User: %s", user);
    console.log("Timepoint: %s", timepoint);

    // Check if the user has delegated their personhood to another wallet
    if (user == address(0)) {
      return (false, "User has delegated their personhood");
    }

    // TODO: Add checkpointed check
    // If a wallet is whitelisted, it is a person
    if (
      PassportChecksLogic.whitelistCheckEnabled(self) && PassportWhitelistAndBlacklistLogic.isWhitelisted(self, user)
    ) {
      return (true, "User is whitelisted");
    }

    // TODO: Add checkpointed check
    // If a wallet is blacklisted, it is not a person
    if (
      PassportChecksLogic.blacklistCheckEnabled(self) && PassportWhitelistAndBlacklistLogic.isBlacklisted(self, user)
    ) {
      return (false, "User is blacklisted");
    }

    // TODO: Add checkpointed check
    // If a wallet is not whitelisted and has been signaled more than X times
    if (
      (PassportChecksLogic.signalingCheckEnabled(self) &&
        PassportSignalingLogic.signaledCounter(self, user) >= PassportSignalingLogic.signalingThreshold(self))
    ) {
      return (false, "User has been signaled too many times");
    }

    // TODO: Add checkpointed check
    if (PassportChecksLogic.participationScoreCheckEnabled(self)) {
      uint256 participationScore = PassportPoPScoreLogic.getCumulativeScoreWithDecay(
        self,
        user,
        self.xAllocationVoting.currentRoundId()
      );

      // TODO: Add checkpointed check
      // If the user's cumulated score in the last rounds is greater than or equal to the threshold
      if ((participationScore >= PassportPoPScoreLogic.thresholdParticipationScore(self))) {
        return (true, "User's participation score is above the threshold");
      }
    }

    // TODO: Add checkpointed check
    // Check if user owns an economic or xnode
    if (PassportChecksLogic.nodeOwnershipCheckEnabled(self) && (self.nodeManagement.getNodeIds(user).length > 0)) {
      return (true, "User owns an economic or xnode");
    }

    // TODO: With `GalaxyMember` version 2, Check if user's selected `GalaxyMember` `tokenId` is greater than `getMinimumGalaxyMemberLevel(self)`

    // If none of the conditions are met, return false with the default reason
    return (false, "User does not meet the criteria to be considered a person");
  }

  // ---------- Internal & Private Functions ---------- //
  /**
   * @dev Resolves the address of a person based on the delegation status
   * @param user address of the user
   * @param timepoint uint256 of the timepoint
   * @return address of the person
   */
  function _resolvePersonhoodAddress(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    uint256 timepoint
  ) private view returns (address) {
    if (PassportEntityLogic.wasEntityLinkedToPassportAtTimepoint(self, user, timepoint)) {
       return address(0); // Return zero address if they delegated their personhood
    } else {
      return user; // Return the user's own address if no delegation exists
    }
  }
}
