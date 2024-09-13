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
import { PassportEIP712SigningLogic } from "./PassportEIP712SigningLogic.sol";
import { PassportTypes } from "./PassportTypes.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

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

  // ---------- Getters ---------- //

  /// @notice Returns the number of times a user has been signaled
  function signaledCounter(
    PassportStorageTypes.PassportStorage storage self,
    address user
  ) internal view returns (uint256) {
    return self.signaledCounter[user];
  }

  /// @notice Returns the belonging app of a signaler
  function appOfSignaler(
    PassportStorageTypes.PassportStorage storage self,
    address signaler
  ) internal view returns (bytes32) {
    return self.appOfSignaler[signaler];
  }

  /// @notice Returns the number of times a user has been signaled by an app
  function appSignalsCounter(
    PassportStorageTypes.PassportStorage storage self,
    bytes32 app,
    address user
  ) internal view returns (uint256) {
    return self.appSignalsCounter[app][user];
  }

  /// @notice Returns the total number of signals for an app
  function appTotalSignalsCounter(
    PassportStorageTypes.PassportStorage storage self,
    bytes32 app
  ) internal view returns (uint256) {
    return self.appTotalSignalsCounter[app];
  }

  /// @notice Returns the signaling threshold
  function signalingThreshold(PassportStorageTypes.PassportStorage storage self) internal view returns (uint256) {
    return self.signalsThreshold;
  }

  // ---------- Setters ---------- //

  /// @notice Signals a user
  function signalUser(PassportStorageTypes.PassportStorage storage self, address user) external {
    _signalUser(self, user, "");
  }

  /// @notice Signals a user with a reason
  function signalUserWithReason(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    string memory reason
  ) external {
    _signalUser(self, user, reason);
  }

  /// @notice this method allows an app admin to assign a signaler to an app
  /// @param app - the app to assign the signaler to
  /// @param user - the signaler to assign to the app
  function assignSignalerToAppByAppAdmin(
    PassportStorageTypes.PassportStorage storage self,
    bytes32 app,
    address user
  ) external {
    require(self.x2EarnApps.isAppAdmin(app, msg.sender), "BotSignaling: caller is not an admin of the app");

    assignSignalerToApp(self, app, user);
  }

  /// @notice this method allows an app admin to remove a signaler from an app
  /// @param user - the signaler to remove from the app
  function removeSignalerFromAppByAppAdmin(PassportStorageTypes.PassportStorage storage self, address user) external {
    bytes32 app = self.appOfSignaler[user];
    require(self.x2EarnApps.isAppAdmin(app, msg.sender), "BotSignaling: caller is not an admin of the app");

    removeSignalerFromApp(self, user);
  }

  /// @notice Sets the signaling threshold
  function setSignalingThreshold(PassportStorageTypes.PassportStorage storage self, uint256 threshold) external {
    self.signalsThreshold = threshold;
  }

  /// @notice Private function to remove a signaler from an app
  function removeSignalerFromApp(PassportStorageTypes.PassportStorage storage self, address user) public {
    require(user != address(0), "BotSignaling: user cannot be zero");

    // to emit in the event
    bytes32 app = self.appOfSignaler[user];

    self.appOfSignaler[user] = bytes32(0);

    emit SignalerRemovedFromApp(user, app);
  }

  /// @notice Private function to assign a signaler to an app
  function assignSignalerToApp(PassportStorageTypes.PassportStorage storage self, bytes32 app, address user) public {
    require(app != bytes32(0), "BotSignaling: app cannot be zero");
    require(user != address(0), "BotSignaling: user cannot be zero");

    self.appOfSignaler[user] = app;
    emit SignalerAssignedToApp(user, app);
  }

  // ---------- Private ---------- //

  /// @notice Private function to signal a user
  function _signalUser(PassportStorageTypes.PassportStorage storage self, address user, string memory reason) private {
    self.signaledCounter[user]++;

    bytes32 app = self.appOfSignaler[msg.sender];
    self.appSignalsCounter[app][user]++;
    self.appTotalSignalsCounter[app]++;

    emit UserSignaled(user, msg.sender, app, reason);
  }
}
