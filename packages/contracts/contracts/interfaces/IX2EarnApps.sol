// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { X2EarnAppsDataTypes } from "../libraries/X2EarnAppsDataTypes.sol";
import { EndorsementUtils } from "../x-2-earn-apps/libraries/EndorsementUtils.sol";
import { IX2EarnCreator } from "./IX2EarnCreator.sol";
import { IXAllocationVotingGovernor } from "./IXAllocationVotingGovernor.sol";
import { IX2EarnRewardsPool } from "./IX2EarnRewardsPool.sol";
import { IStargateNFT } from "../mocks/Stargate/interfaces/IStargateNFT.sol";

/**
 * @title IX2EarnApps
 * @notice Interface for the X2EarnApps contract.
 * @dev The contract inheriting this interface should be able to manage the x2earn apps and their Eligibility for allocation voting.
 */
interface IX2EarnApps {
  /**
   * @dev The clock was incorrectly modified.
   */
  error ERC6372InconsistentClock();

  /**
   * @dev The `appId` doesn't exist.
   */
  error X2EarnNonexistentApp(bytes32 appId);

  /**
   * @dev The creator of the app doesn't exist.
   */
  error X2EarnNonexistentCreator(bytes32 appId, address creator);

  /**
   * @dev The `addr` is not valid (eg: is the ZERO ADDRESS).
   */
  error X2EarnInvalidAddress(address addr);

  /**
   * @dev The caller is already an endorser.
   */
  error X2EarnAlreadyEndorser();

  /**
   * @dev The caller is not a node holder.
   */
  error X2EarnNonNodeHolder();

  /**
   * @dev The caller is not an endorser.
   */
  error X2EarnNonEndorser();

  /**
   * @dev The `appId` is already endorsed.
   */
  error X2EarnAppAlreadyEndorsed(bytes32 appId);

  /**
   * @dev An app with the specified `appId` already exists.
   */
  error X2EarnAppAlreadyExists(bytes32 appId);

  /**
   * @dev The Vechain Node is in a cooldown period, and the action cannot be performed.
   */
  error X2EarnNodeCooldownActive();

  /**
   * @dev The user is not authorized to perform the action.
   */
  error X2EarnUnauthorizedUser(address user);

  /**
   * @dev The maximum number of creators has been reached.
   */
  error X2EarnMaxCreatorsReached(bytes32 appId);

  /**
   * @dev The caller is already the creator of the app.
   */
  error X2EarnAlreadyCreator(address creator);

  /**
   * @dev The caller is an unverified creator.
   */
  error X2EarnUnverifiedCreator(address creator);

  /**
   * @dev The creator NFT is already used for another app.
   */
  error CreatorNFTAlreadyUsed(address creator);

  /**
   * @dev Invalid start index for get apps pagination
   */
  error X2EarnInvalidStartIndex();

  /**
   * @notice Error indicating that an XAPP has already been included in a XAllocation Voting round and submission cant be removed.
   */
  error NodeManagementXAppAlreadyIncluded(bytes32 appId);

  /**
   * @dev Lookup to future votes is not available.
   */
  error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

  /**
   * @dev The `percentage` is not valid.
   */
  error X2EarnInvalidAllocationPercentage(uint256 percentage);

  /**
   * @dev The `distributorAddress` is not valid.
   */
  error X2EarnNonexistentRewardDistributor(bytes32 appId, address distributorAddress);

  /**
   * @dev The `moderator` is not valid.
   */
  error X2EarnNonexistentModerator(bytes32 appId, address moderator);

  /**
   * @dev The maximum number of moderators has been reached.
   */
  error X2EarnMaxModeratorsReached(bytes32 appId);

  /**
   * @dev The app is blacklisted.
   */
  error X2EarnAppBlacklisted(bytes32 appId);

  /**
   * @dev The maximum number of reward distributors has been reached.
   */
  error X2EarnMaxRewardDistributorsReached(bytes32 appId);

  /**
   * @dev The maximum number of managers has been reached.
   */
  error X2EarnMaxManagersReached(bytes32 appId);

  /**
   * @dev The user has a node that cannot be used to endorse
   */
  error NodeNotAllowedToEndorse();

  /**
   * @dev Thrown when trying to allocate more points than allowed per node per app (V8)
   */
  error ExceedsMaxPointsPerNodePerApp(uint256 requested, uint256 max);

