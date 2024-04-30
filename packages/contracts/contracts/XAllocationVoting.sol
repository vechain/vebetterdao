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
import "./x-allocation-voting-governance/modules/ExternalContractsUpgradeable.sol";
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
  ExternalContractsUpgradeable,
  RoundsStorageUpgradeable,
  RoundFinalizationUpgradeable,
  AccessControlUpgradeable,
  UUPSUpgradeable
{
  /// @notice Role identifier for the address that can start a new round
  bytes32 public constant ROUND_STARTER_ROLE = keccak256("ROUND_STARTER_ROLE");
  /// @notice Role identifier for the address that can upgrade the contract
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  /// @notice Role identifier for governance operations
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

  /**
   * @notice Data for initializing the contract
   * @param vot3Token The address of the Vot3 token used for voting
   * @param quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param initialVotingPeriod How long does a proposal remain open to votes
   * @param _timeLock Address of the timelock contract controlling governance actions
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
    address timeLock;
    IVoterRewards voterRewards;
    IEmissions emissions;
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
    __XAllocationVotingGovernor_init("XAllocationVoting");
    __ExternalContracts_init(data.x2EarnAppsAddress, data.emissions, data.voterRewards);
    __GovernorSettings_init(data.initialVotingPeriod);
    __GovernorXAllocationVotesCounting_init();
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
    _grantRole(GOVERNANCE_ROLE, data.timeLock);
  }

  // ---------- Setters ---------- //
  function setX2EarnAppsAddress(IX2EarnApps newX2EarnApps) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setX2EarnApps(newX2EarnApps);
  }

  function setEmissionsAddress(IEmissions newEmissions) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setEmissions(newEmissions);
  }

  function setVoterRewardsAddress(IVoterRewards newVoterRewards) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setVoterRewards(newVoterRewards);
  }

  function startNewRound() public override onlyRole(ROUND_STARTER_ROLE) returns (uint256) {
    return super.startNewRound();
  }

  function setAppSharesCap(uint256 appSharesCap_) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
    _setAppSharesCap(appSharesCap_);
  }

  function setBaseAllocationPercentage(
    uint256 baseAllocationPercentage_
  ) public virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
    _setBaseAllocationPercentage(baseAllocationPercentage_);
  }

  function setVotingPeriod(uint32 newVotingPeriod) public virtual onlyRole(GOVERNANCE_ROLE) {
    _setVotingPeriod(newVotingPeriod);
  }

  function updateQuorumNumerator(uint256 newQuorumNumerator) public virtual override onlyRole(GOVERNANCE_ROLE) {
    super.updateQuorumNumerator(newQuorumNumerator);
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
