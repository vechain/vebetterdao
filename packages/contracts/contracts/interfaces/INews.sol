// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import { IX2EarnApps } from "./IX2EarnApps.sol";

/**
 * @title INews
 * @dev Interface designed to be used by admins of x2EarnApps contract to publish or retrieve news.
 */
interface INews  {
  /**
   * @dev Event emitted when a new news is published.
   *
   * @param appId The ID of the app for which the news was published.
   * @param metadata The metadata of the news.
   * @param publisher The address of the user that published the news.
   */
  event NewsPublished(bytes32 indexed appId, string metadata, address indexed publisher);

  /**
   * @dev Initializes the contract with role-based access control
   * @param _x2EarnApps The address of the X2EarnApps contract
   * @param _defaultAdmin Address to be assigned the default admin role
   * @param _upgrader Address to be assigned the upgrader role
   * @param _pauser Address to be assigned the pauser role
   */
  function initialize(IX2EarnApps _x2EarnApps, address _defaultAdmin, address _upgrader, address _pauser) external;

  /**
   * @dev Publishes news for an app
   * @param appId The ID of the app for which the news was published
   * @param metadata The metadata of the news
   */
  function publishNews(bytes32 appId, string memory metadata) external;

  /**
   * @dev Publishes news for an app using the PUBLISHER_ROLE or the DEFAULT_ADMIN_ROLE
   * @param appId The ID of the app for which the news was published
   * @param metadata The metadata of the news
   */
  function publishNewsAdmin(bytes32 appId, string memory metadata) external;
  /**
   * @dev Sets the X2EarnApps contract address.
   * @param _x2EarnApps the new X2EarnApps contract
   */
  function setX2EarnApps(IX2EarnApps _x2EarnApps) external;

  /**
   * @dev Retrieves the X2EarnApps contract.
   */
  function x2EarnApps() external view returns (IX2EarnApps);

  /**
   * @dev Pauses all contract operations
   */
  function pause() external;

  /**
   * @dev Unpauses the contract operations
   */
  function unpause() external;

  /**
   * @dev Retrieves the current version of the contract.
   * @return The version of the contract.
   */
  function version() external pure returns (string memory);
}
