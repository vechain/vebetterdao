// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/interfaces/IERC6372.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract B3TRBadge is ERC721, ERC721Enumerable, AccessControl, IERC6372 {
  using Checkpoints for Checkpoints.Trace208;

  // Token ID counter
  uint256 private _nextTokenId;

  // Current Maximum level the Badge can be minted or upgraded to
  uint256 public MAX_LEVEL; // Set to 0 by allowing only the free minting of the Earth Badge

  // Mapping from token ID to level
  mapping(uint256 => uint256) public levelOf;

  // Mapping from X/Economic node type to maximum mintable level
  mapping(uint8 => uint256) public xNodeTypeToMaxMintableLevel;

  // Mapping from owner to their level checkpoints
  mapping(address owner => Checkpoints.Trace208) private _levelCheckpoints;

  /**
   * @dev The clock was incorrectly modified.
   */
  error ERC6372InconsistentClock();

  /**
   * @dev Lookup to future votes is not available.
   */
  error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

  /**
   * @dev Emitted when an account changes their level.
   */
  event LevelOwnedChanged(address indexed owner, uint256 previousLevel, uint256 newLevel);

  constructor(string memory name, string memory symbol, address admin, uint256 maxLevel) ERC721(name, symbol) {
    _grantRole(DEFAULT_ADMIN_ROLE, admin);

    MAX_LEVEL = maxLevel;
  }

  // Mints the highest level Badge the caller is allowed to mint
  function freeMint() public {
    // TODO: Get User's X/Economic node type and check max mintable level
    // TODO: Check if that X/Economic node has not already been used to mint a Badge (e.g., MintedLevelOfXNode[xNodeId])
    uint256 mintableLevel = 1;

    levelOf[_nextTokenId] = mintableLevel;

    safeMint(msg.sender);
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

  // TODO: Upgrading the Badge to the next level
  // TODO: Setting baseURI & getting tokenURI based on level

  /**
   * @dev Clock used for flagging checkpoints. Can be overridden to implement timestamp based
   * checkpoints (and voting), in which case {CLOCK_MODE} should be overridden as well to match.
   */
  function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  /**
   * @dev Machine-readable description of the clock as specified in EIP-6372.
   */
  // solhint-disable-next-line func-name-mixedcase
  function CLOCK_MODE() public view virtual returns (string memory) {
    // Check that the clock was not modified
    if (clock() != Time.blockNumber()) {
      revert ERC6372InconsistentClock();
    }
    return "mode=blocknumber&from=default";
  }

  // ----------- Internal & Private ----------- //

  /**
   * @dev Move ownership level from one address to another.
   */
  function _moveOwnershipLevel(address from, address to, uint256 level) private {
    if (from != to) {
      if (from != address(0)) {
        (uint256 oldValue, uint256 newValue) = _push(_levelCheckpoints[from], 0);
        emit LevelOwnedChanged(from, oldValue, newValue);
      }
      if (to != address(0)) {
        (uint256 oldValue, uint256 newValue) = _push(_levelCheckpoints[to], SafeCast.toUint208(level));
        emit LevelOwnedChanged(to, oldValue, newValue);
      }
    }
  }

  function _push(Checkpoints.Trace208 storage store, uint208 delta) private returns (uint208, uint208) {
    return store.push(clock(), delta);
  }

  /**
   * @dev Get number of checkpoints for `account`.
   */
  function _numCheckpoints(address account) internal view virtual returns (uint32) {
    return SafeCast.toUint32(_levelCheckpoints[account].length());
  }

  // ---------- Setters ---------- //

  function setMaxLevel(uint256 level) public onlyRole(DEFAULT_ADMIN_ROLE) {
    MAX_LEVEL = level;
  }

  // ---------- Getters ---------- //

  function getLevel(address owner) public view returns (uint256) {
    return _levelCheckpoints[owner].latest();
  }

  function getPastLevel(address owner, uint256 timepoint) public view returns (uint256) {
    uint48 currentTimepoint = clock();
    if (timepoint >= currentTimepoint) {
      revert ERC5805FutureLookup(timepoint, currentTimepoint);
    }
    return _levelCheckpoints[owner].upperLookupRecent(SafeCast.toUint48(timepoint));
  }

  function numCheckpoints(address account) public view returns (uint32) {
    return _numCheckpoints(account);
  }

  // ---------- Overrides ---------- //

  function _update(
    address to,
    uint256 tokenId,
    address auth
  ) internal override(ERC721, ERC721Enumerable) returns (address) {
    require(balanceOf(to) == 0, "Badge: Only 1 Badge allowed per address");

    _moveOwnershipLevel(auth, to, levelOf[tokenId]);

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
