// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IWhitelistAndBlacklist } from "../interfaces/IWhitelistAndBlacklist.sol";

/// @title WhitelistAndBlacklist
/// @notice Contract to whitelist and blacklist users
contract WhitelistAndBlacklist is Initializable, AccessControlUpgradeable, IWhitelistAndBlacklist {
  bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  // ---------- Storage ------------ //

  struct WhitelistAndBlacklistStorage {
    mapping(address user => bool) _whitelisted;
    mapping(address user => bool) _blacklisted;
  }

  // keccak256(abi.encode(uint256(keccak256("storage.WhitelistAndBlacklist")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant WhitelistAndBlacklistStorageLocation =
    0x564b0eacbfc3da4d5493a982c1b51a504eba529713a65df72dc5051250a8f500;

  function _getWhitelistAndBlacklistStorage() private pure returns (WhitelistAndBlacklistStorage storage $) {
    assembly {
      $.slot := WhitelistAndBlacklistStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __WhitelistAndBlacklist_init(address[] memory _whitelisters) internal onlyInitializing {
    __WhitelistAndBlacklist_init_unchained(_whitelisters);
  }

  function __WhitelistAndBlacklist_init_unchained(address[] memory _whitelisters) internal onlyInitializing {
    for (uint256 i; i < _whitelisters.length; i++) {
      require(_whitelisters[i] != address(0), "WhitelistAndBlacklist: whitelister address cannot be zero");
      _grantRole(WHITELISTER_ROLE, _whitelisters[i]);
    }
  }

  // ---------- Modifiers ------------ //

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) virtual {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert WhitelistAndBlacklistUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Getters ---------- //

  /// @notice Returns if a user is whitelisted
  function isWhitelisted(address _user) public view returns (bool) {
    return _getWhitelistAndBlacklistStorage()._whitelisted[_user];
  }

  /// @notice Returns if a user is blacklisted
  function isBlacklisted(address _user) public view returns (bool) {
    return _getWhitelistAndBlacklistStorage()._blacklisted[_user];
  }

  // ---------- Setters ---------- //

  /// @notice user can be whitelisted but the counter will not be reset
  function whitelist(address _user) external override onlyRoleOrAdmin(WHITELISTER_ROLE) {
    _getWhitelistAndBlacklistStorage()._whitelisted[_user] = true;
    emit UserWhitelisted(_user, msg.sender);
  }

  /// @notice Removes a user from the whitelist
  function removeFromWhitelist(address _user) external onlyRoleOrAdmin(WHITELISTER_ROLE) {
    _getWhitelistAndBlacklistStorage()._whitelisted[_user] = false;
    emit RemovedUserFromWhitelist(_user, msg.sender);
  }

  /// @notice user can be blacklisted but the counter will not be reset
  function blacklist(address _user) external override onlyRoleOrAdmin(WHITELISTER_ROLE) {
    _getWhitelistAndBlacklistStorage()._blacklisted[_user] = true;
    emit UserBlacklisted(_user, msg.sender);
  }

  /// @notice Removes a user from the blacklist
  function removeFromBlacklist(address _user) external onlyRoleOrAdmin(WHITELISTER_ROLE) {
    _getWhitelistAndBlacklistStorage()._blacklisted[_user] = false;
    emit RemovedUserFromBlacklist(_user, msg.sender);
  }
}
