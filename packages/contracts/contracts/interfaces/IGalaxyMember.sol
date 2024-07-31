// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

/**
 * @title IGalaxyMemberV2 Interface
 * @dev Interface for the GalaxyMemberV2 contract, which manages memberships, roles, and token interactions within a Galaxy ecosystem.
 * @dev Differences from V1:
 * - Added Vechain Nodes contract to attach and detach nodes to tokens
 * - Added free upgrade levels for each Vechain node level
 * - Removed automatic highest level owned selection
 * - Added dynamic level fetching of the token based on the attached Vechain node and B3TR donated for upgrading
 * - Core logic functions are now overridable through inheritance
 */
interface IGalaxyMember {

    // Error Definitions
    error AccessControlBadConfirmation();
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);
    error AddressEmptyCode(address target);
    error ERC1967InvalidImplementation(address implementation);
    error ERC1967NonPayable();
    error ERC5805FutureLookup(uint256 timepoint, uint48 clock);
    error ERC6372InconsistentClock();
    error ERC721EnumerableForbiddenBatchMint();
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);
    error ERC721InsufficientApproval(address operator, uint256 tokenId);
    error ERC721InvalidApprover(address approver);
    error ERC721InvalidOperator(address operator);
    error ERC721InvalidOwner(address owner);
    error ERC721InvalidReceiver(address receiver);
    error ERC721InvalidSender(address sender);
    error ERC721NonexistentToken(uint256 tokenId);
    error ERC721OutOfBoundsIndex(address owner, uint256 index);
    error EnforcedPause();
    error ExpectedPause();
    error FailedInnerCall();
    error InvalidInitialization();
    error NotInitializing();
    error ReentrancyGuardReentrantCall();
    error UUPSUnauthorizedCallContext();
    error UUPSUnsupportedProxiableUUID(bytes32 slot);

    // Event Definitions
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event B3TRtoUpgradeToLevelUpdated(uint256[] indexed b3trToUpgradeToLevel);
    event B3trGovernorAddressUpdated(address indexed newAddress, address indexed oldAddress);
    event BaseURIUpdated(string indexed newBaseURI, string indexed oldBaseURI);
    event Initialized(uint64 version);
    event MaxLevelUpdated(uint256 oldLevel, uint256 newLevel);
    event Paused(address account);
    event PublicMintingPaused(bool isPaused);
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event Selected(address indexed owner, uint256 tokenId);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Unpaused(address account);
    event Upgraded(address indexed implementation);
    event Upgraded(uint256 indexed tokenId, uint256 oldLevel, uint256 newLevel);
    event XAllocationsGovernorAddressUpdated(address indexed newAddress, address indexed oldAddress);

    // Function Definitions

    /**
     * @dev Returns the role identifier for the contracts address manager role.
     * @return The role identifier.
     */
    function CONTRACTS_ADDRESS_MANAGER_ROLE() external view returns (bytes32);

    /**
     * @dev Returns the role identifier for the default admin role.
     * @return The role identifier.
     */
    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev Returns the maximum level of a token.
     * @return The maximum level.
     */
    function MAX_LEVEL() external view returns (uint256);

    /**
     * @dev Returns the role identifier for the minter role.
     * @return The role identifier.
     */
    function MINTER_ROLE() external view returns (bytes32);

    /**
     * @dev Returns the role identifier for the nodes manager role.
     * @return The role identifier.
     */
    function NODES_MANAGER_ROLE() external view returns (bytes32);

    /**
     * @dev Returns the role identifier for the pauser role.
     * @return The role identifier.
     */
    function PAUSER_ROLE() external view returns (bytes32);

    /**
     * @dev Returns the role identifier for the upgrader role.
     * @return The role identifier.
     */
    function UPGRADER_ROLE() external view returns (bytes32);

    /**
     * @dev Returns the version of the upgrade interface.
     * @return The version string.
     */
    function UPGRADE_INTERFACE_VERSION() external view returns (string memory);

    /**
     * @dev Approves another address to transfer the given token ID.
     * @param to The address to approve.
     * @param tokenId The token ID to approve.
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Attaches a node token to a given token ID.
     * @param nodeTokenId The node token ID.
     * @param tokenId The token ID.
     */
    function attachNode(uint256 nodeTokenId, uint256 tokenId) external;

    /**
     * @dev Returns the address of the B3TR contract.
     * @return The B3TR contract address.
     */
    function b3tr() external view returns (address);

    /**
     * @dev Returns the address of the B3TR governor contract.
     * @return The B3TR governor contract address.
     */
    function b3trGovernor() external view returns (address);

    /**
     * @dev Returns the balance of the given address.
     * @param owner The address to query the balance of.
     * @return The balance.
     */
    function balanceOf(address owner) external view returns (uint256);

    /**
     * @dev Returns the base URI for all tokens.
     * @return The base URI.
     */
    function baseURI() external view returns (string memory);

    /**
     * @dev Burns a specific token ID.
     * @param tokenId The token ID to burn.
     */
    function burn(uint256 tokenId) external;

    /**
     * @dev Detaches a node token from a given token ID.
     * @param nodeTokenId The node token ID.
     * @param tokenId The token ID.
     */
    function detachNode(uint256 nodeTokenId, uint256 tokenId) external;

    /**
     * @dev Allows for free minting of tokens.
     */
    function freeMint() external;

    /**
     * @dev Returns the approved address for a specific token ID.
     * @param tokenId The token ID to query the approval of.
     * @return The approved address.
     */
    function getApproved(uint256 tokenId) external view returns (address);

    /**
     * @dev Returns the total B3TR donated for a specific token ID.
     * @param tokenId The token ID to query.
     * @return The total B3TR donated.
     */
    function getB3TRdonated(uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the B3TR required to upgrade a specific token ID.
     * @param tokenId The token ID to query.
     * @return The B3TR required to upgrade.
     */
    function getB3TRrequiredToUpgrade(uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the B3TR needed to upgrade a specific token ID.
     * @param tokenId The token ID to query.
     * @return The B3TR needed to upgrade.
     */
    function getB3TRtoUpgrade(uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the B3TR required to upgrade to a specific level.
     * @param level The level to query.
     * @return The B3TR required.
     */
    function getB3TRtoUpgradeToLevel(uint256 level) external view returns (uint256);

    /**
     * @dev Returns the token ID attached to a specific node ID.
     * @param nodeId The node ID to query.
     * @return The attached token ID.
     */
    function getIdAttachedToNode(uint256 nodeId) external view returns (uint256);

    /**
     * @dev Returns the node ID attached to a specific token ID.
     * @param tokenId The token ID to query.
     * @return The attached node ID.
     */
    function getNodeIdAttached(uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the level of a specific node ID.
     * @param nodeId The node ID to query.
     * @return The node level.
     */
    function getNodeLevelOf(uint256 nodeId) external view returns (uint8);

    /**
     * @dev Returns the free level for a specific node level.
     * @param nodeLevel The node level to query.
     * @return The free level.
     */
    function getNodeToFreeLevel(uint8 nodeLevel) external view returns (uint256);

    /**
     * @dev Returns the admin role for a specific role.
     * @param role The role to query.
     * @return The admin role.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Returns the selected token ID for a specific owner.
     * @param owner The owner to query.
     * @return The selected token ID.
     */
    function getSelectedTokenId(address owner) external view returns (uint256);

    /**
     * @dev Grants a specific role to an account.
     * @param role The role to grant.
     * @param account The account to grant the role to.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Returns true if the account has been granted the specified role.
     * @param role The role to query.
     * @param account The account to query.
     * @return True if the account has the role.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Initializes the contract with specified parameters.
     * @param _vechainNodes The address of the Vechain nodes.
     * @param _nodesAdmin The address of the nodes administrator.
     * @param _nodeFreeLevels The array of node free levels.
     */
    function initializeV2(address _vechainNodes, address _nodesAdmin, uint256[] memory _nodeFreeLevels) external;

    /**
     * @dev Returns true if the operator is approved for all tokens owned by the owner.
     * @param owner The owner to query.
     * @param operator The operator to query.
     * @return True if the operator is approved for all tokens.
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);

    /**
     * @dev Returns the level of a specific token ID.
     * @param tokenId The token ID to query.
     * @return The token level.
     */
    function levelOf(uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the name of the token.
     * @return The token name.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the owner of a specific token ID.
     * @param tokenId The token ID to query.
     * @return The owner address.
     */
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * @dev Returns true if the user has participated in governance.
     * @param user The user to query.
     * @return True if the user has participated in governance.
     */
    function participatedInGovernance(address user) external view returns (bool);

    /**
     * @dev Pauses all token transfers.
     */
    function pause() external;

    /**
     * @dev Returns true if the contract is paused.
     * @return True if paused.
     */
    function paused() external view returns (bool);

    /**
     * @dev Returns the proxiable UUID.
     * @return The proxiable UUID.
     */
    function proxiableUUID() external view returns (bytes32);

    /**
     * @dev Renounces a specific role by the caller, with confirmation.
     * @param role The role to renounce.
     * @param callerConfirmation The caller's confirmation address.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;

    /**
     * @dev Revokes a specific role from an account.
     * @param role The role to revoke.
     * @param account The account to revoke the role from.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Safely transfers the ownership of a given token ID to another address.
     * @param from The current owner of the token.
     * @param to The new owner.
     * @param tokenId The token ID to transfer.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Safely transfers the ownership of a given token ID to another address with additional data.
     * @param from The current owner of the token.
     * @param to The new owner.
     * @param tokenId The token ID to transfer.
     * @param data Additional data to send along with the transfer.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) external;

    /**
     * @dev Selects a specific token ID.
     * @param tokenID The token ID to select.
     */
    function select(uint256 tokenID) external;

    /**
     * @dev Sets or unsets the approval of a given operator to transfer all tokens of the caller.
     * @param operator The operator to set the approval.
     * @param approved The approval status to set.
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @dev Sets the B3TR required to upgrade to specific levels.
     * @param b3trToUpgradeToLevel The array of B3TR values for each level.
     */
    function setB3TRtoUpgradeToLevel(uint256[] memory b3trToUpgradeToLevel) external;

    /**
     * @dev Sets the address of the B3TR governor contract.
     * @param _b3trGovernor The new B3TR governor contract address.
     */
    function setB3trGovernorAddress(address _b3trGovernor) external;

    /**
     * @dev Sets the base URI for all tokens.
     * @param baseTokenURI The new base URI.
     */
    function setBaseURI(string memory baseTokenURI) external;

    /**
     * @dev Sets the public minting pause status.
     * @param isPaused The new pause status.
     */
    function setIsPublicMintingPaused(bool isPaused) external;

    /**
     * @dev Sets the maximum level for tokens.
     * @param level The new maximum level.
     */
    function setMaxLevel(uint256 level) external;

    /**
     * @dev Sets the free upgrade level for a specific node level.
     * @param nodeLevel The node level to set.
     * @param level The new free upgrade level.
     */
    function setNodeToFreeUpgradeLevel(uint8 nodeLevel, uint256 level) external;

    /**
     * @dev Sets the address of the Vechain nodes.
     * @param _vechainNodes The new Vechain nodes address.
     */
    function setVechainNodes(address _vechainNodes) external;

    /**
     * @dev Sets the address of the X allocations governor contract.
     * @param _xAllocationsGovernor The new X allocations governor contract address.
     */
    function setXAllocationsGovernorAddress(address _xAllocationsGovernor) external;

    /**
     * @dev Returns true if the contract supports the given interface.
     * @param interfaceId The interface identifier to query.
     * @return True if the interface is supported.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    /**
     * @dev Returns the symbol of the token.
     * @return The token symbol.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the token ID at a given index of all the tokens stored by the contract.
     * @param index The index to query.
     * @return The token ID.
     */
    function tokenByIndex(uint256 index) external view returns (uint256);

    /**
     * @dev Returns the token ID owned by the owner at a given index.
     * @param owner The address of the owner to query.
     * @param index The index to query.
     * @return The token ID.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);

    /**
     * @dev Returns the URI for a specific token ID.
     * @param tokenId The token ID to query.
     * @return The token URI.
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);

    /**
     * @dev Returns the total supply of tokens.
     * @return The total supply.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Transfers the ownership of a given token ID to another address.
     * @param from The current owner of the token.
     * @param to The new owner.
     * @param tokenId The token ID to transfer.
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Returns the address of the treasury.
     * @return The treasury address.
     */
    function treasury() external view returns (address);

    /**
     * @dev Unpauses all token transfers.
     */
    function unpause() external;

    /**
     * @dev Upgrades a specific token ID.
     * @param tokenId The token ID to upgrade.
     */
    function upgrade(uint256 tokenId) external;

    /**
     * @dev Upgrades to a new implementation and calls a function on the new implementation.
     * @param newImplementation The new implementation address.
     * @param data The call data.
     */
    function upgradeToAndCall(address newImplementation, bytes memory data) external payable;

    /**
     * @dev Returns the version of the contract.
     * @return The version string.
     */
    function version() external pure returns (string memory);

    /**
     * @dev Returns the address of the X allocations governor contract.
     * @return The X allocations governor contract address.
     */
    function xAllocationsGovernor() external view returns (address);
}
