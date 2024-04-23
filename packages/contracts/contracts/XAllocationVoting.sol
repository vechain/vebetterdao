// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./x-allocation-voting-governance/XAllocationVotingGovernor.sol";
import "./x-allocation-voting-governance/modules/XAllocationGovernorVotesCountingUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAllocationGovernorVotesUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAllocationGovernorVotesQuorumFractionUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAllocationGovernorSettingsUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAppsUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAllocationEarningsSettings.sol";
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
  XAppsUpgradeable,
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
    address b3trGovernor;
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
    __XAllocationVotingGovernor_init("XAllocationVoting", data.b3trGovernor);
    __GovernorSettings_init(data.initialVotingPeriod, data.emissions);
    __GovernorXAllocationVotesCounting_init(data.voterRewards);
    __GovernorVotes_init(data.vot3Token);
    __GovernorVotesQuorumFraction_init(data.quorumPercentage);
    __XApps_init(data.x2EarnAppsAddress);
    __XAllocationEarningsSettings_init(data.baseAllocationPercentage, data.appSharesCap);
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

  function _startNewRound(address proposer) internal virtual override returns (uint256 roundId) {
    EarningsSettingsStorage storage $ = _getEarningsSettingsStorage();
    XAllocationVotingGovernorStorage storage xAllocationVotingGovernorStorage = _getXAllocationVotingGovernorStorage();

    ++xAllocationVotingGovernorStorage._roundCount;
    roundId = xAllocationVotingGovernorStorage._roundCount;

    if (xAllocationVotingGovernorStorage._rounds[roundId].voteStart != 0) {
      revert GovernorUnexpectedRoundState(roundId, state(roundId), bytes32(0));
    }

    // Do not run for the first round
    if (roundId > 1) {
      // finalize the previous round
      _finalizeRound(roundId - 1);
    }

    // save x-apps that users can vote for
    bytes32[] memory apps = allElegibleApps();
    xAllocationVotingGovernorStorage._appsElegibleForVoting[roundId] = apps;

    // save the base allocation percentage and app shares cap for this round
    $._roundBaseAllocationPercentage[roundId] = $.baseAllocationPercentage;
    $._roundAppSharesCap[roundId] = $.appSharesCap;

    uint256 snapshot = clock();
    uint256 duration = votingPeriod();

    RoundCore storage round = xAllocationVotingGovernorStorage._rounds[roundId];
    round.proposer = proposer;
    round.voteStart = SafeCast.toUint48(snapshot);
    round.voteDuration = SafeCast.toUint32(duration);

    emit RoundCreated(roundId, proposer, snapshot, snapshot + duration);

    // Using a named return variable to avoid stack too deep errors
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