  /**
   * @dev Thrown when trying to allocate more points than allowed per app total (V8)
   */
  error ExceedsMaxPointsPerApp(uint256 requested, uint256 max);

  /**
   * @dev Thrown when trying to allocate more points than the node has available (V8)
   */
  error InsufficientAvailablePoints(uint256 requested, uint256 available);

  /**
   * @dev Thrown when trying to remove more points than allocated (V8)
   */
  error InsufficientAllocatedPoints(uint256 requested, uint256 allocated);

  /**
   * @dev Thrown when trying to allocate zero points (V8)
   */
  error ZeroPointsNotAllowed();

  /**
   * @dev Event fired when a new app is added.
   */
  event AppAdded(bytes32 indexed id, address addr, string name, bool appAvailableForAllocationVoting);

  /**
   * @dev Event fired when an app Eligibility for allocation voting changes.
   */
  event VotingEligibilityUpdated(bytes32 indexed appId, bool isAvailable);

  /**
   * @dev Event fired when an app is blacklisted or unblacklisted.
   */
  event BlacklistUpdated(bytes32 indexed appId, bool isBlacklisted);

  /**
   * @dev Event fired when the score threshold is updated.
   */
  event EndorsementScoreThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

  /**
   * @dev Event fired when the admin adds a new moderator to the app.
   */
  event ModeratorAddedToApp(bytes32 indexed appId, address moderator);

  /**
   * @dev Event fired when the admin removes a moderator from the app.
   */
  event ModeratorRemovedFromApp(bytes32 indexed appId, address moderator);

  /**
   * @dev Event fired when the admin removes a creator from the app.
   */
  event CreatorRemovedFromApp(bytes32 indexed appId, address creator);

  /**
   * @dev Event fired when the admin adds a new creator to the app and new creator NFT is minted.
   */
  event CreatorAddedToApp(bytes32 indexed appId, address creatorAddress);

  /**
   * @dev Event fired when the admin adds a new reward distributor to the app.
   */
  event RewardDistributorAddedToApp(bytes32 indexed appId, address distributorAddress);

  /**
   * @dev Event fired when the admin removes a reward distributor from the app.
   */
  event RewardDistributorRemovedFromApp(bytes32 indexed appId, address distributorAddress);

  /**
   * @dev Event fired when the admin of an app changes.
   */
  event AppAdminUpdated(bytes32 indexed appId, address oldAdmin, address newAdmin);

  /**
   * @dev Event fired when the address where the x2earn app receives allocation funds is changed.
   */
  event TeamWalletAddressUpdated(bytes32 indexed appId, address oldTeamWalletAddress, address newTeamWalletAddress);

  /**
   * @dev Event fired when the metadata URI of the app is changed.
   */
  event AppMetadataURIUpdated(bytes32 indexed appId, string oldMetadataURI, string newMetadataURI);

  /**
   * @dev Event fired when the base URI is updated.
   */
  event BaseURIUpdated(string oldBaseURI, string newBaseURI);

  /**
   * @dev Event fired when the cooldown period duration is updated.
   */
  event CooldownPeriodUpdated(uint256 oldCooldownPeriod, uint256 newCooldownPeriod);

  /**
   * @dev Event fired when the grace period duration is updated.
   */
  event GracePeriodUpdated(uint256 oldGracePeriod, uint256 newGracePeriod);

  /**
   * @dev Event fired when the app endorsement status is updated.
   */
  event AppEndorsementStatusUpdated(bytes32 indexed appId, bool endorsed);

  /**
   * @dev Event fired when the app endorsement grace period is started.
   */
  event AppUnendorsedGracePeriodStarted(bytes32 indexed appId, uint48 startBlock, uint48 endBlock);

  /**
   * @dev Event fired when the team allocation percentage is updated.
   */
  event TeamAllocationPercentageUpdated(bytes32 indexed appId, uint256 oldPercentage, uint256 newPercentage);

  /**
   * @dev Event fired when an app is endorsed or unendorsed by a node.
   */
  event AppEndorsed(bytes32 indexed id, uint256 nodeId, bool endorsed);

  /**
   * @dev Event fired when the node strength scores are updated.
   */
  event NodeStrengthScoresUpdated(EndorsementUtils.NodeStrengthScores indexed nodeStrengthScores);

