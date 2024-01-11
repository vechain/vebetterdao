// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorCountingSimple.sol)

pragma solidity ^0.8.20;

import { AppVotingGovernor } from "../AppVotingGovernor.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

/**
 * @dev Extension of {Governor} for simple, 3 options, vote counting.
 */
abstract contract GovernorCounting is AppVotingGovernor {
  using Checkpoints for Checkpoints.Trace208;

  mapping(bytes32 appCode => Checkpoints.Trace208) private _appCheckpoints;
  Checkpoints.Trace208 private _totalCheckpoints;

  //proposal -> user -> hasVoted
  mapping(uint256 => mapping(address => bool)) public _hasUserVotedProposal;

  struct RoundResult {
    App app;
    uint256 votes;
  }

  // /**
  //  * @dev Lookup to future votes is not available.
  //  */
  error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

  /**
   * @dev See {IGovernor-COUNTING_MODE}.
   */
  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() public pure virtual returns (string memory) {
    return "support=bravo&quorum=for,abstain";
  }

  /**
   * @dev See {IGovernor-hasVoted}.
   */
  function _hasVoted(uint256 proposalId, address account) internal view virtual override returns (bool) {
    return _hasUserVotedProposal[proposalId][account];
  }

  /**
   * @dev Accessor to the internal vote counts.
   */
  //   function proposalVotes(
  //     uint256 proposalId
  //   ) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
  //     ProposalVote storage proposalVote = _proposalVotes[proposalId];
  //     return (proposalVote.againstVotes, proposalVote.forVotes, proposalVote.abstainVotes);
  //   }

  //   /**
  //    * @dev See {Governor-_quorumReached}.
  //    */
  function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
    return quorum(proposalSnapshot(proposalId)) <= _totalCheckpoints.latest();
  }

  /**
   * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be strictly over the againstVotes.
   */
  function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
    // ProposalState currentState = state(proposalId);
    // vote succceeds if proposal duration ended and quorum was reached
    return _quorumReached(proposalId);
  }

  /**
   * @dev See {Governor-_countVote}. In this module, the support follows the `VoteType` enum (from Governor Bravo).
   */
  function _countVote(uint256 proposalId, uint256 candidateCode, uint256 weight) internal virtual override {
    _hasUserVotedProposal[proposalId][msg.sender] = true;

    // increment the total amount of votes for this proposal
    _push(_totalCheckpoints, _add, SafeCast.toUint208(weight));

    // increment the amount of votes for this proposal for the given candidate
    _push(_appCheckpoints[bytes32(candidateCode)], _add, SafeCast.toUint208(weight));
  }

  function _resetVotes() internal virtual override {
    // reset totalCheckpoints
    _push(_totalCheckpoints, _subtract, SafeCast.toUint208(_totalCheckpoints.latest()));

    // reset appCheckpoints
    for (uint256 i = 0; i < apps.length; i++) {
      _push(_appCheckpoints[apps[i].code], _subtract, SafeCast.toUint208(_appCheckpoints[apps[i].code].latest()));
    }
  }

  function latestCheckpoints() public view virtual returns (Checkpoints.Trace208 memory) {
    return _totalCheckpoints;
  }

  /**
   * @dev Returns the current amount of votes that an `app` has.
   */
  function getCurrentAppVotes(bytes32 appCode) public view virtual returns (uint256) {
    return _appCheckpoints[appCode].latest();
  }

  /**
   * @dev Returns the amount of votes that `app` had at a specific moment in the past. If the `clock()` is
   * configured to use block numbers, this will return the value at the end of the corresponding block.
   *
   * Requirements:
   *
   * - `timepoint` must be in the past. If operating using block numbers, the block must be already mined.
   */
  function getAppVotes(bytes32 appCode, uint256 timepoint) public view virtual override returns (uint256) {
    // qua si potrebbe accettare proposalId come parametro e ritrovarci blocco di quando la proposta è finita e poi fare il lookup
    uint48 currentTimepoint = clock();
    if (timepoint >= currentTimepoint) {
      revert ERC5805FutureLookup(timepoint, currentTimepoint);
    }
    return _appCheckpoints[appCode].upperLookupRecent(SafeCast.toUint48(timepoint));
  }

  function getRoundResults(uint256 proposalId) public view virtual returns (App[] memory app, uint256[] memory votes) {
    ProposalState currentState = state(proposalId);
    // vote succceeds if proposal duration ended and quorum was reached
    require(
      _encodeStateBitmap(currentState) == _encodeStateBitmap(ProposalState.Succeeded) ||
        _encodeStateBitmap(currentState) == _encodeStateBitmap(ProposalState.Executed),
      "Voting is not finished yet"
    );

    uint256[] memory votesArray = new uint256[](apps.length);
    // for each app, get the votes and return the resulting array
    for (uint256 i = 0; i < apps.length; i++) {
      uint256 appVotes = getAppVotes(apps[i].code, proposalDeadline(proposalId));
      votesArray[i] = appVotes;
    }

    return (apps, votesArray);
  }

  function getCurrentRoundResults() public view virtual returns (App[] memory app, uint256[] memory votes) {
    uint256[] memory votesArray = new uint256[](apps.length);
    // for each app, get the votes and return the resulting array
    for (uint256 i = 0; i < apps.length; i++) {
      uint256 appVotes = getCurrentAppVotes(apps[i].code);
      votesArray[i] = appVotes;
    }

    return (apps, votesArray);
  }

  function _push(
    Checkpoints.Trace208 storage store,
    function(uint208, uint208) view returns (uint208) op,
    uint208 delta
  ) private returns (uint208, uint208) {
    return store.push(clock(), op(store.latest(), delta));
  }

  function _add(uint208 a, uint208 b) private pure returns (uint208) {
    return a + b;
  }

  function _subtract(uint208 a, uint208 b) private pure returns (uint208) {
    return a - b;
  }
}
