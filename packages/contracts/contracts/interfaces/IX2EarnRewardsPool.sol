// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface IX2EarnRewardsPool {
  /**
   * @dev Event emitted when a new deposit is made into the rewards pool.
   *
   * @param appId The ID of the app for which the deposit was made.
   * @param amount The amount of $B3TR deposited.
   * @param depositor The address of the user that deposited the funds.
   */
  event NewDeposit(bytes32 indexed appId, uint256 amount, address indexed depositor);

  /**
   * @dev Event emitted when a reward is emitted by an app.
   *
   * @param distributor The address that triggered this action
   * @param appId The ID of the app for which the reward was emitted
   * @param amount The amount of $B3TR sent to the user
   * @param receiver The address of the user that received the reward
   * @param proof A JSON file uploaded on IPFS by the app that adds information on the type of action that was performed
   */
  event RewardEmitted(
    address indexed distributor,
    bytes32 indexed appId,
    uint256 amount,
    address indexed receiver,
    string proof
  );

  /**
   * @dev Retrieves the current version of the contract.
   *
   * @return The version of the contract.
   */
  function version() external pure returns (string memory);

  /**
   * @dev Function used by x2earn apps to deposit funds into the rewards pool.
   *
   * @param amount The amount of $B3TR to deposit.
   * @param appId The ID of the app.
   */
  function deposit(uint256 amount, bytes32 appId) external returns (bool);

  /**
   * @dev Gets the amount of funds available for an app to reward users.
   *
   * @param appId The ID of the app.
   */
  function availableFunds(bytes32 appId) external view returns (uint256);

  /**
   * @dev Function used by x2earn apps to reward users that performed sustainable actions.
   *
   * @param appId the app id that is emitting the reward
   * @param amount the amount of B3TR token the user is rewarded with
   * @param receiver the address of the user that performed the sustainable action and is rewarded
   * @param proof a JSON file uploaded on IPFS by the app that adds information on the type of action that was performed
   */
  function emitReward(bytes32 appId, uint256 amount, address receiver, string memory proof) external;
}
