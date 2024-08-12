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
import { VechainNodesDataTypes } from "./libraries/VechainNodesDataTypes.sol";
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
    ITokenAuction vechainNodesContract; // The token auction contract
    mapping(address delagatee => uint256 nodeId) delegateeToNodeId; // Map delegatee address to node ID
    mapping(uint256 nodeId => address delagatee) nodeIdToDelegatee; // Map delegator address to delegatee address
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.NodeDelegation")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant NodeDelegationStorageLocation =
    0xc1a7bcdc0c77e8c77ade4541d1777901ab96ca598d164d89afa5c8dfbfc44300;

  /**
   * @notice Retrieve the storage reference for node delegation data.
   * @dev Internal pure function to get the storage slot for node delegation data using inline assembly.
   * @return $ The storage reference for node delegation data.
   */
  function _getNodeDelegationStorage() internal pure returns (NodeDelegationStorage storage $) {
    assembly {
      $.slot := NodeDelegationStorageLocation
    }
  }

  /**
   * @notice Initialize the contract with the specified VeChain Nodes contract, admin, and upgrader addresses.
   * @dev This function initializes the contract and sets the initial values for the VeChain Nodes contract address and other roles. It should be called only once during deployment.
   * @param _vechainNodesContract The address of the VeChain Nodes contract.
   * @param _admin The address to be granted the default admin role.
   * @param _upgrader The address to be granted the upgrader role.
   */
  function initialize(address _vechainNodesContract, address _admin, address _upgrader) external initializer {
    __UUPSUpgradeable_init();
    __AccessControl_init();

    require(_admin != address(0), "NodeManagement: admin address cannot be zero");
    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(UPGRADER_ROLE, _upgrader);

    NodeDelegationStorage storage $ = _getNodeDelegationStorage();
    $.vechainNodesContract = ITokenAuction(_vechainNodesContract);
    emit VechainNodeContractSet(address(0), _vechainNodesContract);
  }

  /**
   * @notice Authorize the upgrade to a new implementation.
   * @dev Internal function to authorize the upgrade to a new contract implementation. This function is restricted to addresses with the upgrader role.
   * @param newImplementation The address of the new contract implementation.
   */
  function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

  /**
   * @notice Set the address of the VeChain Nodes contract.
   * @dev This function allows the admin to update the address of the VeChain Nodes contract.
   * @param vechainNodesContract The new address of the VeChain Nodes contract.
   */
  function setVechainNodesContract(address vechainNodesContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(vechainNodesContract != address(0), "NodeManagement: vechainNodesContract cannot be the zero address");
    
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();

    emit VechainNodeContractSet(address($.vechainNodesContract), vechainNodesContract);
    $.vechainNodesContract = ITokenAuction(vechainNodesContract);
  }
  /**
   * @notice Delegate a node to another address.
   * @dev This function allows a node owner to delegate their node to another address. The node can only be delegated if it is not already delegated to another address.
   * @param delegatee The address to delegate the node to.
   * @custom:requirements The caller must own a node. The node must not be already delegated to another address.
   * @custom:events Emits a `NodeDelegated` event on successful delegation.
   * @custom:errors Reverts with `NodeManagementNonNodeHolder` if the caller does not own a node.
   * Reverts with `NodeManagementNodeAlreadyDelegated` if the node is already delegated.
   */
  function delegateNode(address delegatee) public virtual {
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();

    // Get the node ID of the caller
    uint256 nodeId = $.vechainNodesContract.ownerToId(msg.sender);

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
   * @dev This function allows a node owner to remove the delegation of their node, effectively revoking the delegatee's access to the node.
   * @custom:requirements The caller must own a node. The node must be currently delegated.
   * @custom:events Emits a `NodeDelegated` event on successful removal of delegation.
   * @custom:errors Reverts with `NodeManagementNonNodeHolder` if the caller does not own a node.
   * Reverts with `NodeManagementNodeNotDelegated` if the node is not currently delegated.
   */
  function removeNodeDelegation() public virtual {
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();

    // Get the node ID of the caller
    uint256 nodeId = $.vechainNodesContract.ownerToId(msg.sender);

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
    return nodeId != 0 ? nodeId : $.vechainNodesContract.ownerToId(user);
  }

  /**
   * @notice Retrieves the address of the user managing the node ID endorsement either through ownership or delegation.
   * @dev If the node is delegated, this function returns the delegatee's address. If the node is not delegated, it returns the owner's address.
   * @param nodeId The ID of the node for which the manager address is being retrieved.
   * @return The address of the manager of the specified node.
   */
  function getNodeManager(uint256 nodeId) public view returns (address) {
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();

    // Get the address of the delegatee for the given nodeId
    address user = $.nodeIdToDelegatee[nodeId];

    // Return the delegated node ID if it exists, otherwise return the node ID directly owned by the user
    return user != address(0) ? user : $.vechainNodesContract.idToOwner(nodeId);
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
      return $.vechainNodesContract.idToOwner(nodeId) != address(0);
    }

    // Check if the user owns the node ID
    return $.vechainNodesContract.idToOwner(nodeId) == user;
  }
  /**
   * @notice Retrieves the node level of a given node ID.
   * @dev Internal function to get the node level of a token ID. The node level is determined based on the metadata associated with the token ID.
   * @param nodeId The token ID of the endorsing node.
   * @return The node level of the specified token ID as a VechainNodesDataTypes.NodeStrengthLevel enum.
   */
  function getNodeLevel(uint256 nodeId) public view returns (VechainNodesDataTypes.NodeStrengthLevel) {
    NodeDelegationStorage storage $ = _getNodeDelegationStorage();

    // Retrieve the metadata for the specified node ID
    (, uint8 nodeLevel, , , , , ) = $.vechainNodesContract.getMetadata(nodeId);

    // Cast the uint8 node level to VechainNodesDataTypes.NodeStrengthLevel enum and return
    return VechainNodesDataTypes.NodeStrengthLevel(nodeLevel);
  }

  /**
   * @notice Retrieves the node level of a user's managed node.
   * @dev This function retrieves the node level of the node managed by the specified user, either through ownership or delegation.
   * @param user The address of the user managing the node.
   * @return The node level of the node managed by the user as a VechainNodesDataTypes.NodeStrengthLevel enum.
   */
  function getUsersNodeLevel(address user) public view returns (VechainNodesDataTypes.NodeStrengthLevel) {
    // Retrieve the node ID managed by the specified user
    uint256 nodeId = getNodeId(user);

    // Retrieve and return the node level of the managed node
    return getNodeLevel(nodeId);
  }
}
