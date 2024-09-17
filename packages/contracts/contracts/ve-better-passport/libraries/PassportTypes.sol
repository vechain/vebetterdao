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

import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IGalaxyMember } from "../../interfaces/IGalaxyMember.sol";
import { INodeManagement } from "../../interfaces/INodeManagement.sol";

library PassportTypes {
  /**
   * @dev Struct containing data to initialize the contract
   * @param xAllocationVoting The address of the xAllocationVoting
   * @param x2EarnApps The address of the x2EarnApps
   * @param nodeManagement The address of the node management contract
   * @param galaxyMember The address of the galaxy member contract
   * @param upgrader The address of the upgrader
   * @param admins The addresses of the admins
   * @param settingsManagers The addresses of the settings managers
   * @param roleGranters The addresses of the role granters
   * @param blacklisters The addresses of the blacklisters
   * @param whitelisters The addresses of the whitelisters
   * @param actionRegistrar The address of the action registrar
   * @param actionScoreManager The address of the action score manager
   * @param popScoreThreshold The threshold proof of participation score for a wallet to be considered a person
   * @param signalingThreshold The threshold for a proposal to be active
   * @param roundsForCumulativeScore The number of rounds for cumulative score
   */
  struct InitializationData {
    IXAllocationVotingGovernor xAllocationVoting;
    IX2EarnApps x2EarnApps;
    IGalaxyMember galaxyMember;
    INodeManagement nodeManagement;
    address actionRegistrar;
    address actionScoreManager;
    uint256 popScoreThreshold;
    uint256 signalingThreshold;
    uint256 roundsForCumulativeScore;
    uint256 minimumGalaxyMemberLevel;
  }

  struct InitializationRoleData{
    address admin;
    address botSignaler;
    address upgrader;
    address settingsManager;
    address roleGranter;
    address blacklister;
    address whitelister;
    address actionRegistrar;
    address actionScoreManager;
  }

  /// @notice Security level indicates how secure the app is
  /// @dev App security is used to calculate the overall score of a sustainable action
  enum APP_SECURITY {
    UNDEFINED, // For new apps that have not been set yet
    NONE,
    LOW,
    MEDIUM,
    HIGH
  }
}
