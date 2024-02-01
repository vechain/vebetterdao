// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract B3TRBadge is ERC721, ERC721Enumerable, AccessControl {
  // Token ID counter
  uint256 private _nextTokenId;

  // Current Maximum level the Badge can be minted or upgraded to
  uint256 public MAX_LEVEL; // Set to 0 by allowing only the free minting of the Earth Badge

  // Mapping from token ID to level
  mapping(uint256 => uint256) public levelOf;

  // Mapping from X/Economic node type to maximum mintable level
  mapping(uint8 => uint256) public xNodeTypeToMaxMintableLevel;

  constructor(string memory name, string memory symbol, address admin, uint256 maxLevel) ERC721(name, symbol) {
    _grantRole(DEFAULT_ADMIN_ROLE, admin);

    MAX_LEVEL = maxLevel;
  }

  // Mints the Badge for the given address to the given level
  function freeMint() public {
    // TODO: Get User's X/Economic node type and check max mintable level
    // TODO: Check if that X/Economic node has not already been used to mint a Badge (e.g., MintedLevelOfXNode[xNodeId])
    uint256 mintableLevel = 1;

    safeMint(msg.sender);

    levelOf[_nextTokenId - 1] = mintableLevel;
  }

  function setMaxMintableLevels(uint256[] memory maxMintableLevels) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(
      maxMintableLevels.length == 7,
      "Badge: Invalid number of max mintable levels. There should be 7 levels, one for each X/Economic node type"
    );

    for (uint8 i = 0; i < maxMintableLevels.length; i++) {
      xNodeTypeToMaxMintableLevel[i] = maxMintableLevels[i];
    }
  }

  // Mints the Badge for the given address
  // Can't be called externally but only from the contract
  function safeMint(address to) internal {
    uint256 tokenId = _nextTokenId++;
    _safeMint(to, tokenId);
  }

  function setMaxLevel(uint256 level) public onlyRole(DEFAULT_ADMIN_ROLE) {
    MAX_LEVEL = level;
  }

  // TODO: Upgrading the Badge to the next level
  // TODO: Setting baseURI & getting tokenURI based on level

  // The following functions are overrides required by Solidity.

  function _update(
    address to,
    uint256 tokenId,
    address auth
  ) internal override(ERC721, ERC721Enumerable) returns (address) {
    require(balanceOf(to) == 0, "Badge: Only 1 Badge allowed per address");

    return super._update(to, tokenId, auth);
  }

  function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
    super._increaseBalance(account, value);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
