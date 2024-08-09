// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { VechainNodesDataTypes } from "../libraries/VechainNodesDataTypes.sol";

interface INodeManagement {
    error NodeManagementNonNodeHolder();
    error NodeManagementNodeNotDelegated();
    error NodeManagementNodeAlreadyDelegated(uint256 nodeId, address delegatee);

    event NodeDelegated(uint256 indexed nodeId, address indexed delegatee, bool delegated);

    function initialize(address vechainNodesContract, address admin, address upgrader) external;

    function setVechainNodesContract(address vechainNodesContract) external;

    function delegateNode(address delegatee) external;

    function removeNodeDelegation() external;

    function getNodeId(address user) external view returns (uint256);

    function isNodeManager(address user, uint256 nodeId) external view returns (bool);
}