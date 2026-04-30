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

/// @title GovernorFunctionRestrictionsLogic
/// @notice Library for managing function restrictions within the Governor contract.
/// @dev This library provides functions to whitelist or restrict functions that can be called by proposals.
library GovernorFunctionRestrictionsLogic {
  /// @notice Error message for when a function is restricted by the governor.
  /// @param functionSelector The function selector that is restricted.
  error GovernorRestrictedFunction(bytes4 functionSelector);

  /// @notice Error message for when a function selector is invalid.
  /// @param selector The function selector that is invalid.
  error GovernorFunctionInvalidSelector(bytes selector);

  /// @notice Emitted when a function is whitelisted by the governor.
  /// @param target The address of the contract.
  /// @param functionSelector The function selector.
  /// @param isWhitelisted Boolean indicating if the function is whitelisted.
  event FunctionWhitelisted(address indexed target, bytes4 indexed functionSelector, bool isWhitelisted);

  // --------------- SETTERS ---------------
  /**
   * @notice Set the whitelist status of a function for proposals.
   * @dev This method allows restricting functions that can be called by proposals for a single function selector.
   * @param target The address of the contract.
   * @param functionSelector The function selector.
   * @param isWhitelisted Boolean indicating if the function is whitelisted for proposals.
   */
  function setWhitelistFunction(
    address target,
    bytes4 functionSelector,
    bool isWhitelisted
  ) public {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(target != address(0), "GovernorFunctionRestrictionsLogic: target is the zero address");
    $.whitelistedFunctions[target][functionSelector] = isWhitelisted;
    emit FunctionWhitelisted(target, functionSelector, isWhitelisted);
  }

  function setWhitelistFunctions(
    address target,
    bytes4[] memory functionSelectors,
    bool isWhitelisted
  ) external {
    for (uint256 i; i < functionSelectors.length; i++) {
      setWhitelistFunction(target, functionSelectors[i], isWhitelisted);
    }
  }

  function setIsFunctionRestrictionEnabled(bool isEnabled) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    $.isFunctionRestrictionEnabled = isEnabled;
  }

  // --------------- GETTERS ---------------
  function isFunctionWhitelisted(
    address target,
    bytes4 functionSelector
  ) internal view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.whitelistedFunctions[target][functionSelector];
  }

  function checkFunctionsRestriction(
    address[] memory targets,
    bytes[] memory calldatas
  ) internal view {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    if ($.isFunctionRestrictionEnabled) {
      for (uint256 i; i < targets.length; i++) {
        bytes4 functionSelector = extractFunctionSelector(calldatas[i]);
        if (!$.whitelistedFunctions[targets[i]][functionSelector]) {
          revert GovernorRestrictedFunction(functionSelector);
        }
      }
    }
  }

  // --------------- PRIVATE FUNCTIONS ---------------
  /**
   * @notice Extract the function selector from the calldata.
   * @dev Internal pure function to extract the function selector from the calldata.
   * @param data The calldata from which to extract the function selector.
   * @return bytes4 The extracted function selector.
   */
  function extractFunctionSelector(bytes memory data) private pure returns (bytes4) {
    if (data.length < 4) revert GovernorFunctionInvalidSelector(data);
    bytes4 sig;
    assembly {
      sig := mload(add(data, 32))
    }
    return sig;
  }
}
