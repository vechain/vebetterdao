// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

abstract contract GovernorXAllocationVotesCounting is XAllocationVotingGovernor {
  // ogni round di allocazione gli utenti possono votare una frazione del loro balance per le app disponibili per il voto di quel round

  // quindi ogni round avrà un conteggio dei voti separato

  // lo smart contract dell'allocazione per contare quanti soldi deve ricevere
  // ogni app controlla per ogni round quanti voti totali ci sono stati e quanti voti ha ricevuto quell'app

  struct AllocationRoundVote {
    mapping(bytes32 app => uint256) votesReceived;
    uint256 totalVotes;
    mapping(address user => bool) hasVoted;
    mapping(address user => uint256) totalVotesUserCasted; // cosi può votare più volte, in caso servisse scalare
    // ovviamente deve poter usare solo i voti restanti quando andrà a votare nuovamente
  }

  mapping(uint256 proposalId => AllocationRoundVote) internal _allocationRoundVotes;

  /**
   * @dev See {IXAllocationVotingGovernor-COUNTING_MODE}.
   */
  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() public pure virtual override returns (string memory) {
    return "support=x-allocations&quorum=auto";
  }

  function getAppVotes(uint256 proposalId, bytes32 app) public view returns (uint256) {
    return _allocationRoundVotes[proposalId].votesReceived[app];
  }

  function getAllocationRoundTotalVotes(uint256 proposalId) public view returns (uint256) {
    return _allocationRoundVotes[proposalId].totalVotes;
  }

  // l'utente quando fa il cast dei voti per un round di allocazione può passare tanti address di app quante ne vuole votare e
  // per ognuna di queste app può passare un peso di voto
  // il peso di voto è una frazione del suo balance
  function _countVote(
    uint256 proposalId,
    address voter,
    bytes32[] memory apps,
    uint256[] memory weights
  ) internal virtual override {
    require(apps.length == weights.length, "GovernorXAllocationVotesCounting: apps and weights length mismatch");
    require(apps.length > 0, "GovernorXAllocationVotesCounting: no apps to vote for");

    ProposalCore storage proposal = _proposals[proposalId];

    uint256 totalWeight = 0;
    for (uint256 i = 0; i < apps.length; i++) {
      totalWeight += weights[i];

      // TODO: require che app fa parte della lista delle app votate per questo round

      _allocationRoundVotes[proposalId].votesReceived[apps[i]] += weights[i];
    }

    require(
      totalWeight <=
        getVotes(voter, proposal.voteStart) - _allocationRoundVotes[proposalId].totalVotesUserCasted[voter],
      "Governor: account has insufficient voting power for this proposal"
    );

    _allocationRoundVotes[proposalId].totalVotes += totalWeight;
    _allocationRoundVotes[proposalId].hasVoted[voter] = true;

    // emit event
    emit AllocationVoteCast(voter, proposalId, apps, weights);
  }

  function hasVoted(uint256 proposalId, address user) public view returns (bool) {
    //TODO: implement
  }

  function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
    //TODO: implement
  }

  function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
    //TODO: implement
  }
}
