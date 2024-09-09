// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IBotSignaling } from "../interfaces/IBotSignaling.sol";

/// @title BotSignaling
/// @notice Contract to handle the signaling of users that apps consider as bots or malicious actors.
/// Only addresses with the SIGNALER_ROLE can signal users.
/// There is a threshold of signals that a user must reach to be considered a bot.
contract BotSignaling is Initializable, AccessControlUpgradeable, IBotSignaling {
  bytes32 public constant SIGNALER_ROLE = keccak256("SIGNALER_ROLE");

  // ---------- Storage ------------ //

  struct BotSignalingStorage {
    mapping(address user => uint256) _signaledCounter;
    uint256 signalsThreshold;
    // App signals counter
    mapping(address signaler => bytes32 app) _appOfSignaler;
    mapping(bytes32 app => mapping(address user => uint256)) _appSignalsCounter;
    mapping(bytes32 app => uint256) _appTotalSignalsCounter;
  }

  // keccak256(abi.encode(uint256(keccak256("storage.BotSignaling")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant BotSignalingStorageLocation =
    0x564b0eacbfc3da4d5493a982c1b51a504eba529713a65df72dc5051250a8f500;

  function _getBotSignalingStorage() private pure returns (BotSignalingStorage storage $) {
    assembly {
      $.slot := BotSignalingStorageLocation
    }
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Initializes the contract
   */
  function __BotSignaling_init(address[] memory _signalers, uint256 _threshold) internal onlyInitializing {
    __BotSignaling_init_unchained(_signalers, _threshold);
  }

  function __BotSignaling_init_unchained(address[] memory _signalers, uint256 _threshold) internal onlyInitializing {
    for (uint256 i; i < _signalers.length; i++) {
      require(_signalers[i] != address(0), "BotSignaling: signaler address cannot be zero");
      _grantRole(SIGNALER_ROLE, _signalers[i]);
    }

    BotSignalingStorage storage $ = _getBotSignalingStorage();
    $.signalsThreshold = _threshold;
  }

  // ---------- Modifiers ------------ //

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) virtual {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert BotSignalingUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Getters ---------- //

  /// @notice Returns the number of times a user has been signaled
  function signaledCounter(address _user) public view returns (uint256) {
    return _getBotSignalingStorage()._signaledCounter[_user];
  }

  /// @notice Returns the belonging app of a signaler
  function appOfSignaler(address _signaler) public view returns (bytes32) {
    return _getBotSignalingStorage()._appOfSignaler[_signaler];
  }

  /// @notice Returns the number of times a user has been signaled by an app
  function appSignalsCounter(bytes32 _app, address _user) public view returns (uint256) {
    return _getBotSignalingStorage()._appSignalsCounter[_app][_user];
  }

  /// @notice Returns the total number of signals for an app
  function appTotalSignalsCounter(bytes32 _app) public view returns (uint256) {
    return _getBotSignalingStorage()._appTotalSignalsCounter[_app];
  }

  /// @notice Returns the signaling threshold
  function signalingThreshold() public view returns (uint256) {
    return _getBotSignalingStorage().signalsThreshold;
  }

  // ---------- Setters ---------- //

  /// @notice Signals a user
  function signalUser(address _user) external onlyRoleOrAdmin(SIGNALER_ROLE) {
    _signalUser(_user, "");
  }

  /// @notice Signals a user with a reason
  function signalUserWithReason(address _user, string memory reason) external onlyRoleOrAdmin(SIGNALER_ROLE) {
    _signalUser(_user, reason);
  }

  /// @notice Internal function to signal a user
  function _signalUser(address _user, string memory reason) internal virtual onlyRoleOrAdmin(SIGNALER_ROLE) {
    BotSignalingStorage storage $ = _getBotSignalingStorage();
    $._signaledCounter[_user]++;

    bytes32 app = $._appOfSignaler[msg.sender];
    $._appSignalsCounter[app][_user]++;
    $._appTotalSignalsCounter[app]++;

    emit UserSignaled(_user, msg.sender, app, reason);
  }

  /// @notice Internal function to assign a signaler to an app
  function _assignSignalerToApp(bytes32 _app, address _user) internal virtual {
    require(_app != bytes32(0), "BotSignaling: app cannot be zero");
    require(_user != address(0), "BotSignaling: user cannot be zero");

    BotSignalingStorage storage $ = _getBotSignalingStorage();
    $._appOfSignaler[_user] = _app;
    emit SignalerAssignedToApp(_user, _app);
  }

  /// @notice Internal function to remove a signaler from an app
  function _removeSignalerFromApp(address user) internal virtual {
    require(user != address(0), "BotSignaling: user cannot be zero");

    BotSignalingStorage storage $ = _getBotSignalingStorage();

    // to emit in the event
    bytes32 app = $._appOfSignaler[user];

    $._appOfSignaler[user] = bytes32(0);

    emit SignalerRemovedFromApp(user, app);
  }

  /// @notice Sets the signaling threshold
  function setSignalingThreshold(uint256 _threshold) external onlyRoleOrAdmin(DEFAULT_ADMIN_ROLE) {
    BotSignalingStorage storage $ = _getBotSignalingStorage();
    $.signalsThreshold = _threshold;
  }
}
