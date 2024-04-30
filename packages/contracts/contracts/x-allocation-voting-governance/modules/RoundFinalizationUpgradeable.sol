// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { DataTypes } from "../../libraries/DataTypes.sol";

abstract contract RoundFinalizationUpgradeable is Initializable, XAllocationVotingGovernor {
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.RoundFinalization
  struct RoundFinalizationStorage {
    // for each round store a pointer to the latest succeeded round
    mapping(uint256 => uint256) _latestSucceededRoundId;
    mapping(uint256 => bool) _roundFinalized;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.RoundFinalization")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant RoundFinalizationStorageLocation =
    0x7dd3251b9882a8b07dc283a0b43197aa2be3a6af1a7f0284070fe5d86e502500;

  function _getRoundFinalizationStorage() internal pure returns (RoundFinalizationStorage storage $) {
    assembly {
      $.slot := RoundFinalizationStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __RoundFinalization_init() internal onlyInitializing {
    __RoundFinalization_init_unchained();
  }

  function __RoundFinalization_init_unchained() internal onlyInitializing {}

  function finalize(uint256 roundId) public virtual override {
    require(!isActive(roundId), "Governor: round is not ended yet");

    _finalizeRound(roundId);
  }

  /**
   * Store the checkpoints of last succeeded round for the round
   */
  function _finalizeRound(uint256 roundId) internal virtual {
    RoundFinalizationStorage storage $ = _getRoundFinalizationStorage();
    // First round is always succeeded
    if (roundId == 1) {
      $._latestSucceededRoundId[roundId] = 1;
      $._roundFinalized[roundId] = true;
      return;
    }

    if (state(roundId) == RoundState.Succeeded) {
      $._latestSucceededRoundId[roundId] = roundId;
      $._roundFinalized[roundId] = true;
    } else if (state(roundId) == RoundState.Failed) {
      $._latestSucceededRoundId[roundId] = $._latestSucceededRoundId[roundId - 1];
      $._roundFinalized[roundId] = true;
    }
  }

  function latestSucceededRoundId(uint256 roundId) public view override returns (uint256) {
    RoundFinalizationStorage storage $ = _getRoundFinalizationStorage();
    return $._latestSucceededRoundId[roundId];
  }

  function isFinalized(uint256 roundId) public view virtual returns (bool) {
    RoundFinalizationStorage storage $ = _getRoundFinalizationStorage();
    return $._roundFinalized[roundId];
  }
}
