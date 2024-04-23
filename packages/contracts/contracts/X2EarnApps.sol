// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { X2EarnAppsUpgradeable } from "./x-2-earn-apps/X2EarnAppsUpgradeable.sol";
import { DataTypes } from "./libraries/DataTypes.sol";
import { IX2EarnApps } from "./interfaces/IX2EarnApps.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Administration } from "./x-2-earn-apps/modules/Administration.sol";
import { AppsStorage } from "./x-2-earn-apps/modules/AppsStorage.sol";
import { Settings } from "./x-2-earn-apps/modules/Settings.sol";
import { VoteElegibility } from "./x-2-earn-apps/modules/VoteElegibility.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract X2EarnApps is
  Initializable,
  X2EarnAppsUpgradeable,
  Administration,
  Settings,
  VoteElegibility,
  AppsStorage,
  AccessControlUpgradeable,
  UUPSUpgradeable
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /**
   * @notice Initialize the contract
   * @param baseURI_ the base URI for the contract
   * @param _admins the addresses of the admins
   * @dev This function is called only once during the contract deployment
   */
  function initialize(string memory baseURI_, address[] memory _admins) public initializer {
    __Administration_init();
    __AppsStorage_init();
    __Settings_init(baseURI_);
    __VoteElegibility_init();
    __UUPSUpgradeable_init();
    __AccessControl_init();

    for (uint256 i = 0; i < _admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
    }
  }

  // ---------- Overrides ------------ //
  function setBaseURI(string memory baseURI_) external override onlyRole(DEFAULT_ADMIN_ROLE) {
    _setBaseURI(baseURI_);
  }

  function setVotingElegibility(bytes32 _appId, bool _isElegible) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    super.setVotingElegibility(_appId, _isElegible);
  }

  // ---------- Authorizations ------------ //

  /**
   * @dev View {UUPSUpgradeable-_authorizeUpgrade}
   */
  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  /**
   * @dev View {X2EarnAppsUpgradeable-_authorizeAppMetadataUpdate}
   */
  function _authorizeAppMetadataUpdate(bytes32 appId) internal view override {
    require(
      hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || isAppModerator(appId, msg.sender) || isAppAdmin(appId, msg.sender),
      "X2EarnApps: sender must be an admin or app moderator"
    );
  }

  /**
   * @dev View {X2EarnAppsUpgradeable-_authorizeAppManagement}
   */
  function _authorizeAppManagement(bytes32 appId) internal view override {
    require(
      hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || isAppAdmin(appId, msg.sender),
      "X2EarnApps: sender must be an admin"
    );
  }

  /**
   * @dev View {X2EarnAppsUpgradeable-_authorizeAddApp}
   */
  function _authorizeAddApp() internal view override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
