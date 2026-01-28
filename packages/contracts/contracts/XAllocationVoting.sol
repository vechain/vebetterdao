// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./x-allocation-voting-governance/XAllocationVotingGovernor.sol";
import "./x-allocation-voting-governance/modules/RoundVotesCountingUpgradeable.sol";
import "./x-allocation-voting-governance/modules/VotesUpgradeable.sol";
import "./x-allocation-voting-governance/modules/VotesQuorumFractionUpgradeable.sol";
import "./x-allocation-voting-governance/modules/VotingSettingsUpgradeable.sol";
import "./x-allocation-voting-governance/modules/RoundEarningsSettingsUpgradeable.sol";
import "./x-allocation-voting-governance/modules/RoundFinalizationUpgradeable.sol";
import "./x-allocation-voting-governance/modules/RoundsStorageUpgradeable.sol";
import "./x-allocation-voting-governance/modules/ExternalContractsUpgradeable.sol";
import "./x-allocation-voting-governance/modules/AutoVotingLogicUpgradeable.sol";
import "./interfaces/INavigator.sol";
import "./interfaces/IB3TRGovernor.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title XAllocationVoting - V9 with Navigator delegation
contract XAllocationVoting is
  XAllocationVotingGovernor,
  VotingSettingsUpgradeable,
  RoundVotesCountingUpgradeable,
  VotesUpgradeable,
  VotesQuorumFractionUpgradeable,
  RoundEarningsSettingsUpgradeable,
  ExternalContractsUpgradeable,
  RoundsStorageUpgradeable,
  RoundFinalizationUpgradeable,
  AccessControlUpgradeable,
  UUPSUpgradeable,
  AutoVotingLogicUpgradeable
{
  bytes32 public constant ROUND_STARTER_ROLE = keccak256("ROUND_STARTER_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

  struct InitializationData {
    IVotes vot3Token;
    uint256 quorumPercentage;
    uint32 initialVotingPeriod;
    address timeLock;
    IVoterRewards voterRewards;
    IEmissions emissions;
    address[] admins;
    address upgrader;
    IX2EarnApps x2EarnAppsAddress;
    uint256 baseAllocationPercentage;
    uint256 appSharesCap;
    uint256 votingThreshold;
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(InitializationData memory data) public initializer {
    require(address(data.vot3Token) != address(0), "XAV: invalid VOT3");
    require(address(data.voterRewards) != address(0), "XAV: invalid VoterRewards");
    require(address(data.emissions) != address(0), "XAV: invalid Emissions");

    __XAllocationVotingGovernor_init("XAllocationVoting");
    __ExternalContracts_init(data.x2EarnAppsAddress, data.emissions, data.voterRewards);
    __VotingSettings_init(data.initialVotingPeriod);
    __RoundVotesCounting_init(data.votingThreshold);
    __Votes_init(data.vot3Token);
    __VotesQuorumFraction_init(data.quorumPercentage);
    __RoundEarningsSettings_init(data.baseAllocationPercentage, data.appSharesCap);
    __RoundFinalization_init();
    __RoundsStorage_init();
    __AccessControl_init();
    __UUPSUpgradeable_init();

    for (uint256 i; i < data.admins.length; i++) {
      require(data.admins[i] != address(0), "XAV: invalid admin");
      _grantRole(DEFAULT_ADMIN_ROLE, data.admins[i]);
    }

    _grantRole(UPGRADER_ROLE, data.upgrader);
    _grantRole(GOVERNANCE_ROLE, data.timeLock);
  }

  function initializeV9(INavigator _nav, IB3TRGovernor _b3trGovernor) external reinitializer(9) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    $._navigator = _nav;
    $._b3trGovernor = _b3trGovernor;
  }

  function toggleAutoVoting(address user) public {
    if (_msgSender() != user) revert InvalidCaller(_msgSender());
    _toggleAutoVoting(user);
  }

  function setUserVotingPreferences(bytes32[] memory appIds) public {
    _setUserVotingPreferences(_msgSender(), appIds);
  }

  function setVotingThreshold(uint256 v) public virtual override onlyRole(GOVERNANCE_ROLE) {
    super.setVotingThreshold(v);
  }

  function startNewRound() public override onlyRole(ROUND_STARTER_ROLE) returns (uint256) {
    return super.startNewRound();
  }

  function setAppSharesCap(uint256 v) external virtual override onlyRole(GOVERNANCE_ROLE) {
    _setAppSharesCap(v);
  }

  function setBaseAllocationPercentage(uint256 v) public virtual override onlyRole(GOVERNANCE_ROLE) {
    _setBaseAllocationPercentage(v);
  }

  function setVotingPeriod(uint32 v) public virtual onlyRole(GOVERNANCE_ROLE) {
    _setVotingPeriod(v);
  }

  function updateQuorumNumerator(uint256 v) public virtual override onlyRole(GOVERNANCE_ROLE) {
    super.updateQuorumNumerator(v);
  }

  function isUserAutoVotingEnabled(address user) public view returns (bool) {
    return _isAutoVotingEnabled(user);
  }

  function isUserAutoVotingEnabledInCurrentRound(address a) public view returns (bool) {
    return _isAutoVotingEnabledAtTimepoint(a, uint48(emissions().lastEmissionBlock()));
  }

  function isUserAutoVotingEnabledForRound(address a, uint256 r) public view returns (bool) {
    return _isAutoVotingEnabledAtTimepoint(a, uint48(roundSnapshot(r)));
  }

  function isUserAutoVotingEnabledAtTimepoint(address a, uint48 t) public view returns (bool) {
    return _isAutoVotingEnabledAtTimepoint(a, t);
  }

  function getUserVotingPreferences(address a) public view returns (bytes32[] memory) {
    return _getUserVotingPreferences(a);
  }

  function getTotalAutoVotingUsersAtRoundStart() public view returns (uint208) {
    return _getTotalAutoVotingUsersAtTimepoint(uint48(emissions().lastEmissionBlock()));
  }

  function getTotalAutoVotingUsersAtTimepoint(uint48 t) public view returns (uint208) {
    return _getTotalAutoVotingUsersAtTimepoint(t);
  }

  function x2EarnApps()
    public
    view
    override(ExternalContractsUpgradeable, XAllocationVotingGovernor, AutoVotingLogicUpgradeable)
    returns (IX2EarnApps)
  {
    return ExternalContractsUpgradeable.x2EarnApps();
  }

  function roundQuorum(uint256 r) external view returns (uint256) {
    return quorum(roundSnapshot(r));
  }

  function votingPeriod() public view override(XAllocationVotingGovernor, VotingSettingsUpgradeable) returns (uint256) {
    return super.votingPeriod();
  }

  function quorum(uint256 b) public view override(XAllocationVotingGovernor, VotesQuorumFractionUpgradeable) returns (uint256) {
    return super.quorum(b);
  }

  function supportsInterface(bytes4 i) public view override(AccessControlUpgradeable, XAllocationVotingGovernor) returns (bool) {
    return super.supportsInterface(i);
  }

  function hasVoted(uint256 r, address a) public view override(XAllocationVotingGovernor, RoundVotesCountingUpgradeable) returns (bool) {
    return RoundVotesCountingUpgradeable.hasVoted(r, a);
  }

  function navigator() public view override(XAllocationVotingGovernor, ExternalContractsUpgradeable) returns (INavigator) {
    return ExternalContractsUpgradeable.navigator();
  }

  function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}
}
