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

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import { IX2EarnApps } from "./interfaces/IX2EarnApps.sol";
import { INews } from "./interfaces/INews.sol";

/// @title News
/// @notice Contract for news of VeBetterDAO.
/// @dev This contract extends AccessControlUpgradeable with upgradeable pattern, enumerable, pausable, and access control functionalities.
contract News is INews, PausableUpgradeable, UUPSUpgradeable, AccessControlUpgradeable {
  // ---------------- Roles ----------------
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @custom:storage-location erc7201:b3tr.storage.News
  struct NewsStorage {
    IX2EarnApps x2EarnApps;
    mapping(bytes32 appId => NewsType[]) news;
    mapping(bytes32 appId => uint256) lastNewsBlock;
    uint256 cooldownPeriod;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.News")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant NewsStorageLocation = 0x5bef5c2fccff019296bd4b93f8c16a61495761f5d9e4b8788aad428bd3500400;

  function _getNewsStorage() private pure returns (NewsStorage storage $) {
    assembly {
      $.slot := NewsStorageLocation
    }
  }

  /// @notice Initializes the contract with role-based access control
  /// @param _x2EarnApps The address of the X2EarnApps contract
  /// @param _defaultAdmin Address to be assigned the default admin role
  /// @param _upgrader Address to be assigned the upgrader role
  /// @param _pauser Address to be assigned the pauser role
  function initialize(
    IX2EarnApps _x2EarnApps,
    uint256 _cooldownPeriod,
    address _defaultAdmin,
    address _upgrader,
    address _pauser
  ) public initializer {
    __AccessControl_init();
    __UUPSUpgradeable_init();

    require(address(_x2EarnApps) != address(0), "News: x2EarnApps is the zero address");
    require(_defaultAdmin != address(0), "News: defaultAdmin is the zero address");
    require(_upgrader != address(0), "News: upgrader is the zero address");

    _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    _grantRole(UPGRADER_ROLE, _upgrader);
    _grantRole(PAUSER_ROLE, _pauser);

    NewsStorage storage $ = _getNewsStorage();
    $.x2EarnApps = _x2EarnApps;
    $.cooldownPeriod = _cooldownPeriod;
  }

  // ---------- Modifiers ------------ //

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert NewsUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------------- Upgrade and Utility Overrides ----------------

  /**
   * @dev See {UUPSUpgradeable-_authorizeUpgrade}
   */
  function _authorizeUpgrade(address newImplementation) internal override onlyRoleOrAdmin(UPGRADER_ROLE) {}

  // ---------- Setters ---------- //

  /**
   * @dev Publishes news for an app
   * @param appId The ID of the app for which the news was published
   * @param title The title of the news
   * @param description The description of the news
   * @param image The image of the news
   * @param callToActionUrl The call to action URL of the news
   */
  function publish(
    bytes32 appId,
    string memory title,
    string memory description,
    string memory image,
    string memory callToActionUrl
  ) public onlyRoleOrAdmin(PUBLISHER_ROLE) {
    NewsStorage storage $ = _getNewsStorage();
    require(
      $.x2EarnApps.isAppAdmin(appId, msg.sender) ||
        $.x2EarnApps.isAppCreator(appId, msg.sender) ||
        $.x2EarnApps.isAppModerator(appId, msg.sender),
      "News: not a moderator, creator or admin"
    );
    //Check if app already published news in this week
    require(!isUnderCooldown(appId), "News: app is in cooldown period");
    //If not, publish news
    _publish(appId, title, description, image, callToActionUrl);
  }
  /**
   * @dev Internal function to publish news for an app
   * @param appId The ID of the app for which the news was published
   * @param title The title of the news
   * @param description The description of the news
   * @param image The image of the news
   * @param callToActionUrl The call to action URL of the news
   */
  function _publish(
    bytes32 appId,
    string memory title,
    string memory description,
    string memory image,
    string memory callToActionUrl
  ) internal {
    NewsStorage storage $ = _getNewsStorage();
    $.news[appId].push(NewsType(title, description, image, callToActionUrl));
    $.lastNewsBlock[appId] = block.number;
    emit NewsPublished(appId, title, description, image, callToActionUrl, msg.sender);
  }

  /**
   * @dev Sets the cooldown period.
   *
   * @param _cooldownPeriod the new cooldown period
   */
  function setCooldownPeriod(uint256 _cooldownPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
    NewsStorage storage $ = _getNewsStorage();
    emit CooldownPeriodUpdated($.cooldownPeriod, _cooldownPeriod);
    $.cooldownPeriod = _cooldownPeriod;
  }

  /**
   * @dev Sets the X2EarnApps contract address.
   *
   * @param _x2EarnApps the new X2EarnApps contract
   */
  function setX2EarnApps(IX2EarnApps _x2EarnApps) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(address(_x2EarnApps) != address(0), "News: x2EarnApps is the zero address");
    NewsStorage storage $ = _getNewsStorage();
    $.x2EarnApps = _x2EarnApps;
  }

  /// @notice Pauses all token transfers and minting functions
  /// @dev Only callable by accounts with the PAUSER_ROLE or the DEFAULT_ADMIN_ROLE
  function pause() public onlyRoleOrAdmin(PAUSER_ROLE) {
    _pause();
  }

  /// @notice Unpauses the contract to resume token transfers and minting
  /// @dev Only callable by accounts with the PAUSER_ROLE or the DEFAULT_ADMIN_ROLE
  function unpause() public onlyRoleOrAdmin(PAUSER_ROLE) {
    _unpause();
  }

  // ---------- Getters ---------- //

  /**
   * @dev Retrieves the news for an app
   * @param appId The ID of the app for which the news was published
   * @return An array of NewsType objects containing the news details
   */
  function appNews(bytes32 appId) external view returns (NewsType[] memory) {
    NewsStorage storage $ = _getNewsStorage();
    return $.news[appId];
  }

  /**
   * @dev See {INews-isUnderCooldown}.
   * @param appId The unique identifier of the app.
   * @return True if the app is in a cooldown period.
   */
  function isUnderCooldown(bytes32 appId) public view returns (bool) {
    NewsStorage storage $ = _getNewsStorage();
    uint256 _lastNewsBlock = $.lastNewsBlock[appId];
    uint256 requiredBlock = _lastNewsBlock + $.cooldownPeriod;
    return requiredBlock > block.number;
  }

  /**
   * @dev See {INews-cooldownPeriod}.
   * @return The current cooldown period duration in blocks.
   */
  function cooldownPeriod() external view returns (uint256) {
    NewsStorage storage $ = _getNewsStorage();
    return $.cooldownPeriod;
  }

  /**
   * @dev See {INews-lastNewsBlock}.
   * @param appId The ID of the app.
   * @return The last news block.
   */
  function lastNewsBlock(bytes32 appId) external view returns (uint256) {
    NewsStorage storage $ = _getNewsStorage();
    return $.lastNewsBlock[appId];
  }

  /**
   * @dev Retrieves the X2EarnApps contract.
   */
  function x2EarnApps() external view returns (IX2EarnApps) {
    NewsStorage storage $ = _getNewsStorage();
    return $.x2EarnApps;
  }

  /// @notice Retieves the version of the contract
  function version() public pure returns (uint256) {
    return 1;
  }
}