  /**
   * @dev Event fired when points are allocated to an app (V8).
   */
  event PointsAllocated(
    bytes32 indexed appId,
    uint256 indexed nodeId,
    uint256 points,
    uint256 totalNodePoints,
    uint256 totalAppPoints
  );

  /**
   * @dev Event fired when points are removed from an app (V8).
   */
  event PointsRemoved(
    bytes32 indexed appId,
    uint256 indexed nodeId,
    uint256 points,
    uint256 totalNodePoints,
    uint256 totalAppPoints
  );

  /**
   * @dev Generates the hash of the app name to be used as the app id.
   *
   * @param name the name of the app
   */
  function hashAppName(string memory name) external pure returns (bytes32);

  /**
   * @dev Get the app data by its id.
   *
   * @param appId the id of the app
   */
  function app(bytes32 appId) external view returns (X2EarnAppsDataTypes.AppWithDetailsReturnType memory);

  /**
   * @dev Function to get the number of apps.
   */
  function appsCount() external view returns (uint256);

  /**
   * @dev Get a paginated list of apps
   * @param startIndex The starting index of the pagination
   * @param count The number of items to return
   */
  function getPaginatedApps(uint startIndex, uint count) external view returns (X2EarnAppsDataTypes.App[] memory);

  /**
   * @notice Get all the apps that exist in the VeBetter DAO ecosystem.
   * @dev An XApp must have been included in at least one allocation round to be considered an existing app.
   */
  function apps() external view returns (X2EarnAppsDataTypes.AppWithDetailsReturnType[] memory);

  /**
   * @dev Add a new moderator to the app.
   *
   * @param appId the id of the app
   * @param moderator the address of the moderator
   *
   * Emits a {ModeratorAddedToApp} event.
   */
  function addAppModerator(bytes32 appId, address moderator) external;

  /**
   * @dev Remove a moderator from the app.
   *
   * @param appId the id of the app
   * @param moderator the address of the moderator
   *
   * Emits a {ModeratorRemovedFromApp} event.
   */
  function removeAppModerator(bytes32 appId, address moderator) external;

  /**
   * @dev Set the app admin.
   *
   * @param appId the id of the app
   * @param admin the address of the admin
   *
   * Emits a {AppAdminUpdated} event.
   */
  function setAppAdmin(bytes32 appId, address admin) external;

  /**
   * @dev Add a new creator to the app.
   *
   * @param appId the id of the app
   * @param creator the address of the creator
   *
   * Emits a {CreatorAddedToApp} event.
   */
  function addCreator(bytes32 appId, address creator) external;

  /**
   * @dev Check if a creator has already been used for another app.
   *
   * @param creator the address of the creator
   */
  function isCreatorOfAnyApp(address creator) external returns (bool);

  /**
   * @dev Remove a creator from the app.
   *
   * @param appId the id of the app
   * @param creator the address of the creator
   *
   * Emits a {CreatorRemovedFromApp} event.
   */
  function removeAppCreator(bytes32 appId, address creator) external;

  /**
   * @dev Get the creators of an app.
   *
   * @param appId the id of the app
   */
  function appCreators(bytes32 appId) external view returns (address[] memory);

  /**
   * @dev Check if an account is the creator of the app
   *
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppCreator(bytes32 appId, address account) external view returns (bool);

  /**
   * @dev Get the number of apps created by an account.
   *
   * @param creator the address of the creator
   */
  function creatorApps(address creator) external view returns (uint256);

  /**
   * @dev Get the app admin.
   *
   * @param appId the id of the app
   */
  function appAdmin(bytes32 appId) external view returns (address);

  /**
   * @dev Check if an account is the admin of the app
   *
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppAdmin(bytes32 appId, address account) external view returns (bool);

  /**
   * @dev Update the address where the x2earn app receives allocation funds.
   *
   * @param appId the id of the app
   * @param newTeamWalletAddress the new address where the app should receive allocation funds
   *
   * Emits a {TeamWalletAddressUpdated} event.
   */
  function updateTeamWalletAddress(bytes32 appId, address newTeamWalletAddress) external;

  /**
   * @dev Get the address where the x2earn app receives allocation funds.
   *
   * @param appId the id of the app
   */
  function teamWalletAddress(bytes32 appId) external view returns (address);

  /**
   * @dev Function to get the percentage of the allocation sent to the team address each round.
   *
   * @param appId the app id
   */
  function teamAllocationPercentage(bytes32 appId) external view returns (uint256);

