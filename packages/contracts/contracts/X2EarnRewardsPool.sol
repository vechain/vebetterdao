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
import "@openzeppelin/contracts/utils/Strings.sol";
import { X2EarnAppsDataTypes } from "./libraries/X2EarnAppsDataTypes.sol";
import { ProofDataTypes } from "./libraries/ProofDataTypes.sol";

/**
 * @title X2EarnRewardsPool
 * @dev This contract is used by x2Earn apps to reward users that performed sustainable actions.
 * The XAllocationPool contract or other contracts/users can deposit funds into this contract by specifying the app
 * that can access the funds.
 * Admins of x2EarnApps can withdraw funds from the rewards pool, whihch are sent to the team wallet.
 * Reward distributors of a x2Earn app can distribute rewards to users that performed sustainable actions or withdraw funds
 * to the team wallet.
 * The contract is upgradable through the UUPS proxy pattern and UPGRADER_ROLE can authorize the upgrade.
 */
contract X2EarnRewardsPool is
  IX2EarnRewardsPool,
  UUPSUpgradeable,
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");
  bytes32 public constant IMPACT_KEY_MANAGER_ROLE = keccak256("IMPACT_KEY_MANAGER_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @custom:storage-location erc7201:b3tr.storage.X2EarnRewardsPool
  struct X2EarnRewardsPoolStorage {
    IB3TR b3tr;
    IX2EarnApps x2EarnApps;
    mapping(bytes32 appId => uint256) availableFunds; // Funds that the app can use to reward users
    string[] allowedImpactKeys;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnRewardsPool")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant X2EarnRewardsPoolStorageLocation =
    0x7c0dcc5654efea34bf150fefe2d7f927494d4026026590e81037cb4c7a9cdc00;

  function _getX2EarnRewardsPoolStorage() private pure returns (X2EarnRewardsPoolStorage storage $) {
    assembly {
      $.slot := X2EarnRewardsPoolStorageLocation
    }
  }

  function initialize(
    address _admin,
    address _contractsManagerAdmin,
    address _upgrader,
    IB3TR _b3tr,
    IX2EarnApps _x2EarnApps
  ) external initializer {
    require(_admin != address(0), "X2EarnRewardsPool: admin is the zero address");
    require(_contractsManagerAdmin != address(0), "X2EarnRewardsPool: contracts manager admin is the zero address");
    require(_upgrader != address(0), "X2EarnRewardsPool: upgrader is the zero address");
    require(address(_b3tr) != address(0), "X2EarnRewardsPool: b3tr is the zero address");
    require(address(_x2EarnApps) != address(0), "X2EarnRewardsPool: x2EarnApps is the zero address");

    __UUPSUpgradeable_init();
    __AccessControl_init();
    __ReentrancyGuard_init();

    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(UPGRADER_ROLE, _upgrader);
    _grantRole(CONTRACTS_ADDRESS_MANAGER_ROLE, _contractsManagerAdmin);

    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    $.b3tr = _b3tr;
    $.x2EarnApps = _x2EarnApps;
  }

  function initializeV2(address _impactKeyManager) external reinitializer(2) {
    require(_impactKeyManager != address(0), "X2EarnRewardsPool: impactKeyManager is the zero address");

    _grantRole(IMPACT_KEY_MANAGER_ROLE, _impactKeyManager);

    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    // pre fill the allowed impact keys
    $.allowedImpactKeys = [
      "carbon",
      "water",
      "energy",
      "waste_mass",
      "learning_time",
      "timber",
      "plastic",
      "trees_planted"
    ];
  }

  // ---------- Modifiers ---------- //
  /**
   * @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
   * @param role - the role to check
   */
  modifier onlyRoleOrAdmin(bytes32 role) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert("X2EarnRewardsPool: sender is not an admin nor has the required role");
    }
    _;
  }

  // ---------- Authorizers ---------- //

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

  // ---------- Setters ---------- //

  /**
   * @dev See {IX2EarnRewardsPool-deposit}
   */
  function deposit(uint256 amount, bytes32 appId) external returns (bool) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();

    // check that app exists
    require($.x2EarnApps.appExists(appId), "X2EarnRewardsPool: app does not exist");

    // increase available amount for the app
    $.availableFunds[appId] += amount;

    // transfer tokens to this contract
    require($.b3tr.transferFrom(msg.sender, address(this), amount), "X2EarnRewardsPool: deposit transfer failed");

    emit NewDeposit(amount, appId, msg.sender);

    return true;
  }

  /**
   * @dev See {IX2EarnRewardsPool-withdraw}
   */
  function withdraw(uint256 amount, bytes32 appId, string memory reason) external nonReentrant {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();

    require($.x2EarnApps.appExists(appId), "X2EarnRewardsPool: app does not exist");

    require(
      $.x2EarnApps.isAppAdmin(appId, msg.sender) || $.x2EarnApps.isRewardDistributor(appId, msg.sender),
      "X2EarnRewardsPool: not an app admin nor a reward distributor"
    );

    // check if the app has enough available funds to withdraw
    require($.availableFunds[appId] >= amount, "X2EarnRewardsPool: app has insufficient funds");

    // check if the contract has enough funds
    require($.b3tr.balanceOf(address(this)) >= amount, "X2EarnRewardsPool: insufficient funds on contract");

    // Get the team wallet address
    address teamWalletAddress = $.x2EarnApps.teamWalletAddress(appId);

    // transfer the rewards to the team wallet
    $.availableFunds[appId] -= amount;
    require($.b3tr.transfer(teamWalletAddress, amount), "X2EarnRewardsPool: Allocation transfer to app failed");

    emit TeamWithdrawal(amount, appId, teamWalletAddress, msg.sender, reason);
  }

  /**
   * @dev Deprecated function, that will call the internal distribute method with empty proof
   * @notice the proof argument is unused but kept for backwards compatibility
   */
  function distributeReward(bytes32 appId, uint256 amount, address receiver, string memory /*proof*/) external {
    _distributeReward(
      appId,
      amount,
      receiver,
      ProofDataTypes.Proof("", ""),
      ProofDataTypes.Impact(new string[](0), new uint256[](0)),
      ""
    );
  }

  /**
   * @dev See {IX2EarnRewardsPool-distributeReward}
   * @notice Currently only "image" and "link" proof types are supported.
   */
  function distributeReward(
    bytes32 appId,
    uint256 amount,
    address receiver,
    ProofDataTypes.Proof memory proof,
    ProofDataTypes.Impact memory impact,
    string memory description
  ) external {
    _distributeReward(appId, amount, receiver, proof, impact, description);
  }

  /**
   * @dev See {IX2EarnRewardsPool-distributeReward}
   * @notice The impact is an array of integers and codes that represent the impact of the action.
   * Each index of the array represents a different impact.
   * The codes are predefined and the values are the impact values.
   * Example: ["carbon", "water", "energy"], [100, 200, 300]
   */
  function _distributeReward(
    bytes32 appId,
    uint256 amount,
    address receiver,
    ProofDataTypes.Proof memory proof,
    ProofDataTypes.Impact memory impact,
    string memory description
  ) internal nonReentrant {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();

    // check authorization
    require($.x2EarnApps.appExists(appId), "X2EarnRewardsPool: app does not exist");
    require($.x2EarnApps.isRewardDistributor(appId, msg.sender), "X2EarnRewardsPool: not a reward distributor");

    // check if the app has enough available funds to distribute
    require($.availableFunds[appId] >= amount, "X2EarnRewardsPool: app has insufficient funds");
    require($.b3tr.balanceOf(address(this)) >= amount, "X2EarnRewardsPool: insufficient funds on contract");

    // buildJsonProof
    string memory jsonProof = _buildJsonProof(proof, impact, description);

    // Transfer the rewards to the receiver
    $.availableFunds[appId] -= amount;
    require($.b3tr.transfer(receiver, amount), "X2EarnRewardsPool: Allocation transfer to app failed");

    // emit event
    emit RewardDistributed(amount, appId, receiver, jsonProof, msg.sender);
  }

  /**
   * @dev Builds the JSON proof string.
   */
  function _buildJsonProof(
    ProofDataTypes.Proof memory proof,
    ProofDataTypes.Impact memory impact,
    string memory description
  ) internal view returns (string memory) {
    bool hasProof = bytes(proof.proofType).length > 0 || bytes(proof.value).length > 0;
    bool hasImpact = impact.codes.length > 0 && impact.values.length > 0;
    bool hasDescription = bytes(description).length > 0;

    // If neither proof, description, nor impact is provided, return an empty string
    if (!hasProof || !hasImpact) {
      return "";
    }

    // Initialize an empty JSON string with version
    string memory json = '{"version": 2';

    // Add description if available
    if (hasDescription) {
      json = string(abi.encodePacked(json, ',"description": "', description, '"'));
    }

    // Add proof if available and check proofType
    if (hasProof) {
      require(
        keccak256(abi.encodePacked(proof.proofType)) == keccak256(abi.encodePacked("image")) ||
          keccak256(abi.encodePacked(proof.proofType)) == keccak256(abi.encodePacked("link")),
        "X2EarnRewardsPool: Invalid proof type"
      );

      json = string(abi.encodePacked(json, ',"proof": {', '"', proof.proofType, '": "', proof.value, '"}'));
    }

    // Add impact if available
    if (hasImpact) {
      string memory jsonImpact = _buildImpactJson(impact);

      if (hasProof || hasDescription) {
        // Add a comma if proof or description was already added
        json = string(abi.encodePacked(json, ","));
      }

      json = string(abi.encodePacked(json, '"impact": ', jsonImpact));
    }

    // Close the JSON object
    json = string(abi.encodePacked(json, "}"));

    return json;
  }

  /**
   * @dev Builds the impact JSON string.
   * @param impact an array of integers that represent the impact of the action. Each index of the array
   */
  function _buildImpactJson(ProofDataTypes.Impact memory impact) internal view returns (string memory) {
    require(impact.codes.length == impact.values.length, "Mismatched input lengths");

    bytes memory json = abi.encodePacked("{");

    for (uint256 i = 0; i < impact.values.length; i++) {
      if (_isAllowedImpactKey(impact.codes[i])) {
        json = abi.encodePacked(json, '"', impact.codes[i], '":', Strings.toString(impact.values[i]), "");
        if (i < impact.values.length - 1) {
          json = abi.encodePacked(json, ",");
        }
      } else {
        revert("X2EarnRewardsPool: Invalid impact key");
      }
    }

    json = abi.encodePacked(json, "}");
    return string(json);
  }

  /**
   * @dev Checks if the key is allowed.
   */
  function _isAllowedImpactKey(string memory key) internal view returns (bool) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    for (uint256 i = 0; i < $.allowedImpactKeys.length; i++) {
      if (keccak256(abi.encodePacked(key)) == keccak256(abi.encodePacked($.allowedImpactKeys[i]))) {
        return true;
      }
    }
    return false;
  }

  /**
   * @dev Sets the X2EarnApps contract address.
   *
   * @param _x2EarnApps the new X2EarnApps contract
   */
  function setX2EarnApps(IX2EarnApps _x2EarnApps) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    require(address(_x2EarnApps) != address(0), "X2EarnRewardsPool: x2EarnApps is the zero address");

    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    $.x2EarnApps = _x2EarnApps;
  }

  /**
   * @dev Adds a new allowed impact key.
   * @param newKey the new key to add
   */
  function addImpactKey(string memory newKey) external onlyRoleOrAdmin(IMPACT_KEY_MANAGER_ROLE) {
    require(!_isAllowedImpactKey(newKey), "X2EarnRewardsPool: Key already exists");

    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    $.allowedImpactKeys.push(newKey);
  }

  /**
   * @dev Removes an allowed impact key.
   * @param keyToRemove the key to remove
   */
  function removeImpactKey(string memory keyToRemove) external onlyRoleOrAdmin(IMPACT_KEY_MANAGER_ROLE) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    for (uint256 i = 0; i < $.allowedImpactKeys.length; i++) {
      if (keccak256(abi.encodePacked($.allowedImpactKeys[i])) == keccak256(abi.encodePacked(keyToRemove))) {
        $.allowedImpactKeys[i] = $.allowedImpactKeys[$.allowedImpactKeys.length - 1];
        $.allowedImpactKeys.pop();
        return;
      }
    }
    revert("X2EarnRewardsPool: Key not found");
  }

  // ---------- Getters ---------- //

  /**
   * @dev See {IX2EarnRewardsPool-availableFunds}
   */
  function availableFunds(bytes32 appId) external view returns (uint256) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    return $.availableFunds[appId];
  }

  /**
   * @dev See {IX2EarnRewardsPool-version}
   */
  function version() external pure virtual returns (string memory) {
    return "2";
  }

  /**
   * @dev Retrieves the B3TR token contract.
   */
  function b3tr() external view returns (IB3TR) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    return $.b3tr;
  }

  /**
   * @dev Retrieves the X2EarnApps contract.
   */
  function x2EarnApps() external view returns (IX2EarnApps) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    return $.x2EarnApps;
  }

  /**
   * @dev Retrieves the allowed impact keys.
   */
  function getAllowedImpactKeys() external view returns (string[] memory) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    return $.allowedImpactKeys;
  }

  // ---------- Fallbacks ---------- //

  /**
   * @dev Transfers of VET to this contract are not allowed.
   */
  receive() external payable virtual {
    revert("X2EarnRewardsPool: contract does not accept VET");
  }

  /**
   * @dev Contract does not accept calls/data.
   */
  fallback() external payable {
    revert("X2EarnRewardsPool: contract does not accept calls/data");
  }

  /**
   * @dev Transfers of ERC721 tokens to this contract are not allowed.
   *
   * @notice supported only when safeTransferFrom is used
   */
  function onERC721Received(address, address, uint256, bytes memory) public virtual returns (bytes4) {
    revert("X2EarnRewardsPool: contract does not accept ERC721 tokens");
  }

  /**
   * @dev Transfers of ERC1155 tokens to this contract are not allowed.
   */
  function onERC1155Received(address, address, uint256, uint256, bytes memory) public virtual returns (bytes4) {
    revert("X2EarnRewardsPool: contract does not accept ERC1155 tokens");
  }

  /**
   * @dev Transfers of ERC1155 tokens to this contract are not allowed.
   */
  function onERC1155BatchReceived(
    address,
    address,
    uint256[] memory,
    uint256[] memory,
    bytes memory
  ) public virtual returns (bytes4) {
    revert("X2EarnRewardsPool: contract does not accept batch transfers of ERC1155 tokens");
  }
}
