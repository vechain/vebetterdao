// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { ERC165Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { ContextUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import { NoncesUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";
import { IXAllocationVotingGovernor, IERC6372 } from "../interfaces/IXAllocationVotingGovernor.sol";
import { IXAllocationPool } from "../interfaces/IXAllocationPool.sol";
import { IGovernor } from "../interfaces/IGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev Core of the x-allocation votes governance system, designed to be extended through various modules.
 *
 * This contract is abstract and requires several functions to be implemented in various modules:
 *
 * - A counting module must implement {quorum}, {_quorumReached}, {_voteSucceeded}, and {_countVote}
 * - A voting module must implement {_getVotes}
 * - Additionally, {votingPeriod} must also be implemented
 */
abstract contract XAllocationVotingGovernor is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  NoncesUpgradeable,
  IXAllocationVotingGovernor
{
  struct RoundCore {
    address proposer;
    uint48 voteStart;
    uint32 voteDuration;
  }

  bytes32 private constant ALL_ROUND_STATES_BITMAP = bytes32((2 ** (uint8(type(RoundState).max) + 1)) - 1);

  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor
  struct XAllocationVotingGovernorStorage {
    // counter to count the number of proposals and also used to create the id
    uint256 _roundCount;
    // for each round store a pointer to the latest succeeded round
    mapping(uint256 => uint256) _latestSucceededRoundId;
    mapping(uint256 => bool) _roundFinalized;
    string _name;
    IGovernor _b3trGovernor;
    mapping(uint256 roundId => RoundCore) _rounds;
    mapping(uint256 roundId => bytes32[]) _appsElegibleForVoting;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant XAllocationVotingGovernorStorageLocation =
    0x7fb63bcd433c69110ad961bfbe38aef51814cbb9e11af6fe21011ae43fb4be00;

  function _getXAllocationVotingGovernorStorage() internal pure returns (XAllocationVotingGovernorStorage storage $) {
    assembly {
      $.slot := XAllocationVotingGovernorStorageLocation
    }
  }

  /**
   * @dev Sets the value for {name} and {b3trGovernor} address
   */
  function __XAllocationVotingGovernor_init(string memory name_, address b3trGovernor_) internal onlyInitializing {
    __XAllocationVotingGovernor_init_unchained(name_, b3trGovernor_);
  }

  function __XAllocationVotingGovernor_init_unchained(
    string memory name_,
    address b3trGovernor_
  ) internal onlyInitializing {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    $._name = name_;
    $._b3trGovernor = IGovernor(payable(b3trGovernor_));
  }

  // ---------- Modifiers ---------- //

  /**
   * @dev Restricts a function so it can only be executed through governance proposals. For example, governance
   * parameter setters in {GovernorSettings} are protected using this modifier.
   */
  modifier onlyGovernance() {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    if (address($._b3trGovernor) != _msgSender()) {
      revert B3TRGovernorOnlyExecutor(_msgSender());
    }
    _;
  }

  // ---------- Setters ---------- //

  function finalize(uint256 roundId) public {
    require(!isFinalized(roundId), "Governor: round already finalized");
    require(!isActive(roundId), "Governor: round is not ended yet");

    _finalizeRound(roundId);
  }

  function startNewRound() public virtual returns (uint256) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    address proposer = _msgSender();

    // check that there isn't an already ongoing round
    // but only do it after we have at least 1 round otherwise it will fail with `GovernorNonexistentRound`
    if ($._roundCount > 0) {
      require(!isActive($._roundCount), "Governor: there can be only one round per time");
    }

    return _startNewRound(proposer);
  }

  // ---------- Internal and Private ---------- //

  /**
   * Store the checkpoints of last succeeded round for the round
   */
  function _finalizeRound(uint256 roundId) internal virtual {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();

    if (state(roundId) == RoundState.Succeeded) {
      $._latestSucceededRoundId[roundId] = roundId;
      $._roundFinalized[roundId] = true;
    } else if (state(roundId) == RoundState.Failed) {
      $._latestSucceededRoundId[roundId] = $._latestSucceededRoundId[roundId - 1];
      $._roundFinalized[roundId] = true;
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

  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, ERC165Upgradeable) returns (bool) {
    return interfaceId == type(IXAllocationVotingGovernor).interfaceId || super.supportsInterface(interfaceId);
  }

  function name() public view virtual returns (string memory) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._name;
  }

  function version() public view virtual returns (string memory) {
    return "1";
  }

  function b3trGovernor() public view returns (IGovernor) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._b3trGovernor;
  }

  function getRoundApps(uint256 roundId) public view override returns (bytes32[] memory) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._appsElegibleForVoting[roundId];
  }

  function currentRoundId() public view virtual override returns (uint256) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._roundCount;
  }

  function isActive(uint256 roundId) public view virtual override returns (bool) {
    return state(roundId) == RoundState.Active;
  }

  function latestSucceededRoundId(uint256 roundId) public view override returns (uint256) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._latestSucceededRoundId[roundId];
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
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._rounds[roundId].voteStart;
  }

  function roundDeadline(uint256 roundId) public view virtual returns (uint256) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._rounds[roundId].voteStart + $._rounds[roundId].voteDuration;
  }

  function roundProposer(uint256 roundId) public view virtual returns (address) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._rounds[roundId].proposer;
  }

  function isFinalized(uint256 roundId) public view virtual returns (bool) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._roundFinalized[roundId];
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
  function _encodeStateBitmap(RoundState roundState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(roundState));
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