  /**
   * @dev Update the allocation percentage to be sent to the team
   *
   * @param appId the id of the app
   * @param percentage the new percentage of the allocation
   */
  function setTeamAllocationPercentage(bytes32 appId, uint256 percentage) external;

  /**
   * @dev Add a new reward distributor to the app.
   *
   * @param appId the id of the app
   * @param distributorAddress the address of the reward distributor
   *
   * Emits a {RewardDistributorAddedToApp} event.
   */
  function addRewardDistributor(bytes32 appId, address distributorAddress) external;

  /**
   * @dev Remove a reward distributor from the app.
   *
   * @param appId the id of the app
   * @param distributorAddress the address of the reward distributor
   *
   * Emits a {RewardDistributorRemovedFromApp} event.
   */
  function removeRewardDistributor(bytes32 appId, address distributorAddress) external;

  /**
   * @dev Returns true if an account is a reward distributor of the app
   *
   * @param appId the id of the app
   * @param distributorAddress the address of the account
   */
  function isRewardDistributor(bytes32 appId, address distributorAddress) external view returns (bool);

  /**
   * @dev Enable the rewards pool for a new app.
   *
   * @param appId the id of the app
   */
  function enableRewardsPoolForNewApp(bytes32 appId) external;

  /**
   * @dev Update the X2EarnRewardsPool contract address.
   *
   * @param  _x2EarnRewardsPoolContract the address of the X2EarnRewardsPool contract
   */
  function setX2EarnRewardsPoolContract(address _x2EarnRewardsPoolContract) external;

  /**
   * @dev Get the X2EarnRewardsPool contract address.
   */
  function x2EarnRewardsPoolContract() external view returns (IX2EarnRewardsPool);

  /**
   * @dev Update the metadata URI of the app.
   *
   * @param appId the id of the app
   * @param metadataURI the new metadata URI of the app containing details about the app
   *
   * Emits a {AppMetadataURIUpdated} event.
   */
  function updateAppMetadata(bytes32 appId, string memory metadataURI) external;

  /**
   * @dev Check if there is an app with the specified `appId`.
   * @dev This function should be used to check if an app exists is part of the VeBetter DAO ecosystem.
   * @notice An app is considered to exist if it has been included in at least one allocation round.
   *
   * @param appId the id of the app
   */
  function appExists(bytes32 appId) external view returns (bool);

  /**
   * @dev Check if an app is blacklisted.
   *
   * @param appId the id of the app
   */
  function isBlacklisted(bytes32 appId) external view returns (bool);

  /**
   * @dev Allow or deny an app to participate in the next allocation voting rounds.
   *
   * @param _appId the id of the app
   * @param _isEligible true if the app should be eligible for voting, false otherwise
   *
   * Emits a {VotingEligibilityUpdated} event.
   */
  function setVotingEligibility(bytes32 _appId, bool _isEligible) external;

  /**
   * @dev Get all the app ids that are eligible for voting in the next allocation rounds.
   */
  function allEligibleApps() external view returns (bytes32[] memory);

  /**
   * @dev Check if an app was allowed to participate in the allocation rounds in a specific timepoint.
   * XAllocationVoting contract can use this function to check if an app was eligible for voting in the block when the round starts.
   *
   * @param appId the id of the app
   * @param timepoint the timepoint when the app should be checked for Eligibility
   */
  function isEligible(bytes32 appId, uint256 timepoint) external view returns (bool);

  /**
   * @dev return the base URI for the contract
   */
  function baseURI() external view returns (string memory);


  /**
   * @notice Get the version of the contract.
   * @dev This should be updated every time a new version of implementation is deployed.
   */
  function version() external view returns (string memory);

  /**
   * @dev Register a new app.
   *
   * @param _teamWalletAddress the address where the app will receive the allocation funds
   * @param _admin the address of the admin
   * @param _appName the name of the app
   * @param _appMetadataURI the metadata URI of the app
   *
   * Emits a {AppAdded} event.
   */
  function submitApp(
    address _teamWalletAddress,
    address _admin,
    string memory _appName,
    string memory _appMetadataURI
  ) external;


  /**
   * @dev Update the X2EarnCreator contract address.
   *
   * @param x2EarnCreatorContract the address of the X2EarnCreator contract
   */
  function setX2EarnCreatorContract(address x2EarnCreatorContract) external;


}
