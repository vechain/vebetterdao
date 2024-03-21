// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/interfaces/IERC6372.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { IB3TRGovernor } from "./interfaces/IB3TRGovernor.sol";
import { IB3TR } from "./interfaces/IB3TR.sol";

contract B3TRBadge is ERC721, ERC721Enumerable, ERC721Pausable, AccessControl, IERC6372, ReentrancyGuard {
  using Checkpoints for Checkpoints.Trace208;

  /// @custom:storage-location erc7201:b3tr.storage.B3TRBadge
  struct B3TRBadgeStorage {
    IXAllocationVotingGovernor xAllocationsGovernor; // XAllocationVotingGovernor contract
    IB3TRGovernor b3trGovernor; // B3TRGovernor contract
    IB3TR b3tr; // B3TR token contract
    address treasury;
    string _baseTokenURI; // Base URI for the Token
    uint256 _nextTokenId; // Token ID counter
    // Current Maximum level the Token can be minted or upgraded to
    uint256 MAX_LEVEL; // Set to 0 by allowing only the free minting of the Earth Token
    // Mapping from token ID to level
    mapping(uint256 => uint256) levelOf;
    // Mapping from owner to tokenId selected for voting rewards
    mapping(address => uint256) selectedTokenId;
    // Mapping from X/Economic node type to maximum mintable level
    /*
    0 => Strength
    1 => Thunder
    2 => Mjolnir
    3 => VeThorX
    4 => StrengthX
    5 => ThunderX
    6 => MjolnirX
    */
    mapping(uint8 => uint256) _xNodeTypeToMaxMintableLevel;
    mapping(uint256 => uint256) _b3trToUpgradeToLevel;
    // Mapping from owner to their selected GM NFT level to be used for voter rewards
    mapping(address owner => Checkpoints.Trace208) _selectedLevelCheckpoints;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.B3TRBadge")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant B3TRBadgeStorageLocation =
    0xa3a4dbdafa3539d2a7f76379fff3516428de5d09ad2bbe195434cac5e7193900;

  function _getB3TRBadgeStorage() private pure returns (B3TRBadgeStorage storage $) {
    assembly {
      $.slot := B3TRBadgeStorageLocation
    }
  }

  /**
   * @dev The clock was incorrectly modified.
   */
  error ERC6372InconsistentClock();

  /**
   * @dev Lookup to future votes is not available.
   */
  error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

  /**
   * @dev Emitted when an account changes the selected token for voting rewards.
   */
  event Selected(address indexed owner, uint256 tokenId);

  /**
   * @dev Emitted when an account changes the selected level for voting rewards.
   */
  event SelectedLevel(address indexed owner, uint256 oldLevel, uint256 newLevel);

  /**
   * @dev Emitted when a token is upgraded.
   */
  event Upgraded(uint256 indexed tokenId, uint256 oldLevel, uint256 newLevel);

  constructor(
    string memory name,
    string memory symbol,
    address admin,
    uint256 maxLevel,
    string memory baseTokenURI,
    uint256[] memory xNodeMaxMintableLevels,
    uint256[] memory b3trToUpgradeToLevel,
    address _b3tr,
    address _treasury
  ) ERC721(name, symbol) {
    require(maxLevel > 0, "Galaxy Member: Max level must be greater than 0");
    require(bytes(baseTokenURI).length > 0, "Galaxy Member: Base URI must be set");
    require(
      xNodeMaxMintableLevels.length == 7,
      "Galaxy Member: Invalid number of max mintable levels. There should be 7 levels, one for each X/Economic node type"
    );
    require(_b3tr != address(0), "Galaxy Member: B3TR token address cannot be the zero address");
    require(_treasury != address(0), "Galaxy Member: Treasury address cannot be the zero address");

    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();

    $.MAX_LEVEL = maxLevel;
    $._baseTokenURI = baseTokenURI;

    for (uint8 i = 0; i < xNodeMaxMintableLevels.length; i++) {
      $._xNodeTypeToMaxMintableLevel[i] = xNodeMaxMintableLevels[i];
    }

    for (uint8 i = 0; i < b3trToUpgradeToLevel.length; i++) {
      $._b3trToUpgradeToLevel[i + 2] = b3trToUpgradeToLevel[i]; // First Level that requires B3TR is level 2
    }

    $.b3tr = IB3TR(_b3tr);
    $.treasury = _treasury;

    $._nextTokenId = 1; // First token ID starts from 1

    _grantRole(DEFAULT_ADMIN_ROLE, admin);
  }

  function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  // Mints the highest level Token the caller is allowed to mint
  function freeMint() public {
    require(participatedInGovernance(msg.sender), "Galaxy Member: User has not participated in governance");
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();

    // TODO: Get User's X/Economic node type and check max mintable level
    // TODO: Check if that X/Economic node has not already been used to mint a Token (e.g., MintedLevelOfXNode[xNodeId])
    /* uint256 mintableLevel = 1; */

    uint256 tokenId = $._nextTokenId;

    $.levelOf[tokenId] = 1;

    safeMint(msg.sender);
  }

  // TODO: Mock X/Economic nodes NFT Contract, add to constructor and use it to check the X/Economic node type of the caller
  function upgrade(uint256 tokenId) public nonReentrant whenNotPaused {
    require(ownerOf(tokenId) == msg.sender, "Galaxy Member: you must own the Token to upgrade it");
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();

    uint256 currentLevel = $.levelOf[tokenId];

    require(currentLevel < $.MAX_LEVEL, "Galaxy Member: Token is already at max level");

    uint256 b3trRequired = $._b3trToUpgradeToLevel[currentLevel + 1];

    require($.b3tr.balanceOf(msg.sender) >= b3trRequired, "Galaxy Member: Insufficient balance to upgrade");

    $.levelOf[tokenId] = currentLevel + 1;

    if ($.selectedTokenId[msg.sender] == tokenId) {
      _updateLevelSelected(msg.sender, $.levelOf[tokenId]);
    }

    require($.b3tr.transferFrom(msg.sender, $.treasury, b3trRequired), "B3TRBadge: Transfer failed");

    emit Upgraded(tokenId, currentLevel, $.levelOf[tokenId]);
  }

  function select(uint256 tokenId) public {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();

    require(ownerOf(tokenId) == msg.sender, "Galaxy Member: Caller is not the owner of the Token");
    require($.selectedTokenId[msg.sender] != tokenId, "Galaxy Member: Token already selected");

    _updateLevelSelected(msg.sender, $.levelOf[tokenId]);

    _select(msg.sender, tokenId);
  }

  function upgradeAndSelect(uint256 tokenId) public {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();

    require(
      $.selectedTokenId[msg.sender] != tokenId,
      "Galaxy Member: Token already selected, consider upgrading it instead"
    );

    upgrade(tokenId);
    select(tokenId);
  }

  // Mints the Token for the given address
  // Can't be called externally but only from the contract
  function safeMint(address to) internal {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    uint256 tokenId = $._nextTokenId++;
    _safeMint(to, tokenId);
  }

  // ----------- Internal & Private ----------- //

  /**
   * @dev Move ownership level from one address to another.
   */
  function _moveOwnershipLevel(address from, address to, uint256 level, uint256 tokenId) internal {
    if (from != to) {
      // If the owner is transferring the last token then we checkpoint that the selected level is 0 because they no longer have a token
      if (from != address(0) && balanceOf(from) == 1) {
        _updateLevelSelected(from, 0); // Set the selected level to 0, i.e., no level selected

        _select(from, 0); // Set the selected token to 0, i.e., no token selected
      }
      // If the owner is receiving their first token then we checkpoint the selected level to the token's level
      if (to != address(0) && balanceOf(to) == 0) {
        _updateLevelSelected(to, level);

        _select(to, tokenId);
      }
    }
  }

  function _select(address owner, uint256 tokenId) internal whenNotPaused {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    $.selectedTokenId[owner] = tokenId;

    emit Selected(owner, tokenId);
  }

  function _updateLevelSelected(address owner, uint256 level) internal whenNotPaused {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    // If the selected level is different from the new level then we checkpoint the selected level to the new level
    if (getLevel(owner) != level) {
      (uint256 oldLevel, uint256 newLevel) = _push($._selectedLevelCheckpoints[owner], SafeCast.toUint208(level));

      emit SelectedLevel(owner, oldLevel, newLevel);
    }
  }

  function _push(Checkpoints.Trace208 storage store, uint208 delta) private returns (uint208, uint208) {
    return store.push(clock(), delta);
  }

  /**
   * @dev Get number of checkpoints for `account`.
   */
  function _numCheckpoints(address account) internal view virtual returns (uint32) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return SafeCast.toUint32($._selectedLevelCheckpoints[account].length());
  }

  // ---------- Setters ---------- //

  function setMaxLevel(uint256 level) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(level > 0, "Galaxy Member: Max level must be greater than 0");
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    $.MAX_LEVEL = level;
  }

  function setMaxMintableLevels(uint8[] memory maxMintableLevels) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(
      maxMintableLevels.length == 7,
      "Galaxy Member: Invalid number of max mintable levels. There should be 7 levels, one for each X/Economic node type"
    );

    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    for (uint8 i = 0; i < maxMintableLevels.length; i++) {
      $._xNodeTypeToMaxMintableLevel[i] = maxMintableLevels[i];
    }
  }

  function setXAllocationsGovernorAddress(address _xAllocationsGovernor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_xAllocationsGovernor != address(0), "Galaxy Member: _xAllocationsGovernor cannot be the zero address");
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    $.xAllocationsGovernor = IXAllocationVotingGovernor(_xAllocationsGovernor);
  }

  function setB3trGovernorAddress(address _b3trGovernor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_b3trGovernor != address(0), "Galaxy Member: _b3trGovernor cannot be the zero address");
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    $.b3trGovernor = IB3TRGovernor(payable(_b3trGovernor));
  }

  function setBaseURI(string memory baseTokenURI) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(bytes(baseTokenURI).length > 0, "Galaxy Member: Base URI must be set");
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    $._baseTokenURI = baseTokenURI;
  }

  function setB3TRtoUpgradeToLevel(uint256[] memory b3trToUpgradeToLevel) public onlyRole(DEFAULT_ADMIN_ROLE) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    for (uint8 i = 0; i < b3trToUpgradeToLevel.length; i++) {
      $._b3trToUpgradeToLevel[i + 2] = b3trToUpgradeToLevel[i]; // First Level that requires B3TR is level 2
    }
  }

  // ---------- Getters ---------- //

  function getLevel(address owner) public view returns (uint256) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $._selectedLevelCheckpoints[owner].latest();
  }

  function getPastLevel(address owner, uint256 timepoint) public view returns (uint256) {
    uint48 currentTimepoint = clock();
    if (timepoint >= currentTimepoint) {
      revert ERC5805FutureLookup(timepoint, currentTimepoint);
    }
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $._selectedLevelCheckpoints[owner].upperLookupRecent(SafeCast.toUint48(timepoint));
  }

  function numCheckpoints(address account) public view returns (uint32) {
    return _numCheckpoints(account);
  }

  function participatedInGovernance(address user) public view returns (bool) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    require(
      $.xAllocationsGovernor != IXAllocationVotingGovernor(address(0)),
      "Galaxy Member: XAllocationVotingGovernor not set"
    );
    require($.b3trGovernor != IB3TRGovernor(payable(address(0))), "Galaxy Member: B3TRGovernor not set");

    if ($.xAllocationsGovernor.hasVotedOnce(user) || $.b3trGovernor.hasVotedOnce(user)) {
      return true;
    }

    return false;
  }

  function baseURI() public view returns (string memory) {
    return _baseURI();
  }

  function getMaxMintableLevelOfXNode(uint8 xNodeType) public view returns (uint256) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $._xNodeTypeToMaxMintableLevel[xNodeType];
  }

  function getB3TRtoUpgradeToLevel(uint256 level) public view returns (uint256) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $._b3trToUpgradeToLevel[level];
  }

  function getNextLevel(uint256 tokenId) public view returns (uint256) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $.levelOf[tokenId] + 1;
  }

  function getB3TRtoUpgrade(uint256 tokenId) public view returns (uint256) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $._b3trToUpgradeToLevel[$.levelOf[tokenId] + 1];
  }

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

  function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    uint256 levelOfToken = $.levelOf[tokenId];
    return levelOfToken > 0 ? string.concat(baseURI(), Strings.toString(levelOfToken)) : "";
  }

  function xAllocationsGovernor() public view returns (IXAllocationVotingGovernor) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $.xAllocationsGovernor;
  }

  function b3trGovernor() public view returns (IB3TRGovernor) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $.b3trGovernor;
  }

  function b3tr() public view returns (IB3TR) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $.b3tr;
  }

  function treasury() public view returns (address) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $.treasury;
  }

  function MAX_LEVEL() public view returns (uint256) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $.MAX_LEVEL;
  }

  function levelOf(uint256 tokenId) public view returns (uint256) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $.levelOf[tokenId];
  }

  function selectedTokenId(address owner) public view returns (uint256) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $.selectedTokenId[owner];
  }

  // ---------- Overrides ---------- //

  function _update(
    address to,
    uint256 tokenId,
    address auth
  ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) returns (address) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    _moveOwnershipLevel(auth, to, $.levelOf[tokenId], tokenId);

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

  function _baseURI() internal view override returns (string memory) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $._baseTokenURI;
  }
}
