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
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";

/// @title PassportConfigurator Library
/// @notice Library for managing the configuration of a Passport contract.
/// @dev This library provides functions to set and get various configuration parameters and contracts used by the Passport contract.
library PassportConfigurator {
  // ---------- Getters ---------- //
  /// @notice Gets the x2EarnApps contract address
  function x2EarnApps(PassportStorageTypes.PassportStorage storage self) internal view returns (IX2EarnApps) {
    return self.x2EarnApps;
  }

  // ---------- Setters ---------- //
  /// @notice Sets the X2EarnApps contract address
  /// @dev The X2EarnApps contract address can be modified by the CONTRACTS_ADDRESS_MANAGER_ROLE
  /// @param _x2EarnApps - the X2EarnApps contract address
  function setX2EarnApps(PassportStorageTypes.PassportStorage storage self, IX2EarnApps _x2EarnApps) external {
    require(address(_x2EarnApps) != address(0), "VeBetterPassport: x2EarnApps is the zero address");

    self.x2EarnApps = _x2EarnApps;
  }
}
