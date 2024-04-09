// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// VOT3 contract
contract VOT3 is
  Initializable,
  ERC20Upgradeable,
  ERC20PausableUpgradeable,
  AccessControlUpgradeable,
  ERC20PermitUpgradeable,
  ERC20VotesUpgradeable,
  UUPSUpgradeable
{
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /// @custom:storage-location erc7201:b3tr.storage.VOT3
  struct VOT3Storage {
    IERC20 b3tr;
    mapping(address account => uint256) _stakedBalances;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.VOT3")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant VOT3StorageLocation = 0x8af7882bba84ab51775aa801e199e7d1dfd5f5ff08dcfbb73c614b3313e4cb00;

  function _getVOT3Storage() private pure returns (VOT3Storage storage $) {
    assembly {
      $.slot := VOT3StorageLocation
    }
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address _admin, address _b3tr) public initializer {
    __ERC20_init("VOT3", "VOT3");
    __ERC20Pausable_init();
    __AccessControl_init();
    __ERC20Permit_init("VOT3");
    __ERC20Votes_init();
    __UUPSUpgradeable_init();
    __Nonces_init();

    VOT3Storage storage $ = _getVOT3Storage();
    // Grant the contract deployer the default admin role and the UPGRADER_ROLE
    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(UPGRADER_ROLE, _admin);
    $.b3tr = IERC20(_b3tr);
  }

  function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  function stakedBalanceOf(address account) public view returns (uint256) {
    VOT3Storage storage $ = _getVOT3Storage();
    return $._stakedBalances[account];
  }

  function stake(uint256 amount) external {
    VOT3Storage storage $ = _getVOT3Storage();
    _mint(msg.sender, amount);
    $._stakedBalances[msg.sender] += amount;

    require($.b3tr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
  }

  function unstake(uint256 amount) external {
    VOT3Storage storage $ = _getVOT3Storage();

    require(balanceOf(msg.sender) >= amount, "Insufficient Vot3 Tokens");
    require($._stakedBalances[msg.sender] >= amount, "Insufficient staked Vot3 Tokens");
    _burn(msg.sender, amount);
    $._stakedBalances[msg.sender] -= amount;
    require($.b3tr.transfer(msg.sender, amount), "Transfer failed");
  }

  function transfer(address to, uint256 value) public override(ERC20Upgradeable) returns (bool) {
    return super.transfer(to, value);
  }

  function approve(address spender, uint256 value) public override(ERC20Upgradeable) returns (bool) {
    return super.approve(spender, value);
  }

  function transferFrom(address from, address to, uint256 value) public override(ERC20Upgradeable) returns (bool) {
    return super.transferFrom(from, to, value);
  }

  /**
   * @param _addr The address to check
   * @return isContract Whether the address is a contract
   */
  function isContract(address _addr) private view returns (bool) {
    uint32 size;
    assembly {
      size := extcodesize(_addr)
    }
    return (size > 0);
  }

  // Overrides required by Solidity
  function _update(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable, ERC20PausableUpgradeable) {
    super._update(from, to, amount);

    // self-delegate if the user is neither unstaking nor has delegated previously nor burning tokens
    if (to != address(0) && !isContract(to) && delegates(to) == address(0)) {
      _delegate(to, to);
    }
  }

  function nonces(
    address owner
  ) public view virtual override(ERC20PermitUpgradeable, NoncesUpgradeable) returns (uint256) {
    return super.nonces(owner);
  }

  function delegate(address delegatee) public override {
    require(paused() == false, "VOT3: contract is paused");

    _delegate(msg.sender, delegatee);
  }

  function b3tr() public view returns (IERC20) {
    VOT3Storage storage $ = _getVOT3Storage();
    return $.b3tr;
  }

  /**
   * @dev Returns the current voting power that `account` has.
   **/
  function getVotingPower(address account) public view returns (uint256) {
    return Math.sqrt(getVotes(account));
  }

  /**
   * @dev Returns the voting power of an `account`.
   **/
  function getPastVotingPower(address account, uint256 timepoint) public view returns (uint256) {
    return Math.sqrt(getPastVotes(account, timepoint));
  }
}
