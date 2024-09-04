// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IVeBetterPassport } from "./interfaces/IVeBetterPassport.sol";
import { Blacklist } from "./modules/Blacklist.sol";
import { ProofOfParticipation } from "./modules/ProofOfParticipation.sol";
import { IXAllocationVotingGovernor } from "../interfaces/IXAllocationVotingGovernor.sol";

contract VeBetterPassport is
  AccessControlUpgradeable,
  UUPSUpgradeable,
  ProofOfParticipation,
  Blacklist,
  IVeBetterPassport
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant ROLE_GRANTER = keccak256("ROLE_GRANTER");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  // ---------- Storage ------------ //

  struct VeBetterPassportStorage {
    IXAllocationVotingGovernor xAllocationVoting;
  }

  // keccak256(abi.encode(uint256(keccak256("storage.VeBetterPassport")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant VeBetterPassportStorageLocation =
    0xc9931bd7ecbba177fc71b0ded00eb01d4035361d4a0ee711add00987aca69000;

  function _getVeBetterPassportStorage() private pure returns (VeBetterPassportStorage storage $) {
    assembly {
      $.slot := VeBetterPassportStorageLocation
    }
  }

  /// @notice Initializes the contract
  function initialize(
    address _upgrader,
    address[] memory _admins,
    address[] memory _roleGranters,
    address[] memory _blacklisters,
    address[] memory _whitelisters,
    address _x2EarnApps,
    IXAllocationVotingGovernor _xAllocationVoting
  ) external initializer {
    require(address(_xAllocationVoting) != address(0), "VeBetterPassport: xAllocationVoting is the zero address");
    require(_x2EarnApps != address(0), "VeBetterPassport: x2EarnApps is the zero address");
    require(_upgrader != address(0), "VeBetterPassport: upgrader is the zero address");

    __UUPSUpgradeable_init();
    __AccessControl_init();
    __ProofOfParticipation_init(_x2EarnApps, _xAllocationVoting);
    __Blacklist_init(_blacklisters, _whitelisters);

    VeBetterPassportStorage storage $ = _getVeBetterPassportStorage();
    $.xAllocationVoting = _xAllocationVoting;

    // Grant roles
    _grantRole(UPGRADER_ROLE, _upgrader);

    for (uint256 i; i < _admins.length; i++) {
      require(_admins[i] != address(0), "VeBetterPassport: admin address cannot be zero");
      _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
    }

    for (uint256 i; i < _roleGranters.length; i++) {
      require(_roleGranters[i] != address(0), "VeBetterPassport: role granter address cannot be zero");
      _grantRole(ROLE_GRANTER, _roleGranters[i]);
    }
  }

  // ---------- Modifiers ------------ //

  /**
   * @dev Modifier to restrict access to only the admin role and the app admin role.
   * @param appId the app ID
   */
  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) override(Blacklist, ProofOfParticipation) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert VeBetterPassportUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Authorizers ---------- //

  /// @notice Authorizes the upgrade of the contract
  /// @param newImplementation - the new implementation address
  function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

  // ---------- Setters ---------- //

  /// @dev Grants a role to an account
  /// @notice Overrides the grantRole function to add a modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to grant
  /// @param account - the account to grant the role to
  function grantRole(bytes32 role, address account) public override onlyRoleOrAdmin(ROLE_GRANTER) {
    _grantRole(role, account);
  }

  /// @dev Revokes a role from an account
  /// @notice Overrides the revokeRole function to add a modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to revoke
  /// @param account - the account to revoke the role from
  function revokeRole(bytes32 role, address account) public override onlyRoleOrAdmin(ROLE_GRANTER) {
    _revokeRole(role, account);
  }

  // ---------- Getters ---------- //

  function isPerson(address _user) public view returns (bool) {
    // If a wallet is blacklisted and has been blacklisted more than once, it is not a person
    if (!isBlacklisted(_user)) {
      return true;
    }

    VeBetterPassportStorage storage $ = _getVeBetterPassportStorage();

    uint256 participationScore = getQuadraticCumulativeScore(_user, $.xAllocationVoting.currentRoundId());
    // If the user's cumulated quadratic score in the round is greater than or equal to the round threshold
    if (participationScore >= roundThreshold()) return true;
    // If the total score is considered for personhood and the user's total score is greater than or equal to the total threshold
    if (isTotalScoreConsidered() && userTotalScore(_user) >= totalThreshold()) return true;

    return false;
  }

  /// @notice Returns the version of the contract
  function version() public pure virtual returns (string memory) {
    return "1";
  }
}
