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

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import { NavigatorStorageTypes } from "./libraries/NavigatorStorageTypes.sol";

/**
 * @title NavigatorRegistry
 * @notice Manages the Navigator delegation system for VeBetterDAO.
 * Navigators are professional voting delegates who stake B3TR to vote on behalf of citizens.
 *
 * @dev Architecture:
 * - Upgradeable via UUPS proxy pattern
 * - Logic split into external libraries for contract size optimization
 * - ERC-7201 namespaced storage (7 namespaces)
 * - Role-based access control (GOVERNANCE_ROLE, UPGRADER_ROLE)
 *
 * Key features:
 * - Permissionless navigator registration with B3TR staking
 * - Citizens delegate specific VOT3 amounts to navigators
 * - Navigators set allocation preferences and governance decisions
 * - 20% fee on citizen rewards, locked for 4 rounds
 * - Automatic minor slashing for negligence, governance-driven major slashing
 * - Exit process with notice period
 */
contract NavigatorRegistry is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
  /// @notice Role for governance-controlled settings and deactivation
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

  /// @notice Role for contract upgrades
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /// @notice Basis points scale (10000 = 100%)
  uint256 public constant BASIS_POINTS = 10000;

  // ======================== Initialization ======================== //

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @notice Initialization parameters packed into a struct to avoid stack-too-deep
  struct InitParams {
    address admin;
    address upgrader;
    address governance;
    address b3trToken;
    address vot3Token;
    address treasury;
    uint256 minStake; // default: 50000e18
    uint256 maxStakePercentage; // basis points of VOT3 supply (default: 100 = 1%)
    uint256 feeLockPeriod; // rounds (default: 4)
    uint256 feePercentage; // basis points (default: 2000 = 20%)
    uint256 exitNoticePeriod; // rounds (default: 1)
    uint256 reportInterval; // rounds (default: 2)
    uint256 minorSlashPercentage; // basis points (default: 1000 = 10%)
  }

  /**
   * @notice Initialize the NavigatorRegistry contract
   * @param params Initialization parameters
   */
  function initialize(InitParams calldata params) public initializer {
    require(params.admin != address(0), "NavigatorRegistry: admin is zero");
    require(params.b3trToken != address(0), "NavigatorRegistry: b3tr is zero");
    require(params.vot3Token != address(0), "NavigatorRegistry: vot3 is zero");
    require(params.treasury != address(0), "NavigatorRegistry: treasury is zero");

    __AccessControl_init();
    __UUPSUpgradeable_init();
    __ReentrancyGuard_init();

    _grantRole(DEFAULT_ADMIN_ROLE, params.admin);
    _grantRole(UPGRADER_ROLE, params.upgrader);
    _grantRole(GOVERNANCE_ROLE, params.governance);

    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    // Staking config
    $.minStake = params.minStake;
    $.maxStakePercentage = params.maxStakePercentage;
    $.b3trToken = params.b3trToken;
    $.vot3Token = params.vot3Token;
    $.treasury = params.treasury;

    // Fee config
    $.feeLockPeriod = params.feeLockPeriod;
    $.feePercentage = params.feePercentage;

    // Lifecycle config
    $.exitNoticePeriod = params.exitNoticePeriod;

    // Profile config
    $.reportInterval = params.reportInterval;

    // Slashing config
    $.minorSlashPercentage = params.minorSlashPercentage;
  }

  // ======================== Version ======================== //

  /// @notice Returns the version of the contract
  function version() external pure returns (string memory) {
    return "1";
  }

  // ======================== Upgrade Authorization ======================== //

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
