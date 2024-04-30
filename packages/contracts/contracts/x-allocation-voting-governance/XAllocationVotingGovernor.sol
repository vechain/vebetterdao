// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { ERC165Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { ContextUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import { NoncesUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";
import { IXAllocationVotingGovernor, IERC6372 } from "../interfaces/IXAllocationVotingGovernor.sol";
import { IXAllocationPool } from "../interfaces/IXAllocationPool.sol";
import { IB3TRGovernor } from "../interfaces/IB3TRGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IX2EarnApps } from "../interfaces/IX2EarnApps.sol";
import { DataTypes } from "../libraries/DataTypes.sol";

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
  bytes32 private constant ALL_ROUND_STATES_BITMAP = bytes32((2 ** (uint8(type(RoundState).max) + 1)) - 1);

  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor
  struct XAllocationVotingGovernorStorage {
    string _name;
    IB3TRGovernor _b3trGovernor;
    IX2EarnApps _x2EarnApps;
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
  function __XAllocationVotingGovernor_init(
    string memory name_,
    IB3TRGovernor b3trGovernor_,
    IX2EarnApps x2EarnApps_
  ) internal onlyInitializing {
    __XAllocationVotingGovernor_init_unchained(name_, b3trGovernor_, x2EarnApps_);
  }

  function __XAllocationVotingGovernor_init_unchained(
    string memory name_,
    IB3TRGovernor b3trGovernor_,
    IX2EarnApps x2EarnApps_
  ) internal onlyInitializing {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    $._name = name_;
    $._b3trGovernor = b3trGovernor_;
    $._x2EarnApps = x2EarnApps_;
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

  function startNewRound() public virtual returns (uint256) {
    address proposer = _msgSender();

    // check that there isn't an already ongoing round
    // but only do it after we have at least 1 round otherwise it will fail with `GovernorNonexistentRound`
    if (currentRoundId() > 0) {
      require(!isActive(currentRoundId()), "Governor: there can be only one round per time");
    }

    return _startNewRound(proposer);
  }

  // ---------- Internal and Private ---------- //

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

  function b3trGovernor() public view returns (IB3TRGovernor) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._b3trGovernor;
  }

  function x2EarnApps() public view returns (IX2EarnApps) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._x2EarnApps;
  }

  function isActive(uint256 roundId) public view virtual override returns (bool) {
    return state(roundId) == RoundState.Active;
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

  function getVotes(address account, uint256 timepoint) public view virtual returns (uint256) {
    return _getVotes(account, timepoint, "");
  }

  function isEligibleForVote(bytes32 appId, uint256 roundId) public view virtual returns (bool) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();

    return $._x2EarnApps.isElegible(appId, roundSnapshot(roundId));
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

  function _countVote(
    uint256 roundId,
    address account,
    bytes32[] memory appIds,
    uint256[] memory voteWeights
  ) internal virtual;

  function _snapshotRoundEarnings(uint256 roundId) internal virtual;

  function _quorumReached(uint256 roundId) internal view virtual returns (bool);

  function _voteSucceeded(uint256 roundId) internal view virtual returns (bool);

  function _getVotes(address account, uint256 timepoint, bytes memory params) internal view virtual returns (uint256);

  function _startNewRound(address proposer) internal virtual returns (uint256);

  function finalize(uint256 roundId) public virtual;

  function clock() public view virtual returns (uint48);

  function CLOCK_MODE() public view virtual returns (string memory);

  function votingPeriod() public view virtual returns (uint256);

  function quorum(uint256 timepoint) public view virtual returns (uint256);

  function setB3trGovernanceAddress(address newB3trGovernance) public virtual;

  function roundSnapshot(uint256 roundId) public view virtual returns (uint256);

  function roundDeadline(uint256 roundId) public view virtual returns (uint256);

  function currentRoundId() public view virtual returns (uint256);
}
