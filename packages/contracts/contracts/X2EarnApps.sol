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

import { X2EarnAppsUpgradeable } from "./x-2-earn-apps/X2EarnAppsUpgradeable.sol";
import { AdministrationUpgradeable } from "./x-2-earn-apps/modules/AdministrationUpgradeable.sol";
import { AppsStorageUpgradeable } from "./x-2-earn-apps/modules/AppsStorageUpgradeable.sol";
import { SettingsUpgradeable } from "./x-2-earn-apps/modules/SettingsUpgradeable.sol";
import { VoteEligibilityUpgradeable } from "./x-2-earn-apps/modules/VoteEligibilityUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title X2EarnApps
 * @notice The main contract for handling the x-2-earn apps.
 *
 * The contract is using AccessControl to handle roles for admin, app management and app metadata update operations.
 */
contract X2EarnApps is
  Initializable,
  X2EarnAppsUpgradeable,
  AdministrationUpgradeable,
  SettingsUpgradeable,
  VoteEligibilityUpgradeable,
  AppsStorageUpgradeable,
  AccessControlUpgradeable,
  UUPSUpgradeable
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /**
   * @notice Initialize the contract
   * @param _baseURI the base URI for the contract
   * @param _admins the addresses of the admins
   * @param _upgrader the address of the upgrader
   *
   * @dev This function is called only once during the contract deployment
   */
  function initialize(string memory _baseURI, address[] memory _admins, address _upgrader) public initializer {
    __X2EarnApps_init();
    __Administration_init();
    __AppsStorage_init();
    __Settings_init(_baseURI);
    __VoteEligibility_init();
    __UUPSUpgradeable_init();
    __AccessControl_init();

    for (uint256 i = 0; i < _admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
    }

    _grantRole(UPGRADER_ROLE, _upgrader);
  }

  // ---------- Overrides ------------ //
  /**
   * @dev See {IX2EarnApps-setBaseURI}.
   */
  function setBaseURI(string memory _baseURI) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    super.setBaseURI(_baseURI);
  }

  /**
   * @dev See {IX2EarnApps-setVotingEligibility}.
   */
  function setVotingEligibility(bytes32 _appId, bool _isEligible) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    super.setVotingEligibility(_appId, _isEligible);
  }

  // ---------- Authorizations ------------ //

  /**
   * @dev See {UUPSUpgradeable-_authorizeUpgrade}
   */
  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  /**
   * @dev See {X2EarnAppsUpgradeable-_authorizeAppMetadataUpdate}
   */
  function _authorizeAppMetadataUpdate(bytes32 appId) internal view override {
    if (
      !hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && !isAppModerator(appId, msg.sender) && !isAppAdmin(appId, msg.sender)
    ) {
      revert X2EarnUnauthorizedUser(msg.sender);
    }
  }

  /**
   * @dev See {X2EarnAppsUpgradeable-_authorizeAppManagement}
   */
  function _authorizeAppManagement(bytes32 appId) internal view override {
    if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && !isAppAdmin(appId, msg.sender)) {
      revert X2EarnUnauthorizedUser(msg.sender);
    }
  }

  /**
   * @dev See {X2EarnAppsUpgradeable-_authorizeAddApp}
   */
  function _authorizeAddApp() internal view override {
    if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert X2EarnUnauthorizedUser(msg.sender);
    }
  }
}
