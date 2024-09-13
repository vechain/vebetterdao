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
  }
}
