// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

contract B3TR is ERC20Capped, AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    constructor(
        address _defaultOperator
    ) ERC20Capped(1000000000 * 10 ** 18) ERC20("B3TR", "B3TR") {
        // Grant the contract deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, _defaultOperator);
    }

    /**
     * @dev See {ERC20Capped-cap()}.
     * Proxy function to cap()
     *
     * @return the cap of the token.
     */
    function maxSupply() external view returns (uint256) {
        return cap();
    }

    /**
     * @dev See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the {OPERATOR_ROLE}.
     * - supply must not exceed cap.
     */
    function mint(
        address to,
        uint256 amount
    ) external onlyRole(OPERATOR_ROLE) returns (bool) {
        _mint(to, amount);
        return true;
    }
}
