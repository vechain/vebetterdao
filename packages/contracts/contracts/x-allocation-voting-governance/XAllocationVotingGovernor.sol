// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IERC165, ERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { Nonces } from "@openzeppelin/contracts/utils/Nonces.sol";
import { IXAllocationVotingGovernor, IERC6372 } from "../interfaces/IXAllocationVotingGovernor.sol";
import { IXAllocationPool } from "../interfaces/IXAllocationPool.sol";

/**
 * @dev Core of the x-allocation votes governance system, designed to be extended through various modules.
 *
 * This contract is abstract and requires several functions to be implemented in various modules:
 *
 * - A counting module must implement {quorum}, {_quorumReached}, {_voteSucceeded}, and {_countVote}
 * - A voting module must implement {_getVotes}
 * - Additionally, {votingPeriod} must also be implemented
 */
abstract contract XAllocationVotingGovernor is Context, ERC165, Nonces, IXAllocationVotingGovernor {
  // counter to count the number of proposals and also used to create the id
  uint256 internal _proposalCount;

  struct ProposalCore {
    address proposer;
    uint48 voteStart;
    uint32 voteDuration;
  }

  bytes32 private constant ALL_PROPOSAL_STATES_BITMAP =
    bytes32((2 ** (uint8(type(AllocationProposalState).max) + 1)) - 1);

  string private _name;

  address internal _b3trGovernor;
  IXAllocationPool internal _xAllocationPool;

  mapping(uint256 proposalId => ProposalCore) internal _proposals;
  mapping(uint256 proposalId => bytes32[]) internal _appsElegibleForVoting;

  /**
   * @dev Restricts a function so it can only be executed through governance proposals. For example, governance
   * parameter setters in {GovernorSettings} are protected using this modifier.
   */
  modifier onlyGovernance() {
    if (_b3trGovernor != _msgSender()) {
      revert GovernorOnlyExecutor(_msgSender());
    }
    _;
  }

  /**
   * @dev Sets the value for {name} and {version}
   */
  constructor(string memory name_, address b3trGovernor_, address xAllocationPool_) {
    _name = name_;
    _b3trGovernor = b3trGovernor_;
    _xAllocationPool = IXAllocationPool(xAllocationPool_);
  }

  /**
   * @dev Function to receive ETH that will be handled by the governor id disabled.
   */
  receive() external payable virtual {
    revert GovernorDisabledDeposit();
  }

  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
    return interfaceId == type(IXAllocationVotingGovernor).interfaceId || super.supportsInterface(interfaceId);
  }

  /**
   * @dev See {IXAllocationVotingGovernor-name}.
   */
  function name() public view virtual returns (string memory) {
    return _name;
  }

  /**
   * @dev See {IXAllocationVotingGovernor-version}.
   */
  function version() public view virtual returns (string memory) {
    return "1";
  }

  /**
   * Returns the address of the B3trGovernor contract.
   */
  function b3trGovernor() public view returns (address) {
    return _b3trGovernor;
  }

  function xAllocationPool() public view returns (IXAllocationPool) {
    return _xAllocationPool;
  }

  function getXAllocationPoolAddress() public view returns (address) {
    return address(_xAllocationPool);
  }

  function appsElegibleForVoting(uint256 roundId) public view override returns (bytes32[] memory) {
    return _appsElegibleForVoting[roundId];
  }

  function setXAllocationPoolAddress(address xAllocationPool_) public virtual;

  /**
   * Returns the current round id.
   */
  function currentRoundId() public view virtual override returns (uint256) {
    return _proposalCount;
  }

  /**
   * @dev See {IXAllocationVotingGovernor-state}.
   */
  function state(uint256 proposalId) public view virtual returns (AllocationProposalState) {
    uint256 snapshot = proposalSnapshot(proposalId);

    if (snapshot == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    uint256 currentTimepoint = clock();

    if (snapshot >= currentTimepoint) {
      return AllocationProposalState.Pending;
    }

    uint256 deadline = proposalDeadline(proposalId);

    if (deadline >= currentTimepoint) {
      return AllocationProposalState.Active;
    } else if (!_voteSucceeded(proposalId)) {
      return AllocationProposalState.Failed;
    } else {
      return AllocationProposalState.Succeeded;
    }
  }

  /**
   * @dev See {IXAllocationVotingGovernor-proposalSnapshot}.
   */
  function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256) {
    return _proposals[proposalId].voteStart;
  }

  /**
   * @dev See {IXAllocationVotingGovernor-proposalDeadline}.
   */
  function proposalDeadline(uint256 proposalId) public view virtual returns (uint256) {
    return _proposals[proposalId].voteStart + _proposals[proposalId].voteDuration;
  }

  /**
   * @dev See {IXAllocationVotingGovernor-proposalProposer}.
   */
  function proposalProposer(uint256 proposalId) public view virtual returns (address) {
    return _proposals[proposalId].proposer;
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
   * @dev Get the voting weight of `account` at a specific `timepoint`, for a vote as described by `params`.
   */
  function _getVotes(address account, uint256 timepoint, bytes memory params) internal view virtual returns (uint256);

  /**
   * @dev Register a vote for `proposalId` by `account` for multiple given `apps` with fractionalized `voteWeights`.
   */
  function _countVote(
    uint256 proposalId,
    address account,
    bytes32[] memory appIds,
    uint256[] memory voteWeights
  ) internal virtual;

  /**
   * @dev See {IXAllocationVotingGovernor-proposeNewAllocationRound}.
   */
  function proposeNewAllocationRound() public virtual returns (uint256) {
    address proposer = _msgSender();

    // check that there isn't an already ongoing proposal
    // but only do it after we have at least 1 proposal otherwise it will fail with `GovernorNonexistentProposal`
    if (_proposalCount > 0) {
      AllocationProposalState currentState = state(_proposalCount);
      require(
        currentState == AllocationProposalState.Succeeded || currentState == AllocationProposalState.Failed,
        "Governor: there can be only one proposal per time"
      );
    }

    return _propose(proposer);
  }

  /**
   * @dev Internal propose mechanism. Can be overridden to add more logic on proposal creation.
   *
   * Emits a {IXAllocationVotingGovernor-ProposalCreated} event.
   */
  function _propose(address proposer) internal virtual returns (uint256 proposalId) {
    ++_proposalCount;
    proposalId = _proposalCount;

    if (_proposals[proposalId].voteStart != 0) {
      revert GovernorUnexpectedProposalState(proposalId, state(proposalId), bytes32(0));
    }

    // save x-apps that users can vote for
    bytes32[] memory apps = xAllocationPool().allElegibleApps();
    _appsElegibleForVoting[proposalId] = apps;

    uint256 snapshot = clock() + votingDelay();
    uint256 duration = votingPeriod();

    ProposalCore storage proposal = _proposals[proposalId];
    proposal.proposer = proposer;
    proposal.voteStart = SafeCast.toUint48(snapshot);
    proposal.voteDuration = SafeCast.toUint32(duration);

    emit AllocationProposalCreated(proposalId, proposer, snapshot, snapshot + duration);

    // Using a named return variable to avoid stack too deep errors
  }

  /**
   * @dev See {IXAllocationVotingGovernor-getVotes}.
   */
  function getVotes(address account, uint256 timepoint) public view virtual returns (uint256) {
    return _getVotes(account, timepoint, "");
  }

  /**
   * @dev See {IXAllocationVotingGovernor-getVotesWithParams}.
   */
  function getVotesWithParams(
    address account,
    uint256 timepoint,
    bytes memory params
  ) public view virtual returns (uint256) {
    return _getVotes(account, timepoint, params);
  }

  /**
   * @dev See {IXAllocationVotingGovernor-castVote}.
   */
  function castVote(uint256 proposalId, bytes32[] memory appIds, uint256[] memory voteWeights) public virtual {
    _validateStateBitmap(proposalId, _encodeStateBitmap(AllocationProposalState.Active));

    require(appIds.length == voteWeights.length, "XAllocationVotingGovernor: apps and weights length mismatch");
    require(appIds.length > 0, "XAllocationVotingGovernor: no apps to vote for");

    address voter = _msgSender();

    _countVote(proposalId, voter, appIds, voteWeights);
  }

  /**
   * @dev Encodes a `AllocationProposalState` into a `bytes32` representation where each bit enabled corresponds to
   * the underlying position in the `AllocationProposalState` enum. For example:
   *
   * 0x000...10000
   *   ^^^^^^------ ...
   *         ^----- Succeeded
   *          ^---- Failed
   *           ^--- Active
   *            ^-- Pending
   */
  function _encodeStateBitmap(AllocationProposalState proposalState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(proposalState));
  }

  /**
   * @dev Check that the current state of a proposal matches the requirements described by the `allowedStates` bitmap.
   * This bitmap should be built using `_encodeStateBitmap`.
   *
   * If requirements are not met, reverts with a {GovernorUnexpectedProposalState} error.
   */
  function _validateStateBitmap(
    uint256 proposalId,
    bytes32 allowedStates
  ) private view returns (AllocationProposalState) {
    AllocationProposalState currentState = state(proposalId);
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
   * @inheritdoc IXAllocationVotingGovernor
   */
  function votingDelay() public view virtual returns (uint256);

  /**
   * @inheritdoc IXAllocationVotingGovernor
   */
  function votingPeriod() public view virtual returns (uint256);

  /**
   * @inheritdoc IXAllocationVotingGovernor
   */
  function quorum(uint256 timepoint) public view virtual returns (uint256);

  function setB3trGovernanceAddress(address newB3trGovernance) public virtual;
}
