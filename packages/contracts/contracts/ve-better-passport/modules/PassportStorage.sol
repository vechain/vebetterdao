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

import { PassportStorageTypes } from "../libraries/PassportStorageTypes.sol";
import { PassportTypes } from "../libraries/PassportTypes.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title PassportStorage
/// @notice Contract used as storage of the VeBetterPassport contract.
/// @dev It defines the storage layout of the VeBetterPassport contract.
contract PassportStorage is Initializable {
  // keccak256(abi.encode(uint256(keccak256("PassportStorageLocation")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant PassportStorageLocation = 0x273c9387b78d9b22e6f3371bb3aa3a918f53507e8cacc54e4831933cbb844100;

  /// @dev Internal function to access the passport storage slot.
  function getPassportStorage() internal pure returns (PassportStorageTypes.PassportStorage storage $) {
    assembly {
      $.slot := PassportStorageLocation
    }
  }

  /// @dev Initializes the passport storage
  function __PassportStorage_init(
    PassportTypes.InitializationData memory initializationData
  ) internal onlyInitializing {
    __PassportStorage_init_unchained(initializationData);
  }

  /// @dev Part of the initialization process that configures the passport storage.
  function __PassportStorage_init_unchained(
    PassportTypes.InitializationData memory initializationData
  ) internal onlyInitializing {
    PassportStorageTypes.PassportStorage storage self = getPassportStorage();

    require(address(initializationData.xAllocationVoting) != address(0), "VeBetterPassport: xAllocationVoting is the zero address");
    require(address(initializationData.x2EarnApps) != address(0), "VeBetterPassport: x2EarnApps is the zero address");
    require(address(initializationData.nodeManagement) != address(0), "VeBetterPassport: nodeManagement is the zero address");
    require(address(initializationData.galaxyMember) != address(0), "VeBetterPassport: galaxyMember is the zero address");

    self.xAllocationVoting = initializationData.xAllocationVoting;
    //self.x2EarnApps = initializationData.x2EarnApps;
    self.nodeManagement = initializationData.nodeManagement;
    self.galaxyMember = initializationData.galaxyMember;
  }
}
