// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorSettings.sol)

pragma solidity ^0.8.18;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev Extension of {XAllocationVotingGovernor} for settings updatable through governance.
 */
abstract contract GovernorSettingsUpgradeable is Initializable, XAllocationVotingGovernor {
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.GovernorSettings
  struct GovernorSettingsStorage {
    // duration: limited to uint32 in core
    uint32 _votingPeriod;
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

  /**
   * @dev Initialize the governance parameters.
   */
  function __GovernorSettings_init(uint32 initialVotingPeriod) internal onlyInitializing {
    __GovernorSettings_init_unchained(initialVotingPeriod);
  }

  function __GovernorSettings_init_unchained(uint32 initialVotingPeriod) internal onlyInitializing {
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
    GovernorSettingsStorage storage $ = _getGovernorSettingsStorage();

    emit VotingPeriodSet($._votingPeriod, newVotingPeriod);
    $._votingPeriod = newVotingPeriod;
  }
}
