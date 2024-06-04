// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IXAllocationPool {
  /**
   * @dev Event emitted when an app claims its rewards for a given round.
   * Total amount of $B3TR tokens earned in a round are the sum of the
   * team allocation and the rewards allocation.
   *
   * @param appId The ID of the app for which the rewards were claimed.
   * @param roundId The round ID for which the rewards were claimed.
   * @param amount The amount of $B3TR sent to the team.
   * @param recipient The address of the recipient of the rewards sent to the team.
   * @param caller The address that triggered this operation.
   * @param unallocatedAmount The amount of $B3TR that was not allocated, and were sent to the treasury.
   * @param rewardsAllocationAmount The amount of $B3TR left in the cotnract and reserved to reward users.
   */
  event AllocationRewardsClaimed(
    bytes32 indexed appId,
    uint256 roundId,
    uint256 amount,
    address indexed recipient,
    address caller,
    uint256 unallocatedAmount,
    uint256 rewardsAllocationAmount
  );

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
    address receiver,
    string proof
  );

  /**
   * @dev Fetches the id of the current round and calculates the earnings.
   * Usually when calling this function round is active, and the results should be treated as real time estimation and not final results.
   * If round ends and a new round did not start yet, then the results can be considered final.
   *
   * @param appId The ID of the app for which to calculate the amount available for allocation.
   */
  function currentRoundEarnings(bytes32 appId) external view returns (uint256);

  /**
   * @dev The amount of allocation to distribute to the apps is calculated in two parts:
   * - There is a minimum amount calculated through the `baseAllocationPercentage` of total available funds for the round divided by the number of eligible apps
   * - There is a variable amount (calculated upon the `variableAllocationPercentage` of total available funds) that depends on the amounts of votes that an app receives.
   * There is a cap to how much each x-app will be able to receive each round. Unallocated amount is calculated when the app share is greater than the max share an app get have.
   *
   * If a round fails then we calculate the % of received votes (shares) against the previous succeeded round.
   * If a round is succeeded then we calculate the % of received votes (shares) against it.
   * If a round is active then results should be treated as real time estimation and not final results, since voting is still in progress.
   *
   * @param roundId The round ID for which to calculate the amount available for allocation.
   * @param appId The ID of the app for which to calculate the amount available for allocation.
   *
   * @return totalAmount The total amount of $B3TR available for allocation to the app.
   * @return unallocatedAmount The amount of $B3TR that was not allocated, and will be sent to the treasury.
   * @return teamAllocationAmount The amount of $B3TR that will be sent to the team.
   * @return rewardsAllocationAmount The amount of $B3TR reserved to reward users.
   */
  function roundEarnings(uint256 roundId, bytes32 appId) external view returns (uint256, uint256, uint256, uint256);

  /**
   * @dev Get how much an app can claim for a given round.
   *
   * @param roundId The round ID for which to calculate the amount available for allocation.
   * @param appId The ID of the app for which to calculate the amount available for allocation.
   * @return totalAmount The total amount of $B3TR available for allocation to the app.
   * @return unallocatedAmount The amount of $B3TR that was not allocated, and will be sent to the treasury.
   * @return teamAllocationAmount The amount of $B3TR that will be sent to the team.
   * @return rewardsAllocationAmount The amount of $B3TR reserved to reward users.
   */
  function claimableAmount(uint256 roundId, bytes32 appId) external view returns (uint256, uint256, uint256, uint256);

  /**
   * @dev Returns the scaled quadratic funding percentage of votes for a given app in a given round.
   * When calculating the percentage of votes received we check if the app exceeds the max cap of shares, eg:
   * if an app has 80 votes out of 100, and the max cap is 50, then the app will have a share of 50% of the available funds.
   * The remaining 30% will be sent to the treasury.
   *
   * @param roundId The round ID for which to calculate the amount of votes received in percentage.
   * @param appId The ID of the app.
   * @return appShare The percentage of votes received by the app.
   * @return unallocatedShare The amount of votes that were not allocated, and will be sent to the treasury.
   */
  function getAppShares(uint256 roundId, bytes32 appId) external view returns (uint256, uint256);

  /**
   * @dev Calculate the minimum amount of $B3TR that will be distributed to each qualified X Application in a given round.
   * `baseAllocationPercentage`% of allocations will be on average distributed to each qualified X Application as the base
   * part of the allocation (so all the x-apps in the ecosystem will receive a minimum amount of $B3TR).
   *
   * @param roundId The round ID for which to calculate the amount available for allocation.
   */
  function baseAllocationAmount(uint256 roundId) external view returns (uint256);

  /**
   * @dev Returns the maximum amount an app can claim for a given round.
   *
   * @param roundId The round ID
   */
  function getMaxAppAllocation(uint256 roundId) external view returns (uint256);

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

  /**
   * @dev Returns the version of the contract
   * @return string The version of the contract
   */
  function version() external view returns (string memory);
}
