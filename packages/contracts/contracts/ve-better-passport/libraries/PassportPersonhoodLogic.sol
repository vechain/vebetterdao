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
import { PassportPoPScoreLogic} from "./PassportPoPScoreLogic.sol";
import { PassportDelegationLogic } from "./PassportDelegationLogic.sol";
import { PassportWhitelistAndBlacklistLogic } from "./PassportWhitelistAndBlacklistLogic.sol";
import { PassportTypes } from "./PassportTypes.sol";

library PassportPersonhoodLogic {
  /**
   * @dev Checks if a wallet is a person or not based on the participation score, blacklisting, and xnode and GM holdings
   * @return person bool representing if the user is considered a person
   * @return reason string representing the reason for the result
   */
  function isPerson(PassportStorageTypes.PassportStorage storage self, address user) external view returns (bool person, string memory reason) {
    // Check if the user has delegated their personhood to another wallet
    if (PassportDelegationLogic.isDelegator(self, user)){
      return (false, "User has delegated their personhood");
    }
    
    // Check if a person has a personhood delegated to them

    // If a wallet is whitelisted, it is a person
    if (PassportChecksLogic.whitelistCheckEnabled(self) && PassportWhitelistAndBlacklistLogic.isWhitelisted(self, user)) {
      return (true, "User is whitelisted");
    }

    // If a wallet is blacklisted, it is not a person
    if (PassportChecksLogic.blacklistCheckEnabled(self) && PassportWhitelistAndBlacklistLogic.isBlacklisted(self, user)) {
      return (false, "User is blacklisted");
    }

    // If a wallet is not whitelisted and has been signaled more than X times
    if ((PassportChecksLogic.signalingCheckEnabled(self) && PassportSignalingLogic.signaledCounter(self, user) >= PassportSignalingLogic.signalingThreshold(self))) {
      return (false, "User has been signaled too many times");
    }


    if (PassportChecksLogic.participationScoreCheckEnabled(self)) {
      uint256 participationScore = PassportPoPScoreLogic.getCumulativeScoreWithDecay(self, user, self.xAllocationVoting.currentRoundId());

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

  function isPersonhoodDelegated(PassportStorageTypes.PassportStorage storage self, address user) external view returns (bool) {
    return PassportDelegationLogic.isDelegator(self, user);
  }
}
