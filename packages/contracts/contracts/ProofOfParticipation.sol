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

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { IB3TR } from "./interfaces/IB3TR.sol";
import { IX2EarnApps } from "./interfaces/IX2EarnApps.sol";
import { IX2EarnRewardsPool } from "./interfaces/IX2EarnRewardsPool.sol";
import { IERC1155Receiver } from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IPassportModule } from "./interfaces/IPassportModule.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { IProofOfParticipation } from "./interfaces/IProofOfParticipation.sol";

contract ProofOfParticipation is
  UUPSUpgradeable,
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable,
  IPassportModule,
  IProofOfParticipation
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
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

  /// @custom:storage-location erc7201:b3tr.storage.ProofOfParticipation
  struct ProofOfParticipationStorage {
    // External contracts
    IX2EarnApps x2EarnApps;
    IXAllocationVotingGovernor xAllocationVoting;
    // Base score for an app's sustainable action
    mapping(bytes32 appId => uint256 baseScore) baseActionScore;
    // Multipliers
    mapping(ACTION_DIFFICULTY difficulty => uint256 multiplier) actionDifficultyMultiplier; // Multiplier of the base action score based on the action difficulty
    mapping(bytes32 appId => ACTION_DIFFICULTY difficulty) appActionDifficulty; // Action difficulty of an app
    mapping(APP_SECURITY security => uint256 multiplier) appSecurityMultiplier; // Multiplier of the base action score based on the app security
    mapping(bytes32 appId => APP_SECURITY security) appSecurity; // Security level of an app
    // User scores
    mapping(address user => uint256 totalScore) userTotalScore; // all-time total score of a user
    mapping(address user => mapping(bytes32 appId => uint256 totalScore)) userAppTotalScore; // all-time total score of a user for a specific app
    mapping(address user => mapping(uint256 round => uint256 score)) userRoundScore; // score of a user in a specific round
    mapping(address user => mapping(uint256 round => mapping(bytes32 appId => uint256 score))) userAppRoundScore; // score of a user for a specific app in a specific round
    // Whitelist and blacklist
    mapping(address user => bool) whitelist; // whitelist of users that are valid without any checks
    mapping(address user => bool) blacklist; // blacklist of users that are invalid without any checks
    // Thresholds
    uint256 roundThreshold; // threshold for a user to be considered a person in a round
    uint256 totalThreshold; // threshold for a user to be considered a person in total
    bool isTotalScoreConsidered; // flag to indicate if the total score is considered for a user to be a person
    uint256 roundsForCumulativeScore; // number of rounds to consider for the cumulative score
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.ProofOfParticipation")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant ProofOfParticipationStorageLocation =
    0xc9931bd7ecbba177fc71b0ded00eb01d4035361d4a0ee711add00987aca69000;

  function _getProofOfParticipationStorage() private pure returns (ProofOfParticipationStorage storage $) {
    assembly {
      $.slot := ProofOfParticipationStorageLocation
    }
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  struct InitializationData {
    address admin;
    address contractsManagerAdmin;
    address upgrader;
    address actionRegistrar;
    address actionScoreManager;
    uint256 roundThreshold;
    uint256 threshold;
    bool isTotalScoreConsidered;
    IX2EarnApps x2EarnApps;
    IXAllocationVotingGovernor xAllocationVoting;
    uint256 roundsForCumulativeScore;
  }

  /// @notice Initializes the contract
  function initialize(InitializationData memory data) external initializer {
    require(data.admin != address(0), "ProofOfParticipation: admin is the zero address");
    require(
      data.contractsManagerAdmin != address(0),
      "ProofOfParticipation: contracts manager admin is the zero address"
    );
    require(data.upgrader != address(0), "ProofOfParticipation: upgrader is the zero address");
    require(address(data.x2EarnApps) != address(0), "ProofOfParticipation: x2EarnApps is the zero address");
    require(data.roundThreshold > 0, "ProofOfParticipation: round threshold is zero");
    require(data.threshold > 0, "ProofOfParticipation: threshold is zero");

    __UUPSUpgradeable_init();
    __AccessControl_init();
    __ReentrancyGuard_init();

    _grantRole(DEFAULT_ADMIN_ROLE, data.admin);
    _grantRole(UPGRADER_ROLE, data.upgrader);
    _grantRole(CONTRACTS_ADDRESS_MANAGER_ROLE, data.contractsManagerAdmin);

    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    $.x2EarnApps = data.x2EarnApps;
    $.xAllocationVoting = data.xAllocationVoting;
    $.roundThreshold = data.roundThreshold;
    $.totalThreshold = data.threshold;
    $.isTotalScoreConsidered = data.isTotalScoreConsidered;

    _grantRole(ACTION_REGISTRAR_ROLE, data.actionRegistrar);
    _grantRole(ACTION_SCORE_MANAGER_ROLE, data.actionScoreManager);

    $.actionDifficultyMultiplier[ACTION_DIFFICULTY.EASY] = 1; // Default multiplier for easy actions
    $.actionDifficultyMultiplier[ACTION_DIFFICULTY.MEDIUM] = 2; // Default multiplier for medium actions
    $.actionDifficultyMultiplier[ACTION_DIFFICULTY.HARD] = 3; // Default multiplier for hard actions

    $.roundsForCumulativeScore = data.roundsForCumulativeScore; // Default number of rounds to consider for the cumulative score
  }

  // ---------- Modifiers ---------- //

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert ProofOfParticipationUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Authorizers ---------- //

  /// @notice Authorizes the upgrade of the contract
  /// @param newImplementation - the new implementation address
  function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

  // ---------- Setters ---------- //

  /// @notice Registers an action for a user in a round
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  /// @param round - the round of the action
  function registerAction(address user, bytes32 appId, uint256 round) public virtual onlyRole(ACTION_REGISTRAR_ROLE) {
    require(user != address(0), "ProofOfParticipation: user is the zero address");

    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    require($.x2EarnApps.appExists(appId), "ProofOfParticipation: app does not exist");
    require($.xAllocationVoting.currentRoundId() >= round && round > 0, "ProofOfParticipation: wrong round");
    require(!$.blacklist[user], "ProofOfParticipation: user is blacklisted");

    // If the base action score is not set, set it to 1. This is for setting the default base action score to an app that has received an action for the first time
    if ($.baseActionScore[appId] == 0) $.baseActionScore[appId] = 1;
    // If the action difficulty is not set, set it to EASY. This is for setting the default action difficulty to an app that has received an action for the first time
    if ($.appActionDifficulty[appId] == ACTION_DIFFICULTY.EASY)
      $.actionDifficultyMultiplier[ACTION_DIFFICULTY.EASY] = 1;
    // If the app security is not set, set it to LOW. This is for setting the default app security to an app that has received an action for the first time
    if ($.appSecurity[appId] == APP_SECURITY.LOW) $.appSecurityMultiplier[APP_SECURITY.LOW] = 1;

    // Calculate the action score by multiplying the base action score with the action difficulty multiplier and the app security multiplier
    uint256 actionScore = $.baseActionScore[appId] *
      $.actionDifficultyMultiplier[$.appActionDifficulty[appId]] *
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

  /// @notice Sets the base action score for an app
  /// @dev The base action score is the score of an action that is considered as the base for calculating the overall score of a sustainable action
  /// @dev The base action score can be modified by the ACTION_SCORE_MANAGER_ROLE or the DEFAULT_ADMIN_ROLE
  /// @param appId - the app id
  /// @param baseActionScore - the base action score
  function setBaseActionScore(
    bytes32 appId,
    uint256 baseActionScore
  ) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    require(baseActionScore > 0, "ProofOfParticipation: baseActionScore is zero");

    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();

    require($.x2EarnApps.appExists(appId), "ProofOfParticipation: app does not exist");

    $.baseActionScore[appId] = baseActionScore;
  }

  /// @notice Sets the whitelisted status of a user
  /// @dev The whitelisted status of a user can be modified by the DEFAULT_ADMIN_ROLE
  /// @dev A whitelisted user is considered as a person without any checks
  /// @param user - the user address
  /// @param isWhitelisted - the whitelisted status
  function setWhitelistedUser(address user, bool isWhitelisted) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    require(user != address(0), "ProofOfParticipation: user is the zero address");

    _getProofOfParticipationStorage().whitelist[user] = isWhitelisted;
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

  // TODO: set security multiplier

  // TODO: update app difficulty and app security

  // TODO: blacklist user

  // ---------- Getters ---------- //

  /// @notice Checks if a user is a person in a round
  /// @param user - the user address
  /// @param round - the round
  /// @return isPerson - the flag indicating if the user is a person
  /// @return message - the message indicating if the user is a person
  function isPerson(address user, uint256 round) public view virtual returns (bool, string memory) {
    // If the user is whitelisted, the user is considered as a person
    if (isWhiteListed(user)) return (true, "User is whitelisted");

    // If the user's cumulated quadratic score in the round is greater than or equal to the round threshold, the user is considered as a person
    if (getQuadraticCumulativeScore(user, round) >= getRoundThreshold())
      return (true, "User is a person in this round");

    // If the total score is considered for personhood and the user's total score is greater than or equal to the total threshold, the user is considered as a person
    if (isTotalScoreConsidered() && getUserTotalScore(user) >= getTotalThreshold())
      return (true, "User is a person in total");

    // Otherwise, the user is not considered as a person
    return (false, "User is not a person");
  }

  function getScore(address _user) external view override returns (uint256) {
    ProofOfParticipationStorage storage $ = _getProofOfParticipationStorage();
    return getQuadraticCumulativeScore(_user, $.xAllocationVoting.currentRoundId());
  }

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

  /// @notice Checks if a user is whitelisted
  /// @param user - the user address
  function isWhiteListed(address user) public view virtual returns (bool) {
    return _getProofOfParticipationStorage().whitelist[user];
  }

  /// @notice Checks if the total score is considered for a user to be a person
  /// @return isTotalScoreConsidered - the total score considered flag
  function isTotalScoreConsidered() public view virtual returns (bool) {
    return _getProofOfParticipationStorage().isTotalScoreConsidered;
  }

  /// @notice Gets the round score of a user
  /// @param user - the user address
  /// @param round - the round
  function getUserRoundScore(address user, uint256 round) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().userRoundScore[user][round];
  }

  /// @notice Gets the total score of a user
  /// @param user - the user address
  function getUserTotalScore(address user) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().userTotalScore[user];
  }

  /// @notice Gets the round threshold for a user to be considered a person
  function getRoundThreshold() public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().roundThreshold;
  }

  /// @notice Gets the total threshold for a user to be considered a person
  function getTotalThreshold() public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().totalThreshold;
  }

  /// @notice Gets the score of a user for an app in a round
  /// @param user - the user address
  /// @param round - the round
  /// @param appId - the app id
  function getUserRoundScoreApp(address user, uint256 round, bytes32 appId) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().userAppRoundScore[user][round][appId];
  }

  /// @notice Gets the total score of a user for an app
  /// @param user - the user address
  /// @param appId - the app id
  function getUserTotalScoreApp(address user, bytes32 appId) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().userAppTotalScore[user][appId];
  }

  /// @notice Gets the difficulty multiplier for an action difficulty
  /// @param difficulty - the action difficulty between EASY, MEDIUM, HARD
  function getDifficultyMultiplier(ACTION_DIFFICULTY difficulty) public view virtual returns (uint256) {
    return _getProofOfParticipationStorage().actionDifficultyMultiplier[difficulty];
  }
}
