// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

/**
 * @title INavigator Interface
 * @notice Interface for the Navigator delegation system
 * @dev Navigators are public voting agents who manage delegated voting power on behalf of users
 * for X-Allocation voting rounds. Users can delegate their voting power to trusted Navigators
 * who vote weekly on their behalf in exchange for a fee deducted from rewards.
 */
interface INavigator {
  /// @notice Navigator registration info
  struct NavigatorInfo {
    bool registered;
    bool active;
    string profile; // IPFS CID for off-chain profile data
    uint256 registeredAt;
    uint256 feePercentage; // Navigator's fee in basis points (e.g., 2000 = 20%)
  }

  // ============ Errors ============

  /// @notice Thrown when caller is not a registered navigator
  error NotRegisteredNavigator(address account);

  /// @notice Thrown when navigator is not active
  error NavigatorNotActive(address navigator);

  /// @notice Thrown when navigator is already registered
  error NavigatorAlreadyRegistered(address navigator);

  /// @notice Thrown when user is already delegated to a navigator
  error AlreadyDelegated(address user, address currentNavigator);

  /// @notice Thrown when user is not delegated to any navigator
  error NotDelegated(address user);

  /// @notice Thrown when navigator doesn't have enough capacity for new delegation
  error NavigatorCapacityExceeded(address navigator, uint256 capacity, uint256 requested);

  /// @notice Thrown when stake amount is below minimum
  error StakeBelowMinimum(uint256 provided, uint256 minimum);

  /// @notice Thrown when trying to unstake more than staked
  error InsufficientStake(uint256 requested, uint256 available);

  /// @notice Thrown when unstaking would cause capacity to be exceeded
  error UnstakeWouldExceedCapacity(address navigator);

  /// @notice Thrown when fees are still locked
  error FeesStillLocked(uint256 round, uint256 unlockRound);

  /// @notice Thrown when no fees to claim
  error NoFeesToClaim(address navigator, uint256 round);

  /// @notice Thrown when caller is not authorized to record fees
  error UnauthorizedFeeRecorder(address caller);

  /// @notice Thrown when fee percentage exceeds maximum
  error FeePercentageTooHigh(uint256 provided, uint256 maximum);

  /// @notice Thrown when address is zero
  error ZeroAddress();

  // ============ Events ============

  /// @notice Emitted when a new navigator registers
  event NavigatorRegistered(address indexed navigator, string profile, uint256 feePercentage);

  /// @notice Emitted when a navigator updates their profile
  event NavigatorProfileUpdated(address indexed navigator, string newProfile);

  /// @notice Emitted when a navigator becomes active
  event NavigatorActivated(address indexed navigator);

  /// @notice Emitted when a navigator becomes inactive
  event NavigatorDeactivated(address indexed navigator);

  /// @notice Emitted when a navigator stakes VOT3
  event NavigatorStaked(address indexed navigator, uint256 amount, uint256 totalStake);

  /// @notice Emitted when a navigator unstakes VOT3
  event NavigatorUnstaked(address indexed navigator, uint256 amount, uint256 totalStake);

  /// @notice Emitted when a user delegates to a navigator
  event DelegatedToNavigator(address indexed user, address indexed navigator, uint256 votingPower);

  /// @notice Emitted when a user removes delegation
  event DelegationRemoved(address indexed user, address indexed previousNavigator);

  /// @notice Emitted when delegation is refreshed to sync with current balance
  event DelegationRefreshed(address indexed delegator, address indexed navigator, uint256 oldAmount, uint256 newAmount);

  /// @notice Emitted when fees are recorded for a navigator
  event FeesRecorded(address indexed navigator, uint256 indexed round, uint256 amount);

  /// @notice Emitted when a navigator claims fees
  event FeesClaimed(address indexed navigator, uint256 indexed round, uint256 amount);

  // ============ Navigator Registration ============

  /// @notice Register as a navigator candidate
  /// @param profile IPFS CID containing navigator profile data
  /// @param feePercentage Fee percentage in basis points (max 5000 = 50%)
  function registerNavigator(string calldata profile, uint256 feePercentage) external;

  /// @notice Update navigator profile
  /// @param newProfile New IPFS CID for profile data
  function updateProfile(string calldata newProfile) external;

  /// @notice Get navigator info
  /// @param navigator Address of the navigator
  /// @return NavigatorInfo struct
  function getNavigatorInfo(address navigator) external view returns (NavigatorInfo memory);

  /// @notice Check if address is a registered navigator
  /// @param account Address to check
  /// @return True if registered
  function isRegisteredNavigator(address account) external view returns (bool);

