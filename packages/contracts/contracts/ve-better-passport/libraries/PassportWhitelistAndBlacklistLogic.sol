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

library PassportWhitelistAndBlacklistLogic {
  // ---------- Events ---------- //
  /// @notice Emitted when a user is whitelisted
  /// @param user - the user that is whitelisted
  /// @param whitelistedBy - the user that whitelisted the user
  event UserWhitelisted(address indexed user, address indexed whitelistedBy);

  /// @notice Emitted when a user is removed from the whitelist
  /// @param user - the user that is removed from the whitelist
  /// @param removedBy - the user that removed the user from the whitelist
  event RemovedUserFromWhitelist(address indexed user, address indexed removedBy);

  /// @notice Emitted when a user is blacklisted
  /// @param user - the user that is blacklisted
  /// @param blacklistedBy - the user that blacklisted the user
  event UserBlacklisted(address indexed user, address indexed blacklistedBy);

  /// @notice Emitted when a user is removed from the blacklist
  /// @param user - the user that is removed from the blacklist
  /// @param removedBy - the user that removed the user from the blacklist
  event RemovedUserFromBlacklist(address indexed user, address indexed removedBy);

  // ---------- Getters ---------- //

  /// @notice Returns if a user is whitelisted
  function isWhitelisted(PassportStorageTypes.PassportStorage storage self, address user) internal view returns (bool) {
    return self.whitelisted[user];
  }

  /// @notice Returns if a user is blacklisted
  function isBlacklisted(PassportStorageTypes.PassportStorage storage self, address user) internal view returns (bool) {
    return self.blacklisted[user];
  }

  // ---------- Setters ---------- //

  /// @notice user can be whitelisted but the counter will not be reset
  function whitelist(PassportStorageTypes.PassportStorage storage self, address user) external {
    self.whitelisted[user] = true;

    if (isWhitelisted(self, user)) removeFromWhitelist(self, user);

    emit UserWhitelisted(user, msg.sender);
  }

  /// @notice Removes a user from the whitelist
  function removeFromWhitelist(PassportStorageTypes.PassportStorage storage self, address user) public {
    self.whitelisted[user] = false;
    emit RemovedUserFromWhitelist(user, msg.sender);
  }

  /// @notice user can be blacklisted but the counter will not be reset
  function blacklist(PassportStorageTypes.PassportStorage storage self, address user) external {
    self.blacklisted[user] = true;

    if (isBlacklisted(self, user)) removeFromBlacklist(self, user);

    emit UserBlacklisted(user, msg.sender);
  }

  /// @notice Removes a user from the blacklist
  function removeFromBlacklist(PassportStorageTypes.PassportStorage storage self, address user) public {
    self.blacklisted[user] = false;
    emit RemovedUserFromBlacklist(user, msg.sender);
  }
}
