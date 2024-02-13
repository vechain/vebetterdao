// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IERC165 } from "@openzeppelin/contracts/interfaces/IERC165.sol";
import { IERC6372 } from "@openzeppelin/contracts/interfaces/IERC6372.sol";

/**
 * @dev Interface of the distribution allocation voting for the x-allocation pool.
 * This interface was forked from OpenZeppelin's IGovernor.sol and modified to fit the needs of the x-allocation pool.
 * Some states were removed; canceling, queuing, executing proposals, vote with signature were removed. Some errors were removed.
 * Instead of hashProposal (to obtain id) we have an incremental id, and the propose process was simplified.
 *
 * Proposals should be considered as voting rounds, and the proposalId is the round number.
 * There should be only one proposal per time.
 *
 * Events were updated to fit the new governor.
 *
 * There is no proposalThreshold, anyone can propose a new round.
 *
 * Votable applications are defined by the x-allocation pool and are identified by their code, this way we can change their
 * withdrawal address in case of a security breach. The governor only allows voting for these applications.
 */
interface IXAllocationVotingGovernor is IERC165, IERC6372 {
  enum AllocationProposalState {
    Pending,
    Active,
    Failed,
    Succeeded
  }

  /**
   * @dev The vote was already cast.
   */
  error GovernorAlreadyCastVote(address voter);

  /**
   * @dev Token deposits are disabled in this contract.
   */
  error GovernorDisabledDeposit();

  /**
   * @dev The `account` is not the governance executor.
   */
  error GovernorOnlyExecutor(address account);

  /**
   * @dev The `account` is not a proposer.
   */
  error GovernorOnlyProposer(address account);

  /**
   * @dev The `proposalId` doesn't exist.
   */
  error GovernorNonexistentProposal(uint256 proposalId);

  /**
   * @dev The current state of a proposal is not the required for performing an operation.
   * The `expectedStates` is a bitmap with the bits enabled for each ProposalState enum position
   * counting from right to left.
   *
   * NOTE: If `expectedState` is `bytes32(0)`, the proposal is expected to not be in any state (i.e. not exist).
   * This is the case when a proposal that is expected to be unset is already initiated (the proposal is duplicated).
   *
   * See {Governor-_encodeStateBitmap}.
   */
  error GovernorUnexpectedProposalState(uint256 proposalId, AllocationProposalState current, bytes32 expectedStates);

  /**
   * @dev The voting period set is not a valid period.
   */
  error GovernorInvalidVotingPeriod(uint256 votingPeriod);

  /**
   * @dev The `proposer` is not allowed to create a proposal.
   */
  error GovernorRestrictedProposer(address proposer);

  /**
   * @dev The vote type used is not valid for the corresponding counting module.
   */
  error GovernorInvalidVoteType();

  /**
   * @dev The `app` is not present in the list with the available apps for voting in this proposal.
   */
  error GovernorAppNotAvailableForVoting(bytes32 app);

  /**
   * @dev Emitted when a proposal is created.
   */
  event AllocationProposalCreated(uint256 proposalId, address proposer, uint256 voteStart, uint256 voteEnd);

  /**
   * @dev Emitted when votes are cast.
   *
   */
  event AllocationVoteCast(address indexed voter, uint256 indexed proposalId, bytes32[] appsIds, uint256[] voteWeights);

  /**
   * @notice module:core
   * @dev Name of the governor instance (used in building the ERC712 domain separator).
   */
  function name() external view returns (string memory);

  /**
   * @notice module:core
   * @dev Version of the governor instance (used in building the ERC712 domain separator). Default: "1"
   */
  function version() external view returns (string memory);

  /**
   * @notice module:voting
   * @dev A description of the possible `support` values for {castVote} and the way these votes are counted, meant to
   * be consumed by UIs to show correct vote options and interpret the results. The string is a URL-encoded sequence of
   * key-value pairs that each describe one aspect, for example `support=bravo&quorum=for,abstain`.
   *
   * There are 2 standard keys: `support` and `quorum`.
   *
   * - `support=bravo` refers to the vote options 0 = Against, 1 = For, 2 = Abstain, as in `GovernorBravo`.
   * - `support=x-allocations` refers to the fractionalized vote for each x-application.
   * - `quorum=bravo` means that only For votes are counted towards quorum.
   * - `quorum=for,abstain` means that both For and Abstain votes are counted towards quorum.
   * - `quorum=auto` means that the contract defines the logic for counting the quorum.
   *
   * If a counting module makes use of encoded `params`, it should  include this under a `params` key with a unique
   * name that describes the behavior. For example:
   *
   * - `params=fractional` might refer to a scheme where votes are divided fractionally between for/against/abstain.
   * - `params=erc721` might refer to a scheme where specific NFTs are delegated to vote.
   *
   * NOTE: The string can be decoded by the standard
   * https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams[`URLSearchParams`]
   * JavaScript class.
   */
  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() external view returns (string memory);

