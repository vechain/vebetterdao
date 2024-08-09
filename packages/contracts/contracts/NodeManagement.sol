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

import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ITokenAuction } from "./interfaces/ITokenAuction.sol";
import { INodeManagement } from "./interfaces/INodeManagement.sol";
import { VechainNodesDataTypes } from "./libraries/VechainNodesDataTypes.sol";

contract NodeManagement is INodeManagement, AccessControlUpgradeable, UUPSUpgradeable {
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /// @custom:storage-location erc7201:b3tr.storage.NodeDelegation
  struct NodeDelegationStorage {
    ITokenAuction _vechainNodesContract; // The token auction contract
    mapping(address delagatee => uint256 nodeId) delegateeToNodeId; // Map delegatee address to node ID
    mapping(uint256 nodeId => address delagatee) nodeIdToDelegatee; // Map delegator address to delegatee address
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.NodeDelegation")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant NodeDelegationStorageLocation =
    0xc1a7bcdc0c77e8c77ade4541d1777901ab96ca598d164d89afa5c8dfbfc44300;

  function _getNodeDelegationStorage() internal pure returns (NodeDelegationStorage storage $) {
    assembly {
      $.slot := NodeDelegationStorageLocation
    }
  }

  function initialize(address vechainNodesContract, address admin, address upgrader) external initializer {
    __UUPSUpgradeable_init();

    NodeDelegationStorage storage $ = _getNodeDelegationStorage();
    $._vechainNodesContract = ITokenAuction(vechainNodesContract);
  }

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

  function setVechainNodesContract(address vechainNodesContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();
    $._vechainNodesContract = ITokenAuction(vechainNodesContract);
  }

  /**
   * @notice Delegate a node to another address.
   * @param delegatee The address to delegate the node to.
   */
  function delegateNode(address delegatee) public virtual {
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();

    // Get the node ID of the caller
    uint256 nodeId = $._vechainNodesContract.ownerToId(msg.sender);

    // If node ID is equal to zero, user does not own a node
    if (nodeId == 0) {
      revert NodeManagementNonNodeHolder();
    }

    // Check if node ID is already delegated to another user
    if ($.nodeIdToDelegatee[nodeId] != address(0)) {
      revert NodeManagementNodeAlreadyDelegated(nodeId, $.nodeIdToDelegatee[nodeId]);
    }

    // Update mappings for delegation
    $.delegateeToNodeId[delegatee] = nodeId; // Map delegatee to node ID
    $.nodeIdToDelegatee[nodeId] = delegatee; // Map node ID to delegatee

    // Emit event for delegation
    emit NodeDelegated(nodeId, delegatee, true);
  }

  /**
   * @notice Remove the delegation of a node.
   */
  function removeNodeDelegation() public virtual {
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();

    // Get the node ID of the caller
    uint256 nodeId = $._vechainNodesContract.ownerToId(msg.sender);

    // If node ID is equal to zero, user does not own a node
    if (nodeId == 0) {
      revert NodeManagementNonNodeHolder();
    }

    // Check if node is delegated
    if ($.nodeIdToDelegatee[nodeId] == address(0)) {
      revert NodeManagementNodeNotDelegated();
    }

    address delegatee = $.nodeIdToDelegatee[nodeId];

    // Remove delegation
    delete $.nodeIdToDelegatee[nodeId];
    delete $.delegateeToNodeId[delegatee];

    // Emit event for delegation removal
    emit NodeDelegated(nodeId, delegatee, false);
  }

  /**
   * @notice Retrieve the node ID associated with a user, either through direct ownership or delegation.
   * @param user The address of the user to check.
   * @return uint256 The node ID associated with the user.
   */
  function getNodeId(address user) public view returns (uint256) {
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();

    // Get the delegated node ID for the user
    uint256 nodeId = $.delegateeToNodeId[user];

    // Return the delegated node ID if it exists, otherwise return the node ID directly owned by the user
    return nodeId != 0 ? nodeId : $._vechainNodesContract.ownerToId(user);
  }

  /**
   * @notice Check if a user is holding a specific node ID either directly or through delegation.
   * @param user The address of the user to check.
   * @param nodeId The node ID to check for.
   * @return bool True if the user is holding the node ID and it is a valid node.
   */
  function isNodeManager(address user, uint256 nodeId) public view virtual returns (bool) {
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();

    // Check if the user has the node ID delegated to them and if it is valid
    if ($.nodeIdToDelegatee[nodeId] == user) {
      // Return true if the owner of the token ID is not the zero address (valid nodeId)
      return $._vechainNodesContract.idToOwner(nodeId) != address(0);
    }

    // Check if the user owns the node ID
    return $._vechainNodesContract.idToOwner(nodeId) == user;
  }
}
