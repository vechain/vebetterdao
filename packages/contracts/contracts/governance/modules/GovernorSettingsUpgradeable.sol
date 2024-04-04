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
 */
abstract contract GovernorSettingsUpgradeable is Initializable, GovernorUpgradeable {
  /// @custom:storage-location erc7201:openzeppelin.storage.GovernorSettings
  struct GovernorSettingsStorage {
    // amount of token
    uint256 _proposalThreshold;
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

  /**
   * @dev Initialize the governance parameters.
   */
  function __GovernorSettings_init(uint256 initialProposalThreshold) internal onlyInitializing {
    __GovernorSettings_init_unchained(initialProposalThreshold);
  }

  function __GovernorSettings_init_unchained(uint256 initialProposalThreshold) internal onlyInitializing {
    _setProposalThreshold(initialProposalThreshold);
  }

  /**
   * @dev See {IGovernor-votingPeriod}.
   */
  function votingPeriod() public view virtual override returns (uint256) {
    GovernorStorage storage $ = _getGovernorStorage();

    return $._xAllocationVotingGovernor.votingPeriod();
  }

  /**
   * @dev See {Governor-proposalThreshold}.
   */
  function proposalThreshold() public view virtual override returns (uint256) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._proposalThreshold;
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
   * @dev Internal setter for the proposal threshold.
   *
   * Emits a {ProposalThresholdSet} event.
   */
  function _setProposalThreshold(uint256 newProposalThreshold) internal virtual {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    emit ProposalThresholdSet($._proposalThreshold, newProposalThreshold);
    $._proposalThreshold = newProposalThreshold;
  }
}
