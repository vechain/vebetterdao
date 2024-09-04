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

  /// @notice Security level indicates how secure the app is
  /// @dev App security is used to calculate the overall score of a sustainable action
  enum APP_SECURITY {
    NONE,
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
    mapping(APP_SECURITY security => uint256 multiplier) securityMultiplier; // Multiplier of the base action score based on the app security
    // App settings
    mapping(bytes32 appId => APP_SECURITY security) appSecurity; // Security level of an app
    // User scores
    mapping(address user => uint256 totalScore) userTotalScore; // all-time total score of a user
    mapping(address user => mapping(bytes32 appId => uint256 totalScore)) userAppTotalScore; // all-time total score of a user for a specific app
    mapping(address user => mapping(uint256 round => uint256 score)) userRoundScore; // score of a user in a specific round
    mapping(address user => mapping(uint256 round => mapping(bytes32 appId => uint256 score))) userAppRoundScore; // score of a user for a specific app in a specific round
    // Thresholds
    uint256 threshold; // threshold for a user to be considered a person in a round //threshold can be 0
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
    address _x2EarnApps,
    IXAllocationVotingGovernor _xAllocationVoting,
    address _actionRegistrar,
    address _actionScoreManager,
    uint256 _threshold,
    uint256 _roundsForCumulativeScore
  ) internal onlyInitializing {
    require(_x2EarnApps != address(0), "ProofOfParticipation: x2EarnApps is the zero address");
    require(address(_xAllocationVoting) != address(0), "ProofOfParticipation: xAllocationVoting is the zero address");
    require(_actionRegistrar != address(0), "ProofOfParticipation: actionRegistrar is the zero address");
    require(_actionScoreManager != address(0), "ProofOfParticipation: actionScoreManager is the zero address");

    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    $.x2EarnApps = IX2EarnApps(_x2EarnApps);
    $.xAllocationVoting = _xAllocationVoting;
    $.threshold = _threshold;
    $.roundsForCumulativeScore = _roundsForCumulativeScore;

    _grantRole(ACTION_REGISTRAR_ROLE, _actionRegistrar);
    _grantRole(ACTION_SCORE_MANAGER_ROLE, _actionScoreManager);

    $.securityMultiplier[APP_SECURITY.NONE] = 0;
    $.securityMultiplier[APP_SECURITY.LOW] = 1;
    $.securityMultiplier[APP_SECURITY.MEDIUM] = 3;
    $.securityMultiplier[APP_SECURITY.HIGH] = 6;

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

    // If the app security is not set, set it to LOW. This is for setting the default app security to an app that has received an action for the first time
    if ($.appSecurity[appId] == APP_SECURITY.LOW) $.securityMultiplier[APP_SECURITY.LOW] = 1;

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
}
