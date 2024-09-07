// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IPersonhoodDelegation } from "../interfaces/IPersonhoodDelegation.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title PersonhoodDelegation
 * @notice This contract allows users to delegate their personhood to another wallet or AA.
 * @dev Only one delegation per time is allowed, both for the delegator and the delegatee.
 */
contract PersonhoodDelegation is Initializable, AccessControlUpgradeable, IPersonhoodDelegation {
  // Ethereum addresses are uint160, we can store addresses as uint160 values within the Checkpoints.Trace160
  using Checkpoints for Checkpoints.Trace160;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  // ---------- Storage ------------ //

  struct PersonhoodDelegationStorage {
    mapping(address => Checkpoints.Trace160) delegatorToDelegatee;
    mapping(address => Checkpoints.Trace160) delegateeToDelegator;
    mapping(address => Checkpoints.Trace160) isDelegated;
  }

  bytes32 private constant PersonhoodDelegationStorageLocation =
    0x91f40f78b5c3e5d39cc1c761de58fd46b47234f93fe10426a471a629784f6c00;

  function _getPersonhoodDelegationStorage() private pure returns (PersonhoodDelegationStorage storage $) {
    assembly {
      $.slot := PersonhoodDelegationStorageLocation
    }
  }

  /**
   * @dev Initializes the contract.
   */
  function __PersonhoodDelegation_init() internal onlyInitializing {
    __PersonhoodDelegation_init_unchained();
  }

  function __PersonhoodDelegation_init_unchained() internal onlyInitializing {}

  // ---------- Modifiers ------------ //

  /**
   * @dev Modifier to restrict access to only the admin role and the app admin role.
   * @param role the role to check
   */
  modifier onlyRoleOrAdmin(bytes32 role) virtual {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert PersonhoodDelegationUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Getters ---------- //

  /**
   * @notice Get the delegatee of a delegator.
   */
  function getDelegatee(address delegator) external view returns (address) {
    return _addressFromUint160(_getPersonhoodDelegationStorage().delegatorToDelegatee[delegator].latest());
  }

  /**
   * @notice Get the delegatee of a delegator at a specific timepoint.
   */
  function getDelegateeInTimepoint(address delegator, uint256 timestamp) external view returns (address) {
    return
      _addressFromUint160(
        _getPersonhoodDelegationStorage().delegatorToDelegatee[delegator].upperLookupRecent(
          SafeCast.toUint48(timestamp)
        )
      );
  }

  /**
   * @notice Get the delegator of a delegatee.
   */
  function getDelegator(address delegatee) external view returns (address) {
    return _addressFromUint160(_getPersonhoodDelegationStorage().delegateeToDelegator[delegatee].latest());
  }

  /**
   * @notice Get the delegator of a delegatee at a specific timepoint.
   */
  function getDelegatorInTimepoint(address delegatee, uint256 timestamp) external view returns (address) {
    return
      _addressFromUint160(
        _getPersonhoodDelegationStorage().delegateeToDelegator[delegatee].upperLookupRecent(
          SafeCast.toUint48(timestamp)
        )
      );
  }

  /**
   * @notice Check if a user is a delegator.
   */
  function isDelegator(address user) external view returns (bool) {
    return _getPersonhoodDelegationStorage().delegatorToDelegatee[user].latest() != 0;
  }

  /**
   * @notice Check if a user is a delegator at a specific timepoint.
   */
  function isDelegatorInTimepoint(address user, uint256 timestamp) external view returns (bool) {
    return
      _getPersonhoodDelegationStorage().delegatorToDelegatee[user].upperLookupRecent(SafeCast.toUint48(timestamp)) != 0;
  }

  /**
   * @notice Check if a user is a delegatee.
   */
  function isDelegatee(address user) external view returns (bool) {
    return _getPersonhoodDelegationStorage().delegateeToDelegator[user].latest() != 0;
  }

  /**
   * @notice Check if a user is a delegatee at a specific timepoint.
   */
  function isDelegateeInTimepoint(address user, uint256 timestamp) external view returns (bool) {
    return
      _getPersonhoodDelegationStorage().delegateeToDelegator[user].upperLookupRecent(SafeCast.toUint48(timestamp)) != 0;
  }

  /**
   * @notice Get the current block number.
   */
  function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  /**
   * @notice Get the clock mode.
   */
  function CLOCK_MODE() external view virtual returns (string memory) {
    return "mode=blocknumber&from=default";
  }

  // ---------- Setters ---------- //

  /**
   * @notice Delegates personhood to another user.
   */
  function delegate(address delegatee) external {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    if (msg.sender == delegatee) {
      revert CannotDelegateToSelf(msg.sender);
    }

    if ($.delegatorToDelegatee[msg.sender].latest() != 0) {
      revert AlreadyDelegated(msg.sender);
    }

    _pushCheckpoint($.delegatorToDelegatee[msg.sender], delegatee);
    _pushCheckpoint($.delegateeToDelegator[delegatee], msg.sender);

    _pushCheckpoint($.isDelegated[delegatee], address(1)); // Mark as true
    _pushCheckpoint($.isDelegated[msg.sender], address(0)); // Mark as false

    emit DelegationCreated(msg.sender, delegatee);
  }

  /**
   * @notice Revokes the delegation of personhood to another user.
   */
  function revokeDelegation() external {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    address delegatee = _addressFromUint160($.delegatorToDelegatee[msg.sender].latest());
    if (delegatee == address(0)) {
      revert NotDelegated(msg.sender);
    }

    _pushCheckpoint($.isDelegated[msg.sender], address(1)); // Mark as true
    _pushCheckpoint($.isDelegated[delegatee], address(0)); // Mark as false

    _pushCheckpoint($.delegatorToDelegatee[msg.sender], address(0));
    _pushCheckpoint($.delegateeToDelegator[delegatee], address(0));

    emit DelegationRevoked(msg.sender, delegatee);
  }

  /**
   * @notice Store a new checkpoint.
   */
  function _pushCheckpoint(Checkpoints.Trace160 storage store, address value) private {
    store.push(clock(), uint160(value));
  }

  /**
   * @notice Converts a uint160 to an address.
   */
  function _addressFromUint160(uint160 value) internal pure returns (address) {
    return address(uint160(value));
  }
}
