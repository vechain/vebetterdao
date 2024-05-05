// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/Governor.sol)

pragma solidity ^0.8.20;

import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { IERC1155Receiver } from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { ERC165Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { DoubleEndedQueue } from "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { ContextUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import { IB3TRGovernor } from "../interfaces/IB3TRGovernor.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IERC6372 } from "@openzeppelin/contracts/interfaces/IERC6372.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IVoterRewards } from "../interfaces/IVoterRewards.sol";
import { IXAllocationVotingGovernor } from "../interfaces/IXAllocationVotingGovernor.sol";

/**
 * @dev Core of the governance system, designed to be extended through various modules.
 *
 * This contract is abstract and requires several functions to be implemented in various modules:
 *
 * - A counting module must implement {quorum}, {_quorumReached}, {_voteSucceeded} and {_countVote}
 * - A voting module must implement {_getVotes}
 * - Additionally, {votingPeriod} must also be implemented
 *
 * Modifications:
 * - _getGovernorStorage is internal
 * - Added roundIdVoteStart to ProposalCore
 * - removed voteStart block from ProposalCore
 * - abstract proposalSnapshot and proposalDeadline
 * - removed propose() and _propose()
 * - updated _countVote() function signature to include power
 * - updated _castVote() to calculate power as Math.sqrt(weight)
 * - added isExecutable to ProposalCore
 * - Removed voteWithSignature
 */
