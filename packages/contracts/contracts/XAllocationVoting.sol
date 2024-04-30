// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./x-allocation-voting-governance/XAllocationVotingGovernor.sol";
import "./x-allocation-voting-governance/modules/XAllocationGovernorVotesCountingUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAllocationGovernorVotesUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAllocationGovernorVotesQuorumFractionUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAllocationGovernorSettingsUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAllocationEarningsSettings.sol";
import "./x-allocation-voting-governance/modules/RoundFinalizationUpgradeable.sol";
import "./x-allocation-voting-governance/modules/RoundsStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { DataTypes } from "./libraries/DataTypes.sol";

contract XAllocationVoting is
  Initializable,
  XAllocationVotingGovernor,
  XAllocationGovernorSettingsUpgradeable,
  XAllocationGovernorVotesCountingUpgradeable,
  XAllocationGovernorVotesUpgradeable,
  XAllocationGovernorVotesQuorumFractionUpgradeable,
  XAllocationEarningsSettings,
  RoundsStorageUpgradeable,
  RoundFinalizationUpgradeable,
  AccessControlUpgradeable,
  UUPSUpgradeable
{
  bytes32 public constant ROUND_STARTER_ROLE = keccak256("ROUND_STARTER_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /**
   * @notice Data for initializing the contract
   * @param vot3Token The address of the Vot3 token used for voting
   * @param quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param initialVotingPeriod How long does a proposal remain open to votes
   * @param b3trGovernor The address of the B3trGovernor contract
   * @param voterRewards The address of the VoterRewards contract
   * @param emissions The address of the Emissions contract
   * @param admins The addresses of the admins
   * @param upgrader The address of the upgrader
   * @param xAppsBaseURI The base URI for the xApps
   * @param baseAllocationPercentage The base allocation percentage
   * @param appSharesCap The app shares cap
   */
  struct InitializationData {
    IVotes vot3Token;
    uint256 quorumPercentage;
    uint32 initialVotingPeriod;
    IB3TRGovernor b3trGovernor;
    address voterRewards;
    address emissions;
    address[] admins;
    address upgrader;
    IX2EarnApps x2EarnAppsAddress;
    uint256 baseAllocationPercentage;
    uint256 appSharesCap;
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @notice Initialize the contract
   * @param data The initialization data
   */
  function initialize(InitializationData memory data) public initializer {
    __XAllocationVotingGovernor_init("XAllocationVoting", data.b3trGovernor, data.x2EarnAppsAddress);
    __GovernorSettings_init(data.initialVotingPeriod, data.emissions);
    __GovernorXAllocationVotesCounting_init(data.voterRewards);
    __GovernorVotes_init(data.vot3Token);
    __GovernorVotesQuorumFraction_init(data.quorumPercentage);
    __XAllocationEarningsSettings_init(data.baseAllocationPercentage, data.appSharesCap);
    __RoundFinalization_init();
    __RoundsStorage_init();
    __AccessControl_init();
    __UUPSUpgradeable_init();

    for (uint256 i = 0; i < data.admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, data.admins[i]);
    }

    _grantRole(UPGRADER_ROLE, data.upgrader);
  }

  // ---------- Setters ---------- //

  function setB3trGovernanceAddress(address b3trGovernor_) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    require(b3trGovernor_ != address(0), "XAllocationVoting: new B3trGovernor is the zero address");

    _getXAllocationVotingGovernorStorage()._b3trGovernor = IB3TRGovernor(payable(b3trGovernor_));
  }

  function startNewRound() public override onlyRole(ROUND_STARTER_ROLE) returns (uint256) {
    return super.startNewRound();
  }

  function setAdminRole(address _newAdmin) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_newAdmin != address(0), "XAllocationVoting: new admin is the zero address");

    _grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
  }

  function setAppSharesCap(uint256 appSharesCap_) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
    _setAppSharesCap(appSharesCap_);
  }

  function setBaseAllocationPercentage(
    uint256 baseAllocationPercentage_
  ) public virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
    _setBaseAllocationPercentage(baseAllocationPercentage_);
  }

  // ---------- Getters ---------- //

  /**
   * Returns the quorum for a given round
   */
  function roundQuorum(uint256 roundId) public view returns (uint256) {
    return quorum(roundSnapshot(roundId));
  }

  // ---------- Required overrides ---------- //

  function votingPeriod()
    public
    view
    override(XAllocationVotingGovernor, XAllocationGovernorSettingsUpgradeable)
    returns (uint256)
  {
    return super.votingPeriod();
  }

  function quorum(
    uint256 blockNumber
  )
    public
    view
    override(XAllocationVotingGovernor, XAllocationGovernorVotesQuorumFractionUpgradeable)
    returns (uint256)
  {
    return super.quorum(blockNumber);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(AccessControlUpgradeable, XAllocationVotingGovernor) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  // ---------- Authorizations ------------ //

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
