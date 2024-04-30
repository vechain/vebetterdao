// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { DataTypes } from "../../libraries/DataTypes.sol";

abstract contract RoundsStorageUpgradeable is Initializable, XAllocationVotingGovernor {
  struct RoundCore {
    address proposer;
    uint48 voteStart;
    uint32 voteDuration;
  }

  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.RoundsStorage
  struct RoundsStorageStorage {
    // counter to count the number of proposals and also used to create the id
    uint256 _roundCount;
    mapping(uint256 roundId => RoundCore) _rounds;
    mapping(uint256 roundId => bytes32[]) _appsElegibleForVoting;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.RoundsStorage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant RoundsStorageStorageLocation =
    0x0f5210c47c3bb73c471770a1cbb5b7ddc03c0ec886694cc17ae21d1f595f1900;

  function _getRoundsStorageStorage() internal pure returns (RoundsStorageStorage storage $) {
    assembly {
      $.slot := RoundsStorageStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __RoundsStorage_init() internal onlyInitializing {
    __RoundsStorage_init_unchained();
  }

  function __RoundsStorage_init_unchained() internal onlyInitializing {}

  function _startNewRound(address proposer) internal virtual override returns (uint256 roundId) {
    RoundsStorageStorage storage $ = _getRoundsStorageStorage();

    ++$._roundCount;
    roundId = $._roundCount;
    if ($._rounds[roundId].voteStart != 0) {
      revert GovernorUnexpectedRoundState(roundId, state(roundId), bytes32(0));
    }

    // Do not run for the first round
    if (roundId > 1) {
      // finalize the previous round
      finalize(roundId - 1);
    }

    // save x-apps that users can vote for
    bytes32[] memory apps = x2EarnApps().allElegibleApps();
    $._appsElegibleForVoting[roundId] = apps;

    _snapshotRoundEarnings(roundId);

    uint256 snapshot = clock();
    uint256 duration = votingPeriod();

    RoundCore storage round = $._rounds[roundId];
    round.proposer = proposer;
    round.voteStart = SafeCast.toUint48(snapshot);
    round.voteDuration = SafeCast.toUint32(duration);

    emit RoundCreated(roundId, proposer, snapshot, snapshot + duration);

    // Using a named return variable to avoid stack too deep errors
  }

  function currentRoundId() public view virtual override returns (uint256) {
    RoundsStorageStorage storage $ = _getRoundsStorageStorage();
    return $._roundCount;
  }

  function currentRoundSnapshot() public view virtual returns (uint256) {
    return roundSnapshot(currentRoundId());
  }

  function currentRoundDeadline() public view virtual returns (uint256) {
    return roundDeadline(currentRoundId());
  }

  function roundSnapshot(uint256 roundId) public view virtual override returns (uint256) {
    RoundsStorageStorage storage $ = _getRoundsStorageStorage();
    return $._rounds[roundId].voteStart;
  }

  function roundDeadline(uint256 roundId) public view virtual override returns (uint256) {
    RoundsStorageStorage storage $ = _getRoundsStorageStorage();
    return $._rounds[roundId].voteStart + $._rounds[roundId].voteDuration;
  }

  function roundProposer(uint256 roundId) public view virtual returns (address) {
    RoundsStorageStorage storage $ = _getRoundsStorageStorage();
    return $._rounds[roundId].proposer;
  }

  function getAppIds(uint256 roundId) public view override returns (bytes32[] memory) {
    RoundsStorageStorage storage $ = _getRoundsStorageStorage();
    return $._appsElegibleForVoting[roundId];
  }

  function getRound(uint256 roundId) public view returns (RoundCore memory) {
    RoundsStorageStorage storage $ = _getRoundsStorageStorage();
    return $._rounds[roundId];
  }

  /**
   * This function could not be efficient with a large number of apps
   */
  function getApps(uint256 roundId) public view returns (DataTypes.App[] memory) {
    RoundsStorageStorage storage $ = _getRoundsStorageStorage();

    bytes32[] memory appsInRound = $._appsElegibleForVoting[roundId];
    DataTypes.App[] memory allApps = new DataTypes.App[](appsInRound.length);

    uint256 length = appsInRound.length;
    for (uint i = 0; i < length; i++) {
      allApps[i] = x2EarnApps().app(appsInRound[i]);
    }
    return allApps;
  }
}
