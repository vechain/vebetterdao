// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorSettings.sol)

pragma solidity ^0.8.20;

import { GovernorUpgradeable } from "../GovernorUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev Extension of {Governor} for settings updatable through governance.
 *
 * Modifications:
 * - removed _votingPeriod
 * - removed _votingDelay (now it depends on the x-allocation roundId)
 * - added _minDelayBeforeVoteStart
 */
abstract contract GovernorSettingsUpgradeable is Initializable, GovernorUpgradeable {
  /// @custom:storage-location erc7201:openzeppelin.storage.GovernorSettings
  struct GovernorSettingsStorage {
    // amount of token
    uint256 _proposalThreshold;
    // min delay before voting starts
    uint256 _minDelayBeforeVoteStart;
  }

  // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.GovernorSettings")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorSettingsStorageLocation =
    0x00d7616c8fe29c6c2fbe1d0c5bc8f2faa4c35b43746e70b24b4d532752affd00;

  function _getGovernorSettingsStorage() private pure returns (GovernorSettingsStorage storage $) {
    assembly {
      $.slot := GovernorSettingsStorageLocation
    }
  }

  event ProposalThresholdSet(uint256 oldProposalThreshold, uint256 newProposalThreshold);
  event MinDelayBeforeVoteStartSet(uint256 oldMinMinDelayBeforeVoteStart, uint256 newMinDelayBeforeVoteStart);

  /**
   * @dev Initialize the governance parameters.
   */
  function __GovernorSettings_init(
    uint256 initialProposalThreshold,
    uint256 initialMinDelayBeforeVoteStart
  ) internal onlyInitializing {
    __GovernorSettings_init_unchained(initialProposalThreshold, initialMinDelayBeforeVoteStart);
  }

  function __GovernorSettings_init_unchained(
    uint256 initialProposalThreshold,
    uint256 initialMinDelayBeforeVoteStart
  ) internal onlyInitializing {
    _setProposalThreshold(initialProposalThreshold);
    _setMinDelayBeforeVoteStart(initialMinDelayBeforeVoteStart);
  }

  /**
   * @dev See {Governor-proposalThreshold}.
   */
  function proposalThreshold() public view virtual override returns (uint256) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._proposalThreshold;
  }

  /**
   * @dev See {B3TRGovernor-minDelayBeforeVoteStart}.
   */
  function minDelayBeforeVoteStart() public view virtual returns (uint256) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._minDelayBeforeVoteStart;
  }

  /**
   * @dev Update the proposal threshold. This operation can only be performed through a governance proposal.
   *
   * Emits a {ProposalThresholdSet} event.
   */
  function setProposalThreshold(uint256 newProposalThreshold) public virtual onlyGovernance {
    _setProposalThreshold(newProposalThreshold);
  }

  /**
   * @dev Update the min voting delay before vote can start.
   * This operation can only be performed through a governance proposal.
   *
   * Emits a {MinDelayBeforeVoteStartSet} event.
   */
  function setMinDelayBeforeVoteStart(uint256 newMinDealyBeforeVoteStart) public virtual onlyGovernance {
    _setMinDelayBeforeVoteStart(newMinDealyBeforeVoteStart);
  }

  /**
   * @dev Internal setter for the proposal threshold.
   *
   * Emits a {ProposalThresholdSet} event.
   */
  function _setProposalThreshold(uint256 newProposalThreshold) internal virtual {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    emit ProposalThresholdSet($._proposalThreshold, newProposalThreshold);
    $._proposalThreshold = newProposalThreshold;
  }

  /**
   * @dev Internal setter for the min delay before vote starts.
   *
   * Emits a {MinDelayBeforeVoteStartSet} event.
   */
  function _setMinDelayBeforeVoteStart(uint256 newMinDealyBeforeVoteStart) internal virtual {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    emit MinDelayBeforeVoteStartSet($._minDelayBeforeVoteStart, newMinDealyBeforeVoteStart);
    $._minDelayBeforeVoteStart = newMinDealyBeforeVoteStart;
  }
}
