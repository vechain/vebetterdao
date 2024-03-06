// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./x-allocation-voting-governance/XAllocationVotingGovernor.sol";
import "./x-allocation-voting-governance/modules/GovernorXAllocationVotesCounting.sol";
import "./x-allocation-voting-governance/modules/GovernorVotes.sol";
import "./x-allocation-voting-governance/modules/GovernorVotesQuorumFraction.sol";
import "./x-allocation-voting-governance/modules/XApps.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IEmissions.sol";

contract XAllocationVoting is
  XAllocationVotingGovernor,
  GovernorXAllocationVotesCounting,
  GovernorVotes,
  GovernorVotesQuorumFraction,
  XApps,
  AccessControl
{
  IEmissions public emissions;

  /**
   * @notice Construct a XAllocationVotingGovernor contract
   * @param _vot3Token The address of the Vot3 token used for voting
   * @param _quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param b3trGovernor_ The address of the B3trGovernor DAO
   * @param _voterRewards The address of the VoterRewards contract
   * @param _admins The addresses of the admins (DAO + another address) that can update the XAllocationPool address, only DAO will remain in the final version
   * @param _xAppsBaseURI The base URI for the xApps
   * @param _emissions The address of the emissions contract
   */
  constructor(
    IVotes _vot3Token,
    uint256 _quorumPercentage,
    address b3trGovernor_,
    address _voterRewards,
    address[] memory _admins,
    string memory _xAppsBaseURI,
    address _emissions
  )
    XAllocationVotingGovernor("XAllocationVoting", b3trGovernor_)
    GovernorVotes(_vot3Token)
    GovernorVotesQuorumFraction(_quorumPercentage)
    GovernorXAllocationVotesCounting(_voterRewards)
    XApps(_xAppsBaseURI)
  {
    require(_emissions != address(0), "XAllocationVoting: emission contract cannot be the zero address");
    emissions = IEmissions(_emissions);

    for (uint256 i = 0; i < _admins.length; i++) {
      require(_admins[i] != address(0), "XAllocationVoting: admin cannot be the zero address");
      _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
    }
  }

  // ---------- Setters ---------- //

  function setB3trGovernanceAddress(address b3trGovernor_) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    require(b3trGovernor_ != address(0), "XAllocationVoting: new B3trGovernor is the zero address");
    _b3trGovernor = IGovernor(payable(b3trGovernor_));
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

  function addApp(address appAddress, string memory appName) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    super.addApp(appAddress, appName);
  }

  function startNewRound() public override onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
    return super.startNewRound();
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

  function setEmissionsAddress(address emissions_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(emissions_ != address(0), "XAllocationVoting: emission contract cannot be the zero address");
    emissions = IEmissions(emissions_);
  }

  // ---------- Getters ---------- //

  /**
   * Cycle emissions are tied to the rounds (each round is made to allocate the funds of an emission cycle),
   * so we are setting the voting period to always equal the duration of the cycle (minus a block)
   */
  function votingPeriod() public view virtual override returns (uint256) {
    return emissions.cycleDuration() - 1;
  }

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

  // ---------- Required overrides ---------- //

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
