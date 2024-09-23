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

  struct PendingDelegation {
    address delegator;
    address delegatee;
  }

  struct PersonhoodDelegationStorage {
    mapping(address => Checkpoints.Trace160) delegatorToDelegatee;
    mapping(address => Checkpoints.Trace160) delegateeToDelegator;
    PendingDelegation[] pendingDelegations; // Array to store pending delegations
    mapping(address => uint256) pendingDelegationIndex; // Mapping to track index of pending delegations for each delegator
    mapping(address => uint256[]) pendingDelegationsForDelegatee; // Mapping to track pending delegations for each delegatee
  }

  // keccak256(abi.encode(uint256(keccak256("storage.PersonhoodDelegation")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant PersonhoodDelegationStorageLocation =
    0xbf5618f8e5c3454f6c5472527c4c0c7964b63a408ea4de6cb7d64edf5267eb00;

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

    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    // Push empty PendingDelegation to avoid index 0
    $.pendingDelegations.push(PendingDelegation({ delegator: address(0), delegatee: address(0) }));
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

  /// @notice Get all pending delegations for a specific delegatee
  /// @param delegatee - the address of the delegatee
  /// @return An array of PendingDelegation structs
  function getPendingDelegationsForDelegatee(address delegatee) external view returns (PendingDelegation[] memory) {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    uint256[] memory indices = $.pendingDelegationsForDelegatee[delegatee];

    PendingDelegation[] memory result = new PendingDelegation[](indices.length);

    for (uint256 i = 0; i < indices.length; i++) {
      result[i] = $.pendingDelegations[indices[i]];
    }

    return result;
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

    if ($.delegateeToDelegator[msg.sender].latest() != 0) {
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

    if (isDelegator(user)) {
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

  /// @notice Propose a delegation to another address
  /// @param proposedDelegatee - the address to delegate to
  function proposeDelegation(address proposedDelegatee) external {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    if (msg.sender == proposedDelegatee) {
      revert CannotDelegateToSelf(msg.sender);
    }

    if ($.delegatorToDelegatee[msg.sender].latest() != 0) {
      revert AlreadyDelegated(msg.sender);
    }

    if ($.delegateeToDelegator[proposedDelegatee].latest() != 0) {
      revert AlreadyDelegatee(proposedDelegatee);
    }

    // Check if there's already a pending delegation for this delegator
    if ($.pendingDelegationIndex[msg.sender] != 0) {
      revert AlreadyPendingDelegation(msg.sender);
    }

    uint256 index = $.pendingDelegations.length;

    $.pendingDelegations.push(PendingDelegation({ delegator: msg.sender, delegatee: proposedDelegatee }));

    $.pendingDelegationIndex[msg.sender] = index;
    $.pendingDelegationsForDelegatee[proposedDelegatee].push(index);

    emit DelegationProposed(msg.sender, proposedDelegatee);
  }

  /// @notice Accept a proposed delegation
  /// @param delegator - the address of the delegator who proposed the delegation
  function acceptDelegation(address delegator) external {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    uint256 index = $.pendingDelegationIndex[delegator];

    if (index == 0) {
      revert DelegationNotPending(delegator);
    }

    PendingDelegation memory delegation = $.pendingDelegations[index];
    require(delegation.delegatee == msg.sender, "Not the proposed delegatee");

    _pushCheckpoint($.delegatorToDelegatee[delegator], msg.sender);
    _pushCheckpoint($.delegateeToDelegator[msg.sender], delegator);

    // Remove the pending delegation
    _removePendingDelegation(index);

    emit DelegationAccepted(delegator, msg.sender);
    emit DelegationCreated(delegator, msg.sender);
  }

  /// @notice Reject a proposed delegation
  /// @param delegator - the address of the delegator who proposed the delegation
  function rejectDelegation(address delegator) external {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    uint256 index = $.pendingDelegationIndex[delegator];

    if (index == 0) {
      revert DelegationNotPending(delegator);
    }

    PendingDelegation memory delegation = $.pendingDelegations[index];
    require(delegation.delegatee == msg.sender, "Not the proposed delegatee");

    // Remove the pending delegation
    _removePendingDelegation(index);

    emit DelegationRejected(delegator, msg.sender);
  }

  /// @notice removes the pending delegation from the delegator
  function removePendingDelegation() external {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    uint256 index = $.pendingDelegationIndex[msg.sender];

    if (index == 0) {
      revert DelegationNotPending(msg.sender);
    }

    PendingDelegation memory delegation = $.pendingDelegations[index];

    // Remove the pending delegation
    _removePendingDelegation(index);

    emit DelegationRevoked(delegation.delegator, delegation.delegatee);
  }

  /// @notice Remove a pending delegation from the array
  /// @param index - the index of the pending delegation to remove
  function _removePendingDelegation(uint256 index) internal {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    require(index < $.pendingDelegations.length, "Invalid delegation index");

    PendingDelegation memory delegationToRemove = $.pendingDelegations[index];

    // Move the last element to the position of the element to delete
    $.pendingDelegations[index] = $.pendingDelegations[$.pendingDelegations.length - 1];

    // Update the index for the moved delegation
    $.pendingDelegationIndex[$.pendingDelegations[index].delegator] = index;

    // Remove the last element
    $.pendingDelegations.pop();

    // Clear the index for the original delegator
    delete $.pendingDelegationIndex[delegationToRemove.delegator];

    // Remove the index from pendingDelegationsForDelegatee
    _removeFromPendingDelegationsForDelegatee(delegationToRemove.delegatee, index);
  }

  /// @notice Remove an index from pendingDelegationsForDelegatee
  /// @param delegatee - the address of the delegatee
  /// @param indexToRemove - the index to remove
  function _removeFromPendingDelegationsForDelegatee(address delegatee, uint256 indexToRemove) internal {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    uint256[] storage indices = $.pendingDelegationsForDelegatee[delegatee];
    for (uint256 i = 0; i < indices.length; i++) {
      if (indices[i] == indexToRemove) {
        // Move the last element to the position of the element to delete
        indices[i] = indices[indices.length - 1];

        // Remove the last element
        indices.pop();

        // Exit the loop
        break;
      }
    }
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
