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
import { PassportClockLogic } from "./PassportClockLogic.sol";
import { PassportEntityLogic } from "./PassportEntityLogic.sol";
import { PassportEIP712SigningLogic } from "./PassportEIP712SigningLogic.sol";
import { PassportTypes } from "./PassportTypes.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title PassportSignalingLogic
 * @dev A library that manages the signaling system within the Passport ecosystem.
 * Signaling is used to track negative or positive behavior for users based on interactions in specific apps.
 * This library allows for signaling users, assigning signalers to apps, resetting signals, and managing app-specific signals.
 */
library PassportSignalingLogic {
  // ---------- Events ---------- //
  /// @notice Emitted when a user is signaled.
  /// @param user  The address of the user that was signaled.
  /// @param signaler  The address of the user that signaled the user.
  /// @param app  The app that the user was signaled for.
  /// @param reason  The reason for signaling the user.
  event UserSignaled(address indexed user, address indexed signaler, bytes32 indexed app, string reason);

  /// @notice Emited when an address is associated with an app.
  /// @param signaler  The address of the signaler.
  /// @param app  The app that the signaler was associated with.
  event SignalerAssignedToApp(address indexed signaler, bytes32 indexed app);

  /// @notice Emitted when an address is removed from an app.
  /// @param signaler  The address of the signaler.
  /// @param app  The app that the signaler was removed from.
  event SignalerRemovedFromApp(address indexed signaler, bytes32 indexed app);

  /// @notice Emitted when a user's signals are reset.
  /// @param user  The address of the user that had their signals reset.
  /// @param reason  The reason for resetting the signals.
  event UserSignalsReset(address indexed user, string reason);

  /// @notice Emitted when a user's signals are reset for an app.
  /// @param user  The address of the user that had their signals reset.
  /// @param app  The app that the user had their signals reset for.
  /// @param reason - The reason for resetting the signals.
  event UserSignalsResetForApp(address indexed user, bytes32 indexed app, string reason);

  // ---------- Getters ---------- //

  /// @notice Returns the number of times a user has been signaled
  function signaledCounter(address user) internal view returns (uint256) {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    return self.signaledCounter[user];
  }

  /// @notice Returns the belonging app of a signaler
  function appOfSignaler(address signaler) internal view returns (bytes32) {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    return self.appOfSignaler[signaler];
  }

  /// @notice Returns the number of times a user has been signaled by an app
  function appSignalsCounter(bytes32 app, address user) internal view returns (uint256) {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    return self.appSignalsCounter[app][user];
  }

  /// @notice Returns the total number of signals for an app
  function appTotalSignalsCounter(bytes32 app) internal view returns (uint256) {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    return self.appTotalSignalsCounter[app];
  }

  /// @notice Returns the signaling threshold
  function signalingThreshold() internal view returns (uint256) {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    return self.signalsThreshold;
  }

  // ---------- Setters ---------- //

  /// @notice Signals a user
  function signalUser(address user) external {
    _signalUser(user, "");
  }

  /// @notice Signals a user with a reason
  function signalUserWithReason(address user, string memory reason) external {
    _signalUser(user, reason);
  }

  /// @notice this method allows an app admin to assign a signaler to an app
  /// @param app - the app to assign the signaler to
  /// @param user - the signaler to assign to the app
  function assignSignalerToAppByAppAdmin(bytes32 app, address user) external {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    require(self.x2EarnApps.isAppAdmin(app, msg.sender), "BotSignaling: caller is not an admin of the app");

    assignSignalerToApp(app, user);
  }

  /// @notice this method allows an app admin to remove a signaler from an app
  /// @param user - the signaler to remove from the app
  function removeSignalerFromAppByAppAdmin(address user) external {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    bytes32 app = self.appOfSignaler[user];
    require(self.x2EarnApps.isAppAdmin(app, msg.sender), "BotSignaling: caller is not an admin of the app");

    removeSignalerFromApp(user);
  }

  /// @notice Sets the signaling threshold
  function setSignalingThreshold(uint256 threshold) external {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    self.signalsThreshold = threshold;
  }

  /// @notice Private function to remove a signaler from an app
  function removeSignalerFromApp(address user) public {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    require(user != address(0), "BotSignaling: user cannot be zero");

    // to emit in the event
    bytes32 app = self.appOfSignaler[user];

    self.appOfSignaler[user] = bytes32(0);

    emit SignalerRemovedFromApp(user, app);
  }

  /// @notice Private function to assign a signaler to an app
  function assignSignalerToApp(bytes32 app, address user) public {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    require(app != bytes32(0), "BotSignaling: app cannot be zero");
    require(user != address(0), "BotSignaling: user cannot be zero");

    self.appOfSignaler[user] = app;
    emit SignalerAssignedToApp(user, app);
  }

  /// @notice Resets the signals of a user
  /// @param user - the user to reset the signals of
  /// @param reason - the reason for resetting the signals
  function resetUserSignals(address user, string memory reason) external {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    // Get the signals
    uint256 signals = self.signaledCounter[user];

    // Reset the signals
    self.signaledCounter[user] = 0;

    // Get the passport address if the user has attached their entity to a passport
    address passport = PassportEntityLogic._getPassportForEntity(user);
    if (user != passport) {
      self.signaledCounter[passport] -= signals;
    }

    emit UserSignalsReset(user, reason);
  }

  /// @notice Resets the signals of a user
  /// @param user - the user to reset the signals of
  /// @param reason - the reason for resetting the signals
  function resetUserSignalsByAppWithReason(address user, string memory reason) external {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    bytes32 app = self.appOfSignaler[msg.sender];

    _resetUserSignalsOfApp(user, app, reason);
  }

  // ---------- Private ---------- //

  /// @notice Private function to signal a user
  function _signalUser(address user, string memory reason) private {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    self.signaledCounter[user]++;

    bytes32 app = self.appOfSignaler[msg.sender];
    self.appSignalsCounter[app][user]++;
    self.appTotalSignalsCounter[app]++;

    // Check if the user has attached their entity to a passport, if so, also signal the passport
    address passport = PassportEntityLogic._getPassportForEntity(user);
    if (user != passport) {
      self.signaledCounter[passport]++;
      self.appSignalsCounter[app][passport]++;
    }

    emit UserSignaled(user, msg.sender, app, reason);
  }

  /// @notice Resets the signals of a user for an app
  /// @param user - the user to reset the signals of
  /// @param app - the app to reset the signals for
  /// @param reason - the reason for resetting the signals
  function _resetUserSignalsOfApp(address user, bytes32 app, string memory reason) private {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    // Get the passport address if the user has attached their entity to a passport
    address passport = PassportEntityLogic._getPassportForEntity(user);

    uint256 signals = self.appSignalsCounter[app][user];

    self.appSignalsCounter[app][user] = 0;
    self.appTotalSignalsCounter[app] -= signals;

    // Check against underflow since resetUserSignals() may have already set signaledCounter to 0.
    // This prevents errors when these functions are called in sequence (resetUserSignals first, then resetUserSignalsByAppWithReason)
    if (self.signaledCounter[user] >= signals) {
      self.signaledCounter[user] -= signals;
    } else {
      self.signaledCounter[user] = 0;
    }

    if (user != passport) {
      if (self.signaledCounter[passport] >= signals) {
        self.signaledCounter[passport] -= signals;
      } else {
        self.signaledCounter[passport] = 0;
      }
      self.appSignalsCounter[app][passport] -= signals;
    }

    emit UserSignalsResetForApp(user, app, reason);
  }

  /**
   * @dev Attaches the signals of an entity to its corresponding passport. If an entity has interacted with apps
   * and accumulated signals, this function aggregates those signals and assigns them to the passport.
   * This includes both the total signal count and the signals for each app the entity has interacted with.
   * @param entity The address of the entity whose signals are being attached to the passport.
   * @param passport The address of the passport to which the entity's signals will be attached.
   */
  function attachEntitySignalsToPassport(address entity, address passport) internal {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    // Attach the signals of the entity to the passport
    self.signaledCounter[passport] += self.signaledCounter[entity];

    // Get the unique apps that the entity has interacted with
    bytes32[] memory apps = self.userInteractedApps[entity];
    // Attach the signals of the entity to the passport for each app
    for (uint256 i = 0; i < apps.length; i++) {
      bytes32 appId = apps[i];
      self.appSignalsCounter[appId][passport] += self.appSignalsCounter[appId][entity];
    }
  }

  /**
   * @dev Removes the signals of an entity from the corresponding passport. This function deducts
   * all signal data from the entity that was previously transferred to the passport, including both the total signal count
   * and app-specific signals.
   * @param entity The address of the entity whose signals will be removed from the passport.
   * @param passport The address of the passport that will have the signals removed.
   */
  function removeEntitySignalsFromPassport(address entity, address passport) internal {
    PassportStorageTypes.PassportStorage storage self = PassportStorageTypes.getPassportStorage();
    // Remove the signals of the entity from the passport
    uint256 entitySignals = self.signaledCounter[entity];

    // Check against underflow since signals may have been reset separately
    if (self.signaledCounter[passport] >= entitySignals) {
      self.signaledCounter[passport] -= entitySignals;
    } else {
      self.signaledCounter[passport] = 0;
    }

    // Get the unique apps that the entity has interacted with
    bytes32[] memory apps = self.userInteractedApps[entity];
    // Remove the signals of the entity from the passport for each app
    for (uint256 i = 0; i < apps.length; i++) {
      bytes32 appId = apps[i];
      self.appSignalsCounter[appId][passport] -= self.appSignalsCounter[appId][entity];
    }
  }
}
