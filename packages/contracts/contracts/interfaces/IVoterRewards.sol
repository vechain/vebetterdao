// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

/**
 * @title IVoterRewards Interface
 * @dev Interface for managing voter rewards, roles, emissions, and galaxy membership.
 */
interface IVoterRewards {

    // Error Definitions
    error AccessControlBadConfirmation();
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);
    error AddressEmptyCode(address target);
    error ERC1967InvalidImplementation(address implementation);
    error ERC1967NonPayable();
    error FailedInnerCall();
    error InvalidInitialization();
    error NotInitializing();
    error ReentrancyGuardReentrantCall();
    error UUPSUnauthorizedCallContext();
    error UUPSUnsupportedProxiableUUID(bytes32 slot);

    // Event Definitions
    event EmissionsAddressUpdated(address indexed newAddress, address indexed oldAddress);
    event GalaxyMemberAddressUpdated(address indexed newAddress, address indexed oldAddress);
    event Initialized(uint64 version);
    event LevelToMultiplierSet(uint256 indexed level, uint256 multiplier);
    event RewardClaimed(uint256 indexed cycle, address indexed voter, uint256 reward);
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event Upgraded(address indexed implementation);
    event VoteRegistered(uint256 indexed cycle, address indexed voter, uint256 votes, uint256 rewardWeightedVote);

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
     * @dev Returns the scaling factor for the rewards.
     * @return The scaling factor.
     */
    function SCALING_FACTOR() external view returns (uint256);

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
     * @dev Returns the role identifier for the vote registrar role.
     * @return The role identifier.
     */
    function VOTE_REGISTRAR_ROLE() external view returns (bytes32);

    /**
     * @dev Returns the address of the B3TR contract.
     * @return The B3TR contract address.
     */
    function b3tr() external view returns (address);

    /**
     * @dev Claims the reward for a voter in a specific cycle.
     * @param cycle The cycle number.
     * @param voter The address of the voter.
     */
    function claimReward(uint256 cycle, address voter) external;

    /**
     * @dev Returns the total votes for a specific cycle.
     * @param cycle The cycle number.
     * @return The total votes.
     */
    function cycleToTotal(uint256 cycle) external view returns (uint256);

    /**
     * @dev Returns the total votes for a voter in a specific cycle.
     * @param cycle The cycle number.
     * @param voter The address of the voter.
     * @return The total votes.
     */
    function cycleToVoterToTotal(uint256 cycle, address voter) external view returns (uint256);

    /**
     * @dev Returns the address of the emissions contract.
     * @return The emissions contract address.
     */
    function emissions() external view returns (address);

    /**
     * @dev Returns the address of the Galaxy Member contract.
     * @return The Galaxy Member contract address.
     */
    function galaxyMember() external view returns (address);

    /**
     * @dev Returns the multiplier for a token in a specific proposal.
     * @param tokenId The token ID.
     * @param proposalId The proposal ID.
     * @return The multiplier.
     */
    function getMultiplier(uint256 tokenId, uint256 proposalId) external view returns (uint256);

    /**
     * @dev Returns the reward for a voter in a specific cycle.
     * @param cycle The cycle number.
     * @param voter The address of the voter.
     * @return The reward amount.
     */
    function getReward(uint256 cycle, address voter) external view returns (uint256);

    /**
     * @dev Returns the admin role for a specific role.
     * @param role The role to query.
     * @return The admin role.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants a specific role to an account.
     * @param role The role to grant.
     * @param account The account to grant the role to.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Checks if a node has voted on a specific proposal.
     * @param nodeId The node ID.
     * @param proposalId The proposal ID.
     * @return True if the node has voted, false otherwise.
     */
    function hasNodeVoted(uint256 nodeId, uint256 proposalId) external view returns (bool);

    /**
     * @dev Returns true if the account has been granted the specified role.
     * @param role The role to query.
     * @param account The account to query.
     * @return True if the account has the role.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Checks if a token has voted on a specific proposal.
     * @param tokenId The token ID.
     * @param proposalId The proposal ID.
     * @return True if the token has voted, false otherwise.
     */
    function hasTokenVoted(uint256 tokenId, uint256 proposalId) external view returns (bool);

    /**
     * @dev Returns the multiplier for a specific level.
     * @param level The level to query.
     * @return The multiplier.
     */
    function levelToMultiplier(uint256 level) external view returns (uint256);

    /**
     * @dev Returns the proxiable UUID.
     * @return The proxiable UUID.
     */
    function proxiableUUID() external view returns (bytes32);

    /**
     * @dev Registers a vote for a proposal.
     * @param proposalId The proposal ID.
     * @param voter The address of the voter.
     * @param votes The number of votes.
     * @param votePower The power of the vote.
     */
    function registerVote(uint256 proposalId, address voter, uint256 votes, uint256 votePower) external;

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
     * @dev Sets the address of the emissions contract.
     * @param _emissions The new emissions contract address.
     */
    function setEmissions(address _emissions) external;

    /**
     * @dev Sets the address of the Galaxy Member contract.
     * @param _galaxyMember The new Galaxy Member contract address.
     */
    function setGalaxyMember(address _galaxyMember) external;

    /**
     * @dev Sets the multiplier for a specific level.
     * @param level The level to set.
     * @param multiplier The new multiplier.
     */
    function setLevelToMultiplier(uint256 level, uint256 multiplier) external;

    /**
     * @dev Returns true if the contract supports the given interface.
     * @param interfaceId The interface identifier to query.
     * @return True if the interface is supported.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);

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
}
