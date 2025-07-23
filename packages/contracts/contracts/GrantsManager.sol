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

import { IB3TRGovernor } from "./interfaces/IB3TRGovernor.sol";
import { ITreasury } from "./interfaces/ITreasury.sol";
import { IB3TR } from "./interfaces/IB3TR.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { IERC1155Receiver } from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { IGrantsManager } from "./interfaces/IGrantsManager.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { GovernorStateLogic } from "./governance/libraries/GovernorStateLogic.sol";
import { GovernorProposalLogic } from "./governance/libraries/GovernorProposalLogic.sol";
import { GovernorTypes } from "./governance/libraries/GovernorTypes.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title GrantsManager
 * @notice Contract that manages grant funds milestone validation and claiming
 */
contract GrantsManager is
  IGrantsManager,
  IERC721Receiver,
  IERC1155Receiver,
  AccessControlUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  // ------------------ ROLES ------------------ //
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant MILESTONE_EDITOR_ROLE = keccak256("MILESTONE_EDITOR_ROLE");
  // bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
  // bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  // ------------------ STORAGE MANAGEMENT ------------------ //
  /// @notice Storage structure for GrantsManager
  /// @custom:storage-location erc7201:b3tr.storage.GrantsManager
  struct GrantsManagerStorage {
    mapping(uint256 => Milestones) proposalMilestones; // proposalId => milestones
    uint256 minimumMilestoneCount;
    ITreasury treasury;
    IB3TRGovernor governor;
    IB3TR b3tr;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.GrantsManager")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GrantsManagerStorageLocation =
    0x5e9e1c17086de7a6e077aa6f5e7f4e07cc54a96e4c9d8c0a468e334b50d62f00;

  function _getGrantsManagerStorage() private pure returns (GrantsManagerStorage storage $) {
    assembly {
      $.slot := GrantsManagerStorageLocation
    }
  }


  // ------------------ INITIALIZATION ------------------ //
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address _governor, address _treasury, address defaultAdmin, address _b3tr) external initializer {
    require(_governor != address(0), "Governor address cannot be 0");
    require(_treasury != address(0), "Treasury address cannot be 0");
    require(defaultAdmin != address(0), "Default admin address cannot be 0");

    __UUPSUpgradeable_init();
    __AccessControl_init();
    __Pausable_init();
    __ReentrancyGuard_init();

    _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    _grantRole(UPGRADER_ROLE, msg.sender);
    _grantRole(GOVERNANCE_ROLE, _governor);

    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    $.governor = IB3TRGovernor(_governor);
    $.treasury = ITreasury(_treasury);
    $.b3tr = IB3TR(_b3tr);
    $.minimumMilestoneCount = 2;
  }

  // ------------------ MODIFIERS ------------------ //
  modifier onlyAdminOrGrantsManager() {
    // todo: is it safe ? Do we need a specific role for this contract ?
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    if (!(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) ||
        hasRole(GOVERNANCE_ROLE, _msgSender()) ||
        _msgSender() == address(this))) {
      revert NotAuthorized();
    }
    _;
  }

  /// @notice Bitmap representing all possible milestone states.
  bytes32 internal constant ALL_MILESTONE_STATES_BITMAP = bytes32((2 ** (uint8(type(MilestoneState).max) + 1)) - 1);

  /**
   * @dev Encodes a `MilestoneState` into a `bytes32` representation where each bit enabled corresponds to the underlying position in the `MilestoneState` enum.
   * @param milestoneState The state to encode.
   * @return The encoded state bitmap.
   */
  function encodeMilestoneStateBitmap(MilestoneState milestoneState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(milestoneState));
  }

  // ------------------ Milestone State Functions ------------------ //
  /**
   * @dev Validates the state of a milestone.
   * @param proposalId The ID of the proposal.
   * @param milestoneIndex The index of the milestone.
   * @param allowedStates The allowed states for the milestone.
   * @return The current state of the milestone.
   */
  function validateMilestoneStateBitmap(
    uint256 proposalId,
    uint256 milestoneIndex,
    bytes32 allowedStates
  ) external view onlyAdminOrGrantsManager returns (MilestoneState) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    MilestoneState currentState = $.proposalMilestones[proposalId].milestone[milestoneIndex].status;

    if (encodeMilestoneStateBitmap(currentState) & allowedStates == bytes32(0)) {
      revert UnexpectedMilestoneState(proposalId, milestoneIndex, currentState, allowedStates);
    }

    return currentState;
  }

  // ------------------ Grants Manager Milestone Functions ------------------ //
  /**
   * @dev Internal function to create milestones for a proposal.
   * @param projectDetailsMetadataURI The IPFS hash containing milestones descriptions and metadata
   * @param proposalId The ID of the proposal
   */
  function createMilestones(
    string memory projectDetailsMetadataURI,
    Milestones memory milestones,
    uint256 proposalId
  ) external {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();

    // Calculate the proposal ID using the same method as the governor
    uint256 milestoneId = proposalId;
    if (milestoneId == 0) {
      revert EmptyMilestoneId();
    }
    _validateMilestones(milestones);

    // Store the passed in milestones
    Milestones storage m = $.proposalMilestones[milestoneId];
    m.id = milestoneId;
    m.totalAmount = milestones.totalAmount;
    m.claimedAmount = milestones.claimedAmount;
    m.recipient = milestones.recipient;
    m.milestonesDetailsMetadataURI = milestones.milestonesDetailsMetadataURI;

    // Store each milestone
    for (uint256 i = 0; i < milestones.milestone.length; i++) {
      m.milestone.push(Milestone({ amount: milestones.milestone[i].amount, status: milestones.milestone[i].status }));
    }

    // the total amount of the proposal should be equal to the sum of the milestones amounts
    uint256 totalAmount = 0;
    for (uint256 i = 0; i < milestones.milestone.length; i++) {
      totalAmount += milestones.milestone[i].amount;
    }
    if (totalAmount != milestones.totalAmount) {
      revert MilestoneTotalAmountMismatch(totalAmount, milestones.totalAmount);
    }

    emit MilestonesRegistered(milestoneId, m, projectDetailsMetadataURI, msg.sender);
  }

  /**
   * @notice Returns a milestone for a proposal.
   * @param proposalId The id of the proposal
   * @param milestoneIndex The index of the milestone
   * @return Milestone The milestone
   */
  function getMilestone(uint256 proposalId, uint256 milestoneIndex) external view returns (Milestone memory) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();

    return $.proposalMilestones[proposalId].milestone[milestoneIndex];
  }

  /**
   * @notice Returns the milestones for a proposal.
   * @param proposalId The id of the proposal
   * @return Milestones The milestones for the proposal
   */
  function getMilestones(uint256 proposalId) external view returns (Milestones memory) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.proposalMilestones[proposalId];
  }

  /**
   * @notice Approves a milestone
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  function approveMilestones(uint256 proposalId, uint256 milestoneIndex) external onlyAdminOrGrantsManager {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    MilestoneState currentState = $.proposalMilestones[proposalId].milestone[milestoneIndex].status;

    // get the state of the proposal, should be queud or executed
    GovernorTypes.ProposalState proposalState = $.governor.state(proposalId);
    if (proposalState != GovernorTypes.ProposalState.Queued && proposalState != GovernorTypes.ProposalState.Executed) {
      revert ProposalNotQueuedOrExecuted();
    }
    if (currentState != MilestoneState.Pending) {
      revert MilestoneStateNotPending(currentState);
    }

    // check that the previous milestone is validated
    if (milestoneIndex > 0) {
      MilestoneState previousState = $.proposalMilestones[proposalId].milestone[milestoneIndex - 1].status;
      if (previousState != MilestoneState.Validated && previousState != MilestoneState.Claimed) {
        revert PreviousMilestoneNotValidated(proposalId, milestoneIndex - 1);
      }
    }

    _setMilestoneStatus(proposalId, milestoneIndex, MilestoneState.Validated);
    emit MilestoneValidated(proposalId, milestoneIndex);
  }

  /**
   * @notice Sets the minimum milestone count
   * @param minimumMilestoneCount The minimum milestone count
   */
  function setMinimumMilestoneCount(uint256 minimumMilestoneCount) external onlyRole(DEFAULT_ADMIN_ROLE) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    $.minimumMilestoneCount = minimumMilestoneCount;
  }

  /**
   * @notice Returns the minimum milestone count for a proposal.
   * @return uint256 The minimum milestone count.
   */
  function getMinimumMilestoneCount() external view returns (uint256) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.minimumMilestoneCount;
  }

  /**
   * @notice Returns the state of a milestone
   * @param proposalId The id of the proposal
   * @param milestoneIndex The index of the milestone
   * @return MilestoneState The state of the milestone
   */
  function getMilestoneState(uint256 proposalId, uint256 milestoneIndex) external view returns (MilestoneState) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.proposalMilestones[proposalId].milestone[milestoneIndex].status;
  }

  /**
   * @notice Rejects a milestone
   * @param proposalId The ID of the proposal
   */
  function rejectMilestone(uint256 proposalId) external onlyAdminOrGrantsManager {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    // for every milestones in the proposal, we set the status to Rejected
    for (uint256 i = 0; i < $.proposalMilestones[proposalId].milestone.length; i++) {
      _setMilestoneStatus(proposalId, i, MilestoneState.Rejected);
    }
    emit MilestoneRejected(proposalId);
  }

  /**
   * @notice Returns the total amount for milestones
   * @param milestoneId The ID of the milestone
   * @return The total amount for the milestones
   */
  function getTotalAmountForMilestones(uint256 milestoneId) external view returns (uint256) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.proposalMilestones[milestoneId].totalAmount;
  }

  // ------------------ Grants Manager Funds Functions ------------------ //
  /**
   * @notice Claims funds for a validated milestone
   * @param proposalId The ID of the grant proposal
   * @param milestoneIndex The index of the milestone to claim
   */
  function claimMilestone(uint256 proposalId, uint256 milestoneIndex) external nonReentrant {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();

    Milestones storage m = $.proposalMilestones[proposalId];
    if (milestoneIndex >= m.milestone.length) {
      revert InvalidMilestoneIndex(proposalId, milestoneIndex);
    }

    // check that the milestone is validated or not already claimed
    Milestone memory milestone = m.milestone[milestoneIndex];
    if (milestone.status != MilestoneState.Validated && milestone.status != MilestoneState.Claimed) {
      revert MilestoneNotApprovedByAdmin(proposalId, milestoneIndex);
    }

    address recipient = m.recipient;
    if (msg.sender != recipient) {
      revert CallerIsNotTheGrantProposer(msg.sender, recipient);
    }

    // check that the milestone is not already claimed
    if (milestone.status == MilestoneState.Claimed) {
      revert MilestoneAlreadyClaimed(proposalId, milestoneIndex);
    }

    // Check if contract has enough B3TR balance
    if ($.b3tr.balanceOf(address(this)) < milestone.amount) {
      revert InsufficientFunds($.b3tr.balanceOf(address(this)), milestone.amount);
    }

    // Transfer B3TR tokens to recipient first
    bool success = $.b3tr.transfer(recipient, milestone.amount);
    if (!success) {
      revert TransferFailed();
    }

    // Update milestone status to Claimed using this contract's context
    this.setMilestoneStatus(proposalId, milestoneIndex, MilestoneState.Claimed);

    // Update the claimed amount of the proposal
    m.claimedAmount += milestone.amount;

    emit MilestoneClaimed(proposalId, milestoneIndex, milestone.amount);
  }

  /**
   * @notice Public function to set milestone status, only callable by this contract
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   * @param newStatus The new status to set
   */
  function setMilestoneStatus(
    uint256 proposalId,
    uint256 milestoneIndex,
    MilestoneState newStatus
  ) external {

    if (msg.sender != address(this)) {
      revert NotAuthorized();
    }
    _setMilestoneStatus(proposalId, milestoneIndex, newStatus);
  }

  // ------------------ Grants Manager Contract Functions ------------------ //
  /**
   * @notice Sets the governor contract
   * @param _governor The address of the governor contract
   */
  function setGovernorContract(address _governor) external onlyRole(DEFAULT_ADMIN_ROLE) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    $.governor = IB3TRGovernor(_governor);
  }

  /**
   * @notice Returns the governor contract
   * @return The address of the governor contract
   */
  function getGovernorContract() external view returns (address) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return address($.governor);
  }

  /**
   * @notice Sets the treasury contract
   * @param _treasury The address of the treasury contract
   */
  function setTreasuryContract(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    $.treasury = ITreasury(_treasury);
  }

  /**
   * @notice Returns the treasury contract
   * @return The address of the treasury contract
   */
  function getTreasuryContract() external view returns (address) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return address($.treasury);
  }

  /**
   * @notice Returns the b3tr contract
   * @return The address of the b3tr contract
   */
  function getB3trContract() external view returns (address) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return address($.b3tr);
  }

  /**
   * @notice Sets the b3tr contract
   * @param _b3tr The address of the b3tr contract
   */
  function setB3trContract(address _b3tr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    $.b3tr = IB3TR(_b3tr);
  }
  // ------------------  Internal Functions ------------------ //
  /**
   * @notice Validates the milestones
   * @param milestones The milestones to validate
   */
  function _validateMilestones(Milestones memory milestones) internal view {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();

    // Check the status of the first milestone
    if (milestones.milestone[0].status != MilestoneState.Pending) {
      revert MilestoneNotPending(milestones.milestone[0].status);
    }

    // Check the proposal metadata
    if (milestones.recipient == address(0)) {
      revert MilestoneRecipientZeroAddress();
    }

    if (msg.sender != address($.governor)) {
      revert CallerIsNotTheGovernor(msg.sender, address($.governor));
    }

    // Check the milestones details metadata URI

    // Check the milestones amounts
    for (uint256 i = 0; i < milestones.milestone.length; i++) {
      if (milestones.milestone[i].amount == 0) {
        revert MilestoneAmountZero(i);
      }
    }

    if (milestones.totalAmount == 0) {
      revert MilestoneTotalAmountZero();
    }

    if (milestones.claimedAmount > milestones.totalAmount) {
      revert MilestoneClaimedAmountExceedsTotalAmount(milestones.claimedAmount, milestones.totalAmount);
    }

    // Check the minimum milestone count
    if (milestones.milestone.length < $.minimumMilestoneCount) {
      revert InvalidNumberOfMilestones(milestones.milestone.length, $.minimumMilestoneCount);
    }
  }

  /**
   * @dev Sets the status of a milestone.
   * @param proposalId The ID of the proposal.
   * @param milestoneIndex The index of the milestone.
   * @param newStatus The new status of the milestone.
   */
  function _setMilestoneStatus(uint256 proposalId, uint256 milestoneIndex, MilestoneState newStatus) internal {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    // only the contract itself can set the milestone status
    if (msg.sender != address(this) && !hasRole(DEFAULT_ADMIN_ROLE, _msgSender())) {
      revert NotAuthorized();
    }
    MilestoneState currentState = $.proposalMilestones[proposalId].milestone[milestoneIndex].status;
    if (currentState == newStatus) {
      revert MilestoneAlreadyInState(proposalId, milestoneIndex, newStatus, currentState);
    }
    $.proposalMilestones[proposalId].milestone[milestoneIndex].status = newStatus;
  }

  // ------------------ OVERRIDES ------------------ //
  /**
   * @notice Implements IERC721Receiver interface
   */
  function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
    return this.onERC721Received.selector;
  }

  /**
   * @notice Implements IERC1155Receiver interface
   */
  function onERC1155Received(
    address,
    address,
    uint256,
    uint256,
    bytes calldata
  ) external pure override returns (bytes4) {
    return this.onERC1155Received.selector;
  }

  /**
   * @notice Implements IERC1155Receiver interface
   */
  function onERC1155BatchReceived(
    address,
    address,
    uint256[] calldata,
    uint256[] calldata,
    bytes calldata
  ) external pure override returns (bytes4) {
    return this.onERC1155BatchReceived.selector;
  }

  /**
   * @notice Implements supportsInterface for IERC165
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(AccessControlUpgradeable, IERC165) returns (bool) {
    return
      interfaceId == type(IERC1155Receiver).interfaceId ||
      interfaceId == type(IERC721Receiver).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  /**
   * @notice Authorize upgrade for UUPS
   * @dev Only addresses with the UPGRADER_ROLE can upgrade the contract
   */
  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}

