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

import { PassportTypes } from "../../ve-better-passport/libraries/PassportTypes.sol";
import { IVeBetterPassport } from "../../interfaces/IVeBetterPassport.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { IStargateNFT } from "../../mocks/Stargate/interfaces/IStargateNFT.sol";
import { DataTypes } from "../../mocks/Stargate/StargateNFT/libraries/DataTypes.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { X2EarnAppsStorageTypes } from "./X2EarnAppsStorageTypes.sol";

/**
 * @title EndorsementUtils
 * @dev Utility library for handling endorsements of applications in a voting context.
 */
library EndorsementUtils {
  using Checkpoints for Checkpoints.Trace208;
  // ------------------------------- Node Data Types -------------------------------
  enum NodeStrengthLevel {
    None,
    Strength,
    Thunder,
    Mjolnir,
    VeThorX,
    StrengthX,
    ThunderX,
    MjolnirX
  }

  struct NodeStrengthScores {
    uint256 strength;
    uint256 thunder;
    uint256 mjolnir;
    uint256 veThorX;
    uint256 strengthX;
    uint256 thunderX;
    uint256 mjolnirX;
  }

  enum NodeSource {
    None,
    VeChainNodes,
    StargateNFT
  }

  // ------------------------------- Errors -------------------------------
  error X2EarnNonexistentApp(bytes32 appId);
  error X2EarnAppBlacklisted(bytes32 appId);
  error X2EarnNonNodeHolder();
  error X2EarnAppAlreadyEndorsed(bytes32 appId);
  error NodeNotAllowedToEndorse();
  error X2EarnNonEndorser();
  error NodeManagementXAppAlreadyIncluded(bytes32 appId);
  error X2EarnInvalidAddress(address addr);
  // V8 errors
  error EndorsementsPaused();
  error CooldownNotExpired(uint256 nodeId, bytes32 appId);
  error ExceedsMaxPointsPerApp(bytes32 appId, uint256 current, uint256 max);
  error ExceedsMaxPointsPerNode(uint256 nodeId, bytes32 appId, uint256 max);
  error InsufficientAvailablePoints(uint256 nodeId, uint256 available, uint256 requested);
  error InvalidPointsAmount();
  error MigrationNotCompleted();

  // ------------------------------- Events -------------------------------
  event AppEndorsed(bytes32 indexed appId, uint256 indexed nodeId, address endorser, uint256 points);
  event AppUnendorsed(bytes32 indexed appId, uint256 indexed nodeId, uint256 points);
  event EndorsementsPausedUpdated(bool paused);
  event NodeStrengthScoresUpdated(NodeStrengthScores nodeStrengthScores);
  event AppEndorsementStatusUpdated(bytes32 indexed appId, bool endorsed);
  event AppUnendorsedGracePeriodStarted(bytes32 indexed appId, uint48 startBlock, uint48 endBlock);
  event GracePeriodUpdated(uint256 oldGracePeriod, uint256 newGracePeriod);
  event CooldownPeriodUpdated(uint256 oldCooldownPeriod, uint256 newCooldownPeriod);
  event EndorsementScoreThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
  event MaxPointsPerNodePerAppUpdated(uint256 oldMax, uint256 newMax);
  event MaxPointsPerAppUpdated(uint256 oldMax, uint256 newMax);

  // ------------------------------- Getter Functions -------------------------------

  /**
   * @notice Returns the current endorsement score for an app.
   * @param appId The unique identifier of the app.
   * @return The total endorsement points the app has received.
   */
  function getScore(bytes32 appId) external view returns (uint256) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._appEndorsementScore[appId];
  }

  /**
   * @notice Returns all endorser addresses for an app.
   * @dev Filters out burned nodes and returns only valid manager addresses.
   * @param appId The unique identifier of the app.
   * @return Array of addresses managing nodes that endorse this app.
   */
  function getEndorsers(bytes32 appId) external view returns (address[] memory) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    uint256[] storage nodeIds = $._appEndorserNodes[appId];
    uint256 length = nodeIds.length;
    address[] memory endorsers = new address[](length);
    uint256 count;

    for (uint256 i; i < length; i++) {
      uint256 nodeId = nodeIds[i];
      if (!$._stargateNFT.tokenExists(nodeId)) continue;
      address manager = $._stargateNFT.getTokenManager(nodeId);
      if (manager != address(0)) {
        endorsers[count] = manager;
        count++;
      }
    }

    assembly {
      mstore(endorsers, count)
    }
    return endorsers;
  }

  /**
   * @notice Returns all node IDs that endorse an app.
   * @param appId The unique identifier of the app.
   * @return Array of node IDs endorsing this app.
   */
  function getEndorserNodes(bytes32 appId) external view returns (uint256[] memory) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._appEndorserNodes[appId];
  }

  /**
   * @notice Returns the total endorsement score a user has from all their managed nodes.
   * @param user The address of the user.
   * @return Total endorsement points across all nodes the user manages.
   */
  function getUsersEndorsementScore(address user) external view returns (uint256) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    DataTypes.Token[] memory nodeLevels = $._stargateNFT.tokensManagedBy(user);
    uint256 totalScore;
    for (uint256 i; i < nodeLevels.length; i++) {
      totalScore += $._nodeEnodorsmentScore[nodeLevels[i].levelId];
    }
    return totalScore;
  }

  /**
   * @notice Returns the endorsement score for a specific node based on its level.
   * @param nodeId The unique identifier of the node.
   * @return The endorsement score the node has based on its strength level.
   */
  function getNodeEndorsementScore(uint256 nodeId) external view returns (uint256) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    uint8 nodeLevel = $._stargateNFT.getTokenLevel(nodeId);
    return $._nodeEnodorsmentScore[nodeLevel];
  }

  /**
   * @notice Returns the endorsement score for a specific node strength level.
   * @param nodeLevel The strength level (1-7 corresponding to different node types).
   * @return The endorsement score assigned to that node level.
   */
  function nodeLevelEndorsementScore(uint8 nodeLevel) external view returns (uint256) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._nodeEnodorsmentScore[nodeLevel];
  }

  /**
   * @notice Returns the grace period duration in blocks.
   * @dev Grace period is the time an app has to regain endorsement after losing eligibility.
   * @return The grace period duration in blocks.
   */
  function gracePeriod() external view returns (uint256) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._gracePeriodDuration;
  }

  /**
   * @notice Returns the cooldown period duration in blocks.
   * @dev Cooldown prevents immediate un-endorsement after endorsing an app.
   * @return The cooldown period duration in blocks.
   */
  function cooldownPeriod() external view returns (uint256) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._cooldownPeriod;
  }

  /**
   * @notice Returns the minimum endorsement score required for an app to be eligible.
   * @return The endorsement score threshold (default 100).
   */
  function endorsementScoreThreshold() external view returns (uint256) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._endorsementScoreThreshold;
  }

  /**
   * @notice Checks if an app is in the unendorsed (pending endorsement) list.
   * @param appId The unique identifier of the app.
   * @param isBlacklisted Whether the app is blacklisted.
   * @return True if the app is pending endorsement, false otherwise.
   */
  function isAppUnendorsed(bytes32 appId, bool isBlacklisted) external view returns (bool) {
    if (isBlacklisted) return false;
    return X2EarnAppsStorageTypes._getEndorsementStorage()._unendorsedAppsIndex[appId] > 0;
  }

  /**
   * @notice Returns all app IDs that are currently pending endorsement.
   * @return Array of app IDs waiting to reach the endorsement threshold.
   */
  function unendorsedAppIds() external view returns (bytes32[] memory) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._unendorsedApps;
  }

  /**
   * @notice Returns the maximum points a single node can assign to one app.
   * @return The max points per node per app (default 49).
   */
  function maxPointsPerNodePerApp() external view returns (uint256) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._maxPointsPerNodePerApp;
  }

  /**
   * @notice Returns the maximum total points an app can receive from all endorsers.
   * @return The max points per app (default 110).
   */
  function maxPointsPerApp() external view returns (uint256) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._maxPointsPerApp;
  }

  /**
   * @notice Checks if endorsements are currently paused (during migration).
   * @return True if endorsements are paused, false otherwise.
   */
  function endorsementsPaused() external view returns (bool) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._endorsementsPaused;
  }

  /**
   * @notice Checks if the V8 migration has been completed.
   * @return True if migration is complete, false otherwise.
   */
  function migrationCompleted() external view returns (bool) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._migrationCompleted;
  }

  /**
   * @notice Returns all active endorsements for a node.
   * @dev Each endorsement contains appId, points, and endorsedAtBlock for cooldown tracking.
   * @param nodeId The unique identifier of the node.
   * @return Array of Endorsement structs representing all apps the node endorses.
   */
  function getNodeActiveEndorsements(
    uint256 nodeId
  ) external view returns (X2EarnAppsStorageTypes.Endorsement[] memory) {
    return X2EarnAppsStorageTypes._getEndorsementStorage()._activeEndorsements[nodeId];
  }

  /**
   * @notice Returns how many points a node has allocated to a specific app.
   * @param nodeId The unique identifier of the node.
   * @param appId The unique identifier of the app.
   * @return The number of points the node has endorsed to this app.
   */
  function getNodePointsForApp(uint256 nodeId, bytes32 appId) external view returns (uint256) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    if (endorsements.length == 0) return 0;
    uint256 index = $._activeEndorsementsAppIndex[nodeId][appId];
    if (index >= endorsements.length || endorsements[index].appId != appId) return 0;
    return endorsements[index].points;
  }

  /**
   * @notice Returns the total points a node has used across all endorsements.
   * @param nodeId The unique identifier of the node.
   * @return Total points the node has allocated to apps.
   */
  function getNodeUsedPoints(uint256 nodeId) external view returns (uint256) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    uint256 usedPoints;
    for (uint256 i; i < endorsements.length; i++) {
      usedPoints += endorsements[i].points;
    }
    return usedPoints;
  }

  /**
   * @notice Returns the available points a node can still allocate to apps.
   * @dev Calculated as: totalPoints (based on node level) - usedPoints (sum of all endorsements).
   * @param nodeId The unique identifier of the node.
   * @return Available points the node can use for new endorsements.
   */
  function getNodeAvailablePoints(uint256 nodeId) external view returns (uint256) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    uint8 nodeLevel = $._stargateNFT.getTokenLevel(nodeId);
    uint256 totalPoints = $._nodeEnodorsmentScore[nodeLevel];
    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    uint256 usedPoints;
    for (uint256 i; i < endorsements.length; i++) {
      usedPoints += endorsements[i].points;
    }
    return totalPoints > usedPoints ? totalPoints - usedPoints : 0;
  }

  /**
   * @notice Returns comprehensive info about a node's endorsement points.
   * @dev Calculates total, used, available, and locked (under cooldown) points in a single call.
   * @param nodeId The unique identifier of the node.
   * @return info Struct containing totalPoints, usedPoints, availablePoints, and lockedPoints.
   */
  function getNodePointsInfo(uint256 nodeId) external view returns (X2EarnAppsStorageTypes.NodePointsInfo memory info) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    uint8 nodeLevel = $._stargateNFT.getTokenLevel(nodeId);
    info.totalPoints = $._nodeEnodorsmentScore[nodeLevel];

    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    uint256 cooldownPeriod = $._cooldownPeriod;

    for (uint256 i; i < endorsements.length; i++) {
      info.usedPoints += endorsements[i].points;
      if (block.number < endorsements[i].endorsedAtBlock + cooldownPeriod) {
        info.lockedPoints += endorsements[i].points;
      }
    }

    info.availablePoints = info.totalPoints > info.usedPoints ? info.totalPoints - info.usedPoints : 0;
  }

  /**
   * @notice Checks if a node can unendorse a specific app (cooldown expired).
   * @dev Returns false if node doesn't endorse the app or if cooldown hasn't expired.
   * @param nodeId The unique identifier of the node.
   * @param appId The unique identifier of the app.
   * @return True if the node can unendorse the app, false otherwise.
   */
  function canUnendorse(uint256 nodeId, bytes32 appId) external view returns (bool) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    if (endorsements.length == 0) return false;
    uint256 index = $._activeEndorsementsAppIndex[nodeId][appId];
    if (index >= endorsements.length || endorsements[index].appId != appId) return false;
    return block.number >= endorsements[index].endorsedAtBlock + $._cooldownPeriod;
  }

  // ------------------------------- Setter Functions -------------------------------

  /**
   * @notice Updates the endorsement scores for all node strength levels.
   * @dev Called by governance to adjust how many endorsement points each node type provides.
   * @param nodeStrengthScores Struct containing scores for all 7 node levels.
   */
  function updateNodeEndorsementScores(NodeStrengthScores calldata nodeStrengthScores) external {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    $._nodeEnodorsmentScore[1] = nodeStrengthScores.strength;
    $._nodeEnodorsmentScore[2] = nodeStrengthScores.thunder;
    $._nodeEnodorsmentScore[3] = nodeStrengthScores.mjolnir;
    $._nodeEnodorsmentScore[4] = nodeStrengthScores.veThorX;
    $._nodeEnodorsmentScore[5] = nodeStrengthScores.strengthX;
    $._nodeEnodorsmentScore[6] = nodeStrengthScores.thunderX;
    $._nodeEnodorsmentScore[7] = nodeStrengthScores.mjolnirX;
    emit NodeStrengthScoresUpdated(nodeStrengthScores);
  }

  /**
   * @notice Adds or removes an app from the unendorsed apps list.
   * @dev Apps in this list have been submitted but haven't reached the endorsement threshold yet.
   *      Uses swap-and-pop pattern for O(1) removal.
   * @param appId The unique identifier of the app.
   * @param remove If true, removes from list; if false, adds to list.
   */
  function updateUnendorsedApps(bytes32 appId, bool remove) public {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    if (remove) {
      uint256 index = $._unendorsedAppsIndex[appId] - 1;
      uint256 lastIndex = $._unendorsedApps.length - 1;
      bytes32 lastAppId = $._unendorsedApps[lastIndex];
      $._unendorsedApps[index] = lastAppId;
      $._unendorsedAppsIndex[lastAppId] = index + 1;
      $._unendorsedApps.pop();
      delete $._unendorsedAppsIndex[appId];
    } else {
      $._unendorsedApps.push(appId);
      $._unendorsedAppsIndex[appId] = $._unendorsedApps.length;
    }
  }

  /**
   * @notice Sets the grace period duration.
   * @dev Grace period is the time an app has to regain endorsement after losing eligibility.
   * @param gracePeriodDuration The new grace period in blocks.
   */
  function setGracePeriod(uint48 gracePeriodDuration) external {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    emit GracePeriodUpdated($._gracePeriodDuration, gracePeriodDuration);
    $._gracePeriodDuration = gracePeriodDuration;
  }

  /**
   * @notice Sets the cooldown period duration.
   * @dev Cooldown prevents immediate un-endorsement after endorsing an app.
   * @param cooldownPeriodDuration The new cooldown period in blocks.
   */
  function setCooldownPeriod(uint256 cooldownPeriodDuration) external {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    emit CooldownPeriodUpdated($._cooldownPeriod, cooldownPeriodDuration);
    $._cooldownPeriod = cooldownPeriodDuration;
  }

  /**
   * @notice Updates the minimum endorsement score required for app eligibility.
   * @param scoreThreshold The new endorsement score threshold.
   */
  function updateEndorsementScoreThreshold(uint256 scoreThreshold) external {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    emit EndorsementScoreThresholdUpdated($._endorsementScoreThreshold, scoreThreshold);
    $._endorsementScoreThreshold = scoreThreshold;
  }

  /**
   * @notice Sets the endorsement status of an app and updates pending list.
   * @param appId The unique identifier of the app.
   * @param endorsed If true, removes from pending list; if false, adds to pending list.
   */
  function setEndorsementStatus(bytes32 appId, bool endorsed) public {
    updateUnendorsedApps(appId, endorsed);
    emit AppEndorsementStatusUpdated(appId, endorsed);
  }

  /**
   * @notice Sets the maximum points a single node can assign to one app.
   * @dev Enforces decentralization by preventing one node from dominating an app's endorsement.
   * @param maxPoints The new max points per node per app (default 49).
   */
  function setMaxPointsPerNodePerApp(uint256 maxPoints) external {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    emit MaxPointsPerNodePerAppUpdated($._maxPointsPerNodePerApp, maxPoints);
    $._maxPointsPerNodePerApp = maxPoints;
  }

  /**
   * @notice Sets the maximum total points an app can receive from all endorsers.
   * @dev Provides a buffer above the threshold to prevent over-endorsement.
   * @param maxPoints The new max points per app (default 110).
   */
  function setMaxPointsPerApp(uint256 maxPoints) external {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    emit MaxPointsPerAppUpdated($._maxPointsPerApp, maxPoints);
    $._maxPointsPerApp = maxPoints;
  }

  /**
   * @notice Pauses or unpauses endorsement operations.
   * @dev Used during migration to prevent state changes while data is being seeded.
   * @param paused If true, pauses endorsements; if false, unpauses.
   */
  function setEndorsementsPaused(bool paused) external {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    $._endorsementsPaused = paused;
    emit EndorsementsPausedUpdated(paused);
  }

  /**
   * @notice Marks the V8 migration as complete or incomplete.
   * @dev Once complete, seedEndorsement() can no longer be called.
   * @param completed If true, marks migration as complete.
   */
  function setMigrationCompleted(bool completed) external {
    X2EarnAppsStorageTypes._getEndorsementStorage()._migrationCompleted = completed;
  }

  // ------------------------------- Core Logic Functions -------------------------------

  /**
   * @notice Endorses an app with a specified number of points from a node.
   * @dev Validates all constraints (paused, caps, node ownership) before creating endorsement.
   *      If node already endorses this app, adds points and resets cooldown.
   * @param appId The unique identifier of the app to endorse.
   * @param nodeId The unique identifier of the endorsing node.
   * @param points The number of points to endorse with.
   * @param isBlacklisted Whether the app is currently blacklisted.
   * @param appExists Whether the app has been fully created (not just submitted).
   * @param isEligibleNow Whether the app is currently eligible for voting.
   */
  function endorseApp(
    bytes32 appId,
    uint256 nodeId,
    uint256 points,
    bool isBlacklisted,
    bool appExists,
    bool isEligibleNow
  ) external {
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage = X2EarnAppsStorageTypes._getAppsStorageStorage();
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();

    _validateEndorsement($, appsStorage, appId, nodeId, points, isBlacklisted);

    uint256 currentAppPoints = _getNodePointsForAppInternal($, nodeId, appId);
    _updateEndorsement($, nodeId, appId, points, currentAppPoints);
    $._appEndorsementScore[appId] += points;

    if ($._appEndorsementScore[appId] >= $._endorsementScoreThreshold) {
      _updateStatusIfThresholdMet($, appsStorage, appId, appExists, isEligibleNow, isBlacklisted);
    }

    address endorser = $._stargateNFT.getTokenManager(nodeId);
    emit AppEndorsed(appId, nodeId, endorser, points);
  }

  function _validateEndorsement(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage,
    bytes32 appId,
    uint256 nodeId,
    uint256 points,
    bool isBlacklisted
  ) private view {
    if ($._endorsementsPaused) revert EndorsementsPaused();
    if (appsStorage._apps[appId].id == bytes32(0)) revert X2EarnNonexistentApp(appId);
    if (isBlacklisted) revert X2EarnAppBlacklisted(appId);
    if (nodeId == 0 || points == 0) revert InvalidPointsAmount();
    if (!$._stargateNFT.tokenExists(nodeId) || !$._stargateNFT.isTokenManager(msg.sender, nodeId)) {
      revert X2EarnNonNodeHolder();
    }

    uint8 nodeLevel = $._stargateNFT.getTokenLevel(nodeId);
    if ($._nodeEnodorsmentScore[nodeLevel] == 0) revert NodeNotAllowedToEndorse();

    uint256 totalNodePoints = $._nodeEnodorsmentScore[nodeLevel];
    uint256 usedPoints = _getNodeUsedPoints($, nodeId);
    uint256 availablePoints = totalNodePoints > usedPoints ? totalNodePoints - usedPoints : 0;
    if (points > availablePoints) revert InsufficientAvailablePoints(nodeId, availablePoints, points);

    uint256 currentAppPoints = _getNodePointsForAppInternal($, nodeId, appId);
    if (currentAppPoints + points > $._maxPointsPerNodePerApp) {
      revert ExceedsMaxPointsPerNode(nodeId, appId, $._maxPointsPerNodePerApp);
    }
    if ($._appEndorsementScore[appId] + points > $._maxPointsPerApp) {
      revert ExceedsMaxPointsPerApp(appId, $._appEndorsementScore[appId], $._maxPointsPerApp);
    }
  }

  function _updateEndorsement(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint256 nodeId,
    bytes32 appId,
    uint256 points,
    uint256 currentAppPoints
  ) private {
    if (currentAppPoints > 0) {
      uint256 index = $._activeEndorsementsAppIndex[nodeId][appId];
      $._activeEndorsements[nodeId][index].points = currentAppPoints + points;
      $._activeEndorsements[nodeId][index].endorsedAtBlock = block.number;
    } else {
      // Add to node's endorsements
      $._activeEndorsements[nodeId].push(
        X2EarnAppsStorageTypes.Endorsement({ appId: appId, points: points, endorsedAtBlock: block.number })
      );
      $._activeEndorsementsAppIndex[nodeId][appId] = $._activeEndorsements[nodeId].length - 1;

      // Add to app's endorser nodes (reverse mapping)
      $._appEndorserNodes[appId].push(nodeId);
      $._appEndorserNodesIndex[appId][nodeId] = $._appEndorserNodes[appId].length - 1;
    }
  }

  /**
   * @notice Removes points from an endorsement (partial or full un-endorsement).
   * @dev Requires cooldown to have expired. If points=0, removes entire endorsement.
   * @param appId The unique identifier of the app to unendorse.
   * @param nodeId The unique identifier of the endorsing node.
   * @param points The number of points to remove (0 = remove all).
   * @param isBlacklisted Whether the app is currently blacklisted.
   * @param isEligibleNow Whether the app is currently eligible for voting.
   * @param clock The current block timestamp for grace period calculations.
   * @return stillEligible Whether the app remains eligible after this un-endorsement.
   */
  function unendorseApp(
    bytes32 appId,
    uint256 nodeId,
    uint256 points,
    bool isBlacklisted,
    bool isEligibleNow,
    uint48 clock
  ) external returns (bool stillEligible) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage = X2EarnAppsStorageTypes._getAppsStorageStorage();

    if ($._endorsementsPaused) revert EndorsementsPaused();
    if (appsStorage._apps[appId].id == bytes32(0)) revert X2EarnNonexistentApp(appId);
    if (!$._stargateNFT.tokenExists(nodeId) || !$._stargateNFT.isTokenManager(msg.sender, nodeId)) {
      revert X2EarnNonNodeHolder();
    }

    // Get current endorsement
    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    if (endorsements.length == 0) revert X2EarnNonEndorser();

    uint256 index = $._activeEndorsementsAppIndex[nodeId][appId];
    if (index >= endorsements.length || endorsements[index].appId != appId) {
      revert X2EarnNonEndorser();
    }

    // Check cooldown (per-app)
    if (block.number < endorsements[index].endorsedAtBlock + $._cooldownPeriod) {
      revert CooldownNotExpired(nodeId, appId);
    }

    uint256 currentPoints = endorsements[index].points;
    uint256 pointsToRemove = points == 0 ? currentPoints : points;

    if (pointsToRemove > currentPoints) {
      revert InvalidPointsAmount();
    }

    // Update or remove endorsement
    if (pointsToRemove == currentPoints) {
      // Remove entire endorsement (swap and pop)
      _removeEndorsement($, nodeId, appId, index);
    } else {
      // Partial unendorse
      endorsements[index].points -= pointsToRemove;
    }

    // Update app score
    $._appEndorsementScore[appId] -= pointsToRemove;

    emit AppUnendorsed(appId, nodeId, pointsToRemove);

    // Check if still eligible
    if (!isEligibleNow || isBlacklisted) {
      return isEligibleNow;
    }

    if ($._appEndorsementScore[appId] < $._endorsementScoreThreshold) {
      return _updateStatusIfThresholdNotMetWithVote($, appId, isBlacklisted, isEligibleNow, clock);
    }

    return true;
  }

  /**
   * @notice Removes a node's endorsement from an app (called by app admin).
   * @dev Unlike unendorseApp, this bypasses cooldown check. Used by app admins to remove endorsers.
   * @param appId The unique identifier of the app.
   * @param nodeId The unique identifier of the node to remove.
   * @param isBlacklisted Whether the app is currently blacklisted.
   * @param isEligibleNow Whether the app is currently eligible for voting.
   * @param clock The current block timestamp for grace period calculations.
   * @return stillEligible Whether the app remains eligible after removal.
   */
  function removeNodeEndorsement(
    bytes32 appId,
    uint256 nodeId,
    bool isBlacklisted,
    bool isEligibleNow,
    uint48 clock
  ) public returns (bool stillEligible) {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage = X2EarnAppsStorageTypes._getAppsStorageStorage();

    if (appsStorage._apps[appId].id == bytes32(0)) revert X2EarnNonexistentApp(appId);

    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    if (endorsements.length == 0) revert X2EarnNonEndorser();

    uint256 index = $._activeEndorsementsAppIndex[nodeId][appId];
    if (index >= endorsements.length || endorsements[index].appId != appId) {
      revert X2EarnNonEndorser();
    }

    uint256 pointsToRemove = endorsements[index].points;
    _removeEndorsement($, nodeId, appId, index);
    $._appEndorsementScore[appId] -= pointsToRemove;

    emit AppUnendorsed(appId, nodeId, pointsToRemove);

    if (!isEligibleNow || isBlacklisted) {
      return isEligibleNow;
    }

    if ($._appEndorsementScore[appId] < $._endorsementScoreThreshold) {
      return _updateStatusIfThresholdNotMetWithVote($, appId, isBlacklisted, isEligibleNow, clock);
    }

    return true;
  }

  /**
   * @notice Removes an app submission that hasn't been fully created yet.
   * @dev Can only be called on apps that were submitted but not yet created (createdAtTimestamp == 0).
   * @param appId The unique identifier of the app to remove.
   */
  function removeXAppSubmission(bytes32 appId) external {
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage = X2EarnAppsStorageTypes._getAppsStorageStorage();
    if (appsStorage._apps[appId].id == bytes32(0)) revert X2EarnNonexistentApp(appId);
    if (appsStorage._apps[appId].createdAtTimestamp != 0) revert NodeManagementXAppAlreadyIncluded(appId);
    updateUnendorsedApps(appId, true);
  }

  /**
   * @notice Validates an app's endorsement status and cleans up invalid endorsements.
   * @dev Removes endorsements from burned/invalid nodes and updates eligibility status.
   *      Triggers grace period if score drops below threshold.
   * @param appId The unique identifier of the app to check.
   * @param clock The current block timestamp for grace period calculations.
   * @return True if the app is still eligible after validation, false otherwise.
   */
  function checkEndorsement(bytes32 appId, uint48 clock) external returns (bool) {
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage = X2EarnAppsStorageTypes._getAppsStorageStorage();
    X2EarnAppsStorageTypes.VoteEligibilityStorage storage voteStorage = X2EarnAppsStorageTypes
      ._getVoteEligibilityStorage();
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();

    if (appsStorage._apps[appId].id == bytes32(0)) revert X2EarnNonexistentApp(appId);

    bool isBlacklisted = voteStorage._blackList[appId];
    if (isBlacklisted) return false;

    // Validate endorsements and remove invalid ones (burned nodes, etc.)
    uint256 score = _validateAndCleanEndorsements($, appId);
    bool existsNow = appsStorage._apps[appId].createdAtTimestamp != 0;
    bool isEligibleNow = existsNow && voteStorage._isAppEligibleCheckpoints[appId].latest() == 1;

    if (score < $._endorsementScoreThreshold) {
      return _updateStatusIfThresholdNotMetWithVote($, appId, isBlacklisted, isEligibleNow, clock);
    } else {
      _updateStatusIfThresholdMet($, appsStorage, appId, existsNow, isEligibleNow, isBlacklisted);
    }

    return true;
  }

  /// @dev Validate all endorsements for an app, remove invalid ones, and return updated score
  function _validateAndCleanEndorsements(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    bytes32 appId
  ) private returns (uint256) {
    uint256[] storage nodeIds = $._appEndorserNodes[appId];
    uint256 validScore;
    uint256 i;

    while (i < nodeIds.length) {
      uint256 nodeId = nodeIds[i];
      bool isValid = $._stargateNFT.tokenExists(nodeId);

      if (!isValid) {
        // Get points from this endorsement
        uint256 endorseIndex = $._activeEndorsementsAppIndex[nodeId][appId];
        X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
        uint256 pointsToRemove = endorsements[endorseIndex].points;

        // Remove endorsement from node's list
        uint256 lastEndorseIndex = endorsements.length - 1;
        if (endorseIndex != lastEndorseIndex) {
          endorsements[endorseIndex] = endorsements[lastEndorseIndex];
          $._activeEndorsementsAppIndex[nodeId][endorsements[endorseIndex].appId] = endorseIndex;
        }
        endorsements.pop();
        delete $._activeEndorsementsAppIndex[nodeId][appId];

        // Remove from app's endorser list (swap and pop)
        uint256 lastNodeIndex = nodeIds.length - 1;
        if (i != lastNodeIndex) {
          uint256 lastNodeId = nodeIds[lastNodeIndex];
          nodeIds[i] = lastNodeId;
          $._appEndorserNodesIndex[appId][lastNodeId] = i;
        }
        nodeIds.pop();
        delete $._appEndorserNodesIndex[appId][nodeId];

        emit AppUnendorsed(appId, nodeId, pointsToRemove);
        // Don't increment i since we swapped
      } else {
        // Valid node - add points to score
        uint256 endorseIndex = $._activeEndorsementsAppIndex[nodeId][appId];
        validScore += $._activeEndorsements[nodeId][endorseIndex].points;
        i++;
      }
    }

    // Update stored score
    $._appEndorsementScore[appId] = validScore;
    return validScore;
  }

  /**
   * @notice Seeds an endorsement during migration (bypasses validation).
   * @dev Only callable before migrationCompleted is set to true. Requires MIGRATION_ROLE.
   *      Emits standard AppEndorsed event for indexer compatibility.
   * @param appId The unique identifier of the app to endorse.
   * @param nodeId The unique identifier of the endorsing node.
   * @param points The number of points to endorse with.
   */
  function seedEndorsement(bytes32 appId, uint256 nodeId, uint256 points) external {
    X2EarnAppsStorageTypes.EndorsementStorage storage $ = X2EarnAppsStorageTypes._getEndorsementStorage();

    if ($._migrationCompleted) revert MigrationNotCompleted();

    // Add endorsement to node's list
    $._activeEndorsements[nodeId].push(
      X2EarnAppsStorageTypes.Endorsement({ appId: appId, points: points, endorsedAtBlock: block.number })
    );
    $._activeEndorsementsAppIndex[nodeId][appId] = $._activeEndorsements[nodeId].length - 1;

    // Add to app's endorser nodes (reverse mapping)
    $._appEndorserNodes[appId].push(nodeId);
    $._appEndorserNodesIndex[appId][nodeId] = $._appEndorserNodes[appId].length - 1;

    $._appEndorsementScore[appId] += points;

    // Get endorser address from node manager
    address endorser = $._stargateNFT.getTokenManager(nodeId);
    emit AppEndorsed(appId, nodeId, endorser, points);
  }

  // ------------------------------- Private Functions -------------------------------

  function _getNodeUsedPoints(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint256 nodeId
  ) private view returns (uint256) {
    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    uint256 usedPoints;
    for (uint256 i; i < endorsements.length; i++) {
      usedPoints += endorsements[i].points;
    }
    return usedPoints;
  }

  function _getNodePointsForAppInternal(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint256 nodeId,
    bytes32 appId
  ) private view returns (uint256) {
    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    if (endorsements.length == 0) return 0;
    uint256 index = $._activeEndorsementsAppIndex[nodeId][appId];
    if (index >= endorsements.length || endorsements[index].appId != appId) return 0;
    return endorsements[index].points;
  }

  function _removeEndorsement(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint256 nodeId,
    bytes32 appId,
    uint256 index
  ) private {
    // Remove from node's endorsements (swap and pop)
    X2EarnAppsStorageTypes.Endorsement[] storage endorsements = $._activeEndorsements[nodeId];
    uint256 lastIndex = endorsements.length - 1;

    if (index != lastIndex) {
      X2EarnAppsStorageTypes.Endorsement storage lastEndorsement = endorsements[lastIndex];
      endorsements[index] = lastEndorsement;
      $._activeEndorsementsAppIndex[nodeId][lastEndorsement.appId] = index;
    }

    endorsements.pop();
    delete $._activeEndorsementsAppIndex[nodeId][appId];

    // Remove from app's endorser nodes (reverse mapping, swap and pop)
    uint256[] storage appNodes = $._appEndorserNodes[appId];
    uint256 nodeIndex = $._appEndorserNodesIndex[appId][nodeId];
    uint256 lastNodeIndex = appNodes.length - 1;

    if (nodeIndex != lastNodeIndex) {
      uint256 lastNodeId = appNodes[lastNodeIndex];
      appNodes[nodeIndex] = lastNodeId;
      $._appEndorserNodesIndex[appId][lastNodeId] = nodeIndex;
    }

    appNodes.pop();
    delete $._appEndorserNodesIndex[appId][nodeId];
  }

  function _updateStatusIfThresholdMet(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage,
    bytes32 appId,
    bool appExists,
    bool isEligibleNow,
    bool isBlacklisted
  ) private {
    if (!appExists) {
      appsStorage._apps[appId].createdAtTimestamp = block.timestamp;
      appsStorage._appIds.push(appId);
      $._veBetterPassport.setAppSecurity(appId, PassportTypes.APP_SECURITY.LOW);
    } else if (!isEligibleNow) {
      $._veBetterPassport.setAppSecurity(appId, $._appSecurity[appId]);
    }

    bool appUnendorsed = !isBlacklisted && $._unendorsedAppsIndex[appId] > 0;
    if (appUnendorsed) {
      setEndorsementStatus(appId, true);
    }

    $._appGracePeriodStart[appId] = 0;
  }

  function _updateStatusIfThresholdNotMetWithVote(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    bytes32 appId,
    bool isBlacklisted,
    bool isEligibleNow,
    uint48 clock
  ) private returns (bool stillEligible) {
    bool appUnendorsed = !isBlacklisted && $._unendorsedAppsIndex[appId] > 0;

    if (!appUnendorsed) {
      updateUnendorsedApps(appId, false);
      emit AppEndorsementStatusUpdated(appId, false);
    }

    if ($._appGracePeriodStart[appId] == 0 && isEligibleNow) {
      $._appGracePeriodStart[appId] = clock;
      emit AppUnendorsedGracePeriodStarted(appId, clock, clock + $._gracePeriodDuration);
      return true;
    } else if ((clock > $._appGracePeriodStart[appId] + $._gracePeriodDuration) && isEligibleNow) {
      $._appSecurity[appId] = $._veBetterPassport.appSecurity(appId);
      $._veBetterPassport.setAppSecurity(appId, PassportTypes.APP_SECURITY.NONE);
      return false;
    }

    return true;
  }
}