  /**
   * @notice module:core
   * @dev Current state of a proposal
   */
  function state(uint256 proposalId) external view returns (AllocationProposalState);

  /**
   * @notice module:core
   * @dev Timepoint used to retrieve user's votes and quorum. If using block number (as per Compound's Comp), the
   * snapshot is performed at the end of this block. Hence, voting for this proposal starts at the beginning of the
   * following block.
   */
  function proposalSnapshot(uint256 proposalId) external view returns (uint256);

  /**
   * @notice module:core
   * @dev Timepoint at which votes close. If using block number, votes close at the end of this block, so it is
   * possible to cast a vote during this block.
   */
  function proposalDeadline(uint256 proposalId) external view returns (uint256);

  /**
   * @notice module:core
   * @dev The account that created a proposal.
   */
  function proposalProposer(uint256 proposalId) external view returns (address);

  /**
   * @notice module:user-config
   * @dev Delay, between the proposal is created and the vote starts. The unit this duration is expressed in depends
   * on the clock (see EIP-6372) this contract uses.
   *
   * This can be increased to leave time for users to buy voting power, or delegate it, before the voting of a
   * proposal starts.
   *
   * NOTE: While this interface returns a uint256, timepoints are stored as uint48 following the ERC-6372 clock type.
   * Consequently this value must fit in a uint48 (when added to the current clock). See {IERC6372-clock}.
   */
  function votingDelay() external view returns (uint256);

  /**
   * @notice module:user-config
   * @dev Delay between the vote start and vote end. The unit this duration is expressed in depends on the clock
   * (see EIP-6372) this contract uses.
   *
   * NOTE: The {votingDelay} can delay the start of the vote. This must be considered when setting the voting
   * duration compared to the voting delay.
   *
   * NOTE: This value is stored when the proposal is submitted so that possible changes to the value do not affect
   * proposals that have already been submitted. The type used to save it is a uint32. Consequently, while this
   * interface returns a uint256, the value it returns should fit in a uint32.
   */
  function votingPeriod() external view returns (uint256);

  /**
   * @notice module:user-config
   * @dev Minimum number of cast voted required for a proposal to be successful.
   *
   * NOTE: The `timepoint` parameter corresponds to the snapshot used for counting vote. This allows to scale the
   * quorum depending on values such as the totalSupply of a token at this timepoint (see {ERC20Votes}).
   */
  function quorum(uint256 timepoint) external view returns (uint256);

  /**
   * @notice module:reputation
   * @dev Voting power of an `account` at a specific `timepoint`.
   *
   * Note: this can be implemented in a number of ways, for example by reading the delegated balance from one (or
   * multiple), {ERC20Votes} tokens.
   */
  function getVotes(address account, uint256 timepoint) external view returns (uint256);

  /**
   * @notice module:reputation
   * @dev Total number of votes cast in an allocation round.
   */
  function totalVotes(uint256 proposalId) external view returns (uint256);

  /**
   * @notice module:reputation
   * @dev Total number of voters in an allocation round.
   */
  function totalVoters(uint256 proposalId) external view returns (uint256);

  /**
   * @notice module:reputation
   * @dev Number of votes cast for a specific app in an allocation round.
   */
  function getAppVotes(uint256 proposalId, bytes32 appId) external view returns (uint256);

  /**
   * @notice module:reputation
   * @dev Voting power of an `account` at a specific `timepoint` given additional encoded parameters.
   */
  function getVotesWithParams(address account, uint256 timepoint, bytes memory params) external view returns (uint256);

  /**
   * @notice module:voting
   * @dev Returns whether `account` has cast a vote on `proposalId`.
   */
  function hasVoted(uint256 proposalId, address account) external view returns (bool);

  /**
   * @dev Create a new allocation proposal (round). Vote start after a delay specified by {IGovernor-votingDelay} and lasts for a
   * duration specified by {IGovernor-votingPeriod}.
   *
   * Emits a {AllocationProposalCreated} event.
   */
  function proposeNewAllocationRound() external returns (uint256 proposalId);

  /**
   * @dev Cast multiple votes at once
   *
   * Emits a {AllocationVoteCast} event.
   */
  function castVote(uint256 proposalId, bytes32[] memory appsIds, uint256[] memory voteWeights) external;

  /**
   * @dev Returns the current allocation proposal round.
   */
  function currentRoundId() external view returns (uint256);

  /**
   * @dev Returns the current allocation proposal round snapshot (block).
   */
  function getCurrentAllocationRoundSnapshot() external view returns (uint256);

  function appsElegibleForVoting(uint256 proposalId) external view returns (bytes32[] memory);

  function isEligibleForVote(bytes32 appId, uint256 proposalId) external view returns (bool);

  function isActive(uint256 proposalId) external view returns (bool);

  function isFinalized(uint256 proposalId) external view returns (bool);

  function latestSucceededRoundId(uint256 roundId) external view returns (uint256);

  function getAppReceiverAddress(bytes32 appId) external view returns (address);
}