abstract contract GovernorUpgradeable is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  IB3TRGovernor,
  IERC721Receiver,
  IERC1155Receiver
{
  using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

  struct ProposalCore {
    address proposer;
    uint256 roundIdVoteStart;
    uint32 voteDuration;
    bool isExecutable;
    bool executed;
    bool canceled;
    uint48 etaSeconds;
    uint256 depositAmount;
  }

  bytes32 internal constant ALL_PROPOSAL_STATES_BITMAP = bytes32((2 ** (uint8(type(ProposalState).max) + 1)) - 1);
  /// @custom:storage-location erc7201:openzeppelin.storage.Governor
  struct GovernorStorage {
    string _name;
    mapping(uint256 proposalId => ProposalCore) _proposals;
    // This queue keeps track of the governor operating on itself. Calls to functions protected by the {onlyGovernance}
    // modifier needs to be whitelisted in this queue. Whitelisting is set in {execute}, consumed by the
    // {onlyGovernance} modifier and eventually reset after {_executeOperations} completes. This ensures that the
    // execution of {onlyGovernance} protected calls can only be achieved through successful proposals.
    DoubleEndedQueue.Bytes32Deque _governanceCall;
  }

  // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.Governor")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorStorageLocation = 0x7c712897014dbe49c045ef1299aa2d5f9e67e48eea4403efa21f1e0f3ac0cb00;

  function _getGovernorStorage() internal pure returns (GovernorStorage storage $) {
    assembly {
      $.slot := GovernorStorageLocation
    }
  }

  /**
   * @dev Restricts a function so it can only be executed through governance proposals. For example, governance
   * parameter setters in {GovernorSettings} are protected using this modifier.
   *
   * The governance executing address may be different from the Governor's own address, for example it could be a
   * timelock. This can be customized by modules by overriding {_executor}. The executor is only able to invoke these
   * functions during the execution of the governor's {execute} function, and not under any other circumstances. Thus,
   * for example, additional timelock proposers are not able to change governance parameters without going through the
   * governance protocol (since v4.6).
   */
  modifier onlyGovernance() {
    _checkGovernance();
    _;
  }

  /**
   * @dev Sets the value for {name}, {version} in the storage.
   */
  function __Governor_init(string memory name_) internal onlyInitializing {
    __Governor_init_unchained(name_);
  }

  function __Governor_init_unchained(string memory name_) internal onlyInitializing {
    GovernorStorage storage $ = _getGovernorStorage();
    $._name = name_;
  }

  /**
   * @dev Function to receive ETH that will be handled by the governor (disabled if executor is a third party contract)
   */
  receive() external payable virtual {
    if (_executor() != address(this)) {
      revert GovernorDisabledDeposit();
    }
  }

  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, ERC165Upgradeable) returns (bool) {
    return
      interfaceId == type(IB3TRGovernor).interfaceId ||
      interfaceId == type(IERC1155Receiver).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  /**
   * @dev See {IB3TRGovernor-name}.
   */
  function name() public view virtual returns (string memory) {
    GovernorStorage storage $ = _getGovernorStorage();
    return $._name;
  }

  /**
   * @dev See {IB3TRGovernor-version}.
   */
  function version() public view virtual returns (string memory) {
    return "1";
  }

  /**
   * @dev See {IB3TRGovernor-hashProposal}.
   *
   * The proposal id is produced by hashing the ABI encoded `targets` array, the `values` array, the `calldatas` array
   * and the descriptionHash (bytes32 which itself is the keccak256 hash of the description string). This proposal id
   * can be produced from the proposal data which is part of the {ProposalCreated} event. It can even be computed in
   * advance, before the proposal is submitted.
   *
   * Note that the chainId and the governor address are not part of the proposal id computation. Consequently, the
   * same proposal (with same operation and same description) will have the same id if submitted on multiple governors
   * across multiple networks. This also means that in order to execute the same operation twice (on the same
   * governor) the proposer will have to change the description in order to avoid proposal id conflicts.
   */
  function hashProposal(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public pure virtual returns (uint256) {
    return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
  }

  /**
   * @dev See {IB3TRGovernor-depositThreshold}.
   */
  function depositThreshold() public view virtual returns (uint256) {
    return 0;
  }

  /**
   * @dev See {IB3TRGovernor-proposalProposer}.
   */
  function proposalProposer(uint256 proposalId) public view virtual returns (address) {
    GovernorStorage storage $ = _getGovernorStorage();
    return $._proposals[proposalId].proposer;
  }

  /**
   * @dev See {IB3TRGovernor-proposalEta}.
   */
  function proposalEta(uint256 proposalId) public view virtual returns (uint256) {
    GovernorStorage storage $ = _getGovernorStorage();
    return $._proposals[proposalId].etaSeconds;
  }

  /**
   * @dev See {IB3TRGovernor-proposalStartRound}
   */
  function proposalStartRound(uint256 proposalId) public view returns (uint256) {
    GovernorStorage storage $ = _getGovernorStorage();
    return $._proposals[proposalId].roundIdVoteStart;
  }

  /**
   * @dev Reverts if the `msg.sender` is not the executor. In case the executor is not this contract
   * itself, the function reverts if `msg.data` is not whitelisted as a result of an {execute}
   * operation. See {onlyGovernance}.
   */
  function _checkGovernance() internal virtual {
    GovernorStorage storage $ = _getGovernorStorage();
    if (_executor() != _msgSender()) {
      revert GovernorOnlyExecutor(_msgSender());
    }
    if (_executor() != address(this)) {
      bytes32 msgDataHash = keccak256(_msgData());
      // loop until popping the expected operation - throw if deque is empty (operation not authorized)
      while ($._governanceCall.popFront() != msgDataHash) {}
    }
  }

  /**
   * @dev Amount of votes already cast passes the threshold limit.
   */
  function _quorumReached(uint256 proposalId) internal view virtual returns (bool);

  /**
   * @dev Is the proposal successful or not.
   */
  function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool);

  /**
   * @dev Get the voting weight of `account` at a specific `timepoint`.
   */
  function _getVotes(address account, uint256 timepoint) internal view virtual returns (uint256);

  /**
   * @dev Register a vote for `proposalId` by `account` with a given `support`, and voting `weight`.
   *
   * Note: Support is generic and can represent various things depending on the voting system used.
   */
  function _countVote(
    uint256 proposalId,
    address account,
    uint8 support,
    uint256 weight,
    uint256 power
  ) internal virtual;

  /**
   * @dev See {IB3TRGovernor-queue}.
   */
  function queue(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public virtual returns (uint256) {
    GovernorStorage storage $ = _getGovernorStorage();
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Succeeded));

    uint48 etaSeconds = _queueOperations(proposalId, targets, values, calldatas, descriptionHash);

    if (etaSeconds != 0) {
      $._proposals[proposalId].etaSeconds = etaSeconds;
      emit ProposalQueued(proposalId, etaSeconds);
    } else {
      revert GovernorQueueNotImplemented();
    }

    return proposalId;
  }

  /**
   * @dev Internal queuing mechanism. Can be overridden (without a super call) to modify the way queuing is
   * performed (for example adding a vault/timelock).
   *
   * This is empty by default, and must be overridden to implement queuing.
   *
   * This function returns a timestamp that describes the expected ETA for execution. If the returned value is 0
   * (which is the default value), the core will consider queueing did not succeed, and the public {queue} function
   * will revert.
   *
   * NOTE: Calling this function directly will NOT check the current state of the proposal, or emit the
   * `ProposalQueued` event. Queuing a proposal should be done using {queue}.
   */
  function _queueOperations(
    uint256 /*proposalId*/,
    address[] memory /*targets*/,
    uint256[] memory /*values*/,
    bytes[] memory /*calldatas*/,
    bytes32 /*descriptionHash*/
  ) internal virtual returns (uint48) {
    return 0;
  }

  /**
   * @dev See {IB3TRGovernor-execute}.
   */
  function execute(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public payable virtual returns (uint256) {
    GovernorStorage storage $ = _getGovernorStorage();
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    _validateStateBitmap(
      proposalId,
      _encodeStateBitmap(ProposalState.Succeeded) | _encodeStateBitmap(ProposalState.Queued)
    );

    // mark as executed before calls to avoid reentrancy
    $._proposals[proposalId].executed = true;

    // before execute: register governance call in queue.
    if (_executor() != address(this)) {
      for (uint256 i = 0; i < targets.length; ++i) {
        if (targets[i] == address(this)) {
          $._governanceCall.pushBack(keccak256(calldatas[i]));
        }
      }
    }

    _executeOperations(proposalId, targets, values, calldatas, descriptionHash);

    // after execute: cleanup governance call queue.
    if (_executor() != address(this) && !$._governanceCall.empty()) {
      $._governanceCall.clear();
    }

    emit ProposalExecuted(proposalId);

    return proposalId;
  }

  /**
   * @dev Internal execution mechanism. Can be overridden (without a super call) to modify the way execution is
   * performed (for example adding a vault/timelock).
   *
   * NOTE: Calling this function directly will NOT check the current state of the proposal, set the executed flag to
   * true or emit the `ProposalExecuted` event. Executing a proposal should be done using {execute} or {_execute}.
   */
  function _executeOperations(
    uint256 /* proposalId */,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 /*descriptionHash*/
  ) internal virtual {
    for (uint256 i = 0; i < targets.length; ++i) {
      (bool success, bytes memory returndata) = targets[i].call{ value: values[i] }(calldatas[i]);
      Address.verifyCallResult(success, returndata);
    }
  }

  /**
   * @dev See {IB3TRGovernor-cancel}.
   */
  function cancel(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public virtual returns (uint256) {
    // The proposalId will be recomputed in the `_cancel` call further down. However we need the value before we
    // do the internal call, because we need to check the proposal state BEFORE the internal `_cancel` call
    // changes it. The `hashProposal` duplication has a cost that is limited, and that we accept.
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    // public cancel restrictions (on top of existing _cancel restrictions).
    _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Pending));
    if (_msgSender() != proposalProposer(proposalId)) {
      revert GovernorOnlyProposer(_msgSender());
    }

    return _cancel(targets, values, calldatas, descriptionHash);
  }

  /**
   * @dev Internal cancel mechanism with minimal restrictions. A proposal can be cancelled in any state other than
   * Canceled, Expired, or Executed. Once cancelled a proposal can't be re-submitted.
   *
   * Emits a {IB3TRGovernor-ProposalCanceled} event.
   */
  function _cancel(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal virtual returns (uint256) {
    GovernorStorage storage $ = _getGovernorStorage();
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    _validateStateBitmap(
      proposalId,
      ALL_PROPOSAL_STATES_BITMAP ^
        _encodeStateBitmap(ProposalState.Canceled) ^
        _encodeStateBitmap(ProposalState.Expired) ^
        _encodeStateBitmap(ProposalState.Executed)
    );

    $._proposals[proposalId].canceled = true;
    emit ProposalCanceled(proposalId);

    return proposalId;
  }

  /**
   * @dev See {IB3TRGovernor-getVotes}.
   */
  function getVotes(address account, uint256 timepoint) public view virtual returns (uint256) {
    return _getVotes(account, timepoint);
  }

  /**
   * @dev returns the quadratic voting power that `account` has.  See {IB3TRGovernor-getQuadraticVotingPower}.
   */
  function getQuadraticVotingPower(address account, uint256 timepoint) public view virtual returns (uint256) {
    // scale the votes by 1e9 so that number returned is 1e18
    return Math.sqrt(_getVotes(account, timepoint)) * 1e9;
  }

  /**
   * @dev See {IB3TRGovernor-castVote}.
   */
  function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256) {
    address voter = _msgSender();
    return _castVote(proposalId, voter, support, "");
  }

  /**
   * @dev See {IB3TRGovernor-castVoteWithReason}.
   */
  function castVoteWithReason(
    uint256 proposalId,
    uint8 support,
    string calldata reason
  ) public virtual returns (uint256) {
    address voter = _msgSender();
    return _castVote(proposalId, voter, support, reason);
  }

  /**
   * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
   * voting weight using {IB3TRGovernor-getVotes} and call the {_countVote} internal function. Uses the _defaultParams().
   *
   * Emits a {IB3TRGovernor-VoteCast} event.
   */
  function _castVote(
    uint256 proposalId,
    address account,
    uint8 support,
    string memory reason
  ) internal virtual returns (uint256) {
    _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Active));

    uint256 weight = _getVotes(account, proposalSnapshot(proposalId));
    uint256 power = Math.sqrt(weight) * 1e9;
    _countVote(proposalId, account, support, weight, power);

    emit VoteCast(account, proposalId, support, weight, power, reason);

    return weight;
  }

  /**
   * @dev Relays a transaction or function call to an arbitrary target. In cases where the governance executor
   * is some contract other than the governor itself, like when using a timelock, this function can be invoked
   * in a governance proposal to recover tokens or Ether that was sent to the governor contract by mistake.
   * Note that if the executor is simply the governor itself, use of `relay` is redundant.
   */
  function relay(address target, uint256 value, bytes calldata data) external payable virtual onlyGovernance {
    (bool success, bytes memory returndata) = target.call{ value: value }(data);
    Address.verifyCallResult(success, returndata);
  }

  /**
   * @dev Address through which the governor executes action. Will be overloaded by module that execute actions
   * through another contract such as a timelock.
   */
  function _executor() internal view virtual returns (address) {
    return address(this);
  }

  /**
   * @dev See {IERC721Receiver-onERC721Received}.
   * Receiving tokens is disabled if the governance executor is other than the governor itself (eg. when using with a timelock).
   */
  function onERC721Received(address, address, uint256, bytes memory) public virtual returns (bytes4) {
    if (_executor() != address(this)) {
      revert GovernorDisabledDeposit();
    }
    return this.onERC721Received.selector;
  }

  /**
   * @dev See {IERC1155Receiver-onERC1155Received}.
   * Receiving tokens is disabled if the governance executor is other than the governor itself (eg. when using with a timelock).
   */
  function onERC1155Received(address, address, uint256, uint256, bytes memory) public virtual returns (bytes4) {
    if (_executor() != address(this)) {
      revert GovernorDisabledDeposit();
    }
    return this.onERC1155Received.selector;
  }

  /**
   * @dev See {IERC1155Receiver-onERC1155BatchReceived}.
   * Receiving tokens is disabled if the governance executor is other than the governor itself (eg. when using with a timelock).
   */
  function onERC1155BatchReceived(
    address,
    address,
    uint256[] memory,
    uint256[] memory,
    bytes memory
  ) public virtual returns (bytes4) {
    if (_executor() != address(this)) {
      revert GovernorDisabledDeposit();
    }
    return this.onERC1155BatchReceived.selector;
  }

  /**
   * @dev Encodes a `ProposalState` into a `bytes32` representation where each bit enabled corresponds to
   * the underlying position in the `ProposalState` enum. For example:
   *
   * 0x000...10000
   *   ^^^^^^------ ...
   *         ^----- Succeeded
   *          ^---- Defeated
   *           ^--- Canceled
   *            ^-- Active
   *             ^- Pending
   */
  function _encodeStateBitmap(ProposalState proposalState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(proposalState));
  }

  /**
   * @dev Check that the current state of a proposal matches the requirements described by the `allowedStates` bitmap.
   * This bitmap should be built using `_encodeStateBitmap`.
   *
   * If requirements are not met, reverts with a {GovernorUnexpectedProposalState} error.
   */
  function _validateStateBitmap(uint256 proposalId, bytes32 allowedStates) internal view returns (ProposalState) {
    ProposalState currentState = state(proposalId);
    if (_encodeStateBitmap(currentState) & allowedStates == bytes32(0)) {
      revert GovernorUnexpectedProposalState(proposalId, currentState, allowedStates);
    }
    return currentState;
  }

  /*
   * @dev Check if the proposer is authorized to submit a proposal with the given description.
   *
   * If the proposal description ends with `#proposer=0x???`, where `0x???` is an address written as a hex string
   * (case insensitive), then the submission of this proposal will only be authorized to said address.
   *
   * This is used for frontrunning protection. By adding this pattern at the end of their proposal, one can ensure
   * that no other address can submit the same proposal. An attacker would have to either remove or change that part,
   * which would result in a different proposal id.
   *
   * If the description does not match this pattern, it is unrestricted and anyone can submit it. This includes:
   * - If the `0x???` part is not a valid hex string.
   * - If the `0x???` part is a valid hex string, but does not contain exactly 40 hex digits.
   * - If it ends with the expected suffix followed by newlines or other whitespace.
   * - If it ends with some other similar suffix, e.g. `#other=abc`.
   * - If it does not end with any such suffix.
   */
  function _isValidDescriptionForProposer(
    address proposer,
    string memory description
  ) internal view virtual returns (bool) {
    uint256 len = bytes(description).length;

    // Length is too short to contain a valid proposer suffix
    if (len < 52) {
      return true;
    }

    // Extract what would be the `#proposer=0x` marker beginning the suffix
    bytes12 marker;
    assembly {
      // - Start of the string contents in memory = description + 32
      // - First character of the marker = len - 52
      //   - Length of "#proposer=0x0000000000000000000000000000000000000000" = 52
      // - We read the memory word starting at the first character of the marker:
      //   - (description + 32) + (len - 52) = description + (len - 20)
      // - Note: Solidity will ignore anything past the first 12 bytes
      marker := mload(add(description, sub(len, 20)))
    }

    // If the marker is not found, there is no proposer suffix to check
    if (marker != bytes12("#proposer=0x")) {
      return true;
    }

    // Parse the 40 characters following the marker as uint160
    uint160 recovered = 0;
    for (uint256 i = len - 40; i < len; ++i) {
      (bool isHex, uint8 value) = _tryHexToUint(bytes(description)[i]);
      // If any of the characters is not a hex digit, ignore the suffix entirely
      if (!isHex) {
        return true;
      }
      recovered = (recovered << 4) | value;
    }

    return recovered == uint160(proposer);
  }

  /**
   * @dev Try to parse a character from a string as a hex value. Returns `(true, value)` if the char is in
   * `[0-9a-fA-F]` and `(false, 0)` otherwise. Value is guaranteed to be in the range `0 <= value < 16`
   */
  function _tryHexToUint(bytes1 char) private pure returns (bool, uint8) {
    uint8 c = uint8(char);
    unchecked {
      // Case 0-9
      if (47 < c && c < 58) {
        return (true, c - 48);
      }
      // Case A-F
      else if (64 < c && c < 71) {
        return (true, c - 55);
      }
      // Case a-f
      else if (96 < c && c < 103) {
        return (true, c - 87);
      }
      // Else: not a hex char
      else {
        return (false, 0);
      }
    }
  }

  /**
   * @inheritdoc IERC6372
   */
  function clock() public view virtual returns (uint48);

  /**
   * @inheritdoc IERC6372
   */
  // solhint-disable-next-line func-name-mixedcase
  function CLOCK_MODE() public view virtual returns (string memory);

  /**
   * @inheritdoc IB3TRGovernor
   */
  function votingPeriod() public view virtual returns (uint256);

  /**
   * @inheritdoc IB3TRGovernor
   */
  function quorum(uint256 timepoint) public view virtual returns (uint256);

  /**
   * @dev See {IB3TRGovernor-proposalSnapshot}.
   */
  function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256);

  /**
   * @dev See {IB3TRGovernor-proposalDeadline}.
   */
  function proposalDeadline(uint256 proposalId) public view virtual returns (uint256);

  /**
   * @dev See {IB3TRGovernor-state}.
   */
  function state(uint256 proposalId) public view virtual returns (ProposalState);

  function voterRewards() public view virtual returns (IVoterRewards);

  function xAllocationVoting() public view virtual returns (IXAllocationVotingGovernor);
}
