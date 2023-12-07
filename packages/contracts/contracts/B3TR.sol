// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract B3TR is ERC20, AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    uint256 private _maxSupply = 1000000000 * 10 ** 18;

    constructor(address _defaultOperator) ERC20("B3TR", "B3TR") {
        // Grant the contract deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, _defaultOperator);
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function mint(address to, uint256 amount) external onlyRole(OPERATOR_ROLE) {
        require(
            totalSupply() + amount <= maxSupply(),
            "B3TR: max supply reached"
        );

        _mint(to, amount);
    }
}
