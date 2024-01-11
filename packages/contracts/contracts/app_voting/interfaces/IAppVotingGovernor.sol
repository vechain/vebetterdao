// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/IGovernor.sol)

pragma solidity ^0.8.20;

import { IERC165 } from "@openzeppelin/contracts/interfaces/IERC165.sol";
import { IERC6372 } from "@openzeppelin/contracts/interfaces/IERC6372.sol";

/**
 * @dev Interface of the {Governor} core.
 */
interface IAppVotingGovernor is IERC165, IERC6372 {
  enum ProposalState {
    Pending,
    Active,
    Canceled,
    Succeeded,
    Executed
  }

  /**
   * @dev Emitted when a proposal is created.
   */
  event ProposalCreated(uint256 proposalId, address proposer, uint256 voteStart, uint256 voteEnd);

  /**
   * @dev Emitted when a proposal is executed.
   */
  event ProposalExecuted(uint256 proposalId);

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
   * @notice module:core
   * @dev Current state of a proposal, following Compound's convention
   */
  function state(uint256 proposalId) external view returns (ProposalState);

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

  function getAppVotes(bytes32 appCode, uint256 timepoint) external view returns (uint256);

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
   * @dev Voting power of an `account` at a specific `timepoint` given additional encoded parameters.
   */
  function getVotesWithParams(address account, uint256 timepoint, bytes memory params) external view returns (uint256);

  /**
   * @notice module:voting
   * @dev Returns whether `account` has cast a vote on `proposalId`.
   */
  function hasVoted(uint256 proposalId, address account) external view returns (bool);

  /**
   * @dev Create a new proposal. Vote start after a delay specified by {IGovernor-votingDelay} and lasts for a
   * duration specified by {IGovernor-votingPeriod}.
   *
   * Emits a {ProposalCreated} event.
   */
  function propose() external returns (uint256 proposalId);

  /**
   * @dev Execute a successful proposal. This requires the quorum to be reached, the vote to be successful, and the
   * deadline to be reached. Depending on the governor it might also be required that the proposal was queued and
   * that some delay passed.
   *
   * Emits a {ProposalExecuted} event.
   *
   * NOTE: Some modules can modify the requirements for execution, for example by adding an additional timelock.
   */
  function execute(uint256 _proposalId) external payable returns (uint256 proposalId);

  /**
   * @dev Cast votes
   *
   * Emits a {VoteCast} event.
   */
  function castVotes(uint256 proposalId, uint256[] memory candidateCodes, uint256[] memory weights) external;

  /**
   * @notice module:core
   * @dev See {IERC6372}
   */
  function clock() external view returns (uint48);

  /**
   * @notice module:core
   * @dev See EIP-6372.
   */
  // solhint-disable-next-line func-name-mixedcase
  function CLOCK_MODE() external view returns (string memory);
}
