// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

interface IB3TRBadge {
  error AccessControlBadConfirmation();

  error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

  error CheckpointUnorderedInsertion();

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

  error SafeCastOverflowedUintDowncast(uint8 bits, uint256 value);

  event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

  event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

  event LevelOwnedChanged(address indexed owner, uint256 previousLevel, uint256 newLevel);

  event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

  event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

  event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

  event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

  function CLOCK_MODE() external view returns (string memory);

  function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

  function MAX_LEVEL() external view returns (uint256);

  function approve(address to, uint256 tokenId) external;

  function balanceOf(address owner) external view returns (uint256);

  function clock() external view returns (uint48);

  function freeMint() external;

  function getApproved(uint256 tokenId) external view returns (address);

  function getLevel(address owner) external view returns (uint256);

  function getPastLevel(address owner, uint256 timepoint) external view returns (uint256);

  function getRoleAdmin(bytes32 role) external view returns (bytes32);

  function grantRole(bytes32 role, address account) external;

  function hasRole(bytes32 role, address account) external view returns (bool);

  function isApprovedForAll(address owner, address operator) external view returns (bool);

  function levelOf(uint256) external view returns (uint256);

  function name() external view returns (string memory);

  function numCheckpoints(address account) external view returns (uint32);

  function ownerOf(uint256 tokenId) external view returns (address);

  function renounceRole(bytes32 role, address callerConfirmation) external;

  function revokeRole(bytes32 role, address account) external;

  function safeTransferFrom(address from, address to, uint256 tokenId) external;

  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) external;

  function setApprovalForAll(address operator, bool approved) external;

  function setMaxLevel(uint256 level) external;

  function setMaxMintableLevels(uint256[] memory maxMintableLevels) external;

  function supportsInterface(bytes4 interfaceId) external view returns (bool);

  function symbol() external view returns (string memory);

  function tokenByIndex(uint256 index) external view returns (uint256);

  function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);

  function tokenURI(uint256 tokenId) external view returns (string memory);

  function totalSupply() external view returns (uint256);

  function transferFrom(address from, address to, uint256 tokenId) external;

  function xNodeTypeToMaxMintableLevel(uint8) external view returns (uint256);
}
