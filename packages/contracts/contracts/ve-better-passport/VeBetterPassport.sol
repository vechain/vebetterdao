// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IVeBetterPassport } from "./interfaces/IVeBetterPassport.sol";
import { BotSignaling } from "./modules/BotSignaling.sol";
import { ProofOfParticipation } from "./modules/ProofOfParticipation.sol";
import { IXAllocationVotingGovernor } from "../interfaces/IXAllocationVotingGovernor.sol";
import { PersonhoodDelegation } from "./modules/PersonhoodDelegation.sol";
import { WhitelistAndBlacklist } from "./modules/WhitelistAndBlacklist.sol";
import { PersonhoodSettings } from "./modules/PersonhoodSettings.sol";
import { INodeManagement } from "../interfaces/INodeManagement.sol";
import { IGalaxyMember } from "../interfaces/IGalaxyMember.sol";
import { IX2EarnApps } from "../interfaces/IX2EarnApps.sol";

/// @title VeBetterPassport
/// @notice Contract to manage the VeBetterPassport, a system to determine if a wallet is a person or not
/// based on the participation score, blacklisting, and xnode, GM holdings and much more that can be added in the future.
contract VeBetterPassport is
  AccessControlUpgradeable,
  UUPSUpgradeable,
  PersonhoodDelegation,
  ProofOfParticipation,
  BotSignaling,
  WhitelistAndBlacklist,
  PersonhoodSettings,
  IVeBetterPassport
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant ROLE_GRANTER = keccak256("ROLE_GRANTER");

  // ---------- Storage ------------ //

  struct VeBetterPassportStorage {
    IXAllocationVotingGovernor xAllocationVoting;
    INodeManagement nodeManagement;
    IGalaxyMember galaxyMember;
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
    IX2EarnApps x2EarnApps;
    address nodeManagement;
    address galaxyMember;
    address upgrader;
    address[] admins;
    address[] settingsManagers;
    address[] roleGranters;
    address[] botSignalers;
    address[] whitelisters;
    address actionRegistrar;
    address actionScoreManager;
    uint256 threshold;
    uint256 signalingThreshold;
    uint256 roundsForCumulativeScore;
    uint256 minimumGalaxyMemberLevel;
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @notice Initializes the contract
  function initialize(InitializationData memory data) external initializer {
    require(address(data.xAllocationVoting) != address(0), "VeBetterPassport: xAllocationVoting is the zero address");
    require(address(data.x2EarnApps) != address(0), "VeBetterPassport: x2EarnApps is the zero address");
    require(data.upgrader != address(0), "VeBetterPassport: upgrader is the zero address");
    require(data.nodeManagement != address(0), "VeBetterPassport: nodeManagement is the zero address");
    require(data.galaxyMember != address(0), "VeBetterPassport: galaxyMember is the zero address");
    require(data.minimumGalaxyMemberLevel > 0, "VeBetterPassport: minimumGalaxyMemberLevel is 0");

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
    __BotSignaling_init(data.botSignalers, data.signalingThreshold, data.x2EarnApps);
    __PersonhoodDelegation_init();
    __WhitelistAndBlacklist_init(data.whitelisters);
    __PersonhoodSettings_init(data.settingsManagers, data.minimumGalaxyMemberLevel);

    VeBetterPassportStorage storage $ = _getVeBetterPassportStorage();
    $.xAllocationVoting = data.xAllocationVoting;
    $.nodeManagement = INodeManagement(data.nodeManagement);
    $.galaxyMember = IGalaxyMember(data.galaxyMember);

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
  modifier onlyRoleOrAdmin(bytes32 role)
    override(BotSignaling, ProofOfParticipation, PersonhoodDelegation, WhitelistAndBlacklist) {
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
   * @return isPerson bool representing if the user is considered a person
   * @return reason string representing the reason for the result
   */
  function isPerson(address _user) public view returns (bool, string memory) {
    // If a wallet is whitelisted, it is a person
    if (whitelistCheckEnabled() && isWhitelisted(_user)) {
      return (true, "User is whitelisted");
    }

    // If a wallet is blacklisted, it is not a person
    if (blacklistCheckEnabled() && isBlacklisted(_user)) {
      return (false, "User is blacklisted");
    }

    // If a wallet is not whitelisted and has been signaled more than X times
    if ((signalingCheckEnabled() && signaledCounter(_user) >= signalingThreshold())) {
      return (false, "User has been signaled too many times");
    }

    VeBetterPassportStorage storage $ = _getVeBetterPassportStorage();

    if (participationScoreCheckEnabled()) {
      uint256 participationScore = getCumulativeScoreWithDecay(_user, $.xAllocationVoting.currentRoundId());

      // If the user's cumulated score in the last rounds is greater than or equal to the threshold
      if ((participationScore >= thresholdParticipationScore())) {
        return (true, "User's participation score is above the threshold");
      }
    }

    // Check if user owns an economic or xnode
    if (nodeOwnershipCheckEnabled() && ($.nodeManagement.getNodeIds(_user).length > 0)) {
      return (true, "User owns an economic or xnode");
    }

    // TODO: With `GalaxyMember` version 2, Check if user's selected `GalaxyMember` `tokenId` is greater than `getMinimumGalaxyMemberLevel()`

    // If none of the conditions are met, return false with the default reason
    return (false, "User does not meet the criteria to be considered a person");
  }

  /// @notice Returns the version of the contract
  function version() public pure virtual returns (string memory) {
    return "1";
  }

  // ---------- Getters ---------- //

  /// @notice Returns the xAllocationVoting contract
  function getXallocationVoting() external view returns (IXAllocationVotingGovernor) {
    return _getVeBetterPassportStorage().xAllocationVoting;
  }

  /// @notice Returns the nodeManagement contract
  function getNodeManagement() external view returns (INodeManagement) {
    return _getVeBetterPassportStorage().nodeManagement;
  }

  /// @notice Returns the galaxyMember contract
  function getGalaxyMember() external view returns (IGalaxyMember) {
    return _getVeBetterPassportStorage().galaxyMember;
  }

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

  /// @notice Resets the signals of a user
  /// @dev assigns the signals of a user to zero
  /// @param _user - the address of the user
  function resetUserSignals(address _user) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _resetUserSignals(_user, "");
  }

  /// @notice Resets the signals of a user with a given reason
  /// @dev assigns the signals of a user to zero
  /// @param _user - the address of the user
  /// @param _reason - the reason for resetting the signals
  function resetUserSignalsWithReason(address _user, string memory _reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _resetUserSignals(_user, _reason);
  }
}
