// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IProofOfParticipation } from "../interfaces/IProofOfParticipation.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

contract ProofOfParticipation is Initializable, AccessControlUpgradeable, IProofOfParticipation {
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");
  bytes32 public constant ACTION_REGISTRAR_ROLE = keccak256("ACTION_REGISTRAR_ROLE");
  bytes32 public constant ACTION_SCORE_MANAGER_ROLE = keccak256("ACTION_SCORE_MANAGER_ROLE");

  /// @notice Action difficulty indicates how hard it is for the user to perform the sustainable action
  /// @dev Action difficulty is used to calculate the overall score of a sustainable action from the app's `baseActionScore`
  enum ACTION_DIFFICULTY {
    EASY,
    MEDIUM,
    HARD
  }

  /// @notice Security level indicates how secure the app is
  /// @dev App security is used to calculate the overall score of a sustainable action
  enum APP_SECURITY {
    LOW,
    MEDIUM,
    HIGH
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  // ---------- Storage ------------ //

  struct ProofOfParticipationStorage {
    // External contracts
    IX2EarnApps x2EarnApps;
    IXAllocationVotingGovernor xAllocationVoting;
    // Multipliers
    mapping(ACTION_DIFFICULTY difficulty => uint256 multiplier) actionDifficultyMultiplier; // Multiplier of the base action score based on the action difficulty
    mapping(APP_SECURITY security => uint256 multiplier) appSecurityMultiplier; // Multiplier of the base action score based on the app security
    // App settings
    mapping(bytes32 appId => APP_SECURITY security) appSecurity; // Security level of an app
    mapping(bytes32 appId => ACTION_DIFFICULTY difficulty) appActionDifficulty; // Action difficulty of an app
    // User scores
    mapping(address user => uint256 totalScore) userTotalScore; // all-time total score of a user
    mapping(address user => mapping(bytes32 appId => uint256 totalScore)) userAppTotalScore; // all-time total score of a user for a specific app
    mapping(address user => mapping(uint256 round => uint256 score)) userRoundScore; // score of a user in a specific round
    mapping(address user => mapping(uint256 round => mapping(bytes32 appId => uint256 score))) userAppRoundScore; // score of a user for a specific app in a specific round
    // Thresholds
    uint256 roundThreshold; // threshold for a user to be considered a person in a round //round threshold can be 0
    uint256 totalThreshold; // threshold for a user to be considered a person in total // total threshold can be 0
    bool isTotalScoreConsidered; // flag to indicate if the total score is considered for a user to be a person
    uint256 roundsForCumulativeScore; // number of rounds to consider for the cumulative score
  }

  // keccak256(abi.encode(uint256(keccak256("storage.ProofOfParticipation")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant ProofOfParticipationStorageLocation =
    0xbe260213d6c64572cce1f1819a6788d452acca94b337419ad1da5de983036200;

  function _getProofOfParticipationStorage() private pure returns (ProofOfParticipationStorage storage $) {
    assembly {
      $.slot := ProofOfParticipationStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __ProofOfParticipation_init(
    address _x2EarnApps,
    IXAllocationVotingGovernor _xAllocationVoting,
    address _actionRegistrar,
    address _actionScoreManager,
    uint256 _roundThreshold,
    uint256 _threshold,
    bool _isTotalScoreConsidered,
    uint256 _roundsForCumulativeScore
  ) internal onlyInitializing {
    __ProofOfParticipation_init_unchained(
      _x2EarnApps,
      _xAllocationVoting,
      _actionRegistrar,
      _actionScoreManager,
      _roundThreshold,
      _threshold,
      _isTotalScoreConsidered,
      _roundsForCumulativeScore
    );
  }

  function __ProofOfParticipation_init_unchained(
    address _x2EarnApps,
    IXAllocationVotingGovernor _xAllocationVoting,
    address _actionRegistrar,
    address _actionScoreManager,
    uint256 _roundThreshold,
    uint256 _threshold,
    bool _isTotalScoreConsidered,
    uint256 _roundsForCumulativeScore
  ) internal onlyInitializing {
    require(_x2EarnApps != address(0), "ProofOfParticipation: x2EarnApps is the zero address");
    require(address(_xAllocationVoting) != address(0), "ProofOfParticipation: xAllocationVoting is the zero address");
    require(_actionRegistrar != address(0), "ProofOfParticipation: actionRegistrar is the zero address");
    require(_actionScoreManager != address(0), "ProofOfParticipation: actionScoreManager is the zero address");

    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    $.x2EarnApps = IX2EarnApps(_x2EarnApps);
    $.xAllocationVoting = _xAllocationVoting;
    $.roundThreshold = _roundThreshold;
    $.totalThreshold = _threshold;
    $.isTotalScoreConsidered = _isTotalScoreConsidered;
    $.roundsForCumulativeScore = _roundsForCumulativeScore;

    _grantRole(ACTION_REGISTRAR_ROLE, _actionRegistrar);
    _grantRole(ACTION_SCORE_MANAGER_ROLE, _actionScoreManager);

    $.actionDifficultyMultiplier[ACTION_DIFFICULTY.EASY] = 1; // Default multiplier for easy actions
    $.actionDifficultyMultiplier[ACTION_DIFFICULTY.MEDIUM] = 2; // Default multiplier for medium actions
    $.actionDifficultyMultiplier[ACTION_DIFFICULTY.HARD] = 3; // Default multiplier for hard actions

    $.roundsForCumulativeScore = _roundsForCumulativeScore; // Default number of rounds to consider for the cumulative score
  }

  // ---------- Modifiers ------------ //

  /**
   * @dev Modifier to restrict access to only the admin role and the app admin role.
   * @param appId the app ID
   */
  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) virtual {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert ProofOfParticipationUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Setters ---------- //

  function registerAction(address user, bytes32 appId) external onlyRole(ACTION_REGISTRAR_ROLE) {
    _registerAction(user, appId, _getProofOfParticipationStorage().xAllocationVoting.currentRoundId());
  }

  function registerActionForRound(address user, bytes32 appId, uint256 round) external onlyRole(ACTION_REGISTRAR_ROLE) {
    _registerAction(user, appId, round);
  }

  /// @notice Registers an action for a user in a round
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  /// @param round - the round of the action
  function _registerAction(address user, bytes32 appId, uint256 round) public virtual {
    require(user != address(0), "ProofOfParticipation: user is the zero address");

    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    require($.x2EarnApps.appExists(appId), "ProofOfParticipation: app does not exist");

    // If the action difficulty is not set, set it to EASY. This is for setting the default action difficulty to an app that has received an action for the first time
    if ($.appActionDifficulty[appId] == ACTION_DIFFICULTY.EASY)
      $.actionDifficultyMultiplier[ACTION_DIFFICULTY.EASY] = 1;
    // If the app security is not set, set it to LOW. This is for setting the default app security to an app that has received an action for the first time
    if ($.appSecurity[appId] == APP_SECURITY.LOW) $.appSecurityMultiplier[APP_SECURITY.LOW] = 1;

    // Calculate the action score, can be max 6
    uint256 actionScore = $.actionDifficultyMultiplier[$.appActionDifficulty[appId]] +
      $.appSecurityMultiplier[$.appSecurity[appId]];

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

  /// @notice Sets if the total score is considered for a user to be a person
  /// @dev The total score considered flag can be modified by the DEFAULT_ADMIN_ROLE
  /// @dev If the total score is considered, the user is considered a person if the user's total score is greater than or equal to the total threshold
  /// @param _isTotalScoreConsidered - the total score considered flag
  function setIsTotalScoreConsidered(bool _isTotalScoreConsidered) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    _getProofOfParticipationStorage().isTotalScoreConsidered = _isTotalScoreConsidered;
  }

  /// @notice Sets the difficulty multiplier for an action difficulty
  /// @param difficulty - the action difficulty between EASY, MEDIUM, HARD
  /// @param multiplier - the multiplier
  function setDifficultyMultiplier(
    ACTION_DIFFICULTY difficulty,
    uint256 multiplier
  ) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    require(multiplier > 0, "ProofOfParticipation: multiplier is zero");

    _getProofOfParticipationStorage().actionDifficultyMultiplier[difficulty] = multiplier;
  }

  /// @notice Sets the round threshold for a user to be considered a person
  /// @param threshold - the round threshold
  function setRoundThreshold(uint256 threshold) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    require(threshold > 0, "ProofOfParticipation: threshold is zero");

    _getProofOfParticipationStorage().roundThreshold = threshold;
  }

  /// @notice Sets the total threshold for a user to be considered a person
  /// @param threshold - the total threshold
  function setTotalThreshold(uint256 threshold) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    require(threshold > 0, "ProofOfParticipation: threshold is zero");

    _getProofOfParticipationStorage().totalThreshold = threshold;
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

    _getProofOfParticipationStorage().appSecurityMultiplier[security] = multiplier;
  }

  /// @dev Sets the action difficulty of an app
  /// @param appId - the app id
  /// @param difficulty - the action difficulty
  function setAppActionDifficulty(
    bytes32 appId,
    ACTION_DIFFICULTY difficulty
  ) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    _getProofOfParticipationStorage().appActionDifficulty[appId] = difficulty;
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

  // ---------- Getters ---------- //

  /// @notice Gets the quadratic cumulative score of a user for a number of last rounds
  /// @param user - the user address
  /// @param lastRound - the round to consider as a starting point for the cumulative score
  function getQuadraticCumulativeScore(address user, uint256 lastRound) public view virtual returns (uint256) {
    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    // Cumulative score of the user
    uint256 cumulativeScore = 0;

    // Factor to calculate the cumulative quadratic score
    uint256 factor = 0;

    // Calculate the cumulative quadratic score for the number of rounds to consider for the cumulative score
    for (uint256 round = lastRound; round >= 1 && round > lastRound - $.roundsForCumulativeScore; round--) {
      uint256 score = $.userRoundScore[user][round];

      // NOTE: the ** operator does not support fractional exponents so we use the Math.sqrt function in a loop to calculate the square root
      for (uint256 i = 0; i < factor; i++) {
        score = Math.sqrt(score);
      }

      cumulativeScore += score;
      factor++;
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
  function userTotalScoreApp(address user, bytes32 appId) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().userAppTotalScore[user][appId];
  }

  /// @notice Gets the round threshold for a user to be considered a person
  function roundThreshold() public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().roundThreshold;
  }

  /// @notice Gets the total threshold for a user to be considered a person
  function totalThreshold() public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().totalThreshold;
  }

  /// @notice Checks if the total score is considered for a user to be a person
  /// @return isTotalScoreConsidered - the total score considered flag
  function isTotalScoreConsidered() public view virtual returns (bool) {
    return _getProofOfParticipationStorage().isTotalScoreConsidered;
  }

  /// @notice Gets the difficulty multiplier for an action difficulty
  /// @param difficulty - the action difficulty between EASY, MEDIUM, HARD
  function difficultyMultiplier(ACTION_DIFFICULTY difficulty) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().actionDifficultyMultiplier[difficulty];
  }

  /// @notice Gets the security multiplier for an app security
  /// @param security - the app security between LOW, MEDIUM, HIGH
  function securityMultiplier(APP_SECURITY security) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().appSecurityMultiplier[security];
  }

  /// @notice Gets the round threshold for a user to be considered a person
  function roundsForCumulativeScore() public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().roundsForCumulativeScore;
  }

  /// @notice Gets the x2EarnApps contract address
  function x2EarnApps() public view virtual returns (IX2EarnApps) {
    return _getProofOfParticipationStorage().x2EarnApps;
  }
}
