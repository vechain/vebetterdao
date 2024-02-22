// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract B3TR is ERC20Capped, ERC20Pausable, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  constructor(address _admin, address _defaultMinter, uint256 _cap) ERC20Capped(_cap * 1e18) ERC20("B3TR", "B3TR") {
    // Grant the contract deployer the default admin role
    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(MINTER_ROLE, _defaultMinter);
  }

  function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  /**
   * @dev See {ERC20-_mint}.
   *
   * Requirements:
   *
   * - the caller must have the {MINTER_ROLE}.
   * - supply must not exceed cap.
   */
  function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
    _mint(to, amount);
  }

  /**
   * Proxy function to get all token details in one call
   */
  function tokenDetails() external view returns (string memory, string memory, uint8, uint256, uint256) {
    return (name(), symbol(), decimals(), totalSupply(), cap());
  }

  // The following functions are overrides required by Solidity.

  function _update(address from, address to, uint256 value) internal override(ERC20Capped, ERC20Pausable) {
    super._update(from, to, value);
  }
}