// /**
//  * @dev Emitted when a milestone's metadata is updated.
//  */
// event MilestoneMetadataUpdated(
//   uint256 indexed proposalId,
//   uint256 indexed milestoneIndex,
//   string oldIpfsHash,
//   string newIpfsHash,
//   address indexed updatedBy
// );

//   /**
//  * @dev Thrown when a user is not authorized to update metadata.
//  */
// error UnauthorizedMetadataUpdate(address user, uint256 proposalId);

// /**
//  * @dev Thrown when an invalid milestone index is provided.
//  */
// error InvalidMilestoneIndex(uint256 proposalId, uint256 milestoneIndex);

// /**
//  * @dev Thrown when a proposal is not found.
//  */
// error ProposalNotFound(uint256 proposalId);
// /**
//  * @dev Updates the project details metadata URI for a milestone
//  * @param proposalId The ID of the proposal
//  * @param newProjectDetailsMetadataURI The new IPFS hash containing updated milestone descriptions
//  */
// function updateMilestoneDescription(
//   uint256 proposalId,
//   string memory newProjectDetailsMetadataURI
// ) external onlyRole(MILESTONE_EDITOR_ROLE) {
//   GrantsManagerStorage storage $ = _getGrantsManagerStorage();

//   require($.proposalMilestones[proposalId].id != 0, "Milestone does not exist");

