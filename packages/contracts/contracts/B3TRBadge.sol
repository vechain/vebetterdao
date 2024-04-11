// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC6372.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { IB3TRGovernor } from "./interfaces/IB3TRGovernor.sol";
import { IB3TR } from "./interfaces/IB3TR.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract B3TRBadge is
  Initializable,
  ERC721Upgradeable,
  ERC721EnumerableUpgradeable,
  ERC721PausableUpgradeable,
  AccessControlUpgradeable,
  IERC6372,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  using Checkpoints for Checkpoints.Trace208;
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

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
    // Value-Frequency map tracking levels owned by users
    mapping(address => mapping(uint256 => uint256)) _ownedLevels;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.B3TRBadge")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant B3TRBadgeStorageLocation =
    0x150e16fa8ec3868c60e68a743142094d7e1a46630e5f53ea9f65c39ff4b11000;

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

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    string memory name,
    string memory symbol,
    address admin,
    address upgrader,
    uint256 maxLevel,
    string memory baseTokenURI,
    uint256[] memory xNodeMaxMintableLevels,
    uint256[] memory b3trToUpgradeToLevel,
    address _b3tr,
    address _treasury
  ) public initializer {
    require(maxLevel > 0, "Galaxy Member: Max level must be greater than 0");
    require(bytes(baseTokenURI).length > 0, "Galaxy Member: Base URI must be set");
    require(
      xNodeMaxMintableLevels.length == 7,
      "Galaxy Member: Invalid number of max mintable levels. There should be 7 levels, one for each X/Economic node type"
    );
    require(_b3tr != address(0), "Galaxy Member: B3TR token address cannot be the zero address");
    require(_treasury != address(0), "Galaxy Member: Treasury address cannot be the zero address");

    __ERC721_init(name, symbol);
    __ERC721Enumerable_init();
    __ERC721Pausable_init();
    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();

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
    _grantRole(UPGRADER_ROLE, upgrader);
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

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

    uint256 tokenId = $._nextTokenId;

    $.levelOf[tokenId] = 1;

    safeMint(msg.sender);
  }

  function upgrade(uint256 tokenId) public nonReentrant whenNotPaused {
    require(ownerOf(tokenId) == msg.sender, "Galaxy Member: you must own the Token to upgrade it");
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();

    uint256 currentLevel = $.levelOf[tokenId];

    require(currentLevel < $.MAX_LEVEL, "Galaxy Member: Token is already at max level");

    uint256 b3trRequired = $._b3trToUpgradeToLevel[currentLevel + 1];

    require($.b3tr.balanceOf(msg.sender) >= b3trRequired, "Galaxy Member: Insufficient balance to upgrade");

    require(
      $.b3tr.allowance(msg.sender, address(this)) >= b3trRequired,
      "Galaxy Member: Insufficient allowance to upgrade"
    );

    $.levelOf[tokenId] = currentLevel + 1;

    $._ownedLevels[msg.sender][currentLevel]--;
    $._ownedLevels[msg.sender][currentLevel + 1]++;

    uint256 currentHighestLevel = getHighestLevel(msg.sender);

    if ($.levelOf[tokenId] > currentHighestLevel) {
      _updateLevelSelected(msg.sender, $.levelOf[tokenId]);
    }

    require($.b3tr.transferFrom(msg.sender, $.treasury, b3trRequired), "B3TRBadge: Transfer failed");

    emit Upgraded(tokenId, currentLevel, $.levelOf[tokenId]);
  }

  function selectHighestLevel() public {
    _selectHighestLevel(msg.sender);
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
   * @dev Selects the highest level owned by the owner
   */
  function _selectHighestLevel(address owner) internal {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();

    /**
     * @dev Loop through the levels owned by the user and select the highest level
     * Out-of-gas safe as the loop will break as soon as the highest level is found and the MAX_LEVEL should not be too high
     */
    for (uint256 level = $.MAX_LEVEL; level > 0; level--) {
      if ($._ownedLevels[owner][level] > 0) {
        _updateLevelSelected(owner, level);
        break;
      }
    }
  }

  /**
   * @dev Updates the highest level owned by the user
   */
  function _updateHighestLevelOwned(address from, address to, uint256 tokenId) internal {
    if (from != to) {
      B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();

      if (from != address(0)) {
        // If the owner is transferring their only token then we checkpoint the selected level to 0
        if (balanceOf(from) == 1) _updateLevelSelected(from, 0);

        $._ownedLevels[from][$.levelOf[tokenId]]--;

        // If the user is transferring a token of the highest level they own then we select the next highest level
        // note that it might be the same level if they own multiple tokens of the same level
        if ($.levelOf[tokenId] == getHighestLevel(from) && balanceOf(from) > 1) _selectHighestLevel(from);
      }
      if (to != address(0)) {
        $._ownedLevels[to][$.levelOf[tokenId]]++;

        if ($.levelOf[tokenId] > getHighestLevel(to)) {
          _updateLevelSelected(to, $.levelOf[tokenId]);
        }
      }
    }
  }

  function _updateLevelSelected(address owner, uint256 level) internal whenNotPaused {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    // If the selected level is different from the new level then we checkpoint the selected level to the new level
    if (getHighestLevel(owner) != level) {
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

  /**
   * @dev Get the `pos`-th checkpoint for `account`.
   */
  function _checkpoints(address account, uint32 pos) internal view virtual returns (Checkpoints.Checkpoint208 memory) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();

    return $._selectedLevelCheckpoints[account].at(pos);
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

  function getHighestLevel(address owner) public view returns (uint256) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $._selectedLevelCheckpoints[owner].latest();
  }

  function getPastHighestLevel(address owner, uint256 timepoint) public view returns (uint256) {
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

  /**
   * @dev Get the `pos`-th checkpoint for `account`.
   */
  function checkpoints(address account, uint32 pos) public view virtual returns (Checkpoints.Checkpoint208 memory) {
    return _checkpoints(account, pos);
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

  function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable) returns (string memory) {
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

  // ---------- Overrides ---------- //

  function _update(
    address to,
    uint256 tokenId,
    address auth
  ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable) returns (address) {
    _updateHighestLevelOwned(auth, to, tokenId);

    return super._update(to, tokenId, auth);
  }

  function _increaseBalance(
    address account,
    uint128 value
  ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
    super._increaseBalance(account, value);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function _baseURI() internal view override returns (string memory) {
    B3TRBadgeStorage storage $ = _getB3TRBadgeStorage();
    return $._baseTokenURI;
  }
}
