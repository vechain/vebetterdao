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
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE"); // TBD
  bytes32 public constant GRANTS_APPROVER_ROLE = keccak256("GRANTS_APPROVER_ROLE");

  // ------------------ STORAGE MANAGEMENT ------------------ //
  /// @notice Storage structure for GrantsManager
  /// @custom:storage-location erc7201:b3tr.storage.GrantsManager
  struct GrantsManagerStorage {
    mapping(uint256 proposalId => GrantProposal grantProposal) grant;
    IB3TRGovernor governor;
    ITreasury treasury;
    IB3TR b3tr;
    uint256 minimumMilestoneCount;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.GrantsManager")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GrantsManagerStorageLocation =
    0x827ef7a586340a0afd9df4d10dcd47e35ee20572dbc95830311fcb8284606d00;

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

  function initialize(
    address _governor,
    address _treasury,
    address defaultAdmin,
    address _b3tr,
    uint256 _minimumMilestoneCount
  ) external initializer {
    require(_governor != address(0), "Governor address cannot be 0");
    require(_treasury != address(0), "Treasury address cannot be 0");
    require(_b3tr != address(0), "B3TR address cannot be 0");
    require(defaultAdmin != address(0), "Default admin address cannot be 0");
    require(_minimumMilestoneCount > 0, "Minimum milestone count cannot be 0");

    __UUPSUpgradeable_init();
    __AccessControl_init();
    __Pausable_init();
    __ReentrancyGuard_init();

    _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    _grantRole(GOVERNANCE_ROLE, _governor);
    _grantRole(GRANTS_APPROVER_ROLE, _governor);

    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    $.governor = IB3TRGovernor(_governor);
    $.treasury = ITreasury(_treasury);
    $.b3tr = IB3TR(_b3tr);
    $.minimumMilestoneCount = _minimumMilestoneCount;
  }

  // ------------------ MODIFIERS ------------------ //
  modifier onlyAdminOrGovernanceRole() {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    if (!(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(GOVERNANCE_ROLE, _msgSender()))) {
      revert NotAuthorized();
    }
    _;
  }

  modifier onlyRoleOrGovernance(bytes32 role) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    if (!(hasRole(role, _msgSender()) || hasRole(GOVERNANCE_ROLE, _msgSender()))) {
      revert NotAuthorized();
    }
    _;
  }

  modifier onlyGovernor() {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    if (!(hasRole(GOVERNANCE_ROLE, _msgSender()))) {
      revert NotAuthorized();
    }
    _;
  }

  // ------------------ Grants Manager Milestone Functions ------------------ //
  /**
   * @dev Internal function to create milestones for a proposal.
   * @param projectDetailsMetadataURI The IPFS hash containing milestones descriptions and metadata
   * @param milestonesDetailsMetadataURI The IPFS hash containing the milestones descriptions
   * @param proposalId The ID of the proposal
   * @param proposer The address of the proposer
   * @param calldatas The calldatas of the milestones
   */
  function createMilestones(
    string memory projectDetailsMetadataURI,
    string memory milestonesDetailsMetadataURI,
    uint256 proposalId,
    address proposer,
    bytes[] memory calldatas
  ) external onlyGovernor {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();

    uint256 _milestoneId = proposalId;
    GrantProposal storage m = $.grant[_milestoneId];
    uint256 totalAmount = 0;
    bool isApproved = false;
    bool isClaimed = false;

    for (uint256 i = 0; i < calldatas.length; i++) {
      bytes memory data = calldatas[i];

      // Extract selector for safety check
      bytes4 selector;
      assembly {
        selector := mload(add(data, 32))
      }
      if (selector != bytes4(keccak256("transferB3TR(address,uint256)"))) {
        revert InvalidFunctionSelector(selector);
      }
      bytes memory slicedData = new bytes(data.length - 4);
      for (uint256 j = 0; j < slicedData.length; j++) {
        slicedData[j] = data[j + 4];
      }

      // Decode arguments
      (address recipient, uint256 amount) = abi.decode(slicedData, (address, uint256));

      if (recipient != address(this)) {
        revert InvalidTarget(recipient);
      }
      if (amount == 0) {
        revert InvalidAmount();
      }

      totalAmount += amount;
      $.grant[_milestoneId].milestones.push(
        Milestone({ amount: amount, isClaimed: isClaimed, isApproved: isApproved })
      );
    }

    m.id = _milestoneId;
    m.proposer = proposer;
    m.milestonesDetailsMetadataURI = milestonesDetailsMetadataURI;
    m.projectDetailsMetadataURI = projectDetailsMetadataURI;
    m.totalAmount = totalAmount;
    m.claimedAmount = 0; // 0 because the milestone is not claimed yet

    _validateMilestones(m);
  }

  /**
   * @notice Returns a milestone for a proposal.
   * @param proposalId The id of the proposal
   * @param milestoneIndex The index of the milestone
   * @return Milestone The milestone
   */
  function getMilestone(uint256 proposalId, uint256 milestoneIndex) external view returns (Milestone memory) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();

    return $.grant[proposalId].milestones[milestoneIndex];
  }

  // ------------------ Milestone State Functions ------------------ //

  /**
   * @notice Returns the status of a grant proposal
   * @param proposalId The id of the proposal
   * @return GrantProposalStatus The status of the grant proposal { see IGrantsManager:GrantProposalStatus }
   */
  function getGrantProposalStatus(uint256 proposalId) external view returns (GrantProposalStatus) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    GrantProposal memory grantProposal = $.grant[proposalId];
    Milestone[] memory milestones = grantProposal.milestones;

    MilestoneState lastState = _getMilestoneState(proposalId, milestones.length - 1);

    if (lastState == MilestoneState.Approved) {
      return GrantProposalStatus.Completed;
    }
    return GrantProposalStatus.InDevelopment;
  }

  /**
   * @notice Returns the state of a milestone
   * @param proposalId The id of the proposal
   * @param milestoneIndex The index of the milestone
   * @return status The state of the milestone {see IGrantsManager:MilestoneState }
   */
  function _getMilestoneState(
    uint256 proposalId,
    uint256 milestoneIndex
  ) internal view returns (MilestoneState status) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    GrantProposal memory grant = $.grant[proposalId];
    Milestone memory milestone = grant.milestones[milestoneIndex];

    if ($.governor.state(proposalId) == GovernorTypes.ProposalState.Canceled) {
      return MilestoneState.Rejected;
    }

    if (milestone.isClaimed) {
      return MilestoneState.Claimed;
    }

    if (milestone.isApproved) {
      return MilestoneState.Approved;
    }

    return MilestoneState.Pending;
  }

  /**
   * @notice Returns the milestones for a proposal.
   * @param proposalId The id of the proposal
   * @return GrantProposal The milestones for the proposal
   */
  function getMilestones(uint256 proposalId) external view returns (Milestone[] memory) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.grant[proposalId].milestones;
  }

  /**
   * @notice Returns the grant proposal for a proposal.
   * @param proposalId The id of the proposal
   * @return GrantProposal The grant proposal for the proposal
   */
  function getGrantProposal(uint256 proposalId) external view returns (GrantProposal memory) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.grant[proposalId];
  }

  /**
   * @notice Approves a milestone
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  function approveMilestones(
    uint256 proposalId,
    uint256 milestoneIndex
  ) external onlyRoleOrGovernance(GRANTS_APPROVER_ROLE) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    MilestoneState currentState = _getMilestoneState(proposalId, milestoneIndex);

    // get the state of the proposal, should be queud or executed
    GovernorTypes.ProposalState proposalState = $.governor.state(proposalId);
    if (proposalState != GovernorTypes.ProposalState.Queued && proposalState != GovernorTypes.ProposalState.Executed) {
      revert ProposalNotQueuedOrExecuted();
    }
    if (currentState != MilestoneState.Pending) {
      revert MilestoneStateNotPending(currentState);
    }

    // check that the previous milestone is validated : chronologically approving
    if (milestoneIndex > 0) {
      MilestoneState previousState = _getMilestoneState(proposalId, milestoneIndex - 1);
      if (previousState != MilestoneState.Approved && previousState != MilestoneState.Claimed) {
        revert PreviousMilestoneNotApproved(proposalId, milestoneIndex - 1);
      }
    }

    $.grant[proposalId].milestones[milestoneIndex].isApproved = true;
    emit MilestoneValidated(proposalId, milestoneIndex);
  }

  // approve with a reason
  // only the admin can approve with a reason

  /**
   * @notice Sets the minimum number of milestones for a grant proposal
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
    return _getMilestoneState(proposalId, milestoneIndex);
  }

  /**
   * @notice Rejects a milestone
   * @param proposalId The ID of the proposal
   */
  function rejectMilestone(uint256 proposalId) external onlyAdminOrGovernanceRole {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    Milestone[] memory milestones = $.grant[proposalId].milestones;

    // check if all of the milestones are approved
    for (uint256 i = 0; i < milestones.length; i++) {
      if (_getMilestoneState(proposalId, i) == MilestoneState.Approved) {
        revert MilestoneAlreadyApproved(proposalId, i);
      }
    }

    // Reconstruct the arguments(targets, values, calldatas, descriptionHash) from milestones
    address[] memory target = new address[](milestones.length);
    string memory description = $.grant[proposalId].projectDetailsMetadataURI;

    for (uint256 i = 0; i < milestones.length; i++) {
      target[i] = address(this);
    }
    uint256[] memory values = new uint256[](milestones.length);
    for (uint256 i = 0; i < milestones.length; i++) {
      values[i] = 0;
    }
    bytes32 descriptionHash = keccak256(bytes(description));
    bytes[] memory calldatas = new bytes[](milestones.length);
    for (uint256 i = 0; i < milestones.length; i++) {
      calldatas[i] = abi.encodeWithSelector($.treasury.transferB3TR.selector, address(this), milestones[i].amount);
    }

    // Turn the proposal into a cancel proposal from the
    $.governor.cancel(target, values, calldatas, descriptionHash);
    _transferRemainingAmountToTreasury(proposalId);
  }

  /**
   * @notice Returns the total amount for milestones
   * @param milestoneId The ID of the milestone
   * @return The total amount for the milestones
   */
  function getTotalAmountForMilestones(uint256 milestoneId) external view returns (uint256) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.grant[milestoneId].totalAmount;
  }

  // ------------------ Grants Manager Funds Functions ------------------ //
  /**
   * @notice Claims funds for a validated milestone
   * @param proposalId The ID of the grant proposal
   * @param milestoneIndex The index of the milestone to claim
   */
  function claimMilestone(uint256 proposalId, uint256 milestoneIndex) external nonReentrant {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();

    GrantProposal storage m = $.grant[proposalId];
    if (milestoneIndex >= m.milestones.length) {
      revert InvalidMilestoneIndex(proposalId, milestoneIndex);
    }

    // check that the milestone is validated or not already claimed
    Milestone memory milestone = m.milestones[milestoneIndex];
    // get the state of the milestone
    MilestoneState milestoneState = _getMilestoneState(proposalId, milestoneIndex);
    if (milestoneState != MilestoneState.Approved && milestoneState != MilestoneState.Claimed) {
      revert MilestoneNotApprovedByAdmin(proposalId, milestoneIndex);
    }

    address proposer = m.proposer;
    if (msg.sender != proposer) {
      revert CallerIsNotTheGrantProposer(msg.sender, proposer);
    }

    // check that the milestone is not already  if (GovernorStateLogic.state($.governor, proposalId) == GovernorTypes.ProposalState.Canceled) {
    if (milestoneState == MilestoneState.Claimed) {
      revert MilestoneAlreadyClaimed(proposalId, milestoneIndex);
    }

    // Check if contract has enough B3TR balance
    if ($.b3tr.balanceOf(address(this)) < milestone.amount) {
      revert InsufficientFunds($.b3tr.balanceOf(address(this)), milestone.amount);
    }

    // Transfer B3TR tokens to proposer first
    bool success = $.b3tr.transfer(proposer, milestone.amount);
    if (!success) {
      revert TransferFailed();
    }

    // Update the claimed amount of the proposal
    m.milestones[milestoneIndex].isClaimed = true;
    emit MilestoneClaimed(proposalId, milestoneIndex, milestone.amount);
  }

  /**
   * @notice Returns if a milestone is claimable
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   * @return bool True if the milestone is claimable, false otherwise
   */
  function isClaimable(uint256 proposalId, uint256 milestoneIndex) external view returns (bool) {
    return _getMilestoneState(proposalId, milestoneIndex) == MilestoneState.Approved;
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

  // ------------------ Metadata Functions ------------------ //

  /**
   * @notice Updates the description metadata URI for a milestone
   * @param proposalId The ID of the proposal
   * @param newDescriptionMetadataURI The new IPFS hash containing the updated milestone descriptions
   * @notice The JSON is {milestone1: {details: ..., duration: timestamp}, milestone2: {details: ..., duration: timestamp}}
   */
  function updateMilestoneDescriptionMetadataURI(uint256 proposalId, string memory newDescriptionMetadataURI) external {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    if (msg.sender != $.grant[proposalId].proposer) {
      revert NotAuthorized();
    }
    $.grant[proposalId].milestonesDetailsMetadataURI = newDescriptionMetadataURI;

    emit MilestoneDescriptionMetadataURIUpdated(proposalId, newDescriptionMetadataURI);
  }

  /**
   * @notice Returns the description metadata URI for a milestone
   * @param proposalId The ID of the proposal
   * @return The description metadata URI for the milestone
   */
  function getMilestoneDescriptionMetadataURI(uint256 proposalId) external view returns (string memory) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.grant[proposalId].milestonesDetailsMetadataURI;
  }

  /**
   * @notice Returns the project details metadata URI for a proposal
   * @param proposalId The ID of the proposal
   * @return The project details metadata URI for the proposal
   */
  function getProjectDetailsMetadataURI(uint256 proposalId) external view returns (string memory) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.grant[proposalId].projectDetailsMetadataURI;
  }

  // ------------------  Internal Functions ------------------ //
  /**
   * @notice Validates the milestones
   * @param grant The milestones to validate
   */
  function _validateMilestones(GrantProposal memory grant) internal view {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();

    if (msg.sender != address($.governor)) {
      revert NotAuthorized();
    }

    // Check the proposer
    if (grant.proposer == address(0)) {
      revert MilestoneProposerZeroAddress();
    }

    // Check the milestones details metadata URI
    if (bytes(grant.milestonesDetailsMetadataURI).length == 0) {
      revert MilestoneDetailsMetadataURIEmpty();
    }

    // Check the project details metadata URI
    if (bytes(grant.projectDetailsMetadataURI).length == 0) {
      revert ProjectDetailsMetadataURIEmpty();
    }

    // Check the milestones amounts
    for (uint256 i = 0; i < grant.milestones.length; i++) {
      if (grant.milestones[i].amount == 0) {
        revert MilestoneAmountZero(i);
      }
    }

    if (grant.totalAmount == 0) {
      revert MilestoneTotalAmountZero();
    }

    if (grant.claimedAmount > grant.totalAmount) {
      revert MilestoneClaimedAmountExceedsTotalAmount(grant.claimedAmount, grant.totalAmount);
    }

    // Check the minimum milestone count
    if (grant.milestones.length < $.minimumMilestoneCount) {
      revert InvalidNumberOfMilestones(grant.milestones.length, $.minimumMilestoneCount);
    }
  }

  /**
   * @notice Transfers the remaining amount to the treasury
   * @param proposalId The ID of the proposal
   */
  function _transferRemainingAmountToTreasury(uint256 proposalId) internal {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    uint256 remainingAmount = $.grant[proposalId].totalAmount - $.grant[proposalId].claimedAmount;
    if (remainingAmount > 0) {
      $.b3tr.transfer(address($.treasury), remainingAmount);
    }
    emit MilestoneRejectedAndFundsReturnedToTreasury(proposalId, remainingAmount);
  }

  /**
   * @notice Returns the version of the contract
   * @return The version of the contract
   */
  function version() external pure returns (uint256) {
    return 1;
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
