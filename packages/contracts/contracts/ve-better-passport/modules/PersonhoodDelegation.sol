// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IPersonhoodDelegation } from "../interfaces/IPersonhoodDelegation.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

/**
 * @title PersonhoodDelegation
 * @notice This contract allows users to delegate their personhood to another wallet or AA.
 * @dev Only one delegation per time is allowed, both for the delegator and the delegatee.
 * The contract uses Checkpoints to store the delegation history, allowing the B3TR DAO to query for
 * the delegator address at the start of a specific round (avoiding sybil attacks).
 */
contract PersonhoodDelegation is Initializable, AccessControlUpgradeable, IPersonhoodDelegation, EIP712Upgradeable {
  // Ethereum addresses are uint160, we can store addresses as uint160 values within the Checkpoints.Trace160
  using Checkpoints for Checkpoints.Trace160;
  // Extends the bytes32 type to support ECDSA signatures
  using ECDSA for bytes32;

  string private constant SIGNING_DOMAIN = "PersonhoodDelegation";
  string private constant SIGNATURE_VERSION = "1";

  // ---------- Storage ------------ //

  struct Delegation {
    address delegator;
    address delegatee;
    uint256 deadline;
  }

  bytes32 private constant DELEGATION_TYPEHASH =
    keccak256("Delegation(address delegator,address delegatee,uint256 deadline)");

  struct PersonhoodDelegationStorage {
    mapping(address => Checkpoints.Trace160) delegatorToDelegatee;
    mapping(address => Checkpoints.Trace160) delegateeToDelegator;
  }

  bytes32 private constant PersonhoodDelegationStorageLocation =
    0x91f40f78b5c3e5d39cc1c761de58fd46b47234f93fe10426a471a629784f6c00;

  function _getPersonhoodDelegationStorage() private pure returns (PersonhoodDelegationStorage storage $) {
    assembly {
      $.slot := PersonhoodDelegationStorageLocation
    }
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Initializes the contract.
   */
  function __PersonhoodDelegation_init() internal onlyInitializing {
    __PersonhoodDelegation_init_unchained();
  }

  function __PersonhoodDelegation_init_unchained() internal onlyInitializing {
    __EIP712_init(SIGNING_DOMAIN, SIGNATURE_VERSION);
  }

  // ---------- Modifiers ------------ //

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) virtual {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert PersonhoodDelegationUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Getters ---------- //

  /// @notice Returns the delegatee address for a delegator
  /// @param delegator - the delegator address
  function getDelegatee(address delegator) public view returns (address) {
    return _addressFromUint160(_getPersonhoodDelegationStorage().delegatorToDelegatee[delegator].latest());
  }

  /// @notice Returns the delegatee address for a delegator at a specific timepoint
  /// @param delegator - the delegator address
  /// @param timepoint - the timepoint to query
  function getDelegateeInTimepoint(address delegator, uint256 timepoint) external view returns (address) {
    return
      _addressFromUint160(
        _getPersonhoodDelegationStorage().delegatorToDelegatee[delegator].upperLookupRecent(
          SafeCast.toUint48(timepoint)
        )
      );
  }

  /// @notice Returns the delegator address for a delegatee
  /// @param delegatee - the delegatee address
  function getDelegator(address delegatee) public view returns (address) {
    return _addressFromUint160(_getPersonhoodDelegationStorage().delegateeToDelegator[delegatee].latest());
  }

  /// @notice Returns the delegator address for a delegatee at a specific timepoint
  /// @param delegatee - the delegatee address
  /// @param timepoint - the timepoint to query
  function getDelegatorInTimepoint(address delegatee, uint256 timepoint) external view returns (address) {
    return
      _addressFromUint160(
        _getPersonhoodDelegationStorage().delegateeToDelegator[delegatee].upperLookupRecent(
          SafeCast.toUint48(timepoint)
        )
      );
  }

  /// @notice Returns if a user is a delegator
  /// @param user - the user address
  function isDelegator(address user) public view returns (bool) {
    return _getPersonhoodDelegationStorage().delegatorToDelegatee[user].latest() != 0;
  }

  /// @notice Returns if a user is a delegator at a specific timepoint
  /// @param user - the user address
  /// @param timepoint - the timepoint to query
  function isDelegatorInTimepoint(address user, uint256 timepoint) external view returns (bool) {
    return
      _getPersonhoodDelegationStorage().delegatorToDelegatee[user].upperLookupRecent(SafeCast.toUint48(timepoint)) != 0;
  }

  /// @notice Returns if a user is a delegatee
  /// @param user - the user address
  function isDelegatee(address user) public view returns (bool) {
    return _getPersonhoodDelegationStorage().delegateeToDelegator[user].latest() != 0;
  }

  /// @notice Returns if a user is a delegatee at a specific timepoint
  /// @param user - the user address
  /// @param timepoint - the timepoint to query
  function isDelegateeInTimepoint(address user, uint256 timepoint) external view returns (bool) {
    return
      _getPersonhoodDelegationStorage().delegateeToDelegator[user].upperLookupRecent(SafeCast.toUint48(timepoint)) != 0;
  }

  // ---------- Signatures and Delegation ------------ //

  /// @notice Delegate the personhood to another address
  /// The delegator must sign a message where he authorizes the delegatee to request the delegation:
  /// this is done to avoid that a malicious user delegates the personhood to another user without his consent.
  /// Eg: Alice has a personhood where she is not considered a person, she delegates her personhood to Bob, which
  /// is considered a person. Bob now cannot vote because he is not considered a person anymore.
  /// @param delegator - the delegator address
  /// @param deadline - the deadline for the signature
  /// @param signature - the signature of the delegation
  function delegateWithSignature(address delegator, uint256 deadline, bytes memory signature) external {
    require(block.timestamp <= deadline, "PersonhoodDelegation: Signature expired");

    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    // Recover the signer address from the signature
    bytes32 structHash = keccak256(abi.encode(DELEGATION_TYPEHASH, delegator, msg.sender, deadline));
    bytes32 digest = _hashTypedDataV4(structHash);
    address signer = digest.recover(signature);

    require(signer == delegator, "PersonhoodDelegation: Invalid signature");

    if (signer == msg.sender) {
      revert CannotDelegateToSelf(signer);
    }

    if ($.delegatorToDelegatee[delegator].latest() != 0) {
      revert AlreadyDelegated(delegator);
    }

    if($.delegateeToDelegator[msg.sender].latest() != 0) {
      revert AlreadyDelegatee(msg.sender);
    }

    _pushCheckpoint($.delegatorToDelegatee[delegator], msg.sender);
    _pushCheckpoint($.delegateeToDelegator[msg.sender], delegator);

    emit DelegationCreated(delegator, msg.sender);
  }

  /// @notice Revoke the delegation (can be done by the delegator or the delegatee)
  /// @dev The delegator can revoke the delegation to the delegatee, or the delegatee can revoke the delegation to the delegator
  function revokeDelegation() public virtual {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    address user = msg.sender;

    if (!isDelegator(user) && !isDelegatee(user)) {
      revert NotDelegated(user);
    }

    address delegatee;
    address delegator;

    if(isDelegator(user)) {
      delegatee = getDelegatee(user);
      delegator = user;
    } else {
      delegatee = user;
      delegator = getDelegator(user);
    }

    if (user != delegator && user != delegatee) {
      revert PersonhoodDelegationUnauthorizedUser(user);
    }

    _pushCheckpoint($.delegatorToDelegatee[delegator], address(0));
    _pushCheckpoint($.delegateeToDelegator[delegatee], address(0));

    emit DelegationRevoked(delegator, delegatee);
  }

  // ---------- Checkpoint Logic ------------ //

  /// @notice Push a new checkpoint for the delegator and delegatee
  function _pushCheckpoint(Checkpoints.Trace160 storage store, address value) private {
    store.push(clock(), uint160(value));
  }

  // ---------- Utility ------------ //

  /// @notice Convert a uint160 value to an address
  function _addressFromUint160(uint160 value) internal pure returns (address) {
    return address(uint160(value));
  }

  /// @notice Get the current block number
  function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  /// @notice Get the clock mode
  function CLOCK_MODE() external view virtual returns (string memory) {
    return "mode=blocknumber&from=default";
  }
}
