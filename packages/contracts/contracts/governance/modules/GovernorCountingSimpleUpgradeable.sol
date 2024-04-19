// SPDX-License-Identifier: MIT
// Forked from OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorCountingSimple.sol)

pragma solidity ^0.8.20;

import { GovernorUpgradeable } from "../GovernorUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev Extension of {B3TRGovernor} for simple, 3 options, vote counting.
 *
 * Modified:
 * - Added `_hasVotedOnce` mapping to store that a user has voted at least one time
 * - Added `hasVotedOnce` function to check if a user has voted at least one time
 * - Include against votes in quorum calculation
 */
abstract contract GovernorCountingSimpleUpgradeable is Initializable, GovernorUpgradeable {
  /**
   * @dev Supported vote types. Matches Governor Bravo ordering.
   */
  enum VoteType {
    Against,
    For,
    Abstain
  }

  struct ProposalVote {
    uint256 againstVotes;
    uint256 forVotes;
    uint256 abstainVotes;
    mapping(address => bool) hasVoted;
  }

  /// @custom:storage-location erc7201:openzeppelin.storage.GovernorCountingSimple
  struct GovernorCountingSimpleStorage {
    mapping(uint256 => ProposalVote) _proposalVotes;
    // mapping to store that a user has voted at least one time
    mapping(address => bool) _hasVotedOnce;
    // mapping to store the total votes for a proposal
    mapping(uint256 => uint256) _proposalTotalVotes;
  }

  // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.GovernorCountingSimple")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorCountingSimpleStorageLocation =
    0xa1cefa0f43667ef127a258e673c94202a79b656e62899531c4376d87a7f39800;

  function _getGovernorCountingSimpleStorage() private pure returns (GovernorCountingSimpleStorage storage $) {
    assembly {
      $.slot := GovernorCountingSimpleStorageLocation
    }
  }

  function __GovernorCountingSimple_init() internal onlyInitializing {}

  function __GovernorCountingSimple_init_unchained() internal onlyInitializing {}

  /**
   * @dev See {IB3TRGovernor-COUNTING_MODE}.
   */
  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() public pure virtual override returns (string memory) {
    return "support=bravo&quorum=for,abstain,against";
  }

  /**
   * @dev See {IB3TRGovernor-hasVoted}.
   */
  function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
    GovernorCountingSimpleStorage storage $ = _getGovernorCountingSimpleStorage();
    return $._proposalVotes[proposalId].hasVoted[account];
  }

  /**
   * @dev Accessor to the internal vote counts, in terms of vote power.
   */
  function proposalVotes(
    uint256 proposalId
  ) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
    GovernorCountingSimpleStorage storage $ = _getGovernorCountingSimpleStorage();
    ProposalVote storage proposalVote = $._proposalVotes[proposalId];
    return (proposalVote.againstVotes, proposalVote.forVotes, proposalVote.abstainVotes);
  }

  /**
   * @dev returns the total votes for a proposal
   */
  function proposalTotalVotes(uint256 proposalId) public view returns (uint256) {
    GovernorCountingSimpleStorage storage $ = _getGovernorCountingSimpleStorage();
    return $._proposalTotalVotes[proposalId];
  }

  /**
   * @dev returns if quorum was reached or not
   */
  function quorumReached(uint256 proposalId) public view virtual returns (bool) {
    return _quorumReached(proposalId);
  }

  /**
   * @dev See {Governor-_quorumReached}.
   */
  function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
    GovernorCountingSimpleStorage storage $ = _getGovernorCountingSimpleStorage();
    return quorum(proposalSnapshot(proposalId)) <= $._proposalTotalVotes[proposalId];
  }

  /**
   * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be strictly over the againstVotes.
   */
  function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
    GovernorCountingSimpleStorage storage $ = _getGovernorCountingSimpleStorage();
    ProposalVote storage proposalVote = $._proposalVotes[proposalId];

    return proposalVote.forVotes > proposalVote.againstVotes;
  }

  /**
   * @dev Check if a user has voted at least one time.
   *
   * @param user The address of the user to check if has voted at least one time
   */
  function hasVotedOnce(address user) public view virtual override returns (bool) {
    GovernorCountingSimpleStorage storage $ = _getGovernorCountingSimpleStorage();
    return $._hasVotedOnce[user];
  }

  /**
   * @dev See {Governor-_countVote}. In this module, the support follows the `VoteType` enum (from Governor Bravo).
   */
  function _countVote(
    uint256 proposalId,
    address account,
    uint8 support,
    uint256 weight,
    uint256 power
  ) internal virtual override {
    GovernorCountingSimpleStorage storage $ = _getGovernorCountingSimpleStorage();
    ProposalVote storage proposalVote = $._proposalVotes[proposalId];

    if (proposalVote.hasVoted[account]) {
      revert GovernorAlreadyCastVote(account);
    }
    proposalVote.hasVoted[account] = true;

    if (support == uint8(VoteType.Against)) {
      proposalVote.againstVotes += power;
    } else if (support == uint8(VoteType.For)) {
      proposalVote.forVotes += power;
    } else if (support == uint8(VoteType.Abstain)) {
      proposalVote.abstainVotes += power;
    } else {
      revert GovernorInvalidVoteType();
    }

    $._proposalTotalVotes[proposalId] += weight;

    // save that user cast vote only the first time
    if (!$._hasVotedOnce[account]) {
      $._hasVotedOnce[account] = true;
    }
  }
}
