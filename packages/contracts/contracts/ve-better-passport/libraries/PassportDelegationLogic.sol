// SPDX-License-Identifier: MIT

//                                      #######
//                                 ################
//                               ####################
//                             ###########   #########
//                            #########      #########
//          #######          #########       #########
//          #########       #########      ##########
//           ##########     ########     ####################
//            ##########   #########  #########################
//              ################### ############################
//               #################  ##########          ########
//                 ##############      ###              ########
//                  ############                       #########
//                    ##########                     ##########
//                     ########                    ###########
//                       ###                    ############
//                                          ##############
//                                    #################
//                                   ##############
//                                   #########

pragma solidity 0.8.20;

import { PassportStorageTypes } from "./PassportStorageTypes.sol";
import { PassportClockLogic } from "./PassportClockLogic.sol";
import { PassportEIP712SigningLogic } from "./PassportEIP712SigningLogic.sol";
import { PassportTypes } from "./PassportTypes.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

library PassportDelegationLogic {
  // Ethereum addresses are uint160, we can store addresses as uint160 values within the Checkpoints.Trace160
  using Checkpoints for Checkpoints.Trace160;
  // Extends the bytes32 type to support ECDSA signatures
  using ECDSA for bytes32;

  // ---------- Constants ---------- //
  string private constant SIGNING_DOMAIN = "PersonhoodDelegation";
  string private constant SIGNATURE_VERSION = "1";
  bytes32 private constant DELEGATION_TYPEHASH =
    keccak256("Delegation(address delegator,address delegatee,uint256 deadline)");

  // ---------- Errors ---------- //
  /// @notice Emitted when a user does not have permission to delegate personhood.
  error PersonhoodDelegationUnauthorizedUser(address user);

  /// @notice Emitted when a user tries to delegate personhood to a user that has already been delegated to.
  error AlreadyDelegated(address delegator);

  /// @notice Emitted when a user tries to delegate personhood to themselves.
  error CannotDelegateToSelf(address user);

  /// @notice Emitted when a user tries to revoke a delegation that does not exist.
  error NotDelegated(address user);

  /// @notice Emitted when a user tries to delegate personhood to more than one user.
  error OnlyOneUserAllowed();

  /// @notice Emitted when a user tries to delegate with a
  error SignatureExpired();

  /// @notice Emitted when a user tries to delegate with a
  error InvaliedSignature();

  // ---------- Events ---------- //
  /// @notice Emitted when a user delegates personhood to another user.
  event DelegationCreated(address indexed delegator, address indexed delegatee);

  /// @notice Emitted when a user delegates personhood to another user pending acceptance.
  event DelegationPending(address indexed delegator, address indexed delegatee);

  /// @notice Emitted when a user revokes the delegation of personhood to another user.
  event DelegationRevoked(address indexed delegator, address indexed delegatee);

  // ---------- Getters ---------- //

  /// @notice Returns the delegatee address for a delegator
  /// @param delegator - the delegator address
  function getDelegatee(
    PassportStorageTypes.PassportStorage storage self,
    address delegator
  ) public view returns (address) {
    return _addressFromUint160(self.delegatorToDelegatee[delegator].latest());
  }

  /// @notice Returns the delegatee address for a delegator at a specific timepoint
  /// @param delegator - the delegator address
  /// @param timepoint - the timepoint to query
  function getDelegateeInTimepoint(
    PassportStorageTypes.PassportStorage storage self,
    address delegator,
    uint256 timepoint
  ) external view returns (address) {
    return _addressFromUint160(self.delegatorToDelegatee[delegator].upperLookupRecent(SafeCast.toUint48(timepoint)));
  }

  /// @notice Returns the delegator address for a delegatee
  /// @param delegatee - the delegatee address
  function getDelegator(
    PassportStorageTypes.PassportStorage storage self,
    address delegatee
  ) public view returns (address) {
    return _addressFromUint160(self.delegateeToDelegator[delegatee].latest());
  }

  /// @notice Returns the delegator address for a delegatee at a specific timepoint
  /// @param delegatee - the delegatee address
  /// @param timepoint - the timepoint to query
  function getDelegatorInTimepoint(
    PassportStorageTypes.PassportStorage storage self,
    address delegatee,
    uint256 timepoint
  ) external view returns (address) {
    return _addressFromUint160(self.delegateeToDelegator[delegatee].upperLookupRecent(SafeCast.toUint48(timepoint)));
  }

  /// @notice Returns if a user is a delegator
  /// @param user - the user address
  function isDelegator(PassportStorageTypes.PassportStorage storage self, address user) internal view returns (bool) {
    return self.delegatorToDelegatee[user].latest() != 0;
  }

  /// @notice Returns if a user is a delegator at a specific timepoint
  /// @param user - the user address
  /// @param timepoint - the timepoint to query
  function isDelegatorInTimepoint(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    uint256 timepoint
  ) external view returns (bool) {
    return self.delegatorToDelegatee[user].upperLookupRecent(SafeCast.toUint48(timepoint)) != 0;
  }

  /// @notice Returns if a user is a delegatee
  /// @param user - the user address
  function isDelegatee(PassportStorageTypes.PassportStorage storage self, address user) internal view returns (bool) {
    return self.delegateeToDelegator[user].latest() != 0;
  }

  /// @notice Returns if a user is a delegatee at a specific timepoint
  /// @param user - the user address
  /// @param timepoint - the timepoint to query
  function isDelegateeInTimepoint(
    PassportStorageTypes.PassportStorage storage self,
    address user,
    uint256 timepoint
  ) external view returns (bool) {
    return self.delegateeToDelegator[user].upperLookupRecent(SafeCast.toUint48(timepoint)) != 0;
  }

  /// @notice Returns the pending delegations for a delegatee
  /// @param delegatee - the delegatee address
  /// @return the delegator address
  function getPendingDelegations(
    PassportStorageTypes.PassportStorage storage self,
    address delegatee
  ) internal view returns (address[] memory) {
    return self.pendingDelegationsDelegateeToDelegators[delegatee];
  }

  // ---------- Setters ------------ //

  /// @notice Delegate the personhood to another address
  /// The delegator must sign a message where he authorizes the delegatee to request the delegation:
  /// this is done to avoid that a malicious user delegates the personhood to another user without his consent.
  /// Eg: Alice has a personhood where she is not considered a person, she delegates her personhood to Bob, which
  /// is considered a person. Bob now cannot vote because he is not considered a person anymore.
  /// @param delegator - the delegator address
  /// @param deadline - the deadline for the signature
  /// @param signature - the signature of the delegation
  function delegateWithSignature(
    PassportStorageTypes.PassportStorage storage self,
    address delegator,
    uint256 deadline,
    bytes memory signature
  ) external {
    if (block.timestamp > deadline) {
      revert SignatureExpired();
    }

    // Recover the signer address from the signature
    bytes32 structHash = keccak256(abi.encode(DELEGATION_TYPEHASH, delegator, msg.sender, deadline));
    bytes32 digest = PassportEIP712SigningLogic.hashTypedDataV4(structHash);
    address signer = digest.recover(signature);

    if (signer != delegator) {
      revert InvaliedSignature();
    }

    if (signer == msg.sender) {
      revert CannotDelegateToSelf(signer);
    }

    if (self.delegateeToDelegator[msg.sender].latest() != 0) {
      revert AlreadyDelegated(delegator);
    }

    _pushCheckpoint(self.delegatorToDelegatee[delegator], msg.sender);
    _pushCheckpoint(self.delegateeToDelegator[msg.sender], delegator);

    emit DelegationCreated(delegator, msg.sender);
  }

  /// @notice Delegate the personhood to another address
  /// @dev The delegatee must accept the delegation
  /// Eg: Alice has a personhood where she is not considered a person, she delegates her personhood to Bob, which
  /// is considered a person. Bob now cannot vote because he is not considered a person anymore.
  function delegatePersonhood(PassportStorageTypes.PassportStorage storage self, address delegatee) external {
    if (self.delegatorToDelegatee[msg.sender].latest() != 0 || self.pendingDelegationsIndexes[msg.sender] != 0) {
      revert AlreadyDelegated(msg.sender);
    }

    // Check if the delegatee is trying to delegate to themselves
    if (msg.sender == delegatee) {
      revert CannotDelegateToSelf(msg.sender);
    }

    // Get the length of the pending delegations
    uint256 length = self.pendingDelegationsDelegateeToDelegators[delegatee].length;

    // Add the delegator to the pending delegations indexes
    self.pendingDelegationsIndexes[msg.sender] = length + 1;

    // Add the delegator to the pending delegations of the delegatee
    self.pendingDelegationsDelegateeToDelegators[delegatee].push(msg.sender);
    self.pendingDelegationsDelegatorToDelegatee[msg.sender] = delegatee;

    emit DelegationPending(msg.sender, delegatee);
  }

  /// @notice Allow the delegatee to accept the delegation
  /// @param delegator - the delegator address
  function acceptDelegation(PassportStorageTypes.PassportStorage storage self, address delegator) external {
    uint256 index = self.pendingDelegationsIndexes[delegator];

    // Check if the pending delegation exists
    if (index == 0) {
      revert NotDelegated(msg.sender); // Delegator not found in the pending delegations
    }

    // Correct the index (since we store index + 1)
    index -= 1;

    // Get the length of pending delegations for the delegatee
    uint256 pendingDelegationsLength = self.pendingDelegationsDelegateeToDelegators[msg.sender].length;

    // Check if the delegation is valid
    address delegatorToAccept = self.pendingDelegationsDelegateeToDelegators[msg.sender][index];
    if (delegatorToAccept != delegator) {
      revert PersonhoodDelegationUnauthorizedUser(msg.sender); // Delegation does not match
    }

    // Add the delegator to the delegatee and the delegatee to the delegator
    _pushCheckpoint(self.delegateeToDelegator[msg.sender], delegator);
    _pushCheckpoint(self.delegatorToDelegatee[delegator], msg.sender);

    // Remove the pending delegation
    _removePendingDelegation(self, delegator, msg.sender);

    emit DelegationCreated(delegator, msg.sender);
  }

  /// @notice Revoke the delegation (can be done by the delegator or the delegatee)
  /// This method revokes the delegation between the delegator and delegatee, whichever one is calling.
  /// It checks if the caller is either the delegator or the delegatee, and resets the delegation.
  /// @param self - the storage reference for PassportStorage
  function revokeDelegation(PassportStorageTypes.PassportStorage storage self) external {
    address user = msg.sender;
    address delegator;
    address delegatee;

    // Check if user is either a delegator or delegatee
    if (isDelegator(self, user)) {
      delegator = user;
      delegatee = getDelegatee(self, user);
    } else if (isDelegatee(self, user)) {
      delegatee = user;
      delegator = getDelegator(self, user);
    } else {
      revert NotDelegated(user);
    }

    // Revoke the delegation and reset the checkpoints
    _pushCheckpoint(self.delegatorToDelegatee[delegator], address(0));
    _pushCheckpoint(self.delegateeToDelegator[delegatee], address(0));

    emit DelegationRevoked(delegator, delegatee);
  }

  ///@notice Allows a delegator to remove their pending delegation to a delegatee.
  function removePendingDelegation(PassportStorageTypes.PassportStorage storage self, address delegator) external {
    address delegatee = self.pendingDelegationsDelegatorToDelegatee[delegator];

    // Check if the pending delegation exists
    if (delegatee == address(0)) {
      revert NotDelegated(delegator);
    }

    // Check caller is the delegator or the delegatee
    if (msg.sender != delegator && msg.sender != delegatee) {
      revert PersonhoodDelegationUnauthorizedUser(msg.sender);
    }

    // Use the _removePendingDelegation function to handle the deletion logic
    _removePendingDelegation(self, delegator, delegatee);

    emit DelegationRevoked(delegator, delegatee);
  }

  // ---------- Private ---------- //
  /// @notice Push a new checkpoint for the delegator and delegatee
  function _pushCheckpoint(Checkpoints.Trace160 storage store, address value) private {
    store.push(PassportClockLogic.clock(), uint160(value));
  }

  /// @notice Removes a pending delegation between a delegator and a delegatee.
  /// @dev This function removes the delegator from the delegatee's pending delegation list and updates the pendingDelegationsIndexes for the delegator.
  ///     The function swaps the last element in the pending delegation array with the one being removed and pops the last element to avoid leaving gaps.
  /// @param self The PassportStorage structure containing delegation mappings and lists.
  /// @param delegator The address of the delegator who initiated the pending delegation.
  /// @param delegatee The address of the delegatee to whom the delegator is delegating.
  function _removePendingDelegation(
    PassportStorageTypes.PassportStorage storage self,
    address delegator,
    address delegatee
  ) private {
    uint256 index = self.pendingDelegationsIndexes[delegator];

    uint256 pendingDelegationsLength = self.pendingDelegationsDelegateeToDelegators[delegatee].length;

    // Adjust index (since it's stored as index + 1)
    index -= 1;

    // Swap the last element with the element to delete
    if (index != pendingDelegationsLength - 1) {
      address lastDelegator = self.pendingDelegationsDelegateeToDelegators[delegatee][pendingDelegationsLength - 1];
      self.pendingDelegationsDelegateeToDelegators[delegatee][index] = lastDelegator;
      self.pendingDelegationsIndexes[lastDelegator] = index + 1; // Update the index
    }

    // Pop the last element (removes the duplicate or the swapped one)
    self.pendingDelegationsDelegateeToDelegators[delegatee].pop();

    // Clear the pending delegation index for the removed delegator
    delete self.pendingDelegationsIndexes[delegator];
    delete self.pendingDelegationsDelegatorToDelegatee[delegator];
  }

  /// @notice Convert a uint160 value to an address
  function _addressFromUint160(uint160 value) private pure returns (address) {
    return address(uint160(value));
  }
}
