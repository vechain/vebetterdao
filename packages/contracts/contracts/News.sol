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
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IX2EarnApps } from "./interfaces/IX2EarnApps.sol";
import { INews } from "./interfaces/INews.sol";

/// @title News
/// @notice Contract for news of VeBetterDAO.
/// @dev This contract extends AccessControlUpgradeable with upgradeable pattern, enumerable, pausable, and access control functionalities.
contract News is
  INews,
  UUPSUpgradeable,
  AccessControlUpgradeable,
{
  // ---------------- Roles ----------------
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  // ---------------- Errors ----------------
  
  /// @dev Error thrown when a user is not authorized to perform an action
  error NewsUnauthorizedUser(address user);


  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @custom:storage-location erc7201:b3tr.storage.News
  struct NewsStorage {
    IX2EarnApps x2EarnApps;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnRewardsPool")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant NewsStorageLocation =
    0x7c0dcc5654efea34bf150fefe2d7f927494d4026026590e81037cb4c7a9cdc00; //TODO: change this

  function _getNewsStorage() private pure returns (NewsStorage storage $) {
    assembly {
      $.slot := NewsStorageLocation
    }
  }


  /// @notice Initializes the contract with role-based access control
  /// @param _x2EarnApps The address of the X2EarnApps contract
  /// @param _defaultAdmin Address to be assigned the default admin role
  /// @param _upgrader Address to be assigned the upgrader role
  function initialize(IX2EarnApps _x2EarnApps, address _defaultAdmin, address _upgrader) public initializer {
    __AccessControl_init();
    __UUPSUpgradeable_init();

    require(address(_x2EarnApps) != address(0), "News: x2EarnApps is the zero address");
    require(_defaultAdmin != address(0), "News: defaultAdmin is the zero address");
    require(_upgrader != address(0), "News: upgrader is the zero address");

    _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    _grantRole(UPGRADER_ROLE, _upgrader);


    NewsStorage storage $ = _getNewsStorage();
    $.x2EarnApps = _x2EarnApps;
  }

  // ---------- Modifiers ------------ //

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert NewsUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Setters ---------- //

  /// @notice Pauses all token transfers and minting functions
  /// @dev Only callable by accounts with the PAUSER_ROLE or the DEFAULT_ADMIN_ROLE
  function pause() public onlyRoleOrAdmin(PAUSER_ROLE) {
    _pause();
  }

  /// @notice Unpauses the contract to resume token transfers and minting
  /// @dev Only callable by accounts with the PAUSER_ROLE or the DEFAULT_ADMIN_ROLE
  function unpause() public onlyRoleOrAdmin(PAUSER_ROLE) {
    _unpause();
  }



  /// @notice Retieves the version of the contract
  function version() public pure returns (string memory) {
    return "1";
  }



  // ---------------- Upgrade and Utility Overrides ----------------

    /**
   * @dev See {UUPSUpgradeable-_authorizeUpgrade}
   */
  function _authorizeUpgrade(address newImplementation) internal override onlyRoleOrAdmin(UPGRADER_ROLE) {}

}
