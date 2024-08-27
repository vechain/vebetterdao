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
import { IProofOfSustainability } from "./interfaces/IProofOfSustainability.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";

contract ProofOfSustainability is
  UUPSUpgradeable,
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable,
  IProofOfSustainability,
  IPassportModule
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");
  bytes32 public constant ACTION_REGISTRAR_ROLE = keccak256("ACTION_REGISTRAR_ROLE");
  bytes32 public constant ACTION_SCORE_MANAGER_ROLE = keccak256("ACTION_SCORE_MANAGER_ROLE");

  uint256 public constant CARBON_WEIGHT = 1000;
  uint256 public constant WATER_WEIGHT = 10;
  uint256 public constant WASTE_MASS_WEIGHT = 500;
  uint256 public constant ENERGY_WEIGHT = 100;
  uint256 public constant LEARNING_TIME_WEIGHT = 1;
  uint256 public constant TIMBER_WEIGHT = 1;
  uint256 public constant PLASTIC_WEIGHT = 1;
  uint256 public constant TREES_PLANTED_WEIGHT = 100;

  /// @custom:storage-location erc7201:b3tr.storage.ProofOfSustainability
  struct ProofOfSustainablityStorage {
    IX2EarnApps x2EarnApps;
    IXAllocationVotingGovernor xAllocationVoting;
    mapping(bytes32 appId => uint256 baseScore) baseActionScore; // Base score for an app's sustainable action
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

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.ProofOfSustainability")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant ProofOfSustainablityStorageLocation =
    0xe614f0865544369f02c9d8b69468a3c9362aebea4a45c4410b6d66cbe0685100;

  function _getProofOfSustainabilityStorage() private pure returns (ProofOfSustainablityStorage storage $) {
    assembly {
      $.slot := ProofOfSustainablityStorageLocation
    }
  }

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert ProofOfSustainabilityUnauthorizedUser(msg.sender);
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
  error ProofOfSustainabilityUnauthorizedUser(address user);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @param admin - the admin of the contract
  /// @param contractsManagerAdmin - the admin of the contracts manager
  /// @param upgrader - the upgrader of the contract
  /// @param actionRegistrar - the registrar of the actions
  /// @param actionScoreManager - the action score manager
  /// @param roundThreshold - the threshold for a user to be considered a person in a round
  /// @param threshold - the threshold for a user to be considered a person in total
  /// @param isTotalScoreConsidered - flag to indicate if the total score is considered for a user to be a person
  /// @param x2EarnApps - the x2EarnApps contract address
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
    uint256 roundsForCumulativeScore;
    IXAllocationVotingGovernor xAllocationVoting;
  }

  /// @notice Initializes the contract
  function initialize(InitializationData memory data) external initializer {
    require(data.admin != address(0), "ProofOfSustainability: admin is the zero address");
    require(
      data.contractsManagerAdmin != address(0),
      "ProofOfSustainability: contracts manager admin is the zero address"
    );
    require(data.upgrader != address(0), "ProofOfSustainability: upgrader is the zero address");
    require(address(data.x2EarnApps) != address(0), "ProofOfSustainability: x2EarnApps is the zero address");
    require(data.roundThreshold > 0, "ProofOfSustainability: round threshold is zero");
    require(data.threshold > 0, "ProofOfSustainability: threshold is zero");
    require(
      address(data.xAllocationVoting) != address(0),
      "ProofOfSustainability: xAllocationVoting is the zero address"
    );

    __UUPSUpgradeable_init();
    __AccessControl_init();
    __ReentrancyGuard_init();

    _grantRole(DEFAULT_ADMIN_ROLE, data.admin);
    _grantRole(UPGRADER_ROLE, data.upgrader);
    _grantRole(CONTRACTS_ADDRESS_MANAGER_ROLE, data.contractsManagerAdmin);

    ProofOfSustainablityStorage storage $ = _getProofOfSustainabilityStorage();

    $.x2EarnApps = data.x2EarnApps;
    $.xAllocationVoting = data.xAllocationVoting;
    $.roundThreshold = data.roundThreshold;
    $.totalThreshold = data.threshold;
    $.isTotalScoreConsidered = data.isTotalScoreConsidered;

    _grantRole(ACTION_REGISTRAR_ROLE, data.actionRegistrar);
    _grantRole(ACTION_SCORE_MANAGER_ROLE, data.actionScoreManager);

    $.roundsForCumulativeScore = data.roundsForCumulativeScore; // Default number of rounds to consider for the cumulative score
  }

  // ---------- Authorizers ---------- //

  /// @notice Authorizes the upgrade of the contract
  /// @param newImplementation - the new implementation address
  function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

  // ---------- Setters ---------- //

  /// @notice Registers an action for a user in a round
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  /// @param impact - the impact of the action, look at {X2EarnRewardsPool} for more information
  function registerAction(
    address user,
    bytes32 appId,
    string[] memory impactCodes,
    uint256[] memory impact
  ) public virtual onlyRole(ACTION_REGISTRAR_ROLE) {
    require(user != address(0), "ProofOfSustainability: user is the zero address");

    ProofOfSustainablityStorage storage $ = _getProofOfSustainabilityStorage();

    require($.x2EarnApps.appExists(appId), "ProofOfSustainability: app does not exist");

    uint256 round = $.xAllocationVoting.currentRoundId();

    // Define the allowed keys and their corresponding weights
    string[8] memory allowedKeys = [
      "carbon",
      "water",
      "energy",
      "waste_mass",
      "learning_time",
      "timber",
      "plastic",
      "trees_planted"
    ];

    uint256[8] memory weights = [
      CARBON_WEIGHT,
      WATER_WEIGHT,
      ENERGY_WEIGHT,
      WASTE_MASS_WEIGHT,
      LEARNING_TIME_WEIGHT,
      TIMBER_WEIGHT,
      PLASTIC_WEIGHT,
      TREES_PLANTED_WEIGHT
    ];

    uint256 absoluteWeightedImpact = 0;

    // Calculate the weighted impact only for allowed keys
    for (uint256 i = 0; i < impactCodes.length; i++) {
      for (uint256 j = 0; j < allowedKeys.length; j++) {
        if (keccak256(abi.encodePacked(impactCodes[i])) == keccak256(abi.encodePacked(allowedKeys[j]))) {
          absoluteWeightedImpact += impact[i] * weights[j];
          break;
        }
      }
    }

    // Update the user's score for the round
    $.userRoundScore[user][round] += absoluteWeightedImpact;

    // Update the user's total score
    $.userTotalScore[user] += absoluteWeightedImpact;

    // Update the user's score for the app in the round
    $.userAppRoundScore[user][round][appId] += absoluteWeightedImpact;

    // Update the user's total score for the app
    $.userAppTotalScore[user][appId] += absoluteWeightedImpact;

    emit RegisteredAction(user, appId, round, absoluteWeightedImpact);
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
    require(baseActionScore > 0, "ProofOfSustainability: baseActionScore is zero");

    ProofOfSustainablityStorage storage $ = _getProofOfSustainabilityStorage();

    require($.x2EarnApps.appExists(appId), "ProofOfSustainability: app does not exist");

    $.baseActionScore[appId] = baseActionScore;
  }

  /// @notice Sets the X2EarnApps contract address
  /// @dev The X2EarnApps contract address can be modified by the CONTRACTS_ADDRESS_MANAGER_ROLE
  /// @param _x2EarnApps - the X2EarnApps contract address
  function setX2EarnApps(IX2EarnApps _x2EarnApps) public virtual onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    require(address(_x2EarnApps) != address(0), "ProofOfSustainability: x2EarnApps is the zero address");

    _getProofOfSustainabilityStorage().x2EarnApps = _x2EarnApps;
  }

  /// @notice Sets if the total score is considered for a user to be a person
  /// @dev The total score considered flag can be modified by the DEFAULT_ADMIN_ROLE
  /// @dev If the total score is considered, the user is considered a person if the user's total score is greater than or equal to the total threshold
  /// @param _isTotalScoreConsidered - the total score considered flag
  function setIsTotalScoreConsidered(bool _isTotalScoreConsidered) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    _getProofOfSustainabilityStorage().isTotalScoreConsidered = _isTotalScoreConsidered;
  }

  // ---------- Getters ---------- //

  // function getScore(address user) public view virtual override returns (uint256) {
  //   return getUserTotalScore(user);
  // }

  // function getNormalizedScore(address user) public view virtual override returns (uint256) {
  //   ProofOfSustainablityStorage storage $ = _getProofOfSustainabilityStorage();

  //   // Get the user's total score
  //   uint256 userScore = getUserTotalScore(user);

  //   // Use the totalThreshold as the maximum score for normalization
  //   uint256 maxScore = $.totalThreshold;

  //   // Ensure maxScore is not zero to avoid division by zero
  //   if (maxScore == 0) {
  //     return 0;
  //   }

  //   // Normalize the user's score to a value between 0 and 1 with 18 decimals of precision
  //   uint256 normalizedScore = (userScore * 1e18) / maxScore;

  //   // Return the normalized score
  //   return normalizedScore;
  // }

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
  /// if we want to look back 5 rounds we will do: score of current round + sqrt of previous round score + sqrt of (round -2 score )
  function getQuadraticCumulativeScore(address user, uint256 currentRound) public view virtual returns (uint256) {
    ProofOfSustainablityStorage storage $ = _getProofOfSustainabilityStorage();

    // Cumulative score of the user
    uint256 cumulativeScore = 0;

    // Factor to calculate the cumulative quadratic score
    uint256 factor = 0;

    // Calculate the cumulative quadratic score for the number of rounds to consider for the cumulative score
    for (uint256 round = currentRound; round >= 1 && round > currentRound - $.roundsForCumulativeScore; round--) {
      // gira massimo 5 volte ( se vogliamo guardare gli ultimi 5 round)
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
    return _getProofOfSustainabilityStorage().whitelist[user];
  }

  /// @notice Checks if a user is blacklisted
  /// @param user - the user address
  function isBlacklisted(address user) public view virtual returns (bool) {
    return _getProofOfSustainabilityStorage().blacklist[user];
  }

  /// @notice Checks if the total score is considered for a user to be a person
  /// @return isTotalScoreConsidered - the total score considered flag
  function isTotalScoreConsidered() public view virtual returns (bool) {
    return _getProofOfSustainabilityStorage().isTotalScoreConsidered;
  }

  /// @notice Gets the round score of a user
  /// @param user - the user address
  /// @param round - the round
  function getUserRoundScore(address user, uint256 round) public view virtual returns (uint256) {
    return _getProofOfSustainabilityStorage().userRoundScore[user][round];
  }

  /// @notice Gets the total score of a user
  /// @param user - the user address
  function getUserTotalScore(address user) public view virtual returns (uint256) {
    return _getProofOfSustainabilityStorage().userTotalScore[user];
  }

  /// @notice Gets the round threshold for a user to be considered a person
  function getRoundThreshold() public view virtual returns (uint256) {
    return _getProofOfSustainabilityStorage().roundThreshold;
  }

  /// @notice Gets the total threshold for a user to be considered a person
  function getTotalThreshold() public view virtual returns (uint256) {
    return _getProofOfSustainabilityStorage().totalThreshold;
  }

  /// @notice Gets the score of a user for an app in a round
  /// @param user - the user address
  /// @param round - the round
  /// @param appId - the app id
  function getUserRoundScoreApp(address user, uint256 round, bytes32 appId) public view virtual returns (uint256) {
    return _getProofOfSustainabilityStorage().userAppRoundScore[user][round][appId];
  }

  /// @notice Gets the total score of a user for an app
  /// @param user - the user address
  /// @param appId - the app id
  function getUserTotalScoreApp(address user, bytes32 appId) public view virtual returns (uint256) {
    return _getProofOfSustainabilityStorage().userAppTotalScore[user][appId];
  }

  function version() public pure returns (string memory) {
    return "1";
  }
}
