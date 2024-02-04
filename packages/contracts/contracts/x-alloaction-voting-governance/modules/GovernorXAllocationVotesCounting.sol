// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { IXAllocationPool } from "../../interfaces/IXAllocationPool.sol";

/**
 * @title GovernorXAllocationVotesCounting
 *
 * @dev Extension of {XAllocationVotingGovernor} for counting votes for allocation rounds.
 *
 * Every round of allocation users can vote a fraction of their balance for the available apps for that round.
 */

abstract contract GovernorXAllocationVotesCounting is XAllocationVotingGovernor {
  struct AllocationRoundVote {
    mapping(bytes32 app => uint256) votesReceived;
    uint256 totalVotes;
    mapping(address user => bool) hasVoted;
    // Save how much votes a user has casted so if we want to allow multiple votes we can scale
    mapping(address user => uint256) totalVotesUserCasted;
  }

  mapping(uint256 proposalId => AllocationRoundVote) internal _allocationRoundVotes;

  IXAllocationPool internal xAllocationPool;

  constructor(address xAllocationPool_) {
    xAllocationPool = IXAllocationPool(xAllocationPool_);
  }

  /**
   * @dev See {IXAllocationVotingGovernor-COUNTING_MODE}.
   */
  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() public pure virtual override returns (string memory) {
    return "support=x-allocations&quorum=auto";
  }

  function _countVote(
    uint256 proposalId,
    address voter,
    bytes32[] memory apps,
    uint256[] memory weights
  ) internal virtual override {
    if (hasVoted(proposalId, voter)) {
      revert GovernorAlreadyCastVote(voter);
    }

    ProposalCore storage proposal = _proposals[proposalId];

    uint256 totalWeight = 0;
    for (uint256 i = 0; i < apps.length; i++) {
      totalWeight += weights[i];

      if (!xAllocationPool.isAppAvailableForAllocationVoting(apps[i])) {
        revert GovernorAppNotAvailableForVoting(apps[i]);
      }

      _allocationRoundVotes[proposalId].votesReceived[apps[i]] += weights[i];
    }

    require(
      totalWeight <=
        getVotes(voter, proposal.voteStart) - _allocationRoundVotes[proposalId].totalVotesUserCasted[voter],
      "Governor: account has insufficient voting power for this proposal"
    );

    _allocationRoundVotes[proposalId].totalVotes += totalWeight;
    _allocationRoundVotes[proposalId].hasVoted[voter] = true;

    emit AllocationVoteCast(voter, proposalId, apps, weights);
  }

  function getAppVotes(uint256 proposalId, bytes32 app) public view returns (uint256) {
    return _allocationRoundVotes[proposalId].votesReceived[app];
  }

  function getAllocationRoundTotalVotes(uint256 proposalId) public view returns (uint256) {
    return _allocationRoundVotes[proposalId].totalVotes;
  }

  function hasVoted(uint256 proposalId, address user) public view returns (bool) {
    return _allocationRoundVotes[proposalId].hasVoted[user];
  }

  function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
    //TODO: implement
  }

  function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
    //TODO: implement
  }

  function getXAllocationPoolAddress() public view returns (address) {
    return address(xAllocationPool);
  }

  function setXAllocationPoolAddress(address xAllocationPool_) public virtual;
}
