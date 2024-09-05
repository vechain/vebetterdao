// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IBotSignaling } from "../interfaces/IBotSignaling.sol";

contract BotSignaling is Initializable, AccessControlUpgradeable, IBotSignaling {
  bytes32 public constant SIGNALER_ROLE = keccak256("SIGNALER_ROLE");
  bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  // ---------- Storage ------------ //

  struct BotSignalingStorage {
    // Mapping to store blacklist status
    mapping(address user => bool) _whitelisted;
    mapping(address user => uint256) _signaledCounter;
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

  /**
   * @dev Initializes the contract
   */
  function __BotSignaling_init(address[] memory _signalers, address[] memory _whitelisters) internal onlyInitializing {
    __BotSignaling_init_unchained(_signalers, _whitelisters);
  }

  function __BotSignaling_init_unchained(
    address[] memory _signalers,
    address[] memory _whitelisters
  ) internal onlyInitializing {
    for (uint256 i; i < _signalers.length; i++) {
      require(_signalers[i] != address(0), "BotSignaling: signaler address cannot be zero");
      _grantRole(SIGNALER_ROLE, _signalers[i]);
    }

    for (uint256 i; i < _whitelisters.length; i++) {
      require(_whitelisters[i] != address(0), "BotSignaling: whitelister address cannot be zero");
      _grantRole(WHITELISTER_ROLE, _whitelisters[i]);
    }
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

  /// @notice Returns if a user is whitelisted
  function isWhitelisted(address _user) public view returns (bool) {
    return _getBotSignalingStorage()._whitelisted[_user];
  }

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

  // ---------- Setters ---------- //

  /// @notice Signals a user
  function signalUser(address _user) external override onlyRoleOrAdmin(SIGNALER_ROLE) {
    BotSignalingStorage storage $ = _getBotSignalingStorage();
    $._signaledCounter[_user]++;

    bytes32 app = $._appOfSignaler[msg.sender];
    $._appSignalsCounter[app][_user]++;
    $._appTotalSignalsCounter[app]++;

    emit UserSignaled(_user, msg.sender, app);
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

  /// @notice user can be whitelisted but the counter will not be reset
  function whitelistUser(address _user) external override onlyRoleOrAdmin(WHITELISTER_ROLE) {
    _getBotSignalingStorage()._whitelisted[_user] = false;
    emit UserWhitelisted(_user, msg.sender);
  }
}
