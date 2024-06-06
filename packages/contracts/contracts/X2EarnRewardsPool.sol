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

pragma solidity ^0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { IB3TR } from "./interfaces/IB3TR.sol";
import { IX2EarnApps } from "./interfaces/IX2EarnApps.sol";
import { IX2EarnRewardsPool } from "./interfaces/IX2EarnRewardsPool.sol";

/**
 * @title X2EarnRewardsPool
 * @dev This contract is used by x2Earn apps to reward users that performed sustainable actions.
 * The XAllocationPool contract or other contracts/users can deposit funds into this contract by specifying the app
 * that can access the funds.
 * Admins of x2EarnApps can withdraw funds from the rewards pool, whihc are sent to the team wallet.
 * The contract is upgradable through the UUPS proxy pattern and UPGRADER_ROLE can authorize the upgrade.
 */
contract X2EarnRewardsPool is
  IX2EarnRewardsPool,
  Initializable,
  UUPSUpgradeable,
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @custom:storage-location erc7201:b3tr.storage.X2EarnRewardsPool
  struct X2EarnRewardsPoolStorage {
    IB3TR b3tr;
    IX2EarnApps x2EarnApps;
    mapping(bytes32 appId => uint256) availableFunds; // Funds that the app can use to reward users
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnRewardsPool")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant X2EarnRewardsPoolStorageLocation =
    0x7c0dcc5654efea34bf150fefe2d7f927494d4026026590e81037cb4c7a9cdc00;

  function _getX2EarnRewardsPoolStorage() private pure returns (X2EarnRewardsPoolStorage storage $) {
    assembly {
      $.slot := X2EarnRewardsPoolStorageLocation
    }
  }

  function initialize(address _admin, address _upgrader, IB3TR _b3tr, IX2EarnApps _x2EarnApps) public initializer {
    require(_admin != address(0), "X2EarnRewardsPool: admin is the zero address");
    require(_upgrader != address(0), "X2EarnRewardsPool: upgrader is the zero address");
    require(address(_b3tr) != address(0), "X2EarnRewardsPool: b3tr is the zero address");
    require(address(_x2EarnApps) != address(0), "X2EarnRewardsPool: x2EarnApps is the zero address");

    __UUPSUpgradeable_init();
    __AccessControl_init();

    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(UPGRADER_ROLE, _upgrader);

    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    $.b3tr = _b3tr;
    $.x2EarnApps = _x2EarnApps;
  }

  // ---------- Authorizers ---------- //

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

  // ---------- Setters ---------- //

  function deposit(uint256 amount, bytes32 appId) public returns (bool) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();

    // check that app exists
    require($.x2EarnApps.appExists(appId), "X2EarnRewardsPool: app does not exist");

    // transfer tokens to this contract
    $.b3tr.transferFrom(msg.sender, address(this), amount);

    // increase available amount for the app
    $.availableFunds[appId] += amount;

    emit NewDeposit(appId, amount, msg.sender);

    return true;
  }

  /**
   * @dev Function used by x2earn apps to reward users that performed sustainable actions.
   *
   * @param appId the app id that is emitting the reward
   * @param amount the amount of B3TR token the user is rewarded with
   * @param receiver the address of the user that performed the sustainable action and is rewarded
   * @param proof a JSON file uploaded on IPFS by the app that adds information on the type of action that was performed
   */
  function distributeReward(bytes32 appId, uint256 amount, address receiver, string memory proof) public nonReentrant {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();

    require($.x2EarnApps.appExists(appId), "X2EarnRewardsPool: app does not exist");

    require($.x2EarnApps.isRewardDistributor(appId, msg.sender), "X2EarnRewardsPool: not a reward distributor");

    // check if the app has enough available funds to reward users
    require($.availableFunds[appId] >= amount, "X2EarnRewardsPool: app has insufficient funds");

    // check if the contract has enough funds
    require($.b3tr.balanceOf(address(this)) >= amount, "X2EarnRewardsPool: insufficient funds on contract");

    // transfer the rewards to the receiver
    $.availableFunds[appId] -= amount;
    require($.b3tr.transfer(receiver, amount), "X2EarnRewardsPool: Allocation transfer to app failed");

    // emit event
    emit RewardDistributed(msg.sender, appId, amount, receiver, proof);
  }

  /**
   * @dev Sets the X2EarnApps contract address.
   *
   * @param _x2EarnApps the new X2EarnApps contract
   */
  function setX2EarnApps(IX2EarnApps _x2EarnApps) public onlyRole(DEFAULT_ADMIN_ROLE) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    $.x2EarnApps = _x2EarnApps;
  }

  /**
   * @dev Function used by x2earn apps to withdraw funds from the rewards pool.
   *
   * @param appId The ID of the app.
   * @param amount The amount of $B3TR to withdraw.
   */
  function withdraw(bytes32 appId, uint256 amount, string memory reason) public nonReentrant {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();

    require($.x2EarnApps.appExists(appId), "X2EarnRewardsPool: app does not exist");

    require($.x2EarnApps.isAppAdmin(appId, msg.sender), "X2EarnRewardsPool: not a reward distributor");

    // check if the app has enough available funds to withdraw
    require($.availableFunds[appId] >= amount, "X2EarnRewardsPool: app has insufficient funds");

    // check if the contract has enough funds
    require($.b3tr.balanceOf(address(this)) >= amount, "X2EarnRewardsPool: insufficient funds on contract");

    // Get the team wallet address
    address teamWalletAddress = $.x2EarnApps.teamWalletAddress(appId);

    // transfer the rewards to the team wallet
    $.availableFunds[appId] -= amount;
    require($.b3tr.transfer(teamWalletAddress, amount), "X2EarnRewardsPool: Allocation transfer to app failed");

    emit TeamWithdrawal(appId, amount, teamWalletAddress, msg.sender, reason);
  }

  // ---------- Getters ---------- //

  /**
   * @dev Returns the amount of funds available for an app to reward users.
   *
   * @param appId The ID of the app.
   */
  function availableFunds(bytes32 appId) public view returns (uint256) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    return $.availableFunds[appId];
  }

  /**
   * @dev Retrieves the current version of the contract.
   *
   * @return The version of the contract.
   */
  function version() public pure virtual returns (string memory) {
    return "1";
  }

  /**
   * @dev Retrieves the B3TR token contract.
   */
  function b3tr() public view returns (IB3TR) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    return $.b3tr;
  }

  /**
   * @dev Retrieves the X2EarnApps contract.
   */
  function x2EarnApps() public view returns (IX2EarnApps) {
    X2EarnRewardsPoolStorage storage $ = _getX2EarnRewardsPoolStorage();
    return $.x2EarnApps;
  }
}
