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

import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { IVOT3 } from "../../interfaces/IVOT3.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";

/// @title GovernorClockLogic Library
/// @notice Library for managing the clock logic as specified in EIP-6372, with fallback to block numbers.
/// @dev This library interacts with the IVOT3 interface to get the clock time or mode.
library GovernorClockLogic {
  /**
   * @notice Returns the current timepoint from the token's clock, falling back to the current block number if the token does not implement EIP-6372.
   * @dev Tries to get the timepoint from the vot3 clock. If it fails, it returns the current block number.
   * @return The current timepoint or block number.
   */
  function clock() external view returns (uint48) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    try $.vot3.clock() returns (uint48 timepoint) {
      return timepoint;
    } catch {
      return Time.blockNumber();
    }
  }

  /**
   * @notice Returns the machine-readable description of the clock mode as specified in EIP-6372.
   * @dev Tries to get the clock mode from the vot3 interface. If it fails, it returns the default block number mode.
   * @return The clock mode as a string.
   */
  // solhint-disable-next-line func-name-mixedcase
  function CLOCK_MODE() external view returns (string memory) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    try $.vot3.CLOCK_MODE() returns (string memory clockmode) {
      return clockmode;
    } catch {
      return "mode=blocknumber&from=default";
    }
  }
}
