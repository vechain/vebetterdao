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
  ) internal view returns (address) {
    return self.pendingDelegations[delegatee];
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
    require(block.timestamp <= deadline, "Signature expired");

    // Recover the signer address from the signature
    bytes32 structHash = keccak256(abi.encode(DELEGATION_TYPEHASH, delegator, msg.sender, deadline));
    bytes32 digest = PassportEIP712SigningLogic.hashTypedDataV4(structHash);
    address signer = digest.recover(signature);

    require(signer == delegator, "Invalid signature");

    if (signer == msg.sender) {
      revert CannotDelegateToSelf(signer);
    }

    if (self.delegatorToDelegatee[delegator].latest() != 0) {
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
    if (self.delegatorToDelegatee[msg.sender].latest() != 0) {
      revert AlreadyDelegated(msg.sender);
    }

    // Check if the delegatee is trying to delegate to themselves
    if (msg.sender == delegatee) {
      revert CannotDelegateToSelf(msg.sender);
    }

    if (self.delegateeToDelegator[delegatee].latest() != 0) {
      revert OnlyOneUserAllowed();
    }

    _pushCheckpoint(self.delegatorToDelegatee[msg.sender], delegatee);

    // Add the delegator to the pending delegations of the delegatee
    self.pendingDelegations[delegatee] = msg.sender;

    emit DelegationPending(msg.sender, delegatee);
  }

  /// @notice Allow the delegatee to accept the delegation
  /// @param delegator - the delegator address
  function acceptDelegation(PassportStorageTypes.PassportStorage storage self, address delegator) external {
    address delegatorToAccept = self.pendingDelegations[msg.sender];

    // Check if the delegation exists
    if (delegatorToAccept == address(0)) {
      revert NotDelegated(msg.sender);
    }

    // Check if the delegatee is accepting the correct delegator
    if (delegatorToAccept != delegator) {
      revert PersonhoodDelegationUnauthorizedUser(msg.sender);
    }

    // Add the delegator to the delegatee
    _pushCheckpoint(self.delegateeToDelegator[msg.sender], delegator);
    // Remove the pending delegation
    self.pendingDelegations[msg.sender] = address(0);

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

  // ---------- Private ---------- //
  /// @notice Push a new checkpoint for the delegator and delegatee
  function _pushCheckpoint(Checkpoints.Trace160 storage store, address value) private {
    store.push(PassportClockLogic.clock(), uint160(value));
  }

  /// @notice Convert a uint160 value to an address
  function _addressFromUint160(uint160 value) private pure returns (address) {
    return address(uint160(value));
  }
}
