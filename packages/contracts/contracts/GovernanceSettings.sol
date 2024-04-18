// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorSettings.sol)

pragma solidity ^0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract GovernanceSettings is Initializable, UUPSUpgradeable, AccessControlUpgradeable {
  /// @custom:storage-location erc7201:openzeppelin.storage.GovernorSettings
  struct GovernorSettingsStorage {
    // amount of token
    uint256 _generalGovernanceProposalThreshold;
    // min delay before voting can start
    uint256 _generalGovernanceMinVotingDelay;
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
  event MinVotingDelaySet(uint256 oldMinMinVotingDelay, uint256 newMinVotingDelay);

  /**
   * @dev Initialize the governance parameters.
   */
  function __GovernorSettings_init(
    uint256 initialProposalThreshold,
    uint256 initialMinVotingDelay
  ) internal onlyInitializing {
    __GovernorSettings_init_unchained(initialProposalThreshold, initialMinVotingDelay);
  }

  function __GovernorSettings_init_unchained(
    uint256 initialProposalThreshold,
    uint256 initialMinVotingDelay
  ) internal onlyInitializing {
    _setProposalThreshold(initialProposalThreshold);
    _setMinVotingDelay(initialMinVotingDelay);
  }

  /**
   * @dev See {Governor-proposalThreshold}.
   */
  function proposalThreshold() public view virtual returns (uint256) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._generalGovernanceProposalThreshold;
  }

  /**
   * @dev See {B3TRGovernor-minVotingDelay}.
   */
  function minVotingDelay() public view virtual returns (uint256) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._generalGovernanceMinVotingDelay;
  }

  /**
   * @dev Update the proposal threshold. This operation can only be performed through a governance proposal.
   *
   * Emits a {ProposalThresholdSet} event.
   */
  function setProposalThreshold(uint256 newProposalThreshold) public virtual {
    _setProposalThreshold(newProposalThreshold);
  }

  /**
   * @dev Update the min voting delay before vote can start.
   * This operation can only be performed through a governance proposal.
   *
   * Emits a {MinVotingDelaySet} event.
   */
  function setMinVotingDelay(uint256 newMinVotingDelay) public virtual {
    _setMinVotingDelay(newMinVotingDelay);
  }

  /**
   * @dev Internal setter for the proposal threshold.
   *
   * Emits a {ProposalThresholdSet} event.
   */
  function _setProposalThreshold(uint256 newProposalThreshold) internal virtual {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    emit ProposalThresholdSet($._generalGovernanceProposalThreshold, newProposalThreshold);
    $._generalGovernanceProposalThreshold = newProposalThreshold;
  }

  /**
   * @dev Internal setter for the min delay before vote starts.
   *
   * Emits a {MinVotingDelaySet} event.
   */
  function _setMinVotingDelay(uint256 newMinVotingDelay) internal virtual {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    emit MinVotingDelaySet($._generalGovernanceMinVotingDelay, newMinVotingDelay);
    $._generalGovernanceMinVotingDelay = newMinVotingDelay;
  }

  function _authorizeUpgrade(address newImplementation) internal virtual override {}
}