//   string memory oldDescriptionHash = $.proposalMilestones[proposalId].projectDetailsMetadataURI;
//   $.proposalMilestones[proposalId].projectDetailsMetadataURI = newDescriptionHash;

//   emit MilestoneDescriptionUpdated(proposalId, oldDescriptionHash, newDescriptionHash);
// }

// /**
//  * @notice Updates the metadata URI for a proposal
//  * @param proposalId The ID of the proposal
//  * @param metadataURI The new IPFS URI containing the metadata
//  */
// function updateProposalMetadata(
//   uint256 proposalId,
//   string calldata metadataURI
// ) external onlyRole(DEFAULT_ADMIN_ROLE) {
//   GrantsManagerStorage storage $ = _getGrantsManagerStorage();

//   require($.proposalMilestones[proposalId].id != 0, "Proposal does not exist");

//   string memory oldMetadataURI = $.proposalMetadataURIs[proposalId];
//   $.proposalMetadataURIs[proposalId] = metadataURI;

//   emit ProposalMetadataUpdated(proposalId, oldMetadataURI, metadataURI, msg.sender);
// }

// /**
//  * @notice Updates the metadata URI for a milestone
//  * @param proposalId The ID of the proposal
//  * @param milestoneIndex The index of the milestone
//  * @param metadataURI The new IPFS URI containing the metadata
//  */
// function updateMilestoneMetadata(uint256 proposalId, uint256 milestoneIndex, string calldata metadataURI) external {
//   GrantsManagerStorage storage $ = _getGrantsManagerStorage();

