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

import { GovernorStorageTypes } from "./libraries/GovernorStorageTypes.sol";
import { GovernorTypes } from "./libraries/GovernorTypes.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title GovernorStorage
/// @notice Contract used as storage of the B3TRGovernor contract.
/// @dev It defines the storage layout of the B3TRGovernor contract.
contract B3TRGovernorStorage is Initializable {
  // keccak256(abi.encode(uint256(keccak256("GovernorQuoromStorage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorQuoromStorageLocation =
    0xc4bf39076012325596b2a6f89760cc6608fd95f7cf147b47ae61fb6e5a9a1200;

  // keccak256(abi.encode(uint256(keccak256("GovernorTimeLockStorage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorTimeLockStorageLocation =
    0x13baad612a1ba34c1ad25cf3b32eafcb05c98f263795fbf41522d389ae5ab100;

  // keccak256(abi.encode(uint256(keccak256("GovernorSettingsStorage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorSettingsStorageLocation =
    0xc0065be1bc8e77d69a203a49db226e97f882a1490934768d77ec9a4eb951ac00;

  // keccak256(abi.encode(uint256(keccak256("GovernorFunctionRestrictionsStorage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorFunctionRestrictionsStorageLocation =
    0x5559abecc34569938f68c9644616ef818c03d16a5c20378622558d8161585100;

  // keccak256(abi.encode(uint256(keccak256("GovernorExternalContractsStorage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorExternalContractsStorageLocation =
    0x97d598a282d3493bebcf9bd0e9d7ba8e1b1c2e1312cb1c8dc6e1717525f7c200;

  // keccak256(abi.encode(uint256(keccak256("GovernorDepositStorage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorDepositStorageLocation =
    0xfd3a2833e16394588f908aea3be9d05d97d1dfc59c0c2431ef215c019c421800;

  // keccak256(abi.encode(uint256(keccak256("GovernorVotesStorage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorVotesStorageLocation =
    0xcb6cb12dc59022840a1c776f4f7dc071bcd58829ba542523309c31825375c500;

  /// @dev Internal function to access the governor quorum storage slot.
  function getGovernorQuoromStorage() internal pure returns (GovernorStorageTypes.GovernorQuoromStorage storage $) {
    assembly {
      $.slot := GovernorQuoromStorageLocation
    }
  }

  /// @dev Internal function to access the governor timelock storage slot.
  function getGovernorTimeLockStorage() internal pure returns (GovernorStorageTypes.GovernorTimeLockStorage storage $) {
    assembly {
      $.slot := GovernorTimeLockStorageLocation
    }
  }

  /// @dev Internal function to access the governor settings storage slot.
  function getGovernorSettingsStorage() internal pure returns (GovernorStorageTypes.GovernorSettingsStorage storage $) {
    assembly {
      $.slot := GovernorSettingsStorageLocation
    }
  }

  /// @dev Internal function to access the governor function restrictions storage slot.
  function getGovernorFunctionRestrictionsStorage()
    internal
    pure
    returns (GovernorStorageTypes.GovernorFunctionRestrictionsStorage storage $)
  {
    assembly {
      $.slot := GovernorFunctionRestrictionsStorageLocation
    }
  }

  /// @dev Internal function to access the governor external contracts storage slot.
  function getGovernorExternalContractsStorage()
    internal
    pure
    returns (GovernorStorageTypes.GovernorExternalContractsStorage storage $)
  {
    assembly {
      $.slot := GovernorExternalContractsStorageLocation
    }
  }

  /// @dev Internal function to access the governor deposit storage slot.
  function getGovernorDepositStorage() internal pure returns (GovernorStorageTypes.GovernorDepositStorage storage $) {
    assembly {
      $.slot := GovernorDepositStorageLocation
    }
  }

  /// @dev Internal function to access the governor votes storage slot.
  function getGovernorVotesStorage() internal pure returns (GovernorStorageTypes.GovernorVotesStorage storage $) {
    assembly {
      $.slot := GovernorVotesStorageLocation
    }
  }

  /// @dev Initializes the governor storage with the address of the VOT3 token.
  function __GovernorStorage_init(GovernorTypes.InitializationData memory initializationData) internal onlyInitializing {
    __GovernorStorage_init_unchained(initializationData);
  }

  /// @dev Part of the initialization process that configures the deposit storage.
  function __GovernorStorage_init_unchained(
    GovernorTypes.InitializationData memory initializationData
  ) internal onlyInitializing {
    // Set the governor quorum storage
    //GovernorStorageTypes.GovernorQuoromStorage storage quorumStorage = getGovernorQuoromStorage();
    //quorumStorage.quorumPercentage = initializationData.quorumPercentage;

    // Set the governor time lock storage
    GovernorStorageTypes.GovernorTimeLockStorage storage timeLockStorage = getGovernorTimeLockStorage();
    timeLockStorage.timelock = initializationData.timelock;

    // Set the governor settings storage
    GovernorStorageTypes.GovernorSettingsStorage storage settingsStorage = getGovernorSettingsStorage();
    settingsStorage.depositThreshold = initializationData.initialDepositThreshold;
    settingsStorage.minVotingDelay = initializationData.initialMinVotingDelay;
    settingsStorage.votingThreshold = initializationData.initialVotingThreshold;

    // Set the governor function restrictions storage
    GovernorStorageTypes.GovernorFunctionRestrictionsStorage
      storage functionRestrictionsStorage = getGovernorFunctionRestrictionsStorage();
    functionRestrictionsStorage.isFunctionRestrictionEnabled = initializationData.isFunctionRestrictionEnabled;

    // Set the governor external contracts storage
    GovernorStorageTypes.GovernorExternalContractsStorage
      storage externalContractsStorage = getGovernorExternalContractsStorage();
    externalContractsStorage.voterRewards = initializationData.voterRewards;
    externalContractsStorage.xAllocationVoting = initializationData.xAllocationVoting;
    externalContractsStorage.b3tr = initializationData.b3tr;
    externalContractsStorage.vot3 = initializationData.vot3Token;
  }
}
