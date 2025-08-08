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
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IB3TR.sol";
import "./interfaces/IRelayerRewardsPool.sol";
import "./interfaces/IEmissions.sol";

/**
 * @title RelayerRewardsPool
 * @author VeBetterDAO
 * @notice This contract manages rewards for relayers who perform auto-voting actions on behalf of users.
 *
 * @dev The contract is:
 * - upgradeable using UUPSUpgradeable
 * - using AccessControl to handle admin and relayer roles
 * - using ReentrancyGuard to prevent reentrancy attacks
 * - following the ERC-7201 standard for storage layout
 *
 * Roles:
 * - DEFAULT_ADMIN_ROLE: Can add new admins, set contract addresses, and manage pool settings
 * - UPGRADER_ROLE: Can upgrade the contract
 * - RELAYER_REGISTRAR_ROLE: Can register relayer actions (VoterRewards contract)
 * - DEPOSITOR_ROLE: Can deposit rewards into the pool (VoterRewards contract)
 */
contract RelayerRewardsPool is
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable,
  IRelayerRewardsPool
{
  /// @notice The role that can upgrade the contract
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /// @notice The role that can register relayer actions
  bytes32 public constant RELAYER_REGISTRAR_ROLE = keccak256("RELAYER_REGISTRAR_ROLE");

  /// @notice The role that can deposit rewards into the pool
  bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");

  /// @custom:storage-location erc7201:b3tr.storage.RelayerRewardsPool
  struct RelayerRewardsPoolStorage {
    IB3TR b3tr;
    IEmissions emissions;
    // roundId => total rewards available for the round
    mapping(uint256 => uint256) totalRewards;
    // roundId => relayer => number of actions performed
    mapping(uint256 => mapping(address => uint256)) relayerActions;
    // roundId => relayer => weighted actions performed
    mapping(uint256 => mapping(address => uint256)) relayerWeightedActions;
    // roundId => total actions required for the round
    mapping(uint256 => uint256) totalActions;
    // roundId => total weighted actions required for the round
    mapping(uint256 => uint256) totalWeightedActions;
    // roundId => relayer => has claimed rewards
    mapping(uint256 => mapping(address => bool)) claimed;
    // roundId => total actions completed
    mapping(uint256 => uint256) completedActions;
    // roundId => total weighted actions completed
    mapping(uint256 => uint256) completedWeightedActions;
    // configurable weights for different action types
    uint256 voteWeight;
    uint256 claimWeight;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.RelayerRewardsPool")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant RelayerRewardsPoolStorageLocation =
    0x33676f94b2c7694b38dc9f1f29c59bfbb522294615c1bff34717ad1fa8926000;

  /// @notice Get the RelayerRewardsPoolStorage struct from the specified storage slot
  function _getRelayerRewardsPoolStorage() internal pure returns (RelayerRewardsPoolStorage storage $) {
    assembly {
      $.slot := RelayerRewardsPoolStorageLocation
    }
  }

  /// @notice Emitted when the B3TR contract address is updated
  /// @param newAddress The new B3TR contract address
  /// @param oldAddress The old B3TR contract address
  event B3TRAddressUpdated(address indexed newAddress, address indexed oldAddress);

  /// @notice Emitted when the Emissions contract address is updated
  /// @param newAddress The new Emissions contract address
  /// @param oldAddress The old Emissions contract address
  event EmissionsAddressUpdated(address indexed newAddress, address indexed oldAddress);

  /// @notice Custom error for when a round has not ended yet
  error RoundNotEnded(uint256 roundId);

  /// @notice Custom error for when trying to claim rewards twice
  error RewardsAlreadyClaimed(address relayer, uint256 roundId);

  /// @notice Custom error for when there are no rewards to claim
  error NoRewardsToClaim(address relayer, uint256 roundId);

  /// @notice Custom error for when transfer fails
  error TransferFailed();

  /// @notice Custom error for invalid parameters
  error InvalidParameter(string parameter);

  /// @notice Modifier to check if the caller has the admin role
  modifier onlyAdmin() {
    _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _;
  }

  /// @notice Modifier to check if the caller has the relayer registrar role
  modifier onlyRelayerRegistrar() {
    _checkRole(RELAYER_REGISTRAR_ROLE, msg.sender);
    _;
  }

  /// @notice Modifier to check if the caller has the depositor role
  modifier onlyDepositor() {
    _checkRole(DEPOSITOR_ROLE, msg.sender);
    _;
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @notice Initialize the contract
   * @param admin The admin address
   * @param upgrader The upgrader address
   * @param b3trAddress The B3TR contract address
   * @param emissionsAddress The Emissions contract address
   */
  function initialize(
    address admin,
    address upgrader,
    address b3trAddress,
    address emissionsAddress
  ) public initializer {
    require(admin != address(0), "RelayerRewardsPool: admin cannot be zero address");
    require(upgrader != address(0), "RelayerRewardsPool: upgrader cannot be zero address");
    require(b3trAddress != address(0), "RelayerRewardsPool: b3tr cannot be zero address");
    require(emissionsAddress != address(0), "RelayerRewardsPool: emissions cannot be zero address");

    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();

    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(UPGRADER_ROLE, upgrader);

    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    $.b3tr = IB3TR(b3trAddress);
    $.emissions = IEmissions(emissionsAddress);

    // Initialize default weights
    $.voteWeight = 3; // Higher weight for vote actions (more gas intensive)
    $.claimWeight = 1; // Base weight for claim actions
  }

  /**
   * @notice Authorizes upgrade to a new implementation
   * @param newImplementation The address of the new implementation
   */
  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  /**
   * @notice Set the B3TR contract address
   * @param b3trAddress The B3TR contract address
   */
  function setB3TRAddress(address b3trAddress) external onlyAdmin {
    if (b3trAddress == address(0)) revert InvalidParameter("b3trAddress");

    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    address oldAddress = address($.b3tr);
    $.b3tr = IB3TR(b3trAddress);

    emit B3TRAddressUpdated(b3trAddress, oldAddress);
  }

  /**
   * @notice Set the Emissions contract address
   * @param emissionsAddress The Emissions contract address
   */
  function setEmissionsAddress(address emissionsAddress) external onlyAdmin {
    if (emissionsAddress == address(0)) revert InvalidParameter("emissionsAddress");

    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    address oldAddress = address($.emissions);
    $.emissions = IEmissions(emissionsAddress);

    emit EmissionsAddressUpdated(emissionsAddress, oldAddress);
  }

  /**
   * @notice Get the current vote weight
   * @return The current vote weight
   */
  function getVoteWeight() external view returns (uint256) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    return $.voteWeight;
  }

  /**
   * @notice Get the current claim weight
   * @return The current claim weight
   */
  function getClaimWeight() external view returns (uint256) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    return $.claimWeight;
  }

  /**
   * @notice Set the vote weight
   * @param newWeight The new vote weight
   */
  function setVoteWeight(uint256 newWeight) external onlyAdmin {
    if (newWeight == 0) revert InvalidParameter("voteWeight");

    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    uint256 oldWeight = $.voteWeight;
    $.voteWeight = newWeight;

    emit VoteWeightUpdated(newWeight, oldWeight);
  }

  /**
   * @notice Set the claim weight
   * @param newWeight The new claim weight
   */
  function setClaimWeight(uint256 newWeight) external onlyAdmin {
    if (newWeight == 0) revert InvalidParameter("claimWeight");

    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    uint256 oldWeight = $.claimWeight;
    $.claimWeight = newWeight;

    emit ClaimWeightUpdated(newWeight, oldWeight);
  }

  /**
   * @notice Returns the total rewards available for distribution among relayers in a round
   * @param roundId The round ID to check
   * @return The total reward amount for the round
   */
  function getTotalRewards(uint256 roundId) external view override returns (uint256) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    return $.totalRewards[roundId];
  }

  /**
   * @notice Checks if rewards are claimable for a specific round
   * @param roundId The round ID to check
   * @return True if rewards are claimable, false otherwise
   */
  function isRewardClaimable(uint256 roundId) external view override returns (bool) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();

    // Check if the round has ended
    try $.emissions.isCycleEnded(roundId) returns (bool ended) {
      if (!ended) return false;
    } catch {
      return false;
    }

    uint256 roundTotalWeightedActions = $.totalWeightedActions[roundId];
    uint256 roundCompletedWeightedActions = $.completedWeightedActions[roundId];

    return roundCompletedWeightedActions >= roundTotalWeightedActions;
  }

  /**
   * @notice Returns the number of actions performed by a relayer in a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   * @return The number of actions performed by the relayer
   */
  function totalRelayerActions(address relayer, uint256 roundId) external view override returns (uint256) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    return $.relayerActions[roundId][relayer];
  }

  /**
   * @notice Returns the total number of actions required for a round
   * @param roundId The round ID
   * @return The total number of actions required for the round
   */
  function totalActions(uint256 roundId) external view override returns (uint256) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    return $.totalActions[roundId];
  }

  /**
   * @notice Returns the claimable reward amount for a relayer in a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   * @return The claimable reward amount
   */
  function claimableRewards(address relayer, uint256 roundId) external view override returns (uint256) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();

    // Check if rewards are claimable for this round
    if (!this.isRewardClaimable(roundId)) {
      return 0;
    }

    // Check if already claimed
    if ($.claimed[roundId][relayer]) {
      return 0;
    }

    uint256 relayerWeightedActions = $.relayerWeightedActions[roundId][relayer];
    uint256 roundTotalWeightedActions = $.totalWeightedActions[roundId];
    uint256 totalRewards = $.totalRewards[roundId];

    if (relayerWeightedActions == 0 || roundTotalWeightedActions == 0) {
      return 0;
    }

    // Calculate proportional reward based on weighted actions performed
    return (totalRewards * relayerWeightedActions) / roundTotalWeightedActions;
  }

  /**
   * @notice Registers an action performed by a relayer in a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   * @param action The type of action performed (VOTE or CLAIM)
   */
  function registerRelayerAction(
    address relayer,
    uint256 roundId,
    RelayerAction action
  ) external override onlyRelayerRegistrar {
    if (relayer == address(0)) revert InvalidParameter("relayer");

    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();

    // Get weight based on action type
    uint256 weight = action == RelayerAction.VOTE ? $.voteWeight : $.claimWeight;

    // Update action counts
    $.relayerActions[roundId][relayer]++;
    $.relayerWeightedActions[roundId][relayer] += weight;
    $.completedActions[roundId]++;
    $.completedWeightedActions[roundId] += weight;

    emit RelayerActionRegistered(relayer, roundId, $.relayerActions[roundId][relayer], weight);
  }

  /**
   * @notice Sets the total number of actions required for a round
   * @dev This should be called when the round starts based on the number of users with auto-voting enabled
   * @param roundId The round ID
   * @param totalActionsRequired The total number of actions required
   */
  function setTotalActionsForRound(
    uint256 roundId,
    uint256 totalActionsRequired
  ) external override onlyRelayerRegistrar {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    $.totalActions[roundId] = totalActionsRequired;
  }

  /**
   * @notice Sets the total weighted actions required for a round
   * @dev This should be called when the round starts to set expected weighted actions
   * @param roundId The round ID
   * @param totalWeightedActionsRequired The total weighted actions required
   */
  function setTotalWeightedActionsForRound(
    uint256 roundId,
    uint256 totalWeightedActionsRequired
  ) external onlyRelayerRegistrar {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    $.totalWeightedActions[roundId] = totalWeightedActionsRequired;
  }

  /**
   * @notice Returns the total weighted actions performed by a relayer in a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   * @return The total weighted actions performed by the relayer
   */
  function totalRelayerWeightedActions(address relayer, uint256 roundId) external view returns (uint256) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    return $.relayerWeightedActions[roundId][relayer];
  }

  /**
   * @notice Returns the total weighted actions required for a round
   * @param roundId The round ID
   * @return The total weighted actions required for the round
   */
  function totalWeightedActions(uint256 roundId) external view returns (uint256) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    return $.totalWeightedActions[roundId];
  }

  /**
   * @notice Returns the total completed weighted actions for a round
   * @param roundId The round ID
   * @return The total completed weighted actions for the round
   */
  function completedWeightedActions(uint256 roundId) external view returns (uint256) {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();
    return $.completedWeightedActions[roundId];
  }

  /**
   * @notice Allows a relayer to claim their rewards for a specific round
   * @param relayer The relayer address
   * @param roundId The round ID
   */
  function claimRewards(uint256 roundId, address relayer) external override nonReentrant {
    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();

    // Check if the round has ended
    if (!$.emissions.isCycleEnded(roundId)) {
      revert RoundNotEnded(roundId);
    }

    // Check if already claimed
    if ($.claimed[roundId][relayer]) {
      revert RewardsAlreadyClaimed(relayer, roundId);
    }

    // Calculate claimable rewards
    uint256 claimableAmount = this.claimableRewards(relayer, roundId);
    if (claimableAmount == 0) {
      revert NoRewardsToClaim(relayer, roundId);
    }

    // Mark as claimed
    $.claimed[roundId][relayer] = true;

    // Transfer rewards
    if (!$.b3tr.transfer(relayer, claimableAmount)) {
      revert TransferFailed();
    }

    emit RelayerRewardsClaimed(relayer, roundId, claimableAmount);
  }

  /**
   * @notice Deposits B3TR tokens into the pool for a specific round
   * @param amount The amount of B3TR tokens to deposit
   * @param roundId The round ID to deposit for
   */
  function deposit(uint256 amount, uint256 roundId) external override {
    if (amount == 0) revert InvalidParameter("amount");

    RelayerRewardsPoolStorage storage $ = _getRelayerRewardsPoolStorage();

    if (!$.b3tr.transferFrom(msg.sender, address(this), amount)) {
      revert TransferFailed();
    }

    $.totalRewards[roundId] += amount;

    emit RewardsDeposited(roundId, amount, $.totalRewards[roundId]);
  }

  /**
   * @notice Returns the contract version
   * @return The version string
   */
  function version() external pure returns (string memory) {
    return "1";
  }
}
