// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

/**
 * @title INews
 * @dev Interface designed to be used by admins of x2EarnApps contract to publish or retrieve news.
 */
interface INews {
  /**
   * @dev Event emitted when a new news is published.
   *
   * @param appId The ID of the app for which the news was published.
   * @param metadata The metadata of the news.
   * @param publisher The address of the user that published the news.
   */
  event NewsPublished(bytes32 indexed appId, string metadata, address indexed publisher);


  /**
   * @dev Retrieves the current version of the contract.
   *
   * @return The version of the contract.
   */
  function version() external pure returns (string memory);


}
