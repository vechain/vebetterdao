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

pragma solidity ^0.8.20;

import { GovernorUpgradeable } from "../GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title GovernorFunctionsSettingsUpgradeable
 * @author VeBetterDAO
 * @dev Contract module which provides a way to restrict functions that can be called by proposals
 */
abstract contract GovernorFunctionsSettingsUpgradeable is Initializable, GovernorUpgradeable {
  /// @custom:storage-location erc7201:b3tr.storage.GovernorFunctionsSettingsUpgradeable
  struct GovernorFunctionsSettingsStorage {
    mapping(address => mapping(bytes4 => bool)) whitelistedFunctions; // mapping of target address to function selector to bool indicating if function is whitelisted for proposals
    bool isFunctionRestrictionEnabled; // flag to enable/disable function restriction
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.GovernorFunctionsSettingsUpgradeable")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorFunctionsSettingsStorageLocation =
    0x6f6ffe269d0d7b252b41a77e860d36d98c2e2ed0823c5d67bbe47e71ab12ef00;

  function _getGovernorFunctionsSettingsStorage() internal pure returns (GovernorFunctionsSettingsStorage storage $) {
    assembly {
      $.slot := GovernorFunctionsSettingsStorageLocation
    }
  }

  /// @notice Error message for when a function is restricted by the governor
  /// @param functionSelector The function selector that is restricted
  error GovernorRestrictedFunction(bytes4 functionSelector);

  /// @notice Error message for when a function selector is invalid
  /// @param selector The function selector that is invalid
  error GovernorFunctionInvalidSelector(bytes selector);

  /// @notice Initialize the GovernorFunctionsSettings contract
  /// @param _isFunctionRestrictionEnabled - flag to enable/disable function restriction
  function __GovernorFunctionsSettings_init(bool _isFunctionRestrictionEnabled) internal onlyInitializing {
    __GovernorFunctionsSettings_init_unchained(_isFunctionRestrictionEnabled);
  }

  /// @notice Initialize the GovernorFunctionsSettings contract without chaining
  /// @param _isFunctionRestrictionEnabled - flag to enable/disable function restriction
  function __GovernorFunctionsSettings_init_unchained(bool _isFunctionRestrictionEnabled) internal onlyInitializing {
    GovernorFunctionsSettingsStorage storage settings = _getGovernorFunctionsSettingsStorage();
    settings.isFunctionRestrictionEnabled = _isFunctionRestrictionEnabled;
  }

  // ---------- Virtual ---------- //

  /// @notice method that allows to restrict functions that can be called by proposals for a single function selector
  /// @param target - address of the contract
  /// @param functionSelector - function selector
  /// @param isWhitelisted - bool indicating if function is whitelisted for proposals
  function setWhitelistFunction(address target, bytes4 functionSelector, bool isWhitelisted) public virtual {
    GovernorFunctionsSettingsStorage storage settings = _getGovernorFunctionsSettingsStorage();
    settings.whitelistedFunctions[target][functionSelector] = isWhitelisted;
  }

  /// @notice method that allows to restrict functions that can be called by proposals for multiple function selectors at once
  /// @param target - address of the contract
  /// @param functionSelectors - array of function selectors
  /// @param isWhitelisted - bool indicating if function is whitelisted for proposals
  function setWhitelistFunctions(address target, bytes4[] memory functionSelectors, bool isWhitelisted) public virtual {
    for (uint256 i = 0; i < functionSelectors.length; i++) {
      setWhitelistFunction(target, functionSelectors[i], isWhitelisted);
    }
  }

  /// @notice method that allows to toggle the function restriction on/off
  /// @param isEnabled - flag to enable/disable function restriction
  function setIsFunctionRestrictionEnabled(bool isEnabled) public virtual {
    GovernorFunctionsSettingsStorage storage settings = _getGovernorFunctionsSettingsStorage();
    settings.isFunctionRestrictionEnabled = isEnabled;
  }

  // ------------------------ Getters ------------------------ //

  /// @notice Check if a function is restricted by the governor
  /// @param target - address of the contract
  /// @param functionSelector - function selector
  function isFunctionWhitelisted(address target, bytes4 functionSelector) public view returns (bool) {
    return _getGovernorFunctionsSettingsStorage().whitelistedFunctions[target][functionSelector];
  }

  // ------------------------ Internal ------------------------ //

  /**
   * @dev Internal function check if the targets and calldatas are whitelisted
   * @param targets The addresses of the contracts to call
   * @param calldatas Function signatures and arguments
   */
  function _checkFunctionsRestriction(address[] memory targets, bytes[] memory calldatas) internal view {
    GovernorFunctionsSettingsStorage storage $$ = _getGovernorFunctionsSettingsStorage();

    if ($$.isFunctionRestrictionEnabled == true) {
      for (uint256 i = 0; i < targets.length; i++) {
        bytes4 functionSelector = _extractFunctionSelector(calldatas[i]);
        if ($$.whitelistedFunctions[targets[i]][functionSelector] == false) {
          revert GovernorRestrictedFunction(functionSelector);
        }
      }
    }
  }

  /// @notice Extract the function selector from the calldata
  function _extractFunctionSelector(bytes memory data) internal pure returns (bytes4) {
    if (data.length < 4) revert GovernorFunctionInvalidSelector(data);
    bytes4 sig;
    assembly {
      sig := mload(add(data, 32))
    }
    return sig;
  }
}
