// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

interface IGalaxyMember {
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

  function CONTRACTS_ADDRESS_MANAGER_ROLE() external view returns (bytes32);

  function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

  function MAX_LEVEL() external view returns (uint256);

  function MINTER_ROLE() external view returns (bytes32);

  function NODES_MANAGER_ROLE() external view returns (bytes32);

  function PAUSER_ROLE() external view returns (bytes32);

  function UPGRADER_ROLE() external view returns (bytes32);

  function UPGRADE_INTERFACE_VERSION() external view returns (string memory);

  function approve(address to, uint256 tokenId) external;

  function attachNode(uint256 nodeTokenId, uint256 tokenId) external;

  function b3tr() external view returns (address);

  function b3trGovernor() external view returns (address);

  function balanceOf(address owner) external view returns (uint256);

  function baseURI() external view returns (string memory);

  function burn(uint256 tokenId) external;

  function detachNode(uint256 nodeTokenId, uint256 tokenId) external;

  function freeMint() external;

  function getApproved(uint256 tokenId) external view returns (address);

  function getB3TRdonated(uint256 tokenId) external view returns (uint256);

  function getB3TRrequiredToUpgrade(uint256 tokenId) external view returns (uint256);

  function getB3TRtoUpgrade(uint256 tokenId) external view returns (uint256);

  function getB3TRtoUpgradeToLevel(uint256 level) external view returns (uint256);

  function getIdAttachedToNode(uint256 nodeId) external view returns (uint256);

  function getLevelAfterAttachingNode(uint256 tokenId, uint256 nodeTokenId) external view returns (uint256);

  function getLevelAfterDetachingNode(uint256 tokenId) external view returns (uint256);

  function getNodeIdAttached(uint256 tokenId) external view returns (uint256);

  function getNodeLevelOf(uint256 nodeId) external view returns (uint8);

  function getNodeToFreeLevel(uint8 nodeLevel) external view returns (uint256);

  function getRoleAdmin(bytes32 role) external view returns (bytes32);

  function getSelectedTokenId(address owner) external view returns (uint256);

  function grantRole(bytes32 role, address account) external;

  function hasRole(bytes32 role, address account) external view returns (bool);

  function initializeV2(address _vechainNodes, address _nodesAdmin, uint256[] memory _nodeFreeLevels) external;

  function isApprovedForAll(address owner, address operator) external view returns (bool);

  function levelOf(uint256 tokenId) external view returns (uint256);

  function name() external view returns (string memory);

  function ownerOf(uint256 tokenId) external view returns (address);

  function participatedInGovernance(address user) external view returns (bool);

  function pause() external;

  function paused() external view returns (bool);

  function proxiableUUID() external view returns (bytes32);

  function renounceRole(bytes32 role, address callerConfirmation) external;

  function revokeRole(bytes32 role, address account) external;

  function safeTransferFrom(address from, address to, uint256 tokenId) external;

  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) external;

  function select(uint256 tokenID) external;

  function setApprovalForAll(address operator, bool approved) external;

  function setB3TRtoUpgradeToLevel(uint256[] memory b3trToUpgradeToLevel) external;

  function setB3trGovernorAddress(address _b3trGovernor) external;

  function setBaseURI(string memory baseTokenURI) external;

  function setIsPublicMintingPaused(bool isPaused) external;

  function setMaxLevel(uint256 level) external;

  function setNodeToFreeUpgradeLevel(uint8 nodeLevel, uint256 level) external;

  function setVechainNodes(address _vechainNodes) external;

  function setXAllocationsGovernorAddress(address _xAllocationsGovernor) external;

  function supportsInterface(bytes4 interfaceId) external view returns (bool);

  function symbol() external view returns (string memory);

  function tokenByIndex(uint256 index) external view returns (uint256);

  function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);

  function tokenURI(uint256 tokenId) external view returns (string memory);

  function totalSupply() external view returns (uint256);

  function transferFrom(address from, address to, uint256 tokenId) external;

  function treasury() external view returns (address);

  function unpause() external;

  function upgrade(uint256 tokenId) external;

  function upgradeToAndCall(address newImplementation, bytes memory data) external payable;

  function version() external pure returns (string memory);

  function xAllocationsGovernor() external view returns (address);
}