//   require($.proposalMilestones[proposalId].id != 0, "Proposal does not exist");
//   require(milestoneIndex < $.proposalMilestones[proposalId].milestone.length, "Invalid milestone index");

//   // Only proposer or admin can update milestone metadata
//   require(
//     msg.sender == $.proposalMilestones[proposalId].recipient || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
//     "Not authorized"
//   );

//   string memory oldMetadataURI = $.milestoneMetadataURIs[proposalId][milestoneIndex];
//   $.milestoneMetadataURIs[proposalId][milestoneIndex] = metadataURI;

//   emit MilestoneMetadataUpdated(proposalId, milestoneIndex, oldMetadataURI, metadataURI, msg.sender);
// }

// /**
//  * @notice Returns whether a milestone is claimable
//  * @param proposalId The ID of the grant proposal
//  * @param milestoneIndex The index of the milestone
//  */
// function isClaimable(uint256 proposalId, uint256 milestoneIndex) external view returns (bool) {
//   GrantsManagerStorage storage $ = _getTreasuryGrantsStorage();
//   GovernorTypes.Milestones memory milestones = $.governor.getMilestones(proposalId);
//   if (milestoneIndex >= milestones.milestone.length) return false;

//   return milestones.milestone[milestoneIndex].status == GovernorTypes.MilestoneState.Validated;
// }

