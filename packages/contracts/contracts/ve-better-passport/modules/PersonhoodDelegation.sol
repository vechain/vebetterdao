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
  using ECDSA for bytes32;

  string private constant SIGNING_DOMAIN = "PersonhoodDelegation";
  string private constant SIGNATURE_VERSION = "1";

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  // ---------- Storage ------------ //

  struct Delegation {
    address delegator;
    address delegatee;
    uint256 nonce;
    uint256 deadline;
  }

  bytes32 private constant DELEGATION_TYPEHASH =
    keccak256("Delegation(address delegator,address delegatee,uint256 nonce,uint256 deadline)");

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

  function __PersonhoodDelegation_init_unchained() internal onlyInitializing {
    __EIP712_init(SIGNING_DOMAIN, SIGNATURE_VERSION);
  }

  // ---------- Modifiers ------------ //

  modifier onlyRoleOrAdmin(bytes32 role) virtual {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert PersonhoodDelegationUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Getters ---------- //

  function getDelegatee(address delegator) external view returns (address) {
    return _addressFromUint160(_getPersonhoodDelegationStorage().delegatorToDelegatee[delegator].latest());
  }

  function getDelegateeInTimepoint(address delegator, uint256 timepoint) external view returns (address) {
    return
      _addressFromUint160(
        _getPersonhoodDelegationStorage().delegatorToDelegatee[delegator].upperLookupRecent(
          SafeCast.toUint48(timepoint)
        )
      );
  }

  function getDelegator(address delegatee) external view returns (address) {
    return _addressFromUint160(_getPersonhoodDelegationStorage().delegateeToDelegator[delegatee].latest());
  }

  function getDelegatorInTimepoint(address delegatee, uint256 timepoint) external view returns (address) {
    return
      _addressFromUint160(
        _getPersonhoodDelegationStorage().delegateeToDelegator[delegatee].upperLookupRecent(
          SafeCast.toUint48(timepoint)
        )
      );
  }

  function isDelegator(address user) external view returns (bool) {
    return _getPersonhoodDelegationStorage().isDelegated[user].latest() == 1;
  }

  function isDelegatorInTimepoint(address user, uint256 timepoint) external view returns (bool) {
    return _getPersonhoodDelegationStorage().isDelegated[user].upperLookupRecent(SafeCast.toUint48(timepoint)) == 1;
  }

  function isDelegatee(address user) external view returns (bool) {
    return _getPersonhoodDelegationStorage().isDelegated[user].latest() == 0;
  }

  function isDelegateeInTimepoint(address user, uint256 timepoint) external view returns (bool) {
    return _getPersonhoodDelegationStorage().isDelegated[user].upperLookupRecent(SafeCast.toUint48(timepoint)) == 0;
  }

  // ---------- Signatures and Delegation ------------ //

  function delegateWithSignature(address delegator, uint256 nonce, uint256 deadline, bytes memory signature) external {
    require(block.timestamp <= deadline, "Signature expired");

    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    // Recover the signer address from the signature
    bytes32 structHash = keccak256(abi.encode(DELEGATION_TYPEHASH, delegator, msg.sender, nonce, deadline));
    bytes32 digest = _hashTypedDataV4(structHash);
    address signer = digest.recover(signature);

    require(signer == delegator, "Invalid signature");

    if (signer == msg.sender) {
      revert CannotDelegateToSelf(signer);
    }

    if ($.delegatorToDelegatee[delegator].latest() != 0) {
      revert AlreadyDelegated(delegator);
    }

    _pushCheckpoint($.delegatorToDelegatee[delegator], msg.sender);
    _pushCheckpoint($.delegateeToDelegator[msg.sender], delegator);

    _pushCheckpoint($.isDelegated[msg.sender], address(1)); // Mark as true
    _pushCheckpoint($.isDelegated[delegator], address(0)); // Mark as false

    emit DelegationCreated(delegator, msg.sender);
  }

  // Revoke the delegation (can be done by the delegator or the delegatee)
  function revokeDelegation(address delegator) external {
    PersonhoodDelegationStorage storage $ = _getPersonhoodDelegationStorage();

    if ($.delegatorToDelegatee[delegator].latest() == 0) {
      revert NotDelegated(delegator);
    }

    address delegatee = _addressFromUint160($.delegatorToDelegatee[delegator].latest());

    if (msg.sender != delegator && msg.sender != delegatee) {
      revert PersonhoodDelegationUnauthorizedUser(msg.sender);
    }

    _pushCheckpoint($.delegatorToDelegatee[delegator], address(0));
    _pushCheckpoint($.delegateeToDelegator[delegatee], address(0));

    _pushCheckpoint($.isDelegated[delegator], address(0)); // Mark as false
    _pushCheckpoint($.isDelegated[delegatee], address(0)); // Mark as false

    emit DelegationRevoked(delegator, delegatee);
  }

  // ---------- Checkpoint Logic ------------ //

  function _pushCheckpoint(Checkpoints.Trace160 storage store, address value) private {
    store.push(clock(), uint160(value));
  }

  function _addressFromUint160(uint160 value) internal pure returns (address) {
    return address(uint160(value));
  }

  // ---------- Utility ------------ //

  function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  function CLOCK_MODE() external view virtual returns (string memory) {
    return "mode=blocknumber&from=default";
  }
}
