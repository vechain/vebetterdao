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

contract ProofOfPersonhood is UUPSUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
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

  /// @custom:storage-location erc7201:b3tr.storage.ProofOfPersonhood
  struct ProofOfPersonhoodStorage {
    IX2EarnApps x2EarnApps;
    mapping(bytes32 appId => uint256 baseScore) baseActionScore; // Base score for an app's sustainable action
    mapping(ACTION_DIFFICULTY difficulty => uint256 multiplier) actionDifficultyMultiplier; // Multiplier of the base action score based on the action difficulty
    mapping(address user => uint256 totalScore) userTotalScore; // all-time total score of a user
    mapping(address user => mapping(bytes32 appId => uint256 totalScore)) userAppTotalScore; // all-time total score of a user for a specific app
    mapping(address user => mapping(uint256 round => uint256 score)) userRoundScore; // score of a user in a specific round
    mapping(address user => mapping(uint256 round => mapping(bytes32 appId => uint256 score))) userAppRoundScore; // score of a user for a specific app in a specific round
    mapping(address user => bool) whitelist; // whitelist of users that are valid without any checks
    mapping(address user => bool) blacklist; // blacklist of users that are invalid without any checks
    uint256 roundThreshold; // threshold for a user to be considered a person in a round
    uint256 totalThreshold; // threshold for a user to be considered a person in total
    bool isTotalScoreConsidered; // flag to indicate if the total score is considered for a user to be a person
    uint256 roundsForCumulativeScore; // number of rounds to consider for the cumulative score
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.ProofOfPersonhood")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant ProofOfPersonhoodStorageLocation =
    0x562263107a1e976e9702432b2a9ec9bf8e9dd832561ba7545f0d5824f7628f00;

  function _getProofOfPersonhoodStorage() private pure returns (ProofOfPersonhoodStorage storage $) {
    assembly {
      $.slot := ProofOfPersonhoodStorageLocation
    }
  }

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert ProofOfPersonhoodUnauthorizedUser(msg.sender);
    }
    _;
  }

  /// @notice Emitted when a user registers an action
  /// @param user - the user that registered the action
  /// @param appId - the app id of the action
  /// @param round - the round of the action
  /// @param actionScore - the score of the action
  event RegisteredAction(address indexed user, bytes32 indexed appId, uint256 indexed round, uint256 actionScore);

  /// @notice Emitted when a user is not authorized to perform an action
  error ProofOfPersonhoodUnauthorizedUser(address user);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @notice Initializes the contract
  /// @param _admin - the admin of the contract
  /// @param _contractsManagerAdmin - the admin of the contracts manager
  /// @param _upgrader - the upgrader of the contract
  /// @param _actionRegistrar - the registrar of the actions
  /// @param _actionScoreManager - the action score manager
  /// @param _roundThreshold - the threshold for a user to be considered a person in a round
  /// @param _threshold - the threshold for a user to be considered a person in total
  /// @param _isTotalScoreConsidered - flag to indicate if the total score is considered for a user to be a person
  /// @param _x2EarnApps - the x2EarnApps contract address
  function initialize(
    address _admin,
    address _contractsManagerAdmin,
    address _upgrader,
    address _actionRegistrar,
    address _actionScoreManager,
    uint256 _roundThreshold,
    uint256 _threshold,
    bool _isTotalScoreConsidered,
    IX2EarnApps _x2EarnApps
  ) external initializer {
    require(_admin != address(0), "ProofOfPersonhood: admin is the zero address");
    require(_contractsManagerAdmin != address(0), "ProofOfPersonhood: contracts manager admin is the zero address");
    require(_upgrader != address(0), "ProofOfPersonhood: upgrader is the zero address");
    require(address(_x2EarnApps) != address(0), "ProofOfPersonhood: x2EarnApps is the zero address");
    require(_roundThreshold > 0, "ProofOfPersonhood: round threshold is zero");
    require(_threshold > 0, "ProofOfPersonhood: threshold is zero");

    __UUPSUpgradeable_init();
    __AccessControl_init();
    __ReentrancyGuard_init();

    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(UPGRADER_ROLE, _upgrader);
    _grantRole(CONTRACTS_ADDRESS_MANAGER_ROLE, _contractsManagerAdmin);

    ProofOfPersonhoodStorage storage $ = _getProofOfPersonhoodStorage();

    $.x2EarnApps = _x2EarnApps;
    $.roundThreshold = _roundThreshold;
    $.totalThreshold = _threshold;
    $.isTotalScoreConsidered = _isTotalScoreConsidered;

    _grantRole(ACTION_REGISTRAR_ROLE, _actionRegistrar);
    _grantRole(ACTION_SCORE_MANAGER_ROLE, _actionScoreManager);

    $.actionDifficultyMultiplier[ACTION_DIFFICULTY.EASY] = 1; // Default multiplier for easy actions
    $.actionDifficultyMultiplier[ACTION_DIFFICULTY.MEDIUM] = 2; // Default multiplier for medium actions
    $.actionDifficultyMultiplier[ACTION_DIFFICULTY.HARD] = 3; // Default multiplier for hard actions

    $.roundsForCumulativeScore = 3; // Default number of rounds to consider for the cumulative score
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
  /// @param actionDifficulty - the difficulty of the action between EASY, MEDIUM, HARD
  function registerAction(
    address user,
    bytes32 appId,
    uint256 round,
    ACTION_DIFFICULTY actionDifficulty
  ) public virtual onlyRole(ACTION_REGISTRAR_ROLE) {
    require(user != address(0), "ProofOfPersonhood: user is the zero address");

    ProofOfPersonhoodStorage storage $ = _getProofOfPersonhoodStorage();

    require($.x2EarnApps.appExists(appId), "ProofOfPersonhood: app does not exist");

    // If the base action score is not set, set it to 1. This is for setting the default base action score to an app that has received an action for the first time
    if ($.baseActionScore[appId] == 0) $.baseActionScore[appId] = 1;

    // Calculate the action score by multiplying the base action score with the action difficulty multiplier
    uint256 actionScore = $.baseActionScore[appId] * $.actionDifficultyMultiplier[actionDifficulty];

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
    require(baseActionScore > 0, "ProofOfPersonhood: baseActionScore is zero");

    ProofOfPersonhoodStorage storage $ = _getProofOfPersonhoodStorage();

    require($.x2EarnApps.appExists(appId), "ProofOfPersonhood: app does not exist");

    $.baseActionScore[appId] = baseActionScore;
  }

  /// @notice Sets the whitelisted status of a user
  /// @dev The whitelisted status of a user can be modified by the DEFAULT_ADMIN_ROLE
  /// @dev A whitelisted user is considered as a person without any checks
  /// @param user - the user address
  /// @param isWhitelisted - the whitelisted status
  function setWhitelistedUser(address user, bool isWhitelisted) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    require(user != address(0), "ProofOfPersonhood: user is the zero address");

    _getProofOfPersonhoodStorage().whitelist[user] = isWhitelisted;
  }

  /// @notice Sets the X2EarnApps contract address
  /// @dev The X2EarnApps contract address can be modified by the CONTRACTS_ADDRESS_MANAGER_ROLE
  /// @param _x2EarnApps - the X2EarnApps contract address
  function setX2EarnApps(IX2EarnApps _x2EarnApps) public virtual onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    require(address(_x2EarnApps) != address(0), "ProofOfPersonhood: x2EarnApps is the zero address");

    _getProofOfPersonhoodStorage().x2EarnApps = _x2EarnApps;
  }

  /// @notice Sets if the total score is considered for a user to be a person
  /// @dev The total score considered flag can be modified by the DEFAULT_ADMIN_ROLE
  /// @dev If the total score is considered, the user is considered a person if the user's total score is greater than or equal to the total threshold
  /// @param _isTotalScoreConsidered - the total score considered flag
  function setIsTotalScoreConsidered(bool _isTotalScoreConsidered) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    _getProofOfPersonhoodStorage().isTotalScoreConsidered = _isTotalScoreConsidered;
  }

  /// @notice Sets the difficulty multiplier for an action difficulty
  /// @param difficulty - the action difficulty between EASY, MEDIUM, HARD
  /// @param multiplier - the multiplier
  function setDifficultyMultiplier(
    ACTION_DIFFICULTY difficulty,
    uint256 multiplier
  ) public virtual onlyRoleOrAdmin(ACTION_SCORE_MANAGER_ROLE) {
    require(multiplier > 0, "ProofOfPersonhood: multiplier is zero");

    _getProofOfPersonhoodStorage().actionDifficultyMultiplier[difficulty] = multiplier;
  }

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

  /// @notice Gets the quadratic cumulative score of a user for a number of last rounds
  /// @param user - the user address
  /// @param currentRound - the round
  function getQuadraticCumulativeScore(address user, uint256 currentRound) public view virtual returns (uint256) {
    ProofOfPersonhoodStorage storage $ = _getProofOfPersonhoodStorage();

    // Cumulative score of the user
    uint256 cumulativeScore = 0;

    // Factor to calculate the cumulative quadratic score
    uint256 factor = 0;

    // Calculate the cumulative quadratic score for the number of rounds to consider for the cumulative score
    for (uint256 round = currentRound; round >= 1 && round > currentRound - $.roundsForCumulativeScore; round--) {
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
    return _getProofOfPersonhoodStorage().whitelist[user];
  }

  /// @notice Checks if the total score is considered for a user to be a person
  /// @return isTotalScoreConsidered - the total score considered flag
  function isTotalScoreConsidered() public view virtual returns (bool) {
    return _getProofOfPersonhoodStorage().isTotalScoreConsidered;
  }

  /// @notice Gets the round score of a user
  /// @param user - the user address
  /// @param round - the round
  function getUserRoundScore(address user, uint256 round) public view virtual returns (uint256) {
    return _getProofOfPersonhoodStorage().userRoundScore[user][round];
  }

  /// @notice Gets the total score of a user
  /// @param user - the user address
  function getUserTotalScore(address user) public view virtual returns (uint256) {
    return _getProofOfPersonhoodStorage().userTotalScore[user];
  }

  /// @notice Gets the round threshold for a user to be considered a person
  function getRoundThreshold() public view virtual returns (uint256) {
    return _getProofOfPersonhoodStorage().roundThreshold;
  }

  /// @notice Gets the total threshold for a user to be considered a person
  function getTotalThreshold() public view virtual returns (uint256) {
    return _getProofOfPersonhoodStorage().totalThreshold;
  }

  /// @notice Gets the score of a user for an app in a round
  /// @param user - the user address
  /// @param round - the round
  /// @param appId - the app id
  function getUserRoundScoreApp(address user, uint256 round, bytes32 appId) public view virtual returns (uint256) {
    return _getProofOfPersonhoodStorage().userAppRoundScore[user][round][appId];
  }

  /// @notice Gets the total score of a user for an app
  /// @param user - the user address
  /// @param appId - the app id
  function getUserTotalScoreApp(address user, bytes32 appId) public view virtual returns (uint256) {
    return _getProofOfPersonhoodStorage().userAppTotalScore[user][appId];
  }

  /// @notice Gets the difficulty multiplier for an action difficulty
  /// @param difficulty - the action difficulty between EASY, MEDIUM, HARD
  function getDifficultyMultiplier(ACTION_DIFFICULTY difficulty) public view virtual returns (uint256) {
    return _getProofOfPersonhoodStorage().actionDifficultyMultiplier[difficulty];
  }
}
