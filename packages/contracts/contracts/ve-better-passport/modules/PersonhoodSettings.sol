// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IPersonhoodSettings } from "../interfaces/IPersonhoodSettings.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/// @title PersonhoodSettings
/// @notice Contract to manage different checks using bitmask for efficient storage.
contract PersonhoodSettings is Initializable, AccessControlUpgradeable, IPersonhoodSettings {
  bytes32 public constant SETTINGS_MANAGER_ROLE = keccak256("SETTINGS_MANAGER_ROLE");

  // ---------- Storage ---------- //

  struct PersonhoodSettingsStorage {
    uint256 checks;
  }

  // keccak256(abi.encode(uint256(keccak256("storage.PersonhoodSettings")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant PersonhoodSettingsStorageLocation =
    0xba00c5a8fa2c6f0117617e386573dbfc2926a5d74e97ce27c07e2b1d7c6faf00;

  function _getPersonhoodSettingsStorage() private pure returns (PersonhoodSettingsStorage storage $) {
    assembly {
      $.slot := PersonhoodSettingsStorageLocation
    }
  }

  // ---------- Consants ---------- //

  // Define constants for each check as a bitmask
  uint256 constant WHITELIST_CHECK = 1 << 0; // Bitwise shift to the left by 0
  uint256 constant BLACKLIST_CHECK = 1 << 1; // Bitwise shift to the left by 1
  uint256 constant SIGNALING_CHECK = 1 << 2; // Bitwise shift to the left by 2
  uint256 constant PARTICIPATION_SCORE_CHECK = 1 << 3; // Bitwise shift to the left by 3
  uint256 constant NODE_OWNERSHIP_CHECK = 1 << 4; // Bitwise shift to the left by 4
  uint256 constant GM_OWNERSHIP_CHECK = 1 << 5; // Bitwise shift to the left by 5

  string constant WHITELIST_CHECK_NAME = "Whitelist Check";
  string constant BLACKLIST_CHECK_NAME = "Blacklist Check";
  string constant SIGNALING_CHECK_NAME = "Signaling Check";
  string constant PARTICIPATION_SCORE_CHECK_NAME = "Participation Score Check";
  string constant NODE_OWNERSHIP_CHECK_NAME = "Node Ownership Check";
  string constant GM_OWNERSHIP_CHECK_NAME = "GM Ownership Check";

  // ---------- Initializer ---------- //
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

 
  /// @dev Initializes the contract.
  function __PersonhoodSettings_init(address[] memory settingsManagers) internal onlyInitializing {
    __PersonhoodSettings_init_unchained(settingsManagers);
  }

  function __PersonhoodSettings_init_unchained(address[] memory settingsManagers) internal onlyInitializing {
    for (uint256 i; i < settingsManagers.length; i++) {
      require(settingsManagers[i] != address(0), "PersonhoodSettings: settings manager address cannot be zero");
      _grantRole(SETTINGS_MANAGER_ROLE, settingsManagers[i]);
    }
  }

  // ---------- Internal Functions ---------- //

  /// @notice Toggles the specified check using XOR
  /// @param check The check to toggle (bitmask constant)
  function _toggleCheck(uint256 check, string memory checkName) internal {
    PersonhoodSettingsStorage storage $ = _getPersonhoodSettingsStorage();
    $.checks ^= check; // Toggle the check (XOR)
    emit CheckToggled(checkName, ($.checks & check != 0));
  }

  /// @notice Checks if a specific check is enabled
  /// @param check The check to query (bitmask constant)
  /// @return True if the check is enabled, false otherwise
  function _isCheckEnabled(uint256 check) internal view returns (bool) {
    PersonhoodSettingsStorage storage $ = _getPersonhoodSettingsStorage();
    return ($.checks & check) != 0;
  }

  // ---------- Public View Functions ---------- //

  /// @notice Returns if the whitelist check is enabled
  function whitelistCheckEnabled() public view returns (bool) {
    return _isCheckEnabled(WHITELIST_CHECK);
  }

  /// @notice Returns if the blacklist check is enabled
  function blacklistCheckEnabled() public view returns (bool) {
    return _isCheckEnabled(BLACKLIST_CHECK);
  }

  /// @notice Returns if the signaling check is enabled
  function signalingCheckEnabled() public view returns (bool) {
    return _isCheckEnabled(SIGNALING_CHECK);
  }

  /// @notice Returns if the participation score check is enabled
  function participationScoreCheckEnabled() public view returns (bool) {
    return _isCheckEnabled(PARTICIPATION_SCORE_CHECK);
  }

  /// @notice Returns if the node ownership check is enabled
  function nodeOwnershipCheckEnabled() public view returns (bool) {
    return _isCheckEnabled(NODE_OWNERSHIP_CHECK);
  }

  /// @notice Returns if the GM ownership check is enabled
  function gmOwnershipCheckEnabled() public view returns (bool) {
    return _isCheckEnabled(GM_OWNERSHIP_CHECK);
  }

  // ---------- External Functions (Restricted) ---------- //

  /// @notice Toggles the whitelist check
  function toggleWhitelistCheck() external onlyRole(SETTINGS_MANAGER_ROLE) {
    _toggleCheck(WHITELIST_CHECK, WHITELIST_CHECK_NAME);
  }

  /// @notice Toggles the blacklist check
  function toggleBlacklistCheck() external onlyRole(SETTINGS_MANAGER_ROLE) {
    _toggleCheck(BLACKLIST_CHECK, BLACKLIST_CHECK_NAME);
  }

  /// @notice Toggles the signaling check
  function toggleSignalingCheck() external onlyRole(SETTINGS_MANAGER_ROLE) {
    _toggleCheck(SIGNALING_CHECK, SIGNALING_CHECK_NAME);
  }

  /// @notice Toggles the participation score check
  function toggleParticipationScoreCheck() external onlyRole(SETTINGS_MANAGER_ROLE) {
    _toggleCheck(PARTICIPATION_SCORE_CHECK, PARTICIPATION_SCORE_CHECK_NAME);
  }

  /// @notice Toggles the node ownership check
  function toggleNodeOwnershipCheck() external onlyRole(SETTINGS_MANAGER_ROLE) {
    _toggleCheck(NODE_OWNERSHIP_CHECK, NODE_OWNERSHIP_CHECK_NAME);
  }

  /// @notice Toggles the GM ownership check
  function toggleGMOwnershipCheck() external onlyRole(SETTINGS_MANAGER_ROLE) {
    _toggleCheck(GM_OWNERSHIP_CHECK, GM_OWNERSHIP_CHECK_NAME);
  }
}