//   /**
//  * @notice Gets the metadata URI for a proposal
//  * @param proposalId The ID of the proposal
//  * @return string The IPFS URI containing the metadata
//  */
// function getProposalMetadataURI(uint256 proposalId) external view returns (string memory) {
//   GrantsManagerStorage storage $ = _getGrantsManagerStorage();
//   return $.proposalMetadataURIs[proposalId];
// }

// /**
//  * @notice Gets the metadata URI for a milestone
//  * @param proposalId The ID of the proposal
//  * @param milestoneIndex The index of the milestone
//  * @return string The IPFS URI containing the metadata
//  */
// function getMilestoneMetadataURI(uint256 proposalId, uint256 milestoneIndex) external view returns (string memory) {
//   GrantsManagerStorage storage $ = _getGrantsManagerStorage();
//   return $.milestoneMetadataURIs[proposalId][milestoneIndex];
// }


  // /**
  //  * @notice Gets the description hash for a milestone
  //  * @param proposalId The ID of the proposal
  //  * @return string The IPFS hash containing milestone descriptions
  //  */
  // function getMilestoneDescription(uint256 proposalId) external view returns (string memory) {
  //   GrantsManagerStorage storage $ = _getGrantsManagerStorage();
  //   return $.proposalMilestones[proposalId].milestonesDetailsMetadataURI;
  // }

  // /**
  //  * @notice Gets the metadata IPFS hash for a proposal
  //  * @param proposalId The ID of the proposal
  //  * @return The IPFS hash containing the metadata
  //  */
  // function getProposalMetadata(uint256 proposalId) external view returns (GovernorTypes.ProposalMetadata memory) {
  //   GrantsManagerStorage storage $ = _getGrantsManagerStorage();
  //   return $.proposalMetadata[proposalId];
  // }

  // /**
  //  * @notice Gets the metadata IPFS hash for a milestone
  //  * @param proposalId The ID of the proposal
  //  * @param milestoneIndex The index of the milestone
  //  * @return The IPFS hash containing the metadata
  //  */
  // function getMilestoneMetadata(
  //   uint256 proposalId,
  //   uint256 milestoneIndex
  // ) external view returns (GovernorTypes.MilestoneMetadata memory) {
  //   GrantsManagerStorage storage $ = _getGrantsManagerStorage();
  //   return $.milestoneMetadata[proposalId][milestoneIndex];
  // }