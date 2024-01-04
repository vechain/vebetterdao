// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

// VOT3 contract
contract VOT3 is ERC20, ERC20Permit, ERC20Votes, AccessControl {
  IERC20 public b3tr;
  bool public canTransfer = false;

  modifier transferEnabled() {
    require(canTransfer, "Transfers disabled");
    _;
  }

  constructor(address _b3tr) ERC20("VOT3", "VOT3") ERC20Permit("VOT3") {
    // Grant the contract deployer the default admin role
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    b3tr = IERC20(_b3tr);
  }

  function setCanTransfer(bool _canTransfer) public onlyRole(DEFAULT_ADMIN_ROLE) {
    canTransfer = _canTransfer;
  }

  function stake(uint256 amount) external {
    require(b3tr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    _mint(msg.sender, amount);
  }

  function unstake(uint256 amount) external {
    require(balanceOf(msg.sender) >= amount, "Insufficient Vot3 Tokens");
    _burn(msg.sender, amount);
    require(b3tr.transfer(msg.sender, amount), "Transfer failed");
  }

  function transfer(address to, uint256 value) public override(ERC20) transferEnabled returns (bool) {
    return super.transfer(to, value);
  }

  function approve(address spender, uint256 value) public override(ERC20) transferEnabled returns (bool) {
    return super.approve(spender, value);
  }

  function transferFrom(address from, address to, uint256 value) public override(ERC20) transferEnabled returns (bool) {
    return super.transferFrom(from, to, value);
  }

  // Overrides required by Solidity
  function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
    super._update(from, to, amount);
  }

  function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
    return super.nonces(owner);
  }
}
