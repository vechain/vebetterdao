// SPDX-License-Identifier: MIT
// Forked from OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorSettings.sol)

pragma solidity ^0.8.20;

import { GovernorUpgradeable } from "../GovernorUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev Extension of {Governor} for settings updatable through governance.
 *
 * Modifications:
 * - removed _votingPeriod
 * - removed _votingDelay (now it depends on the x-allocation roundId)
 * - added _minVotingDelay
 */
abstract contract GovernorSettingsUpgradeable is Initializable, GovernorUpgradeable {
  /// @custom:storage-location erc7201:openzeppelin.storage.GovernorSettings
  struct GovernorSettingsStorage {
    // amount of token
    uint256 _depositThreshold;
    // min delay before voting can start
    uint256 _minVotingDelay;
    // minimum amount of tokens needed to cast a vote
    uint256 _votingThreshold;
  }

  // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.GovernorSettings")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorSettingsStorageLocation =
    0x00d7616c8fe29c6c2fbe1d0c5bc8f2faa4c35b43746e70b24b4d532752affd00;

  function _getGovernorSettingsStorage() private pure returns (GovernorSettingsStorage storage $) {
    assembly {
      $.slot := GovernorSettingsStorageLocation
    }
  }

  event DepositThresholdSet(uint256 oldDepositThreshold, uint256 newDepositThreshold);
  event MinVotingDelaySet(uint256 oldMinMinVotingDelay, uint256 newMinVotingDelay);
  event VotingThresholdSet(uint256 oldVotingThreshold, uint256 newVotingThreshold);

  /**
   * @dev Initialize the governance parameters.
   */
  function __GovernorSettings_init(
    uint256 initialDepositThreshold,
    uint256 initialMinVotingDelay,
    uint256 initialVotingThreshold
  ) internal onlyInitializing {
    __GovernorSettings_init_unchained(initialDepositThreshold, initialMinVotingDelay, initialVotingThreshold);
  }

  function __GovernorSettings_init_unchained(
    uint256 initialDepositThreshold,
    uint256 initialMinVotingDelay,
    uint256 initialVotingThreshold
  ) internal onlyInitializing {
    _setDepositThreshold(initialDepositThreshold);
    _setMinVotingDelay(initialMinVotingDelay);
    _setVotingThreshold(initialVotingThreshold);
  }

  /**
   * @dev See {Governor-depositThreshold}.
   */
  function depositThreshold() public view virtual override returns (uint256) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._depositThreshold;
  }

  /**
   * @dev See {Governor-votingThreshold}.
   */
  function votingThreshold() public view virtual override returns (uint256) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._votingThreshold;
  }

  /**
   * @dev See {B3TRGovernor-minVotingDelay}.
   */
  function minVotingDelay() public view virtual override returns (uint256) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._minVotingDelay;
  }

  /**
   * @dev See {IB3TRGovernor-votingPeriod}.
   */
  function votingPeriod() public view virtual override returns (uint256) {
    return xAllocationVoting().votingPeriod();
  }

  /**
   * @dev Update the deposit threshold. This operation can only be performed through a governance proposal.
   *
   * Emits a {DepositThresholdSet} event.
   */
  function setDepositThreshold(uint256 newDepositThreshold) public virtual onlyGovernance {
    _setDepositThreshold(newDepositThreshold);
  }

  /**
   * @dev Update the voting threshold. This operation can only be performed through a governance proposal.
   *
   * Emits a {VotingThresholdSet} event.
   */
  function setVotingThreshold(uint256 newVotingThreshold) public virtual onlyGovernance {
    _setVotingThreshold(newVotingThreshold);
  }

  /**
   * @dev Update the min voting delay before vote can start.
   * This operation can only be performed through a governance proposal.
   *
   * Emits a {MinVotingDelaySet} event.
   */
  function setMinVotingDelay(uint256 newMinVotingDelay) public virtual onlyGovernance {
    _setMinVotingDelay(newMinVotingDelay);
  }

  /**
   * @dev Internal setter for the deposit threshold.
   *
   * Emits a {DepositThresholdSet} event.
   */
  function _setDepositThreshold(uint256 newDepositThreshold) internal virtual {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    emit DepositThresholdSet($._depositThreshold, newDepositThreshold);
    $._depositThreshold = newDepositThreshold;
  }

  /**
   * @dev Internal setter for the voting threshold.
   *
   * Emits a {VotingThresholdSet} event.
   */
  function _setVotingThreshold(uint256 newVotingThreshold) internal virtual {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    emit VotingThresholdSet($._votingThreshold, newVotingThreshold);
    $._votingThreshold = newVotingThreshold;
  }

  /**
   * @dev Internal setter for the min delay before vote starts.
   *
   * Emits a {MinVotingDelaySet} event.
   */
  function _setMinVotingDelay(uint256 newMinVotingDelay) internal virtual {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    emit MinVotingDelaySet($._minVotingDelay, newMinVotingDelay);
    $._minVotingDelay = newMinVotingDelay;
  }
}
