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

/**
 * @notice Enum for different types of relayer actions
 */
enum RelayerAction {
  VOTE, // Casting votes on behalf of users
  CLAIM // Claiming rewards for users
}

/**
 * @title IRelayerRewardsPool
 * @author VeBetterDAO
 * @notice Interface for the RelayerRewardsPool contract that manages rewards for relayers
 * who perform auto-voting actions on behalf of users.
 */
interface IRelayerRewardsPool {
  /**
   * @notice Returns the total rewards available for distribution among relayers in a round
   * @param roundId The round ID to check
   * @return The total reward amount for the round
   */
  function getTotalRewards(uint256 roundId) external view returns (uint256);

  /**
   * @notice Checks if rewards are claimable for a specific round
   * @param roundId The round ID to check
   * @return True if rewards are claimable, false otherwise
   */
  function isRewardClaimable(uint256 roundId) external view returns (bool);

  /**
   * @notice Returns the number of actions performed by a relayer in a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   * @return The number of actions performed by the relayer
   */
  function totalRelayerActions(address relayer, uint256 roundId) external view returns (uint256);

  /**
   * @notice Returns the total number of actions required for a round
   * @dev There are 2 actions for auto-voting: cast vote on behalf and claim rewards for them
   * So, each user who enables auto-voting requires 2 actions
   * @param roundId The round ID
   * @return The total number of actions required for the round
   */
  function totalActions(uint256 roundId) external view returns (uint256);

  /**
   * @notice Sets the total number of actions required for a round
   * @param roundId The round ID
   * @param totalActionsRequired The total number of actions required
   */
  function setTotalActionsForRound(uint256 roundId, uint256 totalActionsRequired) external;

  /**
   * @notice Returns the claimable reward amount for a relayer in a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   * @return The claimable reward amount
   */
  function claimableRewards(address relayer, uint256 roundId) external view returns (uint256);

  /**
   * @notice Registers an action performed by a relayer in a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   * @param action The type of action performed (VOTE or CLAIM)
   */
  function registerRelayerAction(address relayer, uint256 roundId, RelayerAction action) external;

  /**
   * @notice Allows a relayer to claim their rewards for a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   */
  function claimRewards(uint256 roundId, address relayer) external;

  /**
   * @notice Deposits B3TR tokens into the pool for a specific round
   * @dev This function should be called by the VoterRewards contract
   * @param amount The amount of B3TR tokens to deposit
   * @param roundId The round ID to deposit for
   */
  function deposit(uint256 amount, uint256 roundId) external;

  /**
   * @notice Get the current vote weight
   * @return The current vote weight
   */
  function getVoteWeight() external view returns (uint256);

  /**
   * @notice Get the current claim weight
   * @return The current claim weight
   */
  function getClaimWeight() external view returns (uint256);

  /**
   * @notice Returns the total weighted actions performed by a relayer in a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   * @return The total weighted actions performed by the relayer
   */
  function totalRelayerWeightedActions(address relayer, uint256 roundId) external view returns (uint256);

  /**
   * @notice Returns the total weighted actions required for a round
   * @param roundId The round ID
   * @return The total weighted actions required for the round
   */
  function totalWeightedActions(uint256 roundId) external view returns (uint256);

  /**
   * @notice Returns the total completed weighted actions for a round
   * @param roundId The round ID
   * @return The total completed weighted actions for the round
   */
  function completedWeightedActions(uint256 roundId) external view returns (uint256);

  /**
   * @notice Emitted when a relayer action is registered
   * @param relayer The relayer address
   * @param roundId The round ID
   * @param actionCount The new total action count for the relayer
   * @param weight The weight of the action
   */
  event RelayerActionRegistered(address indexed relayer, uint256 indexed roundId, uint256 actionCount, uint256 weight);

  /**
   * @notice Emitted when rewards are deposited for a round
   * @param roundId The round ID
   * @param amount The amount deposited
   * @param totalRewards The new total rewards for the round
   */
  event RewardsDeposited(uint256 indexed roundId, uint256 amount, uint256 totalRewards);

  /**
   * @notice Emitted when a relayer claims rewards
   * @param relayer The relayer address
   * @param roundId The round ID
   * @param amount The amount claimed
   */
  event RelayerRewardsClaimed(address indexed relayer, uint256 indexed roundId, uint256 amount);

  /**
   * @notice Emitted when vote weight is updated
   * @param newWeight The new vote weight
   * @param oldWeight The old vote weight
   */
  event VoteWeightUpdated(uint256 newWeight, uint256 oldWeight);

  /**
   * @notice Emitted when claim weight is updated
   * @param newWeight The new claim weight
   * @param oldWeight The old claim weight
   */
  event ClaimWeightUpdated(uint256 newWeight, uint256 oldWeight);
}
