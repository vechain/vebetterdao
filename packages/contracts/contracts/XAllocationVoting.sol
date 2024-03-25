// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./x-allocation-voting-governance/XAllocationVotingGovernor.sol";
import "./x-allocation-voting-governance/modules/GovernorXAllocationVotesCountingUpgradeable.sol";
import "./x-allocation-voting-governance/modules/GovernorVotesUpgradeable.sol";
import "./x-allocation-voting-governance/modules/GovernorVotesQuorumFractionUpgradeable.sol";
import "./x-allocation-voting-governance/modules/GovernorSettingsUpgradeable.sol";
import "./x-allocation-voting-governance/modules/XAppsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract XAllocationVoting is
  Initializable,
  XAllocationVotingGovernor,
  GovernorSettingsUpgradeable,
  GovernorXAllocationVotesCountingUpgradeable,
  GovernorVotesUpgradeable,
  GovernorVotesQuorumFractionUpgradeable,
  XAppsUpgradeable,
  AccessControlUpgradeable,
  UUPSUpgradeable
{
  bytes32 public constant ROUND_STARTER_ROLE = keccak256("ROUND_STARTER_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @notice initialize XAllocationVotingGovernor contract
   * @param _vot3Token The address of the Vot3 token used for voting
   * @param _quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param _initialVotingPeriod How long does a round remain open to votese
   * @param b3trGovernor_ The address of the B3trGovernor DAO
   * @param _voterRewards The address of the VoterRewards contract
   * @param _emissions The address of the emissions contract
   * @param _admins The addresses of the admins (DAO + another address) that can update the XAllocationPool address, only DAO will remain in the final version
   * @param _xAppsBaseURI The base URI for the xApps
   */
  function initialize(
    IVotes _vot3Token,
    uint256 _quorumPercentage,
    uint32 _initialVotingPeriod,
    address b3trGovernor_,
    address _voterRewards,
    address _emissions,
    address[] memory _admins,
    address upgrader,
    string memory _xAppsBaseURI
  ) public initializer {
    __XAllocationVotingGovernor_init("XAllocationVoting", b3trGovernor_);
    __GovernorSettings_init(_initialVotingPeriod, _emissions);
    __GovernorXAllocationVotesCounting_init(_voterRewards);
    __GovernorVotes_init(_vot3Token);
    __GovernorVotesQuorumFraction_init(_quorumPercentage);
    __XApps_init(_xAppsBaseURI);
    __AccessControl_init();
    __UUPSUpgradeable_init();

    for (uint256 i = 0; i < _admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
    }

    _grantRole(UPGRADER_ROLE, upgrader);
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  // ---------- Setters ---------- //

  function setB3trGovernanceAddress(address b3trGovernor_) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    require(b3trGovernor_ != address(0), "XAllocationVoting: new B3trGovernor is the zero address");

    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    $._b3trGovernor = IGovernor(payable(b3trGovernor_));
  }

  function startNewRound() public override onlyRole(ROUND_STARTER_ROLE) returns (uint256) {
    return super.startNewRound();
  }

  function _startNewRound(address proposer) internal virtual override returns (uint256 roundId) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();

    ++$._roundCount;
    roundId = $._roundCount;

    if ($._rounds[roundId].voteStart != 0) {
      revert GovernorUnexpectedRoundState(roundId, state(roundId), bytes32(0));
    }

    // If checkpoint for latest round was not already created, create it
    if (roundId > 1 && !isFinalized(roundId - 1)) {
      _finalizeRound(roundId - 1);
    }

    // save x-apps that users can vote for
    bytes32[] memory apps = allElegibleApps();
    $._appsElegibleForVoting[roundId] = apps;

    uint256 snapshot = clock();
    uint256 duration = votingPeriod();

    RoundCore storage round = $._rounds[roundId];
    round.proposer = proposer;
    round.voteStart = SafeCast.toUint48(snapshot);
    round.voteDuration = SafeCast.toUint32(duration);

    emit RoundCreated(roundId, proposer, snapshot, snapshot + duration);

    // Using a named return variable to avoid stack too deep errors
  }

  function setVotingElegibility(bytes32 appId, bool isElegible) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    super.setVotingElegibility(appId, isElegible);
  }

  function addApp(
    address appAddress,
    string memory appName,
    string memory metadataURI
  ) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    super.addApp(appAddress, appName, metadataURI);
  }

  function setAdminRole(address _newAdmin) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_newAdmin != address(0), "XAllocationVoting: new admin is the zero address");

    _grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
  }

  function setBaseURI(string memory baseURI_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setBaseURI(baseURI_);
  }

  function updateAppReceiverAddress(bytes32 appId, address newReceiverAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    super._updateAppReceiverAddress(appId, newReceiverAddress);
  }

  // ---------- Getters ---------- //

  function getCurrentAllocationRoundSnapshot() public view returns (uint256) {
    uint256 currentId = currentRoundId();
    return roundSnapshot(currentId);
  }

  /**
   * This function could not be efficient with a large number of apps
   */
  function getRoundAppsWithDetails(uint256 roundId) public view returns (App[] memory) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    XAppsStorage storage $xAppsStorage = _getXAppsStorageStorage();

    bytes32[] memory appsInRound = $._appsElegibleForVoting[roundId];
    App[] memory allApps = new App[](appsInRound.length);

    uint256 length = appsInRound.length;
    for (uint i = 0; i < length; i++) {
      allApps[i] = $xAppsStorage._apps[appsInRound[i]];
    }
    return allApps;
  }

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
    override(XAllocationVotingGovernor, GovernorSettingsUpgradeable)
    returns (uint256)
  {
    return super.votingPeriod();
  }

  function quorum(
    uint256 blockNumber
  ) public view override(XAllocationVotingGovernor, GovernorVotesQuorumFractionUpgradeable) returns (uint256) {
    return super.quorum(blockNumber);
  }

  function state(uint256 roundId) public view override(XAllocationVotingGovernor) returns (RoundState) {
    return super.state(roundId);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(AccessControlUpgradeable, XAllocationVotingGovernor) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
