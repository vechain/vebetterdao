// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorCountingSimple.sol)

pragma solidity ^0.8.20;

import { GovernorUpgradeable } from "../GovernorUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { ICountingStrategy } from "../../interfaces/ICountingStrategy.sol";

/**
 * @dev Extension of {Governor} for simple, 3 options, vote counting.
 *
 * Modified:
 * - Added `_hasVotedOnce` mapping to store that a user has voted at least one time
 * - Added `hasVotedOnce` function to check if a user has voted at least one time
 * - Include against votes in quorum calculation
 */
abstract contract GovernorCountingSimpleUpgradeable is Initializable, GovernorUpgradeable {
  /// @custom:storage-location erc7201:openzeppelin.storage.GovernorCountingSimple
  struct GovernorCountingSimpleStorage {
    ICountingStrategy countingStrategy;
  }

  // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.GovernorCountingSimple")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorCountingSimpleStorageLocation =
    0xa1cefa0f43667ef127a258e673c94202a79b656e62899531c4376d87a7f39800;

  function _getGovernorCountingSimpleStorage() private pure returns (GovernorCountingSimpleStorage storage $) {
    assembly {
      $.slot := GovernorCountingSimpleStorageLocation
    }
  }

  function __GovernorCountingSimple_init(ICountingStrategy _countingStrategy) internal onlyInitializing {}

  function __GovernorCountingSimple_init_unchained(ICountingStrategy _countingStrategy) internal onlyInitializing {
    _getGovernorCountingSimpleStorage().countingStrategy = _countingStrategy;
  }

  function countingStrategy() public view returns (ICountingStrategy) {
    return _getGovernorCountingSimpleStorage().countingStrategy;
  }

  /**
   * @dev See {IGovernor-COUNTING_MODE}.
   */
  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() public view virtual override returns (string memory) {
    return _getGovernorCountingSimpleStorage().countingStrategy.COUNTING_MODE();
  }

  /**
   * @dev See {IGovernor-hasVoted}.
   */
  function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
    return _getGovernorCountingSimpleStorage().countingStrategy.hasVoted(proposalId, account);
  }

  /**
   * @dev Accessor to the internal vote counts, in terms of vote power.
   */
  function proposalVotes(
    uint256 proposalId
  ) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
    return _getGovernorCountingSimpleStorage().countingStrategy.proposalVotes(proposalId);
  }

  /**
   * @dev returns the total votes for a proposal
   */
  function proposalTotalVotes(uint256 proposalId) public view returns (uint256) {
    return _getGovernorCountingSimpleStorage().countingStrategy.proposalTotalVotes(proposalId);
  }

  /**
   * @dev See {Governor-_quorumReached}.
   */
  function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
    return
      quorum(proposalSnapshot(proposalId)) <=
      _getGovernorCountingSimpleStorage().countingStrategy.proposalTotalVotes(proposalId);
  }

  /**
   * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be strictly over the againstVotes.
   */
  function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
    (uint256 againstVotes, uint256 forVotes, ) = _getGovernorCountingSimpleStorage().countingStrategy.proposalVotes(
      proposalId
    );
    return forVotes > againstVotes;
  }

  /**
   * @dev Check if a user has voted at least one time.
   *
   * @param user The address of the user to check if has voted at least one time
   */
  function hasVotedOnce(address user) public view returns (bool) {
    return _getGovernorCountingSimpleStorage().countingStrategy.hasVotedOnce(user);
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
    _getGovernorCountingSimpleStorage().countingStrategy._countVote(proposalId, account, support, weight, power, "");
  }

  function _setCountingStrategyAddress(address newCountingStrategyAddress) internal virtual {
    require(newCountingStrategyAddress != address(0), "GCS: zero address");

    GovernorCountingSimpleStorage storage $ = _getGovernorCountingSimpleStorage();
    $.countingStrategy = ICountingStrategy(newCountingStrategyAddress);
  }
}
