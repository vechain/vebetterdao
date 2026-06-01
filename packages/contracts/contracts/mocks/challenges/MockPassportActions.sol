// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MockPassportActions {
  mapping(address account => mapping(uint256 roundId => uint256 count)) private _userRoundActionCount;
  mapping(address account => mapping(uint256 roundId => mapping(bytes32 appId => uint256 count))) private _userRoundActionCountApp;

  // Personhood mock (legacy — kept so tests written against the previous `isPerson`-based gating still build).
  mapping(address account => bool initialized) private _isPersonInitialized;
  mapping(address account => bool isPerson) private _isPerson;
  mapping(address account => string reason) private _isPersonReason;

  // Sybil-flag state used by the soft V2 gate (blacklist + signaling threshold). Defaults: not flagged.
  mapping(address account => bool isBlacklisted) private _isBlacklisted;
  mapping(address account => uint256 count) private _signaledCounter;
  uint256 private _signalingThreshold;

  function setUserRoundActionCount(address account, uint256 roundId, uint256 count) external {
    _userRoundActionCount[account][roundId] = count;
  }

  function setUserRoundActionCountApp(address account, uint256 roundId, bytes32 appId, uint256 count) external {
    _userRoundActionCountApp[account][roundId][appId] = count;
  }

  /// @notice Legacy personhood setter. Retained so older tests keep compiling; the V2 gate no longer reads
  /// `isPerson` — it reads `isBlacklisted` + `signaledCounter` / `signalingThreshold`. Tests that need to
  /// fail the new gate should use `setIsBlacklisted` or `setSignaledCounter` + `setSignalingThreshold`.
  function setIsPerson(address account, bool isPerson_, string calldata reason) external {
    _isPersonInitialized[account] = true;
    _isPerson[account] = isPerson_;
    _isPersonReason[account] = reason;
  }

  /// @notice Configures the blacklist verdict for a given account.
  function setIsBlacklisted(address account, bool value) external {
    _isBlacklisted[account] = value;
  }

  /// @notice Configures the signaled counter for a given account.
  function setSignaledCounter(address account, uint256 count) external {
    _signaledCounter[account] = count;
  }

  /// @notice Configures the global signaling threshold. Default is 0 → signaling check is disabled.
  function setSignalingThreshold(uint256 threshold) external {
    _signalingThreshold = threshold;
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

  function isBlacklisted(address account) external view returns (bool) {
    return _isBlacklisted[account];
  }

  function signaledCounter(address account) external view returns (uint256) {
    return _signaledCounter[account];
  }

  function signalingThreshold() external view returns (uint256) {
    return _signalingThreshold;
  }
}
