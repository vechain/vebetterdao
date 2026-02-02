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

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import { IX2EarnApps } from "../interfaces/IX2EarnApps.sol";
import { IX2EarnCreator } from "../interfaces/IX2EarnCreator.sol";
import { IX2EarnRewardsPool } from "../interfaces/IX2EarnRewardsPool.sol";
import { IXAllocationVotingGovernor } from "../interfaces/IXAllocationVotingGovernor.sol";
import { IVeBetterPassport } from "../interfaces/IVeBetterPassport.sol";
import { IStargateNFT } from "../mocks/Stargate/interfaces/IStargateNFT.sol";

import { X2EarnAppsDataTypes } from "../libraries/X2EarnAppsDataTypes.sol";
import { X2EarnAppsStorageTypes } from "./libraries/X2EarnAppsStorageTypes.sol";
import { EndorsementUtils } from "./libraries/EndorsementUtils.sol";
import { AppStorageUtils } from "./libraries/AppStorageUtils.sol";
import { AdministrationUtils } from "./libraries/AdministrationUtils.sol";
import { VoteEligibilityUtils } from "./libraries/VoteEligibilityUtils.sol";

/**
 * @title X2EarnApps
 * @notice This contract handles the x-2-earn applications of the VeBetterDAO ecosystem. The contract allows the insert, management and
 * eligibility of apps for the B3TR allocation rounds.
 * @dev The contract is using AccessControl to handle the admin and upgrader roles.
 * Only users with the DEFAULT_ADMIN_ROLE can add new apps, set the base URI and set the voting eligibility for an app.
 * Admins can also control the app metadata and management.
 * Each app has a set of admins and moderators that can manage the app and settings.
 *
 * -------------------- Version 2 --------------------
 * - The contract has been upgraded to version 2 to include the X2Earn endorsement system.
 * - Added libraries to reduce the contract size and improve readability.
 *
 * -------------------- Version 3 --------------------
 * - The contract has been upgraded to version 3 to add node cooldown period.
 *
 * -------------------- Version 4 --------------------
 * - Enabling by default the rewards pool for new apps submitted.
 *
 * -------------------- Version 5 --------------------
 * - Restricting one app per creator holding a creator NFT.
 * A check on submitApp is added to ensure that the number of creatorApps[creator] is 0.
 * This mapping is increased when a creator is added to an app, submit an app after approved by VBD, or got endorsed.
 *
 * -------------------- Version 6 --------------------
 * - Upon StarGate launch, we updated the NodeManagement contract to V3. This impacted mostly
 *   EndorsementUtils library.
 *   EndorsementUpgradeable module.
 *
 * -------------------- Version 7 --------------------
 * - Integrated Stargate NFT contract for node management and endorsement verification.
 * - Updated endorsement system to use Stargate NFT for node ownership and token management.
 *
 * -------------------- Version 8 --------------------
 * - Refactor: modules replaced with libraries for size optimization.
 */
