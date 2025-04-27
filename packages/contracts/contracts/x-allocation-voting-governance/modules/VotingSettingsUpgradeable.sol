// SPDX-License-Identifier: MIT

//                                      #######
//                                 ################
//                               ####################
//                             ###########   #########
//                            #########      #########
//          #######          #########       #########
//          #########       #########      ##########
//           ##########     ########     ####################
//            ##########   #########  #########################
//              ################### ############################
//               #################  ##########          ########
//                 ##############      ###              ########
//                  ############                       #########
//                    ##########                     ##########
//                     ########                    ###########
//                       ###                    ############
//                                          ##############
//                                    #################
//                                   ##############
//                                   #########

pragma solidity 0.8.20;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title VotingSettingsUpgradeable
 * @dev Extension of {XAllocationVotingGovernor} for voting settings.
 */
abstract contract VotingSettingsUpgradeable is Initializable, XAllocationVotingGovernor {
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.VotingSettings
  struct VotingSettingsStorage {
    uint32 _votingPeriod;
    mapping(address => bool) _autovotingEnabled;
    mapping(address => UserVotingPreferences) _userVotingPreferences;
  }

  struct UserVotingPreferences {
    bytes32[] apps;
    uint256[] percentages;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.VotingSettings")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant VotingSettingsStorageLocation =
    0xd69d068053671881d25a4d751dcad1e692749d9b24184f608cb1d01af3a99900;

  function _getVotingSettingsStorage() private pure returns (VotingSettingsStorage storage $) {
    assembly {
      $.slot := VotingSettingsStorageLocation
    }
  }

  event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);
  event AutovotingToggled(address indexed account, bool enabled);

  /**
   * @dev Initialize the governance parameters.
   */
  function __VotingSettings_init(uint32 initialVotingPeriod) internal onlyInitializing {
    __VotingSettings_init_unchained(initialVotingPeriod);
  }

  function __VotingSettings_init_unchained(uint32 initialVotingPeriod) internal onlyInitializing {
    _setVotingPeriod(initialVotingPeriod);
  }

  /**
   * @dev See {IXAllocationVotingGovernor-votingPeriod}.
   */
  function votingPeriod() public view virtual override returns (uint256) {
    VotingSettingsStorage storage $ = _getVotingSettingsStorage();
    return $._votingPeriod;
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

    VotingSettingsStorage storage $ = _getVotingSettingsStorage();

    emit VotingPeriodSet($._votingPeriod, newVotingPeriod);
    $._votingPeriod = newVotingPeriod;
  }

  function _toggleAutovoting(address account) internal virtual {
    require(account == msg.sender, "VotingSettingsUpgradeable: not authorized");
    VotingSettingsStorage storage $ = _getVotingSettingsStorage();

    if ($._autovotingEnabled[account]) {
      _setUserVotingPreferences(account, new bytes32[](0), new uint256[](0));
    }

    $._autovotingEnabled[account] = !$._autovotingEnabled[account];

    emit AutovotingToggled(account, $._autovotingEnabled[account]);
  }

  function _isAutovotingEnabled(address account) internal view override returns (bool) {
    VotingSettingsStorage storage $ = _getVotingSettingsStorage();
    return $._autovotingEnabled[account];
  }

  function _setUserVotingPreferences(
    address account,
    bytes32[] memory apps,
    uint256[] memory percentages
  ) internal virtual {
    require(apps.length == percentages.length, "VotingSettingsUpgradeable: apps and percentages length mismatch");
    // Iterate through the apps and percentages to calculate the total weight of votes cast by the voter
    uint256 totalPercentage;
    for (uint256 i; i < apps.length; i++) {
      // app must be a valid app
      require(x2EarnApps().appExists(apps[i]), "VotingSettingsUpgradeable: invalid app");

      // Check current app against ALL previous apps
      for (uint256 j; j < i; j++) {
        require(apps[i] != apps[j], "VotingSettingsUpgradeable: duplicate app");
      }
      totalPercentage += percentages[i];
    }

    require(totalPercentage == 100, "VotingSettingsUpgradeable: total percentage must be 100");

    VotingSettingsStorage storage $ = _getVotingSettingsStorage();
    $._userVotingPreferences[account] = UserVotingPreferences({ apps: apps, percentages: percentages });
  }

  function _getUserVotingPreferences(address account) internal view virtual returns (UserVotingPreferences memory) {
    VotingSettingsStorage storage $ = _getVotingSettingsStorage();
    return $._userVotingPreferences[account];
  }
}
