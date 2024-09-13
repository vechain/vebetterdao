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
import { INodeManagement } from "../../interfaces/INodeManagement.sol";
import { IGalaxyMember } from "../../interfaces/IGalaxyMember.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { PassportTypes } from "./PassportTypes.sol";

/// @title PassportStorageTypes
/// @notice Library for defining storage types used in the Passport contract.
library PassportStorageTypes {
  struct PassportStorage {
    // ------------------ Passport Settings ------------------ //
    // Bitmask of enabled checks (e.g. whitelist, blacklist, signaling, etc.)
    uint256 personhoodChecks;
    // ---------- External Contracts ---------- //
    // Address of the xAllocationVoting contract
    IXAllocationVotingGovernor xAllocationVoting;
    // Address of the node management contract
    INodeManagement nodeManagement;
    // Address of the galaxy member contract
    IGalaxyMember galaxyMember;
    // Address of the x2EarnApps contract
    IX2EarnApps x2EarnApps;
    // ---------- Blacklisted and Whitelisted info ---------- //
    // Mapping of whitelisted users
    mapping(address user => bool) whitelisted;
    // Mapping of blacklisted users
    mapping(address user => bool) blacklisted;
    // ---------- Proof of Participation ---------- //
    // Multiplier of the base action score based on the app security
    mapping(PassportTypes.APP_SECURITY security => uint256 multiplier) securityMultiplier;
    // Security level of an app -> will be UNDEFINED and set to LOW by default
    mapping(bytes32 appId => PassportTypes.APP_SECURITY security) appSecurity;
    // User scores
    mapping(address user => uint256 totalScore) userTotalScore; // all-time total score of a user
    mapping(address user => mapping(bytes32 appId => uint256 totalScore)) userAppTotalScore; // all-time total score of a user for a specific app
    mapping(address user => mapping(uint256 round => uint256 score)) userRoundScore; // score of a user in a specific round
    mapping(address user => mapping(uint256 round => mapping(bytes32 appId => uint256 score))) userAppRoundScore; // score of a user for a specific app in a specific round
    // Threshold for a user to be considered a person in a round //threshold can be 0
    uint256 threshold;
    // Number of rounds to consider for the cumulative score
    uint256 roundsForCumulativeScore;
    // Decay rate for the exponential decay
    uint256 decayRate;
  }
}
