// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { X2EarnAppsUpgradeable } from "./x-2-earn-apps/X2EarnAppsUpgradeable.sol";
import { DataTypes } from "./libraries/DataTypes.sol";
import { IX2EarnApps } from "./interfaces/IX2EarnApps.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Moderation } from "./x-2-earn-apps/modules/Moderation.sol";
import { Settings } from "./x-2-earn-apps/modules/Settings.sol";
import { VoteElegibility } from "./x-2-earn-apps/modules/VoteElegibility.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

abstract contract X2EarnApps is
  Initializable,
  X2EarnAppsUpgradeable,
  Moderation,
  Settings,
  VoteElegibility,
  AccessControlUpgradeable,
  UUPSUpgradeable
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /**
   * @dev Sets the value for {baseURI}
   */
  function __X2EarnApps_init(string memory baseURI_, address[] memory _admins) internal onlyInitializing {
    __X2EarnApps_init_unchained(baseURI_, _admins);
  }

  function __X2EarnApps_init_unchained(string memory baseURI_, address[] memory _admins) internal onlyInitializing {
    __Moderation_init_unchained();
    __Settings_init_unchained(baseURI_);
    __VoteElegibility_init_unchained();
    __UUPSUpgradeable_init();
    __AccessControl_init();

    for (uint256 i = 0; i < _admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
    }
  }

  // ---------- Overrides ------------ //

  /**
   * @dev Return the base URI to retrieve the metadata of the x2earn apps
   */
  function baseURI() public view virtual override(Settings, X2EarnAppsUpgradeable) returns (string memory) {
    return super.baseURI();
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
