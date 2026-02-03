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
  error X2EarnAlreadyEndorser();
  error X2EarnNodeCooldownActive();
  error NodeNotAllowedToEndorse();
  error X2EarnNonEndorser();
  error NodeManagementXAppAlreadyIncluded(bytes32 appId);
  error X2EarnInvalidAddress(address addr);

  // ------------------------------- Events -------------------------------
  event AppEndorsed(bytes32 indexed appId, uint256 endorser, bool endorsed);
  event NodeStrengthScoresUpdated(NodeStrengthScores nodeStrengthScores);
  event AppEndorsementStatusUpdated(bytes32 indexed appId, bool endorsed);
  event AppUnendorsedGracePeriodStarted(bytes32 indexed appId, uint48 startBlock, uint48 endBlock);
  event GracePeriodUpdated(uint256 oldGracePeriod, uint256 newGracePeriod);
  event CooldownPeriodUpdated(uint256 oldCooldownPeriod, uint256 newCooldownPeriod);
  event EndorsementScoreThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

  // ------------------------------- Getter Functions -------------------------------
  function getEndorsers(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    bytes32 appId
  ) external view returns (address[] memory) {
    uint256 length = $._appEndorsers[appId].length;
    address[] memory endorsers = new address[](length);
    uint256 count = 0;

    for (uint256 i = 0; i < length; i++) {
      if (!$._stargateNFT.tokenExists($._appEndorsers[appId][i])) {
        continue;
      }
      address endorser = $._stargateNFT.getTokenManager($._appEndorsers[appId][i]);
      if (endorser != address(0)) {
        endorsers[count] = endorser;
        count++;
      }
    }

    assembly {
      mstore(endorsers, count)
    }

    return endorsers;
  }

  function getUsersEndorsementScore(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    address user
  ) external view returns (uint256) {
    DataTypes.Token[] memory nodeLevels = $._stargateNFT.tokensManagedBy(user);
    uint256 totalScore;

    for (uint256 i; i < nodeLevels.length; i++) {
      totalScore += $._nodeEnodorsmentScore[nodeLevels[i].levelId];
    }

    return totalScore;
  }

  function getNodeEndorsementScore(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint256 nodeId
  ) external view returns (uint256) {
    uint8 nodeLevel = $._stargateNFT.getTokenLevel(nodeId);
    return $._nodeEnodorsmentScore[nodeLevel];
  }

  function nodeToEndorsedApp(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint256 nodeId
  ) external view returns (bytes32) {
    return $._nodeToEndorsedApp[nodeId];
  }

  function nodeLevelEndorsementScore(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint8 nodeLevel
  ) external view returns (uint256) {
    return $._nodeEnodorsmentScore[nodeLevel];
  }

  function gracePeriod(X2EarnAppsStorageTypes.EndorsementStorage storage $) external view returns (uint256) {
    return $._gracePeriodDuration;
  }

  function cooldownPeriod(X2EarnAppsStorageTypes.EndorsementStorage storage $) external view returns (uint256) {
    return $._cooldownPeriod;
  }

  function endorsementScoreThreshold(
    X2EarnAppsStorageTypes.EndorsementStorage storage $
  ) external view returns (uint256) {
    return $._endorsementScoreThreshold;
  }

  function isAppUnendorsed(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    bytes32 appId,
    bool isBlacklisted
  ) external view returns (bool) {
    if (isBlacklisted) {
      return false;
    }
    return $._unendorsedAppsIndex[appId] > 0;
  }

  function checkCooldown(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint256 nodeId
  ) external view returns (bool) {
    uint256 requiredRound = $._endorsementRound[nodeId] + $._cooldownPeriod;
    return requiredRound > $._xAllocationVotingGovernor.currentRoundId();
  }

  function unendorsedAppIds(
    X2EarnAppsStorageTypes.EndorsementStorage storage $
  ) external view returns (bytes32[] memory) {
    return $._unendorsedApps;
  }

  function getScore(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    bytes32 appId
  ) external view returns (uint256) {
    return $._appScores[appId];
  }

  function getXAllocationVotingGovernor(
    X2EarnAppsStorageTypes.EndorsementStorage storage $
  ) external view returns (IXAllocationVotingGovernor) {
    return $._xAllocationVotingGovernor;
  }

  function getVeBetterPassportContract(
    X2EarnAppsStorageTypes.EndorsementStorage storage $
  ) external view returns (IVeBetterPassport) {
    return $._veBetterPassport;
  }

  function getStargateNFT(X2EarnAppsStorageTypes.EndorsementStorage storage $) external view returns (IStargateNFT) {
    return $._stargateNFT;
  }

  // ------------------------------- Setter Functions -------------------------------
  function getScoreAndRemoveEndorsement(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    bytes32 appId,
    uint256 endorserNodeIdToRemove
  ) public returns (uint256) {
    uint256 score;

    for (uint256 i; i < $._appEndorsers[appId].length; ) {
      uint256 endorserNodeId = $._appEndorsers[appId][i];
      uint8 nodeLevel = $._stargateNFT.getTokenLevel(endorserNodeId);

      if (nodeLevel == 0 || endorserNodeId == endorserNodeIdToRemove) {
        $._appEndorsers[appId][i] = $._appEndorsers[appId][$._appEndorsers[appId].length - 1];
        $._appEndorsers[appId].pop();
        emit AppEndorsed(appId, endorserNodeId, false);
        delete $._nodeToEndorsedApp[endorserNodeId];
      } else {
        score += $._nodeEnodorsmentScore[nodeLevel];
        i++;
      }
    }

    $._appScores[appId] = score;
    return score;
  }

  function updateNodeEndorsementScores(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    NodeStrengthScores calldata nodeStrengthScores
  ) external {
    $._nodeEnodorsmentScore[1] = nodeStrengthScores.strength;
    $._nodeEnodorsmentScore[2] = nodeStrengthScores.thunder;
    $._nodeEnodorsmentScore[3] = nodeStrengthScores.mjolnir;
    $._nodeEnodorsmentScore[4] = nodeStrengthScores.veThorX;
    $._nodeEnodorsmentScore[5] = nodeStrengthScores.strengthX;
    $._nodeEnodorsmentScore[6] = nodeStrengthScores.thunderX;
    $._nodeEnodorsmentScore[7] = nodeStrengthScores.mjolnirX;
    emit NodeStrengthScoresUpdated(nodeStrengthScores);
  }

  function updateAppsPendingEndorsement(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    bytes32 appId,
    bool remove
  ) public {
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

  function setGracePeriod(X2EarnAppsStorageTypes.EndorsementStorage storage $, uint48 gracePeriodDuration) external {
    emit GracePeriodUpdated($._gracePeriodDuration, gracePeriodDuration);
    $._gracePeriodDuration = gracePeriodDuration;
  }

  function setCooldownPeriod(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint256 cooldownPeriodDuration
  ) external {
    emit CooldownPeriodUpdated($._cooldownPeriod, cooldownPeriodDuration);
    $._cooldownPeriod = cooldownPeriodDuration;
  }

  function setXAllocationVotingGovernor(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    address xAllocationVotingGovernor
  ) external {
    if (xAllocationVotingGovernor == address(0)) {
      revert X2EarnInvalidAddress(xAllocationVotingGovernor);
    }
    $._xAllocationVotingGovernor = IXAllocationVotingGovernor(xAllocationVotingGovernor);
  }

  function updateEndorsementScoreThreshold(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    uint256 scoreThreshold
  ) external {
    emit EndorsementScoreThresholdUpdated($._endorsementScoreThreshold, scoreThreshold);
    $._endorsementScoreThreshold = scoreThreshold;
  }

  function setVeBetterPassportContract(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    address veBetterPassportContract
  ) external {
    if (veBetterPassportContract == address(0)) {
      revert X2EarnInvalidAddress(veBetterPassportContract);
    }
    $._veBetterPassport = IVeBetterPassport(veBetterPassportContract);
  }

  function setStargateNFT(X2EarnAppsStorageTypes.EndorsementStorage storage $, address stargateNft) external {
    if (stargateNft == address(0)) {
      revert X2EarnInvalidAddress(stargateNft);
    }
    $._stargateNFT = IStargateNFT(stargateNft);
  }

  function setEndorsementStatus(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    bytes32 appId,
    bool endorsed
  ) public {
    updateAppsPendingEndorsement($, appId, endorsed);
    emit AppEndorsementStatusUpdated(appId, endorsed);
  }

  // ------------------------------- Core Logic Functions -------------------------------
  function endorseApp(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage,
    bytes32 appId,
    uint256 nodeId,
    bool isBlacklisted,
    bool appExists,
    bool isEligibleNow
  ) external {
    if (appsStorage._apps[appId].id == bytes32(0)) {
      revert X2EarnNonexistentApp(appId);
    }
    if (isBlacklisted) {
      revert X2EarnAppBlacklisted(appId);
    }
    if (nodeId == 0) {
      revert X2EarnNonNodeHolder();
    }
    // Check if app is pending endorsement
    if ($._unendorsedAppsIndex[appId] == 0 || isBlacklisted) {
      revert X2EarnAppAlreadyEndorsed(appId);
    }
    if (!$._stargateNFT.tokenExists(nodeId) || !$._stargateNFT.isTokenManager(msg.sender, nodeId)) {
      revert X2EarnNonNodeHolder();
    }
    if ($._nodeToEndorsedApp[nodeId] != bytes32(0)) {
      revert X2EarnAlreadyEndorser();
    }

    // Check cooldown
    uint256 requiredRound = $._endorsementRound[nodeId] + $._cooldownPeriod;
    if (requiredRound > $._xAllocationVotingGovernor.currentRoundId()) {
      revert X2EarnNodeCooldownActive();
    }

    uint8 nodeLevel = $._stargateNFT.getTokenLevel(nodeId);
    if ($._nodeEnodorsmentScore[nodeLevel] == 0) {
      revert NodeNotAllowedToEndorse();
    }

    $._appEndorsers[appId].push(nodeId);
    $._nodeToEndorsedApp[nodeId] = appId;
    $._endorsementRound[nodeId] = $._xAllocationVotingGovernor.currentRoundId();

    uint256 score = getScoreAndRemoveEndorsement($, appId, 0);

    if (score >= $._endorsementScoreThreshold) {
      _updateStatusIfThresholdMet($, appsStorage, appId, appExists, isEligibleNow, isBlacklisted);
    }

    emit AppEndorsed(appId, nodeId, true);
  }

  function unendorseApp(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage,
    bytes32 appId,
    uint256 nodeId,
    bool isBlacklisted,
    bool isEligibleNow,
    uint48 clock
  ) external returns (bool stillEligible) {
    if (!$._stargateNFT.tokenExists(nodeId) || !$._stargateNFT.isTokenManager(msg.sender, nodeId)) {
      revert X2EarnNonNodeHolder();
    }

    uint256 requiredRound = $._endorsementRound[nodeId] + $._cooldownPeriod;
    if (requiredRound > $._xAllocationVotingGovernor.currentRoundId()) {
      revert X2EarnNodeCooldownActive();
    }

    return removeNodeEndorsement($, appsStorage, appId, nodeId, isBlacklisted, isEligibleNow, clock);
  }

  function removeNodeEndorsement(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage,
    bytes32 appId,
    uint256 nodeId,
    bool isBlacklisted,
    bool isEligibleNow,
    uint48 clock
  ) public returns (bool stillEligible) {
    if (appsStorage._apps[appId].id == bytes32(0)) {
      revert X2EarnNonexistentApp(appId);
    }
    if ($._nodeToEndorsedApp[nodeId] != appId) {
      revert X2EarnNonEndorser();
    }

    uint256 score = getScoreAndRemoveEndorsement($, appId, nodeId);

    if (!isEligibleNow || isBlacklisted) {
      $._endorsementRound[nodeId] = 0;
      return isEligibleNow;
    }

    if (score < $._endorsementScoreThreshold) {
      stillEligible = _updateStatusIfThresholdNotMetWithVote($, appId, isBlacklisted, isEligibleNow, clock);
    } else {
      stillEligible = true;
    }

    $._endorsementRound[nodeId] = 0;
    return stillEligible;
  }

  function removeXAppSubmission(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage,
    bytes32 appId
  ) external {
    if (appsStorage._apps[appId].id == bytes32(0)) {
      revert X2EarnNonexistentApp(appId);
    }
    if (appsStorage._apps[appId].createdAtTimestamp != 0) {
      revert NodeManagementXAppAlreadyIncluded(appId);
    }
    updateAppsPendingEndorsement($, appId, true);
  }

  function checkEndorsement(
    X2EarnAppsStorageTypes.EndorsementStorage storage $,
    X2EarnAppsStorageTypes.AppsStorageStorage storage appsStorage,
    X2EarnAppsStorageTypes.VoteEligibilityStorage storage voteStorage,
    bytes32 appId,
    uint48 clock
  ) external returns (bool) {
    if (appsStorage._apps[appId].id == bytes32(0)) {
      revert X2EarnNonexistentApp(appId);
    }

    bool isBlacklisted = voteStorage._blackList[appId];
    if (isBlacklisted) {
      return false;
    }

    uint256 score = getScoreAndRemoveEndorsement($, appId, 0);
    bool appExists = appsStorage._apps[appId].createdAtTimestamp != 0;
    bool isEligibleNow = appExists && voteStorage._isAppEligibleCheckpoints[appId].latest() == 1;

    if (score < $._endorsementScoreThreshold) {
      return _updateStatusIfThresholdNotMetWithVote($, appId, isBlacklisted, isEligibleNow, clock);
    } else {
      _updateStatusIfThresholdMet($, appsStorage, appId, appExists, isEligibleNow, isBlacklisted);
    }

    return true;
  }

  // ------------------------------- Private Functions -------------------------------
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

    // Check if app is unendorsed
    bool appUnendorsed = !isBlacklisted && $._unendorsedAppsIndex[appId] > 0;
    if (appUnendorsed) {
      setEndorsementStatus($, appId, true);
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
      updateAppsPendingEndorsement($, appId, false);
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
