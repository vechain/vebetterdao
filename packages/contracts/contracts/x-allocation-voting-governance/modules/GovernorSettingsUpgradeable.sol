// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorSettings.sol)

pragma solidity ^0.8.18;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IEmissions } from "../../interfaces/IEmissions.sol";

/**
 * @dev Extension of {XAllocationVotingGovernor} for settings updatable through governance.
 */
abstract contract GovernorSettingsUpgradeable is Initializable, XAllocationVotingGovernor {
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.GovernorSettings
  struct GovernorSettingsStorage {
    // duration: limited to uint32 in core
    uint32 _votingPeriod;
    IEmissions _emissions;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.GovernorSettings")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorSettingsStorageLocation =
    0x61dedaa499b53d67b3d7e1868cee5772a81e32ad239a9603b0a8a5f779327500;

  function _getGovernorSettingsStorage() private pure returns (GovernorSettingsStorage storage $) {
    assembly {
      $.slot := GovernorSettingsStorageLocation
    }
  }

  event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);
  event EmissionContractSet(address oldContractAddress, address newContractAddress);

  /**
   * @dev Initialize the governance parameters.
   */
  function __GovernorSettings_init(uint32 initialVotingPeriod, address emisions) internal onlyInitializing {
    __GovernorSettings_init_unchained(initialVotingPeriod, emisions);
  }

  function __GovernorSettings_init_unchained(uint32 initialVotingPeriod, address emisions) internal onlyInitializing {
    _setEmissions(emisions);
    _setVotingPeriod(initialVotingPeriod);
  }

  /**
   * @dev See {IXAllocationVotingGovernor-votingPeriod}.
   */
  function votingPeriod() public view virtual override returns (uint256) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._votingPeriod;
  }

  /**
   * @dev The emissions contract.
   */
  function emissions() public view virtual returns (IEmissions) {
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    return $._emissions;
  }

  /**
   * @dev Update the voting period. This operation can only be performed through a governance proposal.
   *
   * Emits a {VotingPeriodSet} event.
   */
  function setVotingPeriod(uint32 newVotingPeriod) public virtual onlyGovernance {
    _setVotingPeriod(newVotingPeriod);
  }

  /**
   * @dev Internal setter for the voting period.
   *
   * Emits a {VotingPeriodSet} event.
   */
  function _setVotingPeriod(uint32 newVotingPeriod) internal virtual {
    if (newVotingPeriod == 0) {
      revert GovernorInvalidVotingPeriod(0);
    }

    // Ensure the voting period is less than the emissions cycle duration.
    uint256 emissionsCycleDuration = emissions().cycleDuration();
    if (newVotingPeriod >= emissionsCycleDuration) {
      revert GovernorInvalidVotingPeriod(newVotingPeriod);
    }

    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();

    emit VotingPeriodSet($._votingPeriod, newVotingPeriod);
    $._votingPeriod = newVotingPeriod;
  }

  function setEmissions(address newEmisionsAddress) public virtual onlyGovernance {
    _setEmissions(newEmisionsAddress);
  }

  /**
   * @dev Sets the emissions contract.
   */
  function _setEmissions(address newEmisionsAddress) internal virtual {
    require(newEmisionsAddress != address(0), "GovernorSettings: emissions is the zero address");
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();
    $._emissions = IEmissions(newEmisionsAddress);

    emit EmissionContractSet(address($._emissions), newEmisionsAddress);
  }
}
