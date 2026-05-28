// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MockPassportActions {
  mapping(address account => mapping(uint256 roundId => uint256 count)) private _userRoundActionCount;
  mapping(address account => mapping(uint256 roundId => mapping(bytes32 appId => uint256 count))) private _userRoundActionCountApp;

  // Personhood state. Tracked as (initialized, value) so tests can opt accounts in/out individually.
  // The default for unset accounts is `true` so existing tests that predate the personhood gate keep passing.
  mapping(address account => bool initialized) private _isPersonInitialized;
  mapping(address account => bool isPerson) private _isPerson;
  mapping(address account => string reason) private _isPersonReason;

  function setUserRoundActionCount(address account, uint256 roundId, uint256 count) external {
    _userRoundActionCount[account][roundId] = count;
  }

  function setUserRoundActionCountApp(address account, uint256 roundId, bytes32 appId, uint256 count) external {
    _userRoundActionCountApp[account][roundId][appId] = count;
  }

  /// @notice Configures the personhood verdict for a given account in the mock.
  /// @param account Address to override.
  /// @param isPerson_ Whether the account should be considered a person.
  /// @param reason Reason string returned alongside the verdict (e.g. "User is blacklisted").
  function setIsPerson(address account, bool isPerson_, string calldata reason) external {
    _isPersonInitialized[account] = true;
    _isPerson[account] = isPerson_;
    _isPersonReason[account] = reason;
  }

  function userRoundActionCount(address account, uint256 roundId) external view returns (uint256) {
    return _userRoundActionCount[account][roundId];
  }

  function userRoundActionCountApp(address account, uint256 roundId, bytes32 appId) external view returns (uint256) {
    return _userRoundActionCountApp[account][roundId][appId];
  }

  /// @notice Mirrors `IVeBetterPassport.isPerson`. Returns `(true, "")` by default so existing tests are unaffected.
  function isPerson(address account) external view returns (bool, string memory) {
    if (!_isPersonInitialized[account]) {
      return (true, "");
    }
    return (_isPerson[account], _isPersonReason[account]);
  }
}
