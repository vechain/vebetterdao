// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IVeBetterPassport } from "./interfaces/IVeBetterPassport.sol";
import { BotSignaling } from "./modules/BotSignaling.sol";
import { ProofOfParticipation } from "./modules/ProofOfParticipation.sol";
import { IXAllocationVotingGovernor } from "../interfaces/IXAllocationVotingGovernor.sol";

contract VeBetterPassport is
  AccessControlUpgradeable,
  UUPSUpgradeable,
  ProofOfParticipation,
  BotSignaling,
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
    0x525c75e32ceef242f2da07b664b7c31005134df413b2946d2db9b8715bb6b900;

  function _getVeBetterPassportStorage() private pure returns (VeBetterPassportStorage storage $) {
    assembly {
      $.slot := VeBetterPassportStorageLocation
    }
  }

  struct InitializationData {
    IXAllocationVotingGovernor xAllocationVoting;
    address x2EarnApps;
    address upgrader;
    address[] admins;
    address[] roleGranters;
    address[] blacklisters;
    address[] whitelisters;
    address actionRegistrar;
    address actionScoreManager;
    uint256 threshold;
    uint256 roundsForCumulativeScore;
  }

  /// @notice Initializes the contract
  function initialize(InitializationData memory data) external initializer {
    require(address(data.xAllocationVoting) != address(0), "VeBetterPassport: xAllocationVoting is the zero address");
    require(data.x2EarnApps != address(0), "VeBetterPassport: x2EarnApps is the zero address");
    require(data.upgrader != address(0), "VeBetterPassport: upgrader is the zero address");

    __UUPSUpgradeable_init();
    __AccessControl_init();
    __ProofOfParticipation_init(
      data.x2EarnApps,
      data.xAllocationVoting,
      data.actionRegistrar,
      data.actionScoreManager,
      data.threshold,
      data.roundsForCumulativeScore
    );
    __BotSignaling_init(data.blacklisters, data.whitelisters);

    VeBetterPassportStorage storage $ = _getVeBetterPassportStorage();
    $.xAllocationVoting = data.xAllocationVoting;

    // Grant roles
    _grantRole(UPGRADER_ROLE, data.upgrader);

    for (uint256 i; i < data.admins.length; i++) {
      require(data.admins[i] != address(0), "VeBetterPassport: admin address cannot be zero");
      _grantRole(DEFAULT_ADMIN_ROLE, data.admins[i]);
    }

    for (uint256 i; i < data.roleGranters.length; i++) {
      require(data.roleGranters[i] != address(0), "VeBetterPassport: role granter address cannot be zero");
      _grantRole(ROLE_GRANTER, data.roleGranters[i]);
    }
  }

  // ---------- Modifiers ------------ //

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) override(BotSignaling, ProofOfParticipation) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert VeBetterPassportUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Authorizers ---------- //

  /// @notice Authorizes the upgrade of the contract
  /// @param newImplementation - the new implementation address
  function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

  // ---------- Getters ---------- //

  /**
   * @dev Checks if a wallet is a person or not based on the participation score, blacklisting, and xnode and GM holdings
   */
  function isPerson(address _user) public view returns (bool) {
    // If a wallet is not whitelisted and has been signaled more than 2 times
    if (!isWhitelisted(_user) && signaledCounter(_user) > 2) {
      return false;
    }

    VeBetterPassportStorage storage $ = _getVeBetterPassportStorage();

    // If the user's cumulated score in the last rounds is greater than or equal to the threshold
    uint256 participationScore = getQuadraticCumulativeScore(_user, $.xAllocationVoting.currentRoundId());
    if (participationScore >= thresholdParticipationScore()) return true;

    // TODO: gm

    // TODO: check xnode

    return false;
  }

  /// @notice Returns the version of the contract
  function version() public pure virtual returns (string memory) {
    return "1";
  }

  // ---------- Setters ---------- //

  // ---------- Overrides ---------- //

  /// @dev Grants a role to an account
  /// @notice Overrides the grantRole function to add a modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to grant
  /// @param account - the account to grant the role to
  function grantRole(
    bytes32 role,
    address account
  ) public override(AccessControlUpgradeable, IVeBetterPassport) onlyRoleOrAdmin(ROLE_GRANTER) {
    _grantRole(role, account);
  }

  /// @dev Revokes a role from an account
  /// @notice Overrides the revokeRole function to add a modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to revoke
  /// @param account - the account to revoke the role from
  function revokeRole(
    bytes32 role,
    address account
  ) public override(AccessControlUpgradeable, IVeBetterPassport) onlyRoleOrAdmin(ROLE_GRANTER) {
    _revokeRole(role, account);
  }

  /// @dev Assigns a signaler to an app, allowing us to track the amount of signals from a specific app
  /// @notice to be used together with grantRole
  /// @param _app - the app ID
  /// @param user - the signaler address
  function assignSignalerToApp(bytes32 _app, address user) external onlyRoleOrAdmin(ROLE_GRANTER) {
    _assignSignalerToApp(_app, user);
  }

  /// @dev Removes a signaler from an app
  /// @notice to be used together with revokeRole
  /// @param user - the signaler address
  function removeSignalerFromApp(address user) external onlyRoleOrAdmin(ROLE_GRANTER) {
    _removeSignalerFromApp(user);
  }
}
