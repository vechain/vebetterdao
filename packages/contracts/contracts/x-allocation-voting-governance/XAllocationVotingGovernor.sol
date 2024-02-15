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
  uint256 internal _roundCount;

  // for each round store a pointer to the latest succeeded round
  mapping(uint256 => uint256) internal _latestSucceededRoundId;
  mapping(uint256 => bool) internal _roundFinalized;

  struct RoundCore {
    address proposer;
    uint48 voteStart;
    uint32 voteDuration;
  }

  bytes32 private constant ALL_ROUND_STATES_BITMAP = bytes32((2 ** (uint8(type(RoundState).max) + 1)) - 1);

  string private _name;

  address internal _b3trGovernor;

  mapping(uint256 roundId => RoundCore) internal _rounds;
  mapping(uint256 roundId => bytes32[]) internal _appsElegibleForVoting;

  /**
   * @dev Sets the value for {name} and {version}
   */
  constructor(string memory name_, address b3trGovernor_) {
    _name = name_;
    _b3trGovernor = b3trGovernor_;
  }

  // ---------- Modifiers ---------- //

  /**
   * @dev Restricts a function so it can only be executed through governance proposals. For example, governance
   * parameter setters in {GovernorSettings} are protected using this modifier.
   */
  modifier onlyGovernance() {
    if (_b3trGovernor != _msgSender()) {
      revert B3TRGovernorOnlyExecutor(_msgSender());
    }
    _;
  }

  // ---------- Setters ---------- //

  /**
   * @dev Function to receive ETH that will be handled by the governor id disabled.
   */
  receive() external payable virtual {
    revert GovernorDisabledDeposit();
  }

  function finalize(uint256 roundId) public {
    require(!isFinalized(roundId), "Governor: round already finalized");
    require(!isActive(roundId), "Governor: round is not ended yet");

    _finalizeRound(roundId);
  }

  function startNewRound() public virtual returns (uint256) {
    address proposer = _msgSender();

    // check that there isn't an already ongoing round
    // but only do it after we have at least 1 round otherwise it will fail with `GovernorNonexistentRound`
    if (_roundCount > 0) {
      require(!isActive(_roundCount), "Governor: there can be only one round per time");
    }

    return _startNewRound(proposer);
  }

  // ---------- Internal and Private ---------- //

  /**
   * Store the checkpoints of last succeeded round for the round
   */
  function _finalizeRound(uint256 roundId) internal virtual {
    if (state(roundId) == RoundState.Succeeded) {
      _latestSucceededRoundId[roundId] = roundId;
      _roundFinalized[roundId] = true;
    } else if (state(roundId) == RoundState.Failed) {
      _latestSucceededRoundId[roundId] = _latestSucceededRoundId[roundId - 1];
      _roundFinalized[roundId] = true;
    }
  }

  function castVote(uint256 roundId, bytes32[] memory appIds, uint256[] memory voteWeights) public virtual {
    _validateStateBitmap(roundId, _encodeStateBitmap(RoundState.Active));

    require(appIds.length == voteWeights.length, "XAllocationVotingGovernor: apps and weights length mismatch");
    require(appIds.length > 0, "XAllocationVotingGovernor: no apps to vote for");

    address voter = _msgSender();

    _countVote(roundId, voter, appIds, voteWeights);
  }

  /**
   * @dev Check that the current state of a round matches the requirements described by the `allowedStates` bitmap.
   * This bitmap should be built using `_encodeStateBitmap`.
   *
   * If requirements are not met, reverts with a {GovernorUnexpectedRoundState} error.
   */
  function _validateStateBitmap(uint256 roundId, bytes32 allowedStates) private view returns (RoundState) {
    RoundState currentState = state(roundId);
    if (_encodeStateBitmap(currentState) & allowedStates == bytes32(0)) {
      revert GovernorUnexpectedRoundState(roundId, currentState, allowedStates);
    }
    return currentState;
  }

  // ---------- Getters ---------- //

  function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
    return interfaceId == type(IXAllocationVotingGovernor).interfaceId || super.supportsInterface(interfaceId);
  }

  function name() public view virtual returns (string memory) {
    return _name;
  }

  function version() public view virtual returns (string memory) {
    return "1";
  }

  function b3trGovernor() public view returns (address) {
    return _b3trGovernor;
  }

  function getRoundApps(uint256 roundId) public view override returns (bytes32[] memory) {
    return _appsElegibleForVoting[roundId];
  }

  function currentRoundId() public view virtual override returns (uint256) {
    return _roundCount;
  }

  function isActive(uint256 roundId) public view virtual override returns (bool) {
    return state(roundId) == RoundState.Active;
  }

  function latestSucceededRoundId(uint256 roundId) public view override returns (uint256) {
    return _latestSucceededRoundId[roundId];
  }

  function state(uint256 roundId) public view virtual returns (RoundState) {
    uint256 snapshot = roundSnapshot(roundId);

    if (snapshot == 0) {
      revert GovernorNonexistentRound(roundId);
    }

    uint256 currentTimepoint = clock();

    uint256 deadline = roundDeadline(roundId);

    if (deadline >= currentTimepoint) {
      return RoundState.Active;
    } else if (!_voteSucceeded(roundId)) {
      return RoundState.Failed;
    } else {
      return RoundState.Succeeded;
    }
  }

  function quorumReached(uint256 roundId) public view returns (bool) {
    return _quorumReached(roundId);
  }

  function roundSnapshot(uint256 roundId) public view virtual returns (uint256) {
    return _rounds[roundId].voteStart;
  }

  function roundDeadline(uint256 roundId) public view virtual returns (uint256) {
    return _rounds[roundId].voteStart + _rounds[roundId].voteDuration;
  }

  function roundProposer(uint256 roundId) public view virtual returns (address) {
    return _rounds[roundId].proposer;
  }

  function isFinalized(uint256 roundId) public view virtual returns (bool) {
    return _roundFinalized[roundId];
  }

  function getVotes(address account, uint256 timepoint) public view virtual returns (uint256) {
    return _getVotes(account, timepoint, "");
  }

  /**
   * @dev Encodes a `RoundState` into a `bytes32` representation where each bit enabled corresponds to
   * the underlying position in the `RoundState` enum. For example:
   *
   * 0x000...10000
   *   ^^^^^^------ ...
   *          ^---- Succeeded
   *           ^--- Failed
   *            ^-- Active
   */
  function _encodeStateBitmap(RoundState proposalState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(proposalState));
  }

  // ---------- Virtual ---------- //

  function _startNewRound(address proposer) internal virtual returns (uint256 roundId);

  function _countVote(
    uint256 roundId,
    address account,
    bytes32[] memory appIds,
    uint256[] memory voteWeights
  ) internal virtual;

  function _quorumReached(uint256 roundId) internal view virtual returns (bool);

  function _voteSucceeded(uint256 roundId) internal view virtual returns (bool);

  function _getVotes(address account, uint256 timepoint, bytes memory params) internal view virtual returns (uint256);

  function clock() public view virtual returns (uint48);

  function CLOCK_MODE() public view virtual returns (string memory);

  function votingPeriod() public view virtual returns (uint256);

  function quorum(uint256 timepoint) public view virtual returns (uint256);

  function setB3trGovernanceAddress(address newB3trGovernance) public virtual;

  function isEligibleForVote(bytes32 appId, uint256 roundId) public view virtual returns (bool);
}
