// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract B3TR is ERC20 {
    uint256 private _maxSupply = 1000000000 * 10 ** 18;

    constructor() ERC20("B3TR", "B3TR") {
        _mint(msg.sender, _maxSupply);
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }
}