contract X2EarnApps is Initializable, IX2EarnApps, AccessControlUpgradeable, UUPSUpgradeable {
  using Checkpoints for Checkpoints.Trace208;
  using X2EarnAppsStorageTypes for *;

  /// @notice The role that can upgrade the contract.
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  /// @notice The role that can manage the contract settings.
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

  /// @notice The maximum number of moderators allowed per app.
  uint256 public constant MAX_MODERATORS = 100;
  /// @notice The maximum number of reward distributors allowed per app.
  uint256 public constant MAX_REWARD_DISTRIBUTORS = 100;
  /// @notice The maximum number of creators allowed per app.
  uint256 public constant MAX_CREATORS = 3;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  // ---------- Storage Locations ---------- //
  bytes32 private constant VoteEligibilityStorageLocation =
    0xb5b8d618af1ffb8d5bcc4bd23f445ba34ed08d7a16d1e1b5411cfbe7913e5900;
  bytes32 private constant EndorsementStorageLocation =
    0xc1a7bcdc0c77e8c77ade4541d1777901ab96ca598d164d89afa5c8dfbfc44300;
  bytes32 private constant SettingsStorageLocation = 
    0x83b9a7e51f394efa93107c3888716138908bbbe611dfc86afa3639a826441100;
  bytes32 private constant AppsStorageStorageLocation =
    0xb6909058bd527140b8d55a44344c5e42f1f148f1b3b16df7641882df8dd72900;
  bytes32 private constant AdministrationStorageLocation =
    0x5830f0e95c01712d916c34d9e2fa42e9f749b325b67bce7382d70bb99c623500;

  function _getVoteEligibilityStorage() private pure returns (X2EarnAppsStorageTypes.VoteEligibilityStorage storage $) {
    assembly { $.slot := VoteEligibilityStorageLocation }
  }

  function _getEndorsementStorage() private pure returns (X2EarnAppsStorageTypes.EndorsementStorage storage $) {
    assembly { $.slot := EndorsementStorageLocation }
  }

  function _getContractSettingsStorage() private pure returns (X2EarnAppsStorageTypes.ContractSettingsStorage storage $) {
    assembly { $.slot := SettingsStorageLocation }
  }

  function _getAppsStorageStorage() private pure returns (X2EarnAppsStorageTypes.AppsStorageStorage storage $) {
    assembly { $.slot := AppsStorageStorageLocation }
  }

  function _getAdministrationStorage() private pure returns (X2EarnAppsStorageTypes.AdministrationStorage storage $) {
    assembly { $.slot := AdministrationStorageLocation }
  }

  // ---------- Initializers ---------- //

  /**
   * @notice Initialize the version 7 contract
   * @param _stargateNft the address of the Stargate NFT contract
   * @dev This function is called only once during the contract deployment
   */
  function initializeV7(address _stargateNft) external onlyRole(UPGRADER_ROLE) reinitializer(7) {
    require(_stargateNft != address(0), "X2EarnApps: Invalid Stargate NFT contract address");
    EndorsementUtils.setStargateNFT(_getEndorsementStorage(), _stargateNft);
  }

  // ---------- Modifiers ---------- //

  /**
   * @dev Modifier to restrict access to only the admin role and the app admin role.
   * @param role the role to check
   * @param appId the app ID
   */
  modifier onlyRoleAndAppAdmin(bytes32 role, bytes32 appId) {
    if (!hasRole(role, msg.sender) && !isAppAdmin(appId, msg.sender)) {
      revert X2EarnUnauthorizedUser(msg.sender);
    }
    _;
  }

  /**
   * @dev Modifier to restrict access to only the admin role, the app admin role and the app moderator role.
   * @param role the role to check
   * @param appId the app ID
   */
  modifier onlyRoleAndAppAdminOrModerator(bytes32 role, bytes32 appId) {
    if (!hasRole(role, msg.sender) && !isAppAdmin(appId, msg.sender) && !isAppModerator(appId, msg.sender)) {
      revert X2EarnUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- UUPS ---------- //

  /**
   * @dev See {UUPSUpgradeable-_authorizeUpgrade}
   */
  function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}

  /**
   * @notice Returns the version of the contract
   * @dev This should be updated every time a new version of implementation is deployed
   * @return string The version of the contract
   */
  function version() public pure virtual returns (string memory) {
    return "8";
  }

  // ---------- Clock ---------- //
  function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  function CLOCK_MODE() external view virtual returns (string memory) {
    if (clock() != Time.blockNumber()) {
      revert ERC6372InconsistentClock();
    }
    return "mode=blocknumber&from=default";
  }

  // ---------- App Storage Getters ---------- //

  /**
   * @dev See {IX2EarnApps-hashAppName}.
   */
  function hashAppName(string memory appName) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(appName));
  }

  /**
   * @dev See {IX2EarnApps-appExists}.
   */
  function appExists(bytes32 appId) public view returns (bool) {
    return AppStorageUtils.appExists(_getAppsStorageStorage(), appId);
  }

  /**
   * @dev See {IX2EarnApps-app}.
   */
  function app(bytes32 appId) public view returns (X2EarnAppsDataTypes.AppWithDetailsReturnType memory) {
    return AppStorageUtils.app(_getAppsStorageStorage(), _getAdministrationStorage(), _getVoteEligibilityStorage(), appId);
  }

  /**
   * @dev See {IX2EarnApps-apps}.
   */
  function apps() external view returns (X2EarnAppsDataTypes.AppWithDetailsReturnType[] memory) {
    return AppStorageUtils.apps(_getAppsStorageStorage(), _getAdministrationStorage(), _getVoteEligibilityStorage());
  }

  /**
   * @dev See {IX2EarnApps-getPaginatedApps}.
   */
  function getPaginatedApps(uint startIndex, uint count) external view returns (X2EarnAppsDataTypes.App[] memory) {
    return AppStorageUtils.getPaginatedApps(_getAppsStorageStorage(), startIndex, count);
  }

  /**
   * @dev See {IX2EarnApps-appsCount}.
   */
  function appsCount() external view returns (uint256) {
    return AppStorageUtils.appsCount(_getAppsStorageStorage());
  }

  /**
   * @dev See {IX2EarnApps-appURI}.
   */
  function appURI(bytes32 appId) public view returns (string memory) {
    if (!AppStorageUtils.appSubmitted(_getAppsStorageStorage(), appId)) {
      revert X2EarnNonexistentApp(appId);
    }
    return string(abi.encodePacked(baseURI(), metadataURI(appId)));
  }

  // ---------- Vote Eligibility ---------- //

  /**
   * @dev See {IX2EarnApps-allEligibleApps}.
   */
  function allEligibleApps() public view returns (bytes32[] memory) {
    return _getVoteEligibilityStorage()._eligibleApps;
  }

  /**
   * @dev See {IX2EarnApps-isBlacklisted}.
   */
  function isBlacklisted(bytes32 appId) public view returns (bool) {
    return _getVoteEligibilityStorage()._blackList[appId];
  }

  /**
   * @dev See {IX2EarnApps-isEligible}.
   */
  function isEligible(bytes32 appId, uint256 timepoint) public view returns (bool) {
    X2EarnAppsStorageTypes.VoteEligibilityStorage storage $ = _getVoteEligibilityStorage();
    return VoteEligibilityUtils.isEligible($._isAppEligibleCheckpoints, appId, timepoint, appExists(appId), clock());
  }

  /**
   * @dev See {IX2EarnApps-isEligibleNow}.
   */
  function isEligibleNow(bytes32 appId) public view returns (bool) {
    if (!appExists(appId)) {
      return false;
    }
    return _getVoteEligibilityStorage()._isAppEligibleCheckpoints[appId].latest() == 1;
  }

  /**
   * @dev See {IX2EarnApps-setVotingEligibility}.
   */
  function setVotingEligibility(bytes32 _appId, bool _isEligible) public virtual onlyRole(GOVERNANCE_ROLE) {
    if (!AppStorageUtils.appSubmitted(_getAppsStorageStorage(), _appId)) {
      revert X2EarnNonexistentApp(_appId);
    }

    if (appExists(_appId)) {
      _setVotingEligibility(_appId, _isEligible);
    }

    if (isAppUnendorsed(_appId) && !_isEligible) {
      EndorsementUtils.updateAppsPendingEndorsement(_getEndorsementStorage(), _appId, true);
    }

    _isEligible ? _validateAppCreators(_appId) : _revokeAppCreators(_appId);
    _setBlacklist(_appId, !_isEligible);
  }

  // ---------- Administration ---------- //

  /**
   * @dev See {IX2EarnApps-appAdmin}.
   */
  function appAdmin(bytes32 appId) public view returns (address) {
    return _getAdministrationStorage()._admin[appId];
  }

  /**
   * @dev Check if an account is the admin of the app.
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppAdmin(bytes32 appId, address account) public view returns (bool) {
    return _getAdministrationStorage()._admin[appId] == account;
  }

  /**
   * @dev Returns the list of moderators of the app.
   * @param appId the hashed name of the app
   */
  function appModerators(bytes32 appId) public view returns (address[] memory) {
    return _getAdministrationStorage()._moderators[appId];
  }

  /**
   * @dev Returns true if an account is moderator of the app.
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppModerator(bytes32 appId, address account) public view returns (bool) {
    return AdministrationUtils.isAppModerator(_getAdministrationStorage()._moderators, appId, account);
  }

  /**
   * @dev Returns the list of creators of the app.
   * @param appId the hashed name of the app
   */
  function appCreators(bytes32 appId) external view returns (address[] memory) {
    return _getAdministrationStorage()._creators[appId];
  }

  /**
   * @dev Returns true if an account is a creator of the app.
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppCreator(bytes32 appId, address account) external view returns (bool) {
    return AdministrationUtils.isAppCreator(_getAdministrationStorage()._creators, appId, account);
  }

  /**
   * @dev Returns true if the creator has already been used for another app.
   * @param creator the address of the creator
   */
  function isCreatorOfAnyApp(address creator) public view returns (bool) {
    return _getAdministrationStorage()._creatorApps[creator] > 0;
  }

  /**
   * @dev Get the number of apps created by a creator.
   * @param creator the address of the creator
   */
  function creatorApps(address creator) external view returns (uint256) {
    return _getAdministrationStorage()._creatorApps[creator];
  }

  /**
   * @dev Get the address where the x2earn app receives allocation funds.
   * @param appId the hashed name of the app
   */
  function teamWalletAddress(bytes32 appId) public view returns (address) {
    return _getAdministrationStorage()._teamWalletAddress[appId];
  }

  /**
   * @dev Function to get the percentage of the allocation reserved for the team.
   * @param appId the app id
   */
  function teamAllocationPercentage(bytes32 appId) public view returns (uint256) {
    return _getAdministrationStorage()._teamAllocationPercentage[appId];
  }

  /**
   * @dev Returns the list of reward distributors of the app.
   * @param appId the hashed name of the app
   */
  function rewardDistributors(bytes32 appId) public view returns (address[] memory) {
    return _getAdministrationStorage()._rewardDistributors[appId];
  }

  /**
   * @dev Returns true if an account is a reward distributor of the app.
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isRewardDistributor(bytes32 appId, address account) public view returns (bool) {
    return AdministrationUtils.isRewardDistributor(_getAdministrationStorage()._rewardDistributors, appId, account);
  }

  /**
   * @dev Get the metadata URI of the app.
   * @param appId the app id
   */
  function metadataURI(bytes32 appId) public view returns (string memory) {
    return _getAdministrationStorage()._metadataURI[appId];
  }

  /**
   * @dev See {IX2EarnApps-x2EarnCreatorContract}.
   */
  function x2EarnCreatorContract() public view returns (IX2EarnCreator) {
    return _getAdministrationStorage()._x2EarnCreatorContract;
  }

  /**
   * @dev See {IX2EarnApps-x2EarnRewardsPoolContract}.
   */
  function x2EarnRewardsPoolContract() public view returns (IX2EarnRewardsPool) {
    return _getAdministrationStorage()._x2EarnRewardsPoolContract;
  }

  // ---------- Endorsement Getters ---------- //

  /**
   * @dev See {IX2EarnApps-gracePeriod}.
   * @return The current grace period duration in blocks.
   */
  function gracePeriod() public view returns (uint256) {
    return EndorsementUtils.gracePeriod(_getEndorsementStorage());
  }

  /**
   * @dev See {IX2EarnApps-cooldownPeriod}.
   * @return The current cooldown period duration in rounds.
   */
  function cooldownPeriod() public view returns (uint256) {
    return EndorsementUtils.cooldownPeriod(_getEndorsementStorage());
  }

  /**
   * @dev See {IX2EarnApps-endorsementScoreThreshold}.
   */
  function endorsementScoreThreshold() external view returns (uint256) {
    return EndorsementUtils.endorsementScoreThreshold(_getEndorsementStorage());
  }

  /**
   * @dev See {IX2EarnApps-isAppUnendorsed}.
   * @param appId The unique identifier of the app.
   * @return True if the app is pending endorsement.
   */
  function isAppUnendorsed(bytes32 appId) public view returns (bool) {
    return EndorsementUtils.isAppUnendorsed(_getEndorsementStorage(), appId, isBlacklisted(appId));
  }

  /**
   * @dev See {IX2EarnApps-unendorsedAppIds}.
   */
  function unendorsedAppIds() external view returns (bytes32[] memory) {
    return EndorsementUtils.unendorsedAppIds(_getEndorsementStorage());
  }

  /**
   * @dev See {IX2EarnApps-unendorsedApps}.
   */
  function unendorsedApps() external view returns (X2EarnAppsDataTypes.AppWithDetailsReturnType[] memory) {
    bytes32[] memory appIds = EndorsementUtils.unendorsedAppIds(_getEndorsementStorage());
    return AppStorageUtils.getAppsInfo(
      _getAppsStorageStorage(),
      _getAdministrationStorage(),
      _getVoteEligibilityStorage(),
      appIds
    );
  }

  /**
   * @dev See {IX2EarnApps-getScore}.
   */
  function getScore(bytes32 appId) external view returns (uint256) {
    return EndorsementUtils.getScore(_getEndorsementStorage(), appId);
  }

  /**
   * @dev See {IX2EarnApps-getEndorsers}.
   */
  function getEndorsers(bytes32 appId) external view returns (address[] memory) {
    return EndorsementUtils.getEndorsers(_getEndorsementStorage(), appId);
  }

  /**
   * @dev See {IX2EarnApps-getUsersEndorsementScore}.
   */
  function getUsersEndorsementScore(address user) external view returns (uint256) {
    return EndorsementUtils.getUsersEndorsementScore(_getEndorsementStorage(), user);
  }

  /**
   * @dev See {IX2EarnApps-getNodeEndorsementScore}.
   */
  function getNodeEndorsementScore(uint256 nodeId) external view returns (uint256) {
    return EndorsementUtils.getNodeEndorsementScore(_getEndorsementStorage(), nodeId);
  }

  /**
   * @notice Returns the app that a node ID is endorsing.
   * @param nodeId The unique identifier of the node ID.
   * @return The unique identifier of the app that the node ID is endorsing.
   */
  function nodeToEndorsedApp(uint256 nodeId) external view returns (bytes32) {
    return EndorsementUtils.nodeToEndorsedApp(_getEndorsementStorage(), nodeId);
  }

  /**
   * @notice Returns the endorsement score of a node level.
   * @param nodeLevel The node level.
   * @return The endorsement score of the node level.
   */
  function nodeLevelEndorsementScore(uint8 nodeLevel) external view returns (uint256) {
    return EndorsementUtils.nodeLevelEndorsementScore(_getEndorsementStorage(), nodeLevel);
  }

  /**
   * @dev See {IX2EarnApps-checkCooldown}.
   * @param nodeId The unique identifier of the node.
   * @return True if the node is in a cooldown period.
   */
  function checkCooldown(uint256 nodeId) external view returns (bool) {
    return EndorsementUtils.checkCooldown(_getEndorsementStorage(), nodeId);
  }

  /**
   * @dev See {IX2EarnApps-getXAllocationVotingGovernor}.
   */
  function getXAllocationVotingGovernor() external view returns (IXAllocationVotingGovernor) {
    return EndorsementUtils.getXAllocationVotingGovernor(_getEndorsementStorage());
  }

  /**
   * @dev See {IX2EarnApps-getStargateNFT}.
   */
  function getStargateNFT() external view returns (IStargateNFT) {
    return EndorsementUtils.getStargateNFT(_getEndorsementStorage());
  }

  /**
   * @dev See {IX2EarnApps-getVeBetterPassportContract}.
   */
  function getVeBetterPassportContract() external view returns (IVeBetterPassport) {
    return EndorsementUtils.getVeBetterPassportContract(_getEndorsementStorage());
  }

  // ---------- Contract Settings ---------- //

  /**
   * @dev See {IX2EarnApps-baseURI}.
   */
  function baseURI() public view returns (string memory) {
    return _getContractSettingsStorage()._baseURI;
  }

  /**
   * @dev Update the base URI to retrieve the metadata of the x2earn apps.
   * @param _baseURI the base URI for the contract
   *
   * Emits a {BaseURIUpdated} event.
   */
  function setBaseURI(string memory _baseURI) public onlyRole(DEFAULT_ADMIN_ROLE) {
    X2EarnAppsStorageTypes.ContractSettingsStorage storage $ = _getContractSettingsStorage();
    emit BaseURIUpdated($._baseURI, _baseURI);
    $._baseURI = _baseURI;
  }

  // ---------- App Management ---------- //

  /**
   * @dev See {IX2EarnApps-submitApp}.
   */
  function submitApp(
    address _teamWalletAddress,
    address _admin,
    string memory _appName,
    string memory _appMetadataURI
  ) public virtual {
    X2EarnAppsStorageTypes.AdministrationStorage storage adminStorage = _getAdministrationStorage();
    
    if (adminStorage._x2EarnCreatorContract.balanceOf(msg.sender) == 0) {
      revert X2EarnUnverifiedCreator(msg.sender);
    }
    if (isCreatorOfAnyApp(msg.sender)) {
      revert CreatorNFTAlreadyUsed(msg.sender);
    }

    bytes32 id = AppStorageUtils.registerApp(_getAppsStorageStorage(), _teamWalletAddress, _admin, _appName);
    
    _setAppAdmin(id, _admin);
    _updateTeamWalletAddress(id, _teamWalletAddress);
    _updateAppMetadata(id, _appMetadataURI);
    _setTeamAllocationPercentage(id, 0);
    EndorsementUtils.setEndorsementStatus(_getEndorsementStorage(), id, false);
    _addCreator(id, msg.sender);
    _enableRewardsPoolForNewApp(id);

    emit AppAdded(id, _teamWalletAddress, _appName, false);
  }

  /**
   * @dev See {IX2EarnApps-setAppAdmin}.
   */
  function setAppAdmin(bytes32 _appId, address _newAdmin) public onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    _setAppAdmin(_appId, _newAdmin);
  }

  /**
   * @dev See {IX2EarnApps-updateTeamWalletAddress}.
   */
  function updateTeamWalletAddress(bytes32 _appId, address _newReceiverAddress) public onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    _updateTeamWalletAddress(_appId, _newReceiverAddress);
  }

  /**
   * @dev See {IX2EarnApps-setTeamAllocationPercentage}.
   */
  function setTeamAllocationPercentage(bytes32 _appId, uint256 _percentage) public onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    _setTeamAllocationPercentage(_appId, _percentage);
  }

  /**
   * @dev See {IX2EarnApps-addAppModerator}.
   */
  function addAppModerator(bytes32 _appId, address _moderator) public onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    AdministrationUtils.addAppModerator(
      _getAdministrationStorage()._moderators,
      _appId,
      _moderator,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), _appId),
      MAX_MODERATORS
    );
  }

  /**
   * @dev See {IX2EarnApps-removeAppModerator}.
   */
  function removeAppModerator(bytes32 _appId, address _moderator) public onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    AdministrationUtils.removeAppModerator(
      _getAdministrationStorage()._moderators,
      _appId,
      _moderator,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), _appId)
    );
  }

  /**
   * @dev See {IX2EarnApps-removeAppCreator}.
   */
  function removeAppCreator(bytes32 _appId, address _creator) public onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    X2EarnAppsStorageTypes.AdministrationStorage storage $ = _getAdministrationStorage();
    AdministrationUtils.removeAppCreator(
      $._creators,
      $._creatorApps,
      $._x2EarnCreatorContract,
      _appId,
      _creator,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), _appId)
    );
  }

  /**
   * @dev See {IX2EarnApps-addCreator}.
   */
  function addCreator(bytes32 _appId, address _creator) public onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    _addCreator(_appId, _creator);
  }

  /**
   * @dev See {IX2EarnApps-addRewardDistributor}.
   */
  function addRewardDistributor(bytes32 _appId, address _distributor) public onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    AdministrationUtils.addRewardDistributor(
      _getAdministrationStorage()._rewardDistributors,
      _appId,
      _distributor,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), _appId),
      MAX_REWARD_DISTRIBUTORS
    );
  }

  /**
   * @dev See {IX2EarnApps-removeRewardDistributor}.
   */
  function removeRewardDistributor(bytes32 _appId, address _distributor) public onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    AdministrationUtils.removeRewardDistributor(
      _getAdministrationStorage()._rewardDistributors,
      _appId,
      _distributor,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), _appId)
    );
  }

  /**
   * @dev See {IX2EarnApps-enableRewardsPoolForNewApp}.
   */
  function enableRewardsPoolForNewApp(bytes32 _appId) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _enableRewardsPoolForNewApp(_appId);
  }

  /**
   * @dev See {IX2EarnApps-updateAppMetadata}.
   */
  function updateAppMetadata(bytes32 _appId, string memory _newMetadataURI) public onlyRoleAndAppAdminOrModerator(DEFAULT_ADMIN_ROLE, _appId) {
    _updateAppMetadata(_appId, _newMetadataURI);
  }

  // ---------- Endorsement Management ---------- //

  /**
   * @notice Endorses an app.
   * @param appId The unique identifier of the app being endorsed.
   * @param nodeId The unique identifier of the node they wish to use for endorsing app.
   */
  function endorseApp(bytes32 appId, uint256 nodeId) external {
    EndorsementUtils.endorseApp(
      _getEndorsementStorage(),
      _getAppsStorageStorage(),
      appId,
      nodeId,
      isBlacklisted(appId),
      appExists(appId),
      isEligibleNow(appId)
    );
    
    // Check if we need to set voting eligibility after endorsement
    X2EarnAppsStorageTypes.EndorsementStorage storage endorsementStorage = _getEndorsementStorage();
    if (endorsementStorage._appScores[appId] >= endorsementStorage._endorsementScoreThreshold) {
      if (!isEligibleNow(appId) && appExists(appId)) {
        _setVotingEligibility(appId, true);
      } else if (!appExists(appId)) {
        _setVotingEligibility(appId, true);
      }
    }
  }

  /**
   * @notice Unendorses an app.
   * @param appId The unique identifier of the app being unendorsed.
   * @param nodeId The unique identifier of the node that will unendorse.
   */
  function unendorseApp(bytes32 appId, uint256 nodeId) external {
    EndorsementUtils.unendorseApp(
      _getEndorsementStorage(),
      _getAppsStorageStorage(),
      appId,
      nodeId,
      isBlacklisted(appId),
      isEligibleNow(appId)
    );
  }

  /**
   * @dev See {IX2EarnApps-checkEndorsement}.
   */
  function checkEndorsement(bytes32 appId) external returns (bool) {
    bool stillEligible = EndorsementUtils.checkEndorsement(
      _getEndorsementStorage(),
      _getAppsStorageStorage(),
      _getVoteEligibilityStorage(),
      appId,
      clock()
    );

    if (!stillEligible && isEligibleNow(appId)) {
      _setVotingEligibility(appId, false);
    }

    return stillEligible;
  }

  /**
   * @dev See {IX2EarnApps-removeNodeEndorsement}.
   * @notice This function can be called by an XAPP admin that wishes to remove an endorsement from a specific node ID.
   */
  function removeNodeEndorsement(bytes32 _appId, uint256 _nodeId) public virtual onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    EndorsementUtils.removeNodeEndorsement(
      _getEndorsementStorage(),
      _getAppsStorageStorage(),
      _appId,
      _nodeId,
      isBlacklisted(_appId),
      isEligibleNow(_appId)
    );
  }

  /**
   * @dev See {IX2EarnApps-removeXAppSubmission}.
   * @notice This function can be called by an XAPP admin or contract admin that wishes to remove an XAPP submission.
   */
  function removeXAppSubmission(bytes32 _appId) public virtual onlyRoleAndAppAdmin(DEFAULT_ADMIN_ROLE, _appId) {
    EndorsementUtils.removeXAppSubmission(_getEndorsementStorage(), _getAppsStorageStorage(), _appId);
  }

  // ---------- Governance Settings ---------- //

  /**
   * @dev See {IX2EarnApps-updateGracePeriod}.
   */
  function updateGracePeriod(uint48 _newGracePeriod) public virtual onlyRole(GOVERNANCE_ROLE) {
    EndorsementUtils.setGracePeriod(_getEndorsementStorage(), _newGracePeriod);
  }

  /**
   * @dev See {IX2EarnApps-updateCooldownPeriod}.
   */
  function updateCooldownPeriod(uint256 _newCooldownPeriod) public virtual onlyRole(GOVERNANCE_ROLE) {
    EndorsementUtils.setCooldownPeriod(_getEndorsementStorage(), _newCooldownPeriod);
  }

  /**
   * @dev See {IX2EarnApps-updateNodeEndorsementScores}.
   */
  function updateNodeEndorsementScores(EndorsementUtils.NodeStrengthScores calldata _nodeStrengthScores) external onlyRole(GOVERNANCE_ROLE) {
    EndorsementUtils.updateNodeEndorsementScores(_getEndorsementStorage(), _nodeStrengthScores);
  }

  /**
   * @dev See {IX2EarnApps-updateEndorsementScoreThreshold}.
   */
  function updateEndorsementScoreThreshold(uint256 _scoreThreshold) external onlyRole(GOVERNANCE_ROLE) {
    EndorsementUtils.updateEndorsementScoreThreshold(_getEndorsementStorage(), _scoreThreshold);
  }

  // ---------- Contract Address Setters ---------- //

  /**
   * @dev See {IX2EarnApps-setVeBetterPassportContract}.
   */
  function setVeBetterPassportContract(address _veBetterPassportContract) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    EndorsementUtils.setVeBetterPassportContract(_getEndorsementStorage(), _veBetterPassportContract);
  }

  /**
   * @dev See {IX2EarnApps-setXAllocationVotingGovernor}.
   */
  function setXAllocationVotingGovernor(address _xAllocationVotingGovernor) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    EndorsementUtils.setXAllocationVotingGovernor(_getEndorsementStorage(), _xAllocationVotingGovernor);
  }

  /**
   * @dev See {IX2EarnApps-setX2EarnCreatorContract}.
   */
  function setX2EarnCreatorContract(address _x2EarnCreatorContract) public onlyRole(DEFAULT_ADMIN_ROLE) {
    if (_x2EarnCreatorContract == address(0)) {
      revert X2EarnInvalidAddress(_x2EarnCreatorContract);
    }
    _getAdministrationStorage()._x2EarnCreatorContract = IX2EarnCreator(_x2EarnCreatorContract);
  }

  /**
   * @dev See {IX2EarnApps-setX2EarnRewardsPoolContract}.
   */
  function setX2EarnRewardsPoolContract(address _x2EarnRewardsPoolContract) public onlyRole(DEFAULT_ADMIN_ROLE) {
    if (_x2EarnRewardsPoolContract == address(0)) {
      revert X2EarnInvalidAddress(_x2EarnRewardsPoolContract);
    }
    _getAdministrationStorage()._x2EarnRewardsPoolContract = IX2EarnRewardsPool(_x2EarnRewardsPoolContract);
  }

  /**
   * @dev See {IX2EarnApps-setStargateNFT}.
   */
  function setStargateNFT(address _stargateNft) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    EndorsementUtils.setStargateNFT(_getEndorsementStorage(), _stargateNft);
  }

  // ---------- Internal Functions ---------- //

  /**
   * @dev Internal function to set the voting eligibility of an app.
   * @param appId the app id
   * @param canBeVoted the voting eligibility status
   */
  function _setVotingEligibility(bytes32 appId, bool canBeVoted) internal {
    X2EarnAppsStorageTypes.VoteEligibilityStorage storage $ = _getVoteEligibilityStorage();
    VoteEligibilityUtils.updateVotingEligibility(
      $._eligibleApps,
      $._isAppEligibleCheckpoints,
      $._eligibleAppIndex,
      appId,
      canBeVoted,
      isEligibleNow(appId),
      clock()
    );
  }

  /**
   * @dev Set the app in the blacklist.
   * @param _appId the app id
   * @param _isBlacklisted true if the app should be blacklisted
   *
   * Emits a {BlacklistUpdated} event.
   */
  function _setBlacklist(bytes32 _appId, bool _isBlacklisted) internal {
    X2EarnAppsStorageTypes.VoteEligibilityStorage storage $ = _getVoteEligibilityStorage();
    $._blackList[_appId] = _isBlacklisted;
    emit BlacklistUpdated(_appId, _isBlacklisted);
  }

  /**
   * @dev Internal function to set the admin address of the app.
   * @param appId the hashed name of the app
   * @param newAdmin the address of the new admin
   */
  function _setAppAdmin(bytes32 appId, address newAdmin) internal {
    AdministrationUtils.setAppAdmin(
      _getAdministrationStorage()._admin,
      appId,
      newAdmin,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), appId)
    );
  }

  /**
   * @dev Update the address where the x2earn app receives allocation funds.
   * @param appId the hashed name of the app
   * @param newTeamWalletAddress the address of the new wallet where the team will receive the funds
   */
  function _updateTeamWalletAddress(bytes32 appId, address newTeamWalletAddress) internal {
    AdministrationUtils.updateTeamWalletAddress(
      _getAdministrationStorage()._teamWalletAddress,
      appId,
      newTeamWalletAddress,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), appId)
    );
  }

  /**
   * @dev Update the metadata URI of the app.
   * @param appId the hashed name of the app
   * @param newMetadataURI the metadata URI of the app
   *
   * Emits a {AppMetadataURIUpdated} event.
   */
  function _updateAppMetadata(bytes32 appId, string memory newMetadataURI) internal {
    AdministrationUtils.updateAppMetadata(
      _getAdministrationStorage()._metadataURI,
      appId,
      newMetadataURI,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), appId)
    );
  }

  /**
   * @dev Update the allocation percentage to reserve for the team.
   * @param appId the app id
   * @param newAllocationPercentage the new allocation percentage
   */
  function _setTeamAllocationPercentage(bytes32 appId, uint256 newAllocationPercentage) internal {
    AdministrationUtils.setTeamAllocationPercentage(
      _getAdministrationStorage()._teamAllocationPercentage,
      appId,
      newAllocationPercentage,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), appId)
    );
  }

  /**
   * @dev Internal function to add a creator to the app.
   * @param appId the hashed name of the app
   * @param creator the address of the creator
   */
  function _addCreator(bytes32 appId, address creator) internal {
    X2EarnAppsStorageTypes.AdministrationStorage storage $ = _getAdministrationStorage();
    AdministrationUtils.addCreator(
      $._creators,
      $._creatorApps,
      $._x2EarnCreatorContract,
      appId,
      creator,
      AppStorageUtils.appSubmitted(_getAppsStorageStorage(), appId),
      MAX_CREATORS
    );
  }

  /**
   * @dev Internal function to enable the rewards pool for a new app by default.
   * @param appId the hashed name of the app
   */
  function _enableRewardsPoolForNewApp(bytes32 appId) internal {
    AdministrationUtils.enableRewardsPoolForNewApp(_getAdministrationStorage()._x2EarnRewardsPoolContract, appId);
  }

  /**
   * @dev Function to revoke all creator roles from an app and burn the creator NFTs.
   * @param appId the app id
   */
  function _revokeAppCreators(bytes32 appId) internal {
    X2EarnAppsStorageTypes.AdministrationStorage storage $ = _getAdministrationStorage();
    if (!isBlacklisted(appId)) {
      AdministrationUtils.revokeAppCreators($._creators, $._creatorApps, $._x2EarnCreatorContract, appId);
    }
  }

  /**
   * @dev Function to validate all creator roles for an app and mint the creator NFTs.
   * @param appId the app id
   */
  function _validateAppCreators(bytes32 appId) internal {
    X2EarnAppsStorageTypes.AdministrationStorage storage $ = _getAdministrationStorage();
    if (isBlacklisted(appId)) {
      AdministrationUtils.validateAppCreators($._creators, $._creatorApps, $._x2EarnCreatorContract, appId);
    }
  }
}
