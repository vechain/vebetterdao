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

import { PassportStorageTypes } from "./PassportStorageTypes.sol";

library PassportChecksLogic {
  // ---------- Consants ---------- //
  uint256 constant WHITELIST_CHECK = 1 << 0; // Bitwise shift to the left by 0
  uint256 constant BLACKLIST_CHECK = 1 << 1; // Bitwise shift to the left by 1
  uint256 constant SIGNALING_CHECK = 1 << 2; // Bitwise shift to the left by 2
  uint256 constant PARTICIPATION_SCORE_CHECK = 1 << 3; // Bitwise shift to the left by 3
  uint256 constant NODE_OWNERSHIP_CHECK = 1 << 4; // Bitwise shift to the left by 4
  uint256 constant GM_OWNERSHIP_CHECK = 1 << 5; // Bitwise shift to the left by 5

  string constant WHITELIST_CHECK_NAME = "Whitelist Check";
  string constant BLACKLIST_CHECK_NAME = "Blacklist Check";
  string constant SIGNALING_CHECK_NAME = "Signaling Check";
  string constant PARTICIPATION_SCORE_CHECK_NAME = "Participation Score Check";
  string constant NODE_OWNERSHIP_CHECK_NAME = "Node Ownership Check";
  string constant GM_OWNERSHIP_CHECK_NAME = "GM Ownership Check";

  // ---------- Events ---------- //
  /// @notice Emitted when a specific check is toggled.
  /// @param checkName The name of the check being toggled.
  /// @param enabled True if the check is enabled, false if disabled.
  event CheckToggled(string indexed checkName, bool enabled);

  /// @notice Emitted when the minimum galaxy member level is set.
  /// @param minimumGalaxyMemberLevel The new minimum galaxy member level.
  event MinimumGalaxyMemberLevelSet(uint256 minimumGalaxyMemberLevel);

  // ---------- Private Functions ---------- //
  /// @notice Toggles the specified check using XOR
  /// @param check The check to toggle (bitmask constant)
  function _toggleCheck(
    PassportStorageTypes.PassportStorage storage self,
    uint256 check,
    string memory checkName
  ) private {
    self.personhoodChecks ^= check; // Toggle the check (XOR)
    emit CheckToggled(checkName, (self.personhoodChecks & check != 0));
  }

  /// @notice Checks if a specific check is enabled
  /// @param check The check to query (bitmask constant)
  /// @return True if the check is enabled, false otherwise
  function _isCheckEnabled(
    PassportStorageTypes.PassportStorage storage self,
    uint256 check
  ) private view returns (bool) {
    return (self.personhoodChecks & check) != 0;
  }

  // ---------- Getters ---------- //

  /// @notice Returns if the whitelist check is enabled
  function whitelistCheckEnabled(PassportStorageTypes.PassportStorage storage self) internal view returns (bool) {
    return _isCheckEnabled(self, WHITELIST_CHECK);
  }

  /// @notice Returns if the blacklist check is enabled
  function blacklistCheckEnabled(PassportStorageTypes.PassportStorage storage self) internal view returns (bool) {
    return _isCheckEnabled(self, BLACKLIST_CHECK);
  }

  /// @notice Returns if the signaling check is enabled
  function signalingCheckEnabled(PassportStorageTypes.PassportStorage storage self) internal view returns (bool) {
    return _isCheckEnabled(self, SIGNALING_CHECK);
  }

  /// @notice Returns if the participation score check is enabled
  function participationScoreCheckEnabled(
    PassportStorageTypes.PassportStorage storage self
  ) internal view returns (bool) {
    return _isCheckEnabled(self, PARTICIPATION_SCORE_CHECK);
  }

  /// @notice Returns if the node ownership check is enabled
  function nodeOwnershipCheckEnabled(PassportStorageTypes.PassportStorage storage self) internal view returns (bool) {
    return _isCheckEnabled(self, NODE_OWNERSHIP_CHECK);
  }

  /// @notice Returns if the GM ownership check is enabled
  function gmOwnershipCheckEnabled(PassportStorageTypes.PassportStorage storage self) internal view returns (bool) {
    return _isCheckEnabled(self, GM_OWNERSHIP_CHECK);
  }

  /// @notice Returns the minimum galaxy member level
  function getMinimumGalaxyMemberLevel(PassportStorageTypes.PassportStorage storage self) internal view returns (uint256) {
    return self.minimumGalaxyMemberLevel;
  }

  // ---------- Setters ---------- //

  /// @notice Toggles the whitelist check
  function toggleWhitelistCheck(PassportStorageTypes.PassportStorage storage self) external {
    _toggleCheck(self, WHITELIST_CHECK, WHITELIST_CHECK_NAME);
  }

  /// @notice Toggles the blacklist check
  function toggleBlacklistCheck(PassportStorageTypes.PassportStorage storage self) external {
    _toggleCheck(self, BLACKLIST_CHECK, BLACKLIST_CHECK_NAME);
  }

  /// @notice Toggles the signaling check
  function toggleSignalingCheck(PassportStorageTypes.PassportStorage storage self) external {
    _toggleCheck(self, SIGNALING_CHECK, SIGNALING_CHECK_NAME);
  }

  /// @notice Toggles the participation score check
  function toggleParticipationScoreCheck(PassportStorageTypes.PassportStorage storage self) external {
    _toggleCheck(self, PARTICIPATION_SCORE_CHECK, PARTICIPATION_SCORE_CHECK_NAME);
  }

  /// @notice Toggles the node ownership check
  function toggleNodeOwnershipCheck(PassportStorageTypes.PassportStorage storage self) external {
    _toggleCheck(self, NODE_OWNERSHIP_CHECK, NODE_OWNERSHIP_CHECK_NAME);
  }

  /// @notice Toggles the GM ownership check
  function toggleGMOwnershipCheck(PassportStorageTypes.PassportStorage storage self) external {
    _toggleCheck(self, GM_OWNERSHIP_CHECK, GM_OWNERSHIP_CHECK_NAME);
  }

  /// @notice Sets the minimum galaxy member level
  /// @param minimumGalaxyMemberLevel The new minimum galaxy member level
  function setMinimumGalaxyMemberLevel(PassportStorageTypes.PassportStorage storage self, uint256 minimumGalaxyMemberLevel) external {
    require(minimumGalaxyMemberLevel > 0, "VeBetterPassport: minimum galaxy member level must be greater than 0");

    self.minimumGalaxyMemberLevel = minimumGalaxyMemberLevel;
    emit MinimumGalaxyMemberLevelSet(minimumGalaxyMemberLevel);
  }
}
