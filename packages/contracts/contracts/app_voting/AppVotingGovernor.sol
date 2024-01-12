// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./interfaces/IAppVotingGovernor.sol";
import "@openzeppelin/contracts/interfaces/IERC6372.sol";
import "./B3trApps.sol";

/**
 * @dev Core of the governance system, designed to be extended though various modules.
 *
 * This contract is abstract and requires several functions to be implemented in various modules:
 *
 * - A counting module must implement {quorum}, {_quorumReached}, {_voteSucceeded} and {_countVote}
 * - A voting module must implement {_getVotes}
 * - Additionally, {votingPeriod} must also be implemented
 *
 * _Available since v4.3._
 */
abstract contract AppVotingGovernor is
  Context,
  ERC165,
  EIP712,
  IAppVotingGovernor,
  IERC721Receiver,
  IERC1155Receiver,
  B3trApps
{
  using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

  // counter to count the number of proposals and also used to create the id
  uint256 public _proposalCount;

  // solhint-disable var-name-mixedcase
  struct ProposalCore {
    address proposer;
    uint48 voteStart;
    uint32 voteDuration;
    bool executed;
    App[] appsToVote;
  }
  // solhint-enable var-name-mixedcase

  string private _name;

  /// @custom:oz-retyped-from mapping(uint256 => Governor.ProposalCore)
  mapping(uint256 => ProposalCore) public _proposals;

  // This queue keeps track of the governor operating on itself. Calls to functions protected by the
  // {onlyGovernance} modifier needs to be whitelisted in this queue. Whitelisting is set in {_beforeExecute},
  // consumed by the {onlyGovernance} modifier and eventually reset in {_afterExecute}. This ensures that the
  // execution of {onlyGovernance} protected calls can only be achieved through successful proposals.
  DoubleEndedQueue.Bytes32Deque private _governanceCall;

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
    require(_msgSender() == _executor(), "Governor: onlyGovernance");
    if (_executor() != address(this)) {
      bytes32 msgDataHash = keccak256(_msgData());
      // loop until popping the expected operation - throw if deque is empty (operation not authorized)
      while (_governanceCall.popFront() != msgDataHash) {}
    }
    _;
  }

  /**
   * @dev Sets the value for {name} and {version}
   */
  constructor(string memory name_, address _admin) EIP712(name_, version()) B3trApps(_admin) {
    _name = name_;
  }

  /**
   * @dev Function to receive ETH that will be handled by the governor (disabled if executor is a third party contract)
   */
  receive() external payable virtual {
    require(_executor() == address(this), "Governor: must send to executor");
  }

  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, ERC165, AccessControl) returns (bool) {
    bytes4 governorCancelId = this.proposalProposer.selector;

    // The original interface id in v4.3.
    bytes4 governor43Id = type(IAppVotingGovernor).interfaceId ^ type(IERC6372).interfaceId ^ governorCancelId;

    // An updated interface id in v4.6, with params added.
    bytes4 governor46Id = type(IAppVotingGovernor).interfaceId ^ type(IERC6372).interfaceId ^ governorCancelId;

    // For the updated interface id in v4.9, we use governorCancelId directly.

    return
      interfaceId == governor43Id ||
      interfaceId == governor46Id ||
      interfaceId == governorCancelId ||
      interfaceId == type(IERC1155Receiver).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  /**
   * @dev See {IAppVotingGovernor-name}.
   */
  function name() public view virtual override returns (string memory) {
    return _name;
  }

  /**
   * @dev See {IAppVotingGovernor-version}.
   */
  function version() public view virtual override returns (string memory) {
    return "1";
  }

  /**
   * @dev See {IAppVotingGovernor-state}.
   */
  function state(uint256 proposalId) public view virtual override returns (ProposalState) {
    ProposalCore storage proposal = _proposals[proposalId];

    if (proposal.executed) {
      return ProposalState.Executed;
    }

    uint256 snapshot = proposalSnapshot(proposalId);

    if (snapshot == 0) {
      revert("Governor: unknown proposal id");
    }

    uint256 currentTimepoint = clock();

    if (snapshot >= currentTimepoint) {
      return ProposalState.Pending;
    }

    uint256 deadline = proposalDeadline(proposalId);

    if (deadline >= currentTimepoint) {
      return ProposalState.Active;
    }

    // && _voteSucceeded(proposalId)
    if (_quorumReached(proposalId)) {
      return ProposalState.Succeeded;
    }

    // TODO: add failed state
    return ProposalState.Canceled;
  }

  function quorumReached(uint256 proposalId) public view virtual returns (bool) {
    return _quorumReached(proposalId);
  }

  // propose - start new round
  function propose() public virtual returns (uint256) {
    address proposer = _msgSender();

    // check that there isn't an already ongoing or pending proposal
    // but only do it after we have at least 1 proposal
    if (_proposalCount > 0) {
      // if no one executed this proposal, we first execute it then start a new one
      if (state(_proposalCount) == ProposalState.Succeeded) {
        _execute(_proposalCount);
      }
      require(state(_proposalCount) == ProposalState.Executed, "Governor: there can be only one proposal per time");
    }

    // check proposal threshold
    uint256 proposerVotes = getVotes(proposer, clock() - 1); //GovernorVotes
    uint256 votesThreshold = proposalThreshold(); //GovernorSettings

    require(proposerVotes >= votesThreshold, "Governor: proposer votes below proposal threshold");

    return _propose(proposer);
  }

  function _propose(address proposer) internal virtual returns (uint256) {
    ++_proposalCount;
    uint256 proposalId = _proposalCount;

    uint256 snapshot = clock() + votingDelay(); //GovernorSettings
    uint256 duration = votingPeriod();

    ProposalCore storage proposal = _proposals[proposalId];
    proposal.proposer = proposer;
    proposal.voteStart = SafeCast.toUint48(snapshot);
    proposal.voteDuration = SafeCast.toUint32(duration);
    proposal.appsToVote = apps;

    // reset votes
    _resetVotes();

    emit ProposalCreated(proposalId, proposer, snapshot, snapshot + duration);

    return proposalId;
  }

  /**
   * @dev See {IAppVotingGovernor-execute}.
   */
  function execute(uint256 _proposalId) external payable virtual returns (uint256) {
    uint256 proposalId = _proposalId;

    _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Succeeded));

    return _execute(_proposalId);
  }

  function _execute(uint256 proposalId) internal returns (uint256) {
    // mark as executed before calls to avoid reentrancy
    _proposals[proposalId].executed = true;

    // get app votes
    App[] memory apps;
    uint256[] memory votes = new uint256[](apps.length);
    uint256[] memory percentages = new uint256[](apps.length);
    (apps, votes, percentages) = _getRoundResults(proposalId);

    // TODO: execute something
    // before execute: register governance call in queue.
    // if (_executor() != address(this)) {
    //   for (uint256 i = 0; i < targets.length; ++i) {
    //     if (targets[i] == address(this)) {
    //       _governanceCall.pushBack(keccak256(calldatas[i]));
    //     }
    //   }
    // }

    // _executeOperations(proposalId, targets, values, calldatas, descriptionHash);

    // after execute: cleanup governance call queue.
    if (_executor() != address(this) && !_governanceCall.empty()) {
      _governanceCall.clear();
    }

    emit ProposalExecuted(proposalId);

    return proposalId;
  }

  //castMultipleVotes
  function castVotes(uint256 proposalId, uint256[] memory candidateCodes, uint256[] memory weights) public virtual {
    address account = _msgSender();

    _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Active));

    ProposalCore memory proposal = _proposals[proposalId];
    // check if the account has already voted
    // this is done to simplify the logic of the contract in this MVP version
    require(!hasVoted(proposalId, account), "Governor: account has already voted");

    // check if the account has enough voting power
    // fetch all votes the account already did on this proposal
    require(weights.length == candidateCodes.length, "Governor: weights and candidateCodes must have the same length");

    uint256 totalWeight = 0;
    for (uint256 i = 0; i < weights.length; i++) {
      totalWeight += weights[i];
    }
    require(totalWeight <= getVotes(account, proposal.voteStart), "Governor: account has insufficient voting power");

    // register vote
    for (uint256 i = 0; i < candidateCodes.length; i++) {
      _countVote(proposalId, candidateCodes[i], weights[i]);
    }

    emit VoteCasted(account, proposalId, candidateCodes, weights);
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
  error GovernorUnexpectedProposalState(uint256 proposalId, ProposalState current, bytes32 expectedStates);

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
   * @dev Part of the Governor Bravo's interface: _"The number of votes required in order for a voter to become a proposer"_.
   */
  function proposalThreshold() public view virtual returns (uint256) {
    return 0;
  }

  /**
   * @dev See {IAppVotingGovernor-proposalSnapshot}.
   */
  function proposalSnapshot(uint256 proposalId) public view virtual override returns (uint256) {
    return _proposals[proposalId].voteStart;
  }

  /**
   * @dev See {IAppVotingGovernor-proposalDeadline}.
   */
  function proposalDeadline(uint256 proposalId) public view virtual returns (uint256) {
    return _proposals[proposalId].voteStart + _proposals[proposalId].voteDuration;
  }

  /**
   * @dev Returns the account that created a given proposal.
   */
  function proposalProposer(uint256 proposalId) public view virtual override returns (address) {
    return _proposals[proposalId].proposer;
  }

  /**
   * @dev Default additional encoded parameters used by castVote methods that don't include them
   *
   * Note: Should be overridden by specific implementations to use an appropriate value, the
   * meaning of the additional params, in the context of that implementation
   */
  function _defaultParams() internal view virtual returns (bytes memory) {
    return "";
  }

  /**
   * @dev Hook before execution is triggered.
   */
  function _beforeExecute(
    uint256 /* proposalId */,
    address[] memory targets,
    uint256[] memory /* values */,
    bytes[] memory calldatas,
    bytes32 /*descriptionHash*/
  ) internal virtual {
    if (_executor() != address(this)) {
      for (uint256 i = 0; i < targets.length; ++i) {
        if (targets[i] == address(this)) {
          _governanceCall.pushBack(keccak256(calldatas[i]));
        }
      }
    }
  }

  /**
   * @dev Hook after execution is triggered.
   */
  function _afterExecute(
    uint256 /* proposalId */,
    address[] memory /* targets */,
    uint256[] memory /* values */,
    bytes[] memory /* calldatas */,
    bytes32 /*descriptionHash*/
  ) internal virtual {
    if (_executor() != address(this)) {
      if (!_governanceCall.empty()) {
        _governanceCall.clear();
      }
    }
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
   */
  function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
    return this.onERC721Received.selector;
  }

  /**
   * @dev See {IERC1155Receiver-onERC1155Received}.
   */
  function onERC1155Received(
    address,
    address,
    uint256,
    uint256,
    bytes memory
  ) public virtual override returns (bytes4) {
    return this.onERC1155Received.selector;
  }

  /**
   * @dev See {IERC1155Receiver-onERC1155BatchReceived}.
   */
  function onERC1155BatchReceived(
    address,
    address,
    uint256[] memory,
    uint256[] memory,
    bytes memory
  ) public virtual override returns (bytes4) {
    return this.onERC1155BatchReceived.selector;
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
   * @dev See {IGovernor-getVotes}.
   */
  function getVotes(address account, uint256 timepoint) public view virtual returns (uint256) {
    return _getVotes(account, timepoint, _defaultParams());
  }

  /**
   * @dev See {IGovernor-getVotesWithParams}.
   */
  function getVotesWithParams(
    address account,
    uint256 timepoint,
    bytes memory params
  ) public view virtual returns (uint256) {
    return _getVotes(account, timepoint, params);
  }

  function hasVoted(uint256 proposalId, address account) public view override returns (bool) {
    return _hasVoted(proposalId, account);
  }

  // FUNCTIONS TO IMPLEMENT IN MODULES

  /**
   * @dev Amount of votes already cast passes the threshold limit.
   */
  function _quorumReached(uint256 proposalId) internal view virtual returns (bool);

  /**
   * @dev Is the proposal successful or not.
   */
  function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool);

  function _getAppVotes(bytes32 appCode, uint256 timepoint) internal view virtual returns (uint256);

  /**
   * @dev Register a vote for `proposalId` by `account` with a given `support`, voting `weight` and voting `params`.
   *
   * Note: Support is generic and can represent various things depending on the voting system used.
   */
  function _countVote(uint256 proposalId, uint256 candidateCode, uint256 weight) internal virtual;

  function _resetVotes() internal virtual;

  /**
   * @inheritdoc IAppVotingGovernor
   */
  function votingDelay() public view virtual returns (uint256);

  /**
   * @inheritdoc IAppVotingGovernor
   */
  function votingPeriod() public view virtual returns (uint256);

  /**
   * @inheritdoc IAppVotingGovernor
   */
  function quorum(uint256 timepoint) public view virtual returns (uint256);

  function _hasVoted(uint256 proposalId, address account) internal view virtual returns (bool);

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
   * @dev Get the voting weight of `account` at a specific `timepoint`, for a vote as described by `params`.
   */
  function _getVotes(address account, uint256 timepoint, bytes memory params) internal view virtual returns (uint256);

  function _totalVotes(uint256 proposalId) internal view virtual returns (uint256);

  function _getRoundResults(
    uint256 proposalId
  ) internal view virtual returns (App[] memory, uint256[] memory, uint256[] memory);
}
