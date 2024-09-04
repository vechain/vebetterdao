// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IBlacklist } from "../interfaces/IBlacklist.sol";

contract Blacklist is Initializable, AccessControlUpgradeable, IBlacklist {
  bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");
  bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  // ---------- Storage ------------ //

  struct BlacklistStorage {
    // Mapping to store blacklist status
    mapping(address user => bool) _blacklist;
    mapping(address user => uint256) _blacklistCounter;
  }

  // keccak256(abi.encode(uint256(keccak256("storage.Blacklist")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant BlacklistStorageLocation =
    0x9ffa16eb72159005d2d25d4912adfb2b37f2cbac37eb07513de20f97b58df600;

  function _getBlacklistStorage() private pure returns (BlacklistStorage storage $) {
    assembly {
      $.slot := BlacklistStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __Blacklist_init(address[] memory _blacklisters, address[] memory _whitelisters) internal onlyInitializing {
    __Blacklist_init_unchained(_blacklisters, _whitelisters);
  }

  function __Blacklist_init_unchained(
    address[] memory _blacklisters,
    address[] memory _whitelisters
  ) internal onlyInitializing {
    for (uint256 i; i < _blacklisters.length; i++) {
      require(_blacklisters[i] != address(0), "Blacklist: blacklister address cannot be zero");
      _grantRole(BLACKLISTER_ROLE, _blacklisters[i]);
    }

    for (uint256 i; i < _whitelisters.length; i++) {
      require(_whitelisters[i] != address(0), "Blacklist: whitelister address cannot be zero");
      _grantRole(WHITELISTER_ROLE, _whitelisters[i]);
    }
  }

  // ---------- Modifiers ------------ //

  /**
   * @dev Modifier to restrict access to only the admin role and the app admin role.
   * @param appId the app ID
   */
  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) virtual {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert BlacklistUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Setters ---------- //

  function blacklistUser(address _user) external override onlyRoleOrAdmin(BLACKLISTER_ROLE) {
    _getBlacklistStorage()._blacklistCounter[_user]++;
    _getBlacklistStorage()._blacklist[_user] = true;

    emit UserBlacklisted(_user, msg.sender);
  }

  /// @notice user can be whitelisted ( removed from blacklist ) but the counter will not be reset
  function whitelistUser(address _user) external override onlyRoleOrAdmin(WHITELISTER_ROLE) {
    _getBlacklistStorage()._blacklist[_user] = false;
    emit UserWhitelisted(_user, msg.sender);
  }

  // ---------- Getters ---------- //

  function isBlacklisted(address _user) public view returns (bool) {
    return _getBlacklistStorage()._blacklist[_user];
  }

  function blacklistingCounter(address _user) public view returns (uint256) {
    return _getBlacklistStorage()._blacklistCounter[_user];
  }
}