  /// @notice Check if navigator is currently active
  /// @param navigator Address of the navigator
  /// @return True if active
  function isNavigatorActive(address navigator) external view returns (bool);

  // ============ Staking ============

  /// @notice Stake VOT3 tokens to increase delegation capacity
  /// @param amount Amount of VOT3 to stake
  function stake(uint256 amount) external;

  /// @notice Unstake VOT3 tokens
  /// @param amount Amount of VOT3 to unstake
  function unstake(uint256 amount) external;

  /// @notice Get navigator's current stake
  /// @param navigator Address of the navigator
  /// @return Staked VOT3 amount
  function getStake(address navigator) external view returns (uint256);

  /// @notice Get navigator's delegation capacity based on stake
  /// @param navigator Address of the navigator
  /// @return Maximum VOT3 that can be delegated to this navigator
  function getDelegationCapacity(address navigator) external view returns (uint256);

  /// @notice Get total VOT3 currently delegated to a navigator
  /// @param navigator Address of the navigator
  /// @return Total delegated VOT3
  function getTotalDelegated(address navigator) external view returns (uint256);

  /// @notice Get available delegation capacity
  /// @param navigator Address of the navigator
  /// @return Remaining capacity for new delegations
  function getAvailableCapacity(address navigator) external view returns (uint256);

  // ============ Delegation ============

  /// @notice Delegate voting power to a navigator
  /// @param navigator Address of the navigator to delegate to
  function delegateTo(address navigator) external;

  /// @notice Remove delegation from current navigator
  function removeDelegation() external;

  /// @notice Get the navigator a user is delegated to
  /// @param user Address of the user
  /// @return Navigator address (address(0) if not delegated)
  function getNavigatorOf(address user) external view returns (address);

  /// @notice Get the navigator a user was delegated to at a specific timepoint
  /// @param user Address of the user
  /// @param timepoint Block number to query
  /// @return Navigator address at that timepoint
  function getNavigatorAtTimepoint(address user, uint256 timepoint) external view returns (address);

  /// @notice Get navigator's aggregate voting power at a specific timepoint
  /// @param navigator Address of the navigator
  /// @param timepoint Block number to query
  /// @return Aggregate voting power at that timepoint
  function getNavigatorVotingPower(address navigator, uint256 timepoint) external view returns (uint256);

  // ============ Fee Management ============

  /// @notice Record fees for a navigator (called by VoterRewards)
  /// @param navigator Address of the navigator
  /// @param round Round ID
  /// @param amount Fee amount in B3TR
  function recordFee(address navigator, uint256 round, uint256 amount) external;

  /// @notice Claim unlocked fees for a specific round
  /// @param round Round ID to claim fees for
  function claimFees(uint256 round) external;

  /// @notice Get locked fees for a navigator in a specific round
  /// @param navigator Address of the navigator
  /// @param round Round ID
  /// @return Locked fee amount
  function getLockedFees(address navigator, uint256 round) external view returns (uint256);

  /// @notice Get total unclaimed fees across all rounds
  /// @param navigator Address of the navigator
  /// @return Total unclaimed fees
  function getTotalUnclaimedFees(address navigator) external view returns (uint256);

  /// @notice Check if fees for a round are claimable
  /// @param round Round ID
  /// @return True if fees can be claimed
  function areFeesClaimable(uint256 round) external view returns (bool);

  // ============ Configuration ============

  /// @notice Get the fee lock period in rounds
  /// @return Number of rounds fees are locked
  function feeLockRounds() external view returns (uint256);

  /// @notice Get minimum stake required
  /// @return Minimum VOT3 stake
  function minStake() external view returns (uint256);

  /// @notice Get maximum stake cap
  /// @return Maximum VOT3 stake
  function maxStake() external view returns (uint256);

  /// @notice Get stake ratio (basis points)
  /// @return Stake ratio for capacity calculation
  function stakeRatio() external view returns (uint256);

  /// @notice Get maximum allowed fee percentage
  /// @return Maximum fee in basis points
  function maxFeePercentage() external view returns (uint256);

  // ============ External Contract References ============

  /// @notice Get VOT3 token address
  /// @return VOT3 contract address
  function vot3() external view returns (address);

  /// @notice Get B3TR token address
  /// @return B3TR contract address
  function b3tr() external view returns (address);

  /// @notice Get XAllocationVoting contract address
  /// @return XAllocationVoting contract address
  function xAllocationVoting() external view returns (address);

  /// @notice Get contract version
  /// @return Version string
  function version() external view returns (string memory);
}
