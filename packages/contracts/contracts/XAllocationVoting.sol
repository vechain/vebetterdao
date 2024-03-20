// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./x-allocation-voting-governance/XAllocationVotingGovernor.sol";
import "./x-allocation-voting-governance/modules/GovernorXAllocationVotesCounting.sol";
import "./x-allocation-voting-governance/modules/GovernorVotes.sol";
import "./x-allocation-voting-governance/modules/GovernorVotesQuorumFraction.sol";
import "./x-allocation-voting-governance/modules/GovernorSettings.sol";
import "./x-allocation-voting-governance/modules/XApps.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract XAllocationVoting is
  XAllocationVotingGovernor,
  GovernorSettings,
  GovernorXAllocationVotesCounting,
  GovernorVotes,
  GovernorVotesQuorumFraction,
  XApps,
  AccessControl
{
  bytes32 public constant ROUND_STARTER_ROLE = keccak256("ROUND_STARTER_ROLE");

  uint256 public baseAllocationPercentage;
  uint256 public appSharesCap;

  mapping(uint256 => uint256) private _roundBaseAllocationPercentage;
  mapping(uint256 => uint256) private _roundAppSharesCap;

  /**
   * @notice Construct a XAllocationVotingGovernor contract
   * @param _vot3Token The address of the Vot3 token used for voting
   * @param _quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param _initialVotingPeriod How long does a round remain open to votese
   * @param b3trGovernor_ The address of the B3trGovernor DAO
   * @param _voterRewards The address of the VoterRewards contract
   * @param _admins The addresses of the admins (DAO + another address) that can update the XAllocationPool address, only DAO will remain in the final version
   * @param _xAppsBaseURI The base URI for the xApps
   */
  constructor(
    IVotes _vot3Token,
    uint256 _quorumPercentage,
    uint32 _initialVotingPeriod,
    address b3trGovernor_,
    address _voterRewards,
    address[] memory _admins,
    string memory _xAppsBaseURI,
    uint256 baseAllocationPercentage_,
    uint256 appSharesCap_
  )
    XAllocationVotingGovernor("XAllocationVoting", b3trGovernor_)
    GovernorSettings(_initialVotingPeriod)
    GovernorVotes(_vot3Token)
    GovernorVotesQuorumFraction(_quorumPercentage)
    GovernorXAllocationVotesCounting(_voterRewards)
    XApps(_xAppsBaseURI)
  {
    for (uint256 i = 0; i < _admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
    }

    setBaseAllocationPercentage(baseAllocationPercentage_);
    setAppSharesCap(appSharesCap_);
  }

  // ---------- Setters ---------- //

  function setB3trGovernanceAddress(address b3trGovernor_) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    require(b3trGovernor_ != address(0), "XAllocationVoting: new B3trGovernor is the zero address");
    _b3trGovernor = IGovernor(payable(b3trGovernor_));
  }

  function startNewRound() public override onlyRole(ROUND_STARTER_ROLE) returns (uint256) {
    return super.startNewRound();
  }

  function _startNewRound(address proposer) internal virtual override returns (uint256 roundId) {
    ++_roundCount;
    roundId = _roundCount;

    if (_rounds[roundId].voteStart != 0) {
      revert GovernorUnexpectedRoundState(roundId, state(roundId), bytes32(0));
    }

    // If checkpoint for latest round was not already created, create it
    if (roundId > 1 && !isFinalized(roundId - 1)) {
      _finalizeRound(roundId - 1);
    }

    // save x-apps that users can vote for
    bytes32[] memory apps = allElegibleApps();
    _appsElegibleForVoting[roundId] = apps;

    // save the base allocation percentage and app shares cap for this round
    _roundBaseAllocationPercentage[roundId] = baseAllocationPercentage;
    _roundAppSharesCap[roundId] = appSharesCap;

    uint256 snapshot = clock();
    uint256 duration = votingPeriod();

    RoundCore storage round = _rounds[roundId];
    round.proposer = proposer;
    round.voteStart = SafeCast.toUint48(snapshot);
    round.voteDuration = SafeCast.toUint32(duration);

    emit RoundCreated(roundId, proposer, snapshot, snapshot + duration);

    // Using a named return variable to avoid stack too deep errors
  }

  function setVotingElegibility(bytes32 appId, bool isElegible) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    super.setVotingElegibility(appId, isElegible);
  }

  /**
   * @notice Set the base allocation percentage
   * @param baseAllocationPercentage_ The new base allocation percentage
   */
  function setBaseAllocationPercentage(uint256 baseAllocationPercentage_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(baseAllocationPercentage_ <= 100, "Base allocation percentage must be less than or equal to 100");

    baseAllocationPercentage = baseAllocationPercentage_;
  }

  /**
   * @notice Set the app shares cap
   * @param appSharesCap_ The new app shares cap
   */
  function setAppSharesCap(uint256 appSharesCap_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(appSharesCap_ <= 100, "App shares cap must be less than or equal to 100");

    appSharesCap = appSharesCap_;
  }

  function addApp(address appAddress, string memory appName) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    super.addApp(appAddress, appName);
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
    bytes32[] memory appsInRound = _appsElegibleForVoting[roundId];
    App[] memory allApps = new App[](appsInRound.length);

    uint256 length = appsInRound.length;
    for (uint i = 0; i < length; i++) {
      allApps[i] = _apps[appsInRound[i]];
    }
    return allApps;
  }

  /**
   * Returns the quorum for a given round
   */
  function roundQuorum(uint256 roundId) public view returns (uint256) {
    return quorum(roundSnapshot(roundId));
  }

  /**
   * Returns the base allocation percentage for a given round
   */
  function getRoundBaseAllocationPercentage(uint256 roundId) public view returns (uint256) {
    return _roundBaseAllocationPercentage[roundId];
  }

  /**
   * Returns the app shares cap for a given round
   */
  function getRoundAppSharesCap(uint256 roundId) public view returns (uint256) {
    return _roundAppSharesCap[roundId];
  }

  // ---------- Required overrides ---------- //

  function votingPeriod() public view override(XAllocationVotingGovernor, GovernorSettings) returns (uint256) {
    return super.votingPeriod();
  }

  function quorum(
    uint256 blockNumber
  ) public view override(XAllocationVotingGovernor, GovernorVotesQuorumFraction) returns (uint256) {
    return super.quorum(blockNumber);
  }

  function state(uint256 roundId) public view override(XAllocationVotingGovernor) returns (RoundState) {
    return super.state(roundId);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(AccessControl, XAllocationVotingGovernor) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
