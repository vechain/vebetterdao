// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IProofOfParticipation } from "../interfaces/IProofOfParticipation.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title ProofOfParticipation
/// @notice This contract is used to track the actions of users in the VeBetterDAO ecosystem.
/// The contract calculates the score of a user based on the actions performed by him inside
/// a specific range of rounds. The score is used to determine the personhood of a user.
/// The score is calculated based on the security level of the app and the number of actions performed.
/// The score is decayed over time to prevent users from performing actions only in the last rounds.
contract ProofOfParticipation is Initializable, AccessControlUpgradeable, IProofOfParticipation {
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");
  bytes32 public constant ACTION_REGISTRAR_ROLE = keccak256("ACTION_REGISTRAR_ROLE");
  bytes32 public constant ACTION_SCORE_MANAGER_ROLE = keccak256("ACTION_SCORE_MANAGER_ROLE");

  // Scaling factor for the exponential decay
  uint256 private constant scalingFactor = 1e18;

  /// @notice Security level indicates how secure the app is
  /// @dev App security is used to calculate the overall score of a sustainable action
  enum APP_SECURITY {
    UNDEFINED, // For new apps that have not been set yet
    NONE,
    LOW,
    MEDIUM,
    HIGH
  }

  // ---------- Storage ------------ //

  struct ProofOfParticipationStorage {
    // External contracts
    IX2EarnApps x2EarnApps;
    IXAllocationVotingGovernor xAllocationVoting;
    // Multipliers
    mapping(APP_SECURITY security => uint256 multiplier) securityMultiplier; // Multiplier of the base action score based on the app security
    // Security level of an app
    mapping(bytes32 appId => APP_SECURITY security) appSecurity; // Will be UNDEFINED and set to LOW by default
    // User scores
    mapping(address user => uint256 totalScore) userTotalScore; // all-time total score of a user
    mapping(address user => mapping(bytes32 appId => uint256 totalScore)) userAppTotalScore; // all-time total score of a user for a specific app
    mapping(address user => mapping(uint256 round => uint256 score)) userRoundScore; // score of a user in a specific round
    mapping(address user => mapping(uint256 round => mapping(bytes32 appId => uint256 score))) userAppRoundScore; // score of a user for a specific app in a specific round
    // Thresholds
    uint256 threshold; // threshold for a user to be considered a person in a round //threshold can be 0
    uint256 roundsForCumulativeScore; // number of rounds to consider for the cumulative score
    // Decay
    uint256 decayRate; // decay rate for the exponential decay
  }

  // keccak256(abi.encode(uint256(keccak256("storage.ProofOfParticipation")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant ProofOfParticipationStorageLocation =
    0xbe260213d6c64572cce1f1819a6788d452acca94b337419ad1da5de983036200;

  function _getProofOfParticipationStorage() private pure returns (ProofOfParticipationStorage storage $) {
    assembly {
      $.slot := ProofOfParticipationStorageLocation
    }
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Initializes the contract
   */
  function __ProofOfParticipation_init(
    IX2EarnApps _x2EarnApps,
    IXAllocationVotingGovernor _xAllocationVoting,
    address _actionRegistrar,
    address _actionScoreManager,
    uint256 _threshold,
    uint256 _roundsForCumulativeScore
  ) internal onlyInitializing {
    __ProofOfParticipation_init_unchained(
      _x2EarnApps,
      _xAllocationVoting,
      _actionRegistrar,
      _actionScoreManager,
      _threshold,
      _roundsForCumulativeScore
    );
  }

  function __ProofOfParticipation_init_unchained(
    IX2EarnApps _x2EarnApps,
    IXAllocationVotingGovernor _xAllocationVoting,
    address _actionRegistrar,
    address _actionScoreManager,
    uint256 _threshold,
    uint256 _roundsForCumulativeScore
  ) internal onlyInitializing {
    require(address(_x2EarnApps) != address(0), "ProofOfParticipation: x2EarnApps is the zero address");
    require(address(_xAllocationVoting) != address(0), "ProofOfParticipation: xAllocationVoting is the zero address");
    require(_actionRegistrar != address(0), "ProofOfParticipation: actionRegistrar is the zero address");
    require(_actionScoreManager != address(0), "ProofOfParticipation: actionScoreManager is the zero address");

    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    $.x2EarnApps = _x2EarnApps;
    $.xAllocationVoting = _xAllocationVoting;
    $.threshold = _threshold;
    $.roundsForCumulativeScore = _roundsForCumulativeScore;

    _grantRole(ACTION_REGISTRAR_ROLE, _actionRegistrar);
    _grantRole(ACTION_SCORE_MANAGER_ROLE, _actionScoreManager);

    $.securityMultiplier[APP_SECURITY.UNDEFINED] = 0;
    $.securityMultiplier[APP_SECURITY.NONE] = 0;
    $.securityMultiplier[APP_SECURITY.LOW] = 100;
    $.securityMultiplier[APP_SECURITY.MEDIUM] = 300;
    $.securityMultiplier[APP_SECURITY.HIGH] = 600;

    $.decayRate = 20; // 20% decay rate

    $.roundsForCumulativeScore = _roundsForCumulativeScore; // Default number of rounds to consider for the cumulative score
  }

  // ---------- Modifiers ------------ //

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) virtual {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert ProofOfParticipationUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Getters ---------- //
  /// @notice Gets the cumulative score of a user based on exponential decay for a number of last rounds
  /// This function calculates the decayed score f(t) = a * (1 - r)^t
  /// @param user - the user address
  /// @param lastRound - the round to consider as a starting point for the cumulative score
  function getCumulativeScoreWithDecay(address user, uint256 lastRound) public view virtual returns (uint256) {
    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    // Calculate the starting round for the cumulative score. If the last round is less than the rounds for cumulative score, start from the first round
    uint256 startingRound = lastRound <= $.roundsForCumulativeScore ? 1 : lastRound - $.roundsForCumulativeScore + 1;

    uint256 decayFactor = ((100 - $.decayRate) * scalingFactor) / 100;

    // Calculate the cumulative score with exponential decay
    uint256 cumulativeScore = 0;
    for (uint256 round = startingRound; round <= lastRound; round++) {
      cumulativeScore = $.userRoundScore[user][round] + (cumulativeScore * decayFactor) / scalingFactor;
    }

    return cumulativeScore;
  }

  /// @notice Gets the round score of a user
  /// @param user - the user address
  /// @param round - the round
  function userRoundScore(address user, uint256 round) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().userRoundScore[user][round];
  }

  /// @notice Gets the total score of a user
  /// @param user - the user address
  function userTotalScore(address user) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().userTotalScore[user];
  }

  /// @notice Gets the score of a user for an app in a round
  /// @param user - the user address
  /// @param round - the round
  /// @param appId - the app id
  function userRoundScoreApp(address user, uint256 round, bytes32 appId) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().userAppRoundScore[user][round][appId];
  }

  /// @notice Gets the total score of a user for an app
  /// @param user - the user address
  /// @param appId - the app id
  function userAppTotalScore(address user, bytes32 appId) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().userAppTotalScore[user][appId];
  }

  /// @notice Gets the threshold for a user to be considered a person
  function thresholdParticipationScore() public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().threshold;
  }

  /// @notice Gets the security multiplier for an app security
  /// @param security - the app security between LOW, MEDIUM, HIGH
  function securityMultiplier(APP_SECURITY security) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().securityMultiplier[security];
  }

  /// @notice Gets the security level of an app
  /// @param appId - the app id
  function appSecurity(bytes32 appId) public view virtual returns (APP_SECURITY) {
    return _getProofOfParticipationStorage().appSecurity[appId];
  }

  /// @notice Gets the round threshold for a user to be considered a person
  function roundsForCumulativeScore() public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().roundsForCumulativeScore;
  }

  /// @notice Gets the x2EarnApps contract address
  function x2EarnApps() public view virtual returns (IX2EarnApps) {
    return _getProofOfParticipationStorage().x2EarnApps;
  }

  // ---------- Setters ---------- //

  /// @notice Registers an action for a user
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  function registerAction(address user, bytes32 appId) external onlyRole(ACTION_REGISTRAR_ROLE) {
    _registerAction(user, appId, _getProofOfParticipationStorage().xAllocationVoting.currentRoundId());
  }

  /// @notice Registers an action for a user in a round
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  /// @param round - the round id of the action
  function registerActionForRound(address user, bytes32 appId, uint256 round) external onlyRole(ACTION_REGISTRAR_ROLE) {
    _registerAction(user, appId, round);
  }

  /// @notice Registers an action for a user in a round
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  /// @param round - the round id of the action
  function _registerAction(address user, bytes32 appId, uint256 round) public virtual {
    require(user != address(0), "ProofOfParticipation: user is the zero address");

    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    require($.x2EarnApps.appExists(appId), "ProofOfParticipation: app does not exist");

    // If app was just added and the security level is not set, set it to LOW by default
    if ($.appSecurity[appId] == APP_SECURITY.UNDEFINED) {
      $.appSecurity[appId] = APP_SECURITY.LOW;
    }

    // Calculate the action score, can be min 0, max 6
    uint256 actionScore = $.securityMultiplier[$.appSecurity[appId]];

    // Update the user's score for the round
    $.userRoundScore[user][round] += actionScore;
    // Update the user's total score
    $.userTotalScore[user] += actionScore;
    // Update the user's score for the app in the round
    $.userAppRoundScore[user][round][appId] += actionScore;
    // Update the user's total score for the app
    $.userAppTotalScore[user][appId] += actionScore;

    emit RegisteredAction(user, appId, round, actionScore);
  }

  /// @notice Sets the X2EarnApps contract address
  /// @dev The X2EarnApps contract address can be modified by the CONTRACTS_ADDRESS_MANAGER_ROLE
  /// @param _x2EarnApps - the X2EarnApps contract address
  function setX2EarnApps(IX2EarnApps _x2EarnApps) public virtual onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    require(address(_x2EarnApps) != address(0), "ProofOfParticipation: x2EarnApps is the zero address");

    _getProofOfParticipationStorage().x2EarnApps = _x2EarnApps;
  }

  /// @notice Sets the threshold for a user to be considered a person
  /// @param threshold - the round threshold
  function setThreshold(uint256 threshold) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    require(threshold > 0, "ProofOfParticipation: threshold is zero");

    _getProofOfParticipationStorage().threshold = threshold;
  }

  /// @notice Sets the number of rounds to consider for the cumulative score
  /// @param rounds - the number of rounds
  function setRoundsForCumulativeScore(uint256 rounds) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    require(rounds > 0, "ProofOfParticipation: rounds is zero");

    _getProofOfParticipationStorage().roundsForCumulativeScore = rounds;
  }

  /// @notice Sets the  security multiplier
  /// @param security - the app security between LOW, MEDIUM, HIGH
  /// @param multiplier - the multiplier
  function setSecurityMultiplier(
    APP_SECURITY security,
    uint256 multiplier
  ) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    require(multiplier > 0, "ProofOfParticipation: multiplier is zero");

    _getProofOfParticipationStorage().securityMultiplier[security] = multiplier;
  }

  /// @dev Sets the security level of an app
  /// @param appId - the app id
  /// @param security  - the security level
  function setAppSecurity(
    bytes32 appId,
    APP_SECURITY security
  ) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    _getProofOfParticipationStorage().appSecurity[appId] = security;
  }

  /// @notice Sets the decay rate for the exponential decay
  /// @param decayRate - the decay rate
  function setDecayRate(uint256 decayRate) public virtual onlyRoleOrAdmin(DEFAULT_ADMIN_ROLE) {
    require(decayRate > 0, "ProofOfParticipation: decay rate is zero");

    _getProofOfParticipationStorage().decayRate = decayRate;
  }
}
