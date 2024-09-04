// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IBlacklist {
  event UserWhitelisted(address indexed user, address indexed whitelister);
  event UserBlacklisted(address indexed user, address indexed blacklister);

  error BlacklistUnauthorizedUser(address user);

  function whitelistUser(address user) external;

  function blacklistUser(address user) external;

  function isBlacklisted(address _user) external view returns (bool);

  function blacklistingCounter(address _user) external view returns (uint256);
}
