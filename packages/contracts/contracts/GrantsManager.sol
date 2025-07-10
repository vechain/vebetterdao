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
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { GovernorStorageTypes } from "./governance/libraries/GovernorStorageTypes.sol";
import { GovernorStateLogic } from "./governance/libraries/GovernorStateLogic.sol";
import { GovernorProposalLogic } from "./governance/libraries/GovernorProposalLogic.sol";
import { GovernorTypes } from "./governance/libraries/GovernorTypes.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title GrantsManager
 * @notice Contract that manages grant funds milestone validation and claiming
 */
contract GrantsManager is
  IERC721Receiver,
  IERC1155Receiver,
  AccessControlUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  /** ------------------ ROLES ------------------ **/
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  // bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
  // bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  /** ------------------ STORAGE MANAGEMENT ------------------ **/
  /// @notice Storage structure for GrantsManager
  /// @custom:storage-location erc7201:b3tr.storage.GrantsManager
  // this contract is upgradable and have to store :
  // - proposalMilestones : proposalId => milestones
  // - minimumMilestoneCount : minimum milestone count
  // ... maybe other contract ?
  // to what contract will i interact with ?
  // b3tr treasury yes

  struct GrantsManagerStorage {
    mapping(uint256 => GovernorTypes.Milestones) proposalMilestones; // proposalId => milestones
    uint256 minimumMilestoneCount;
    ITreasury treasury;
    IB3TRGovernor governor;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.GrantsManager")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GrantsManagerStorageLocation =
    0x5e9e1c17086de7a6e077aa6f5e7f4e07cc54a96e4c9d8c0a468e334b50d62f00;

  function _getGrantsManagerStorage() private pure returns (GrantsManagerStorage storage $) {
    assembly {
      $.slot := GrantsManagerStorageLocation
    }
  }

  /** ------------------ INITIALIZATION ------------------ **/
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address _governor, address _treasury, address defaultAdmin) external initializer {
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
    $.minimumMilestoneCount = 2;
  }

  /** ------------------ MODIFIERS ------------------ **/
  modifier onlyAdminOrGovernance() {
    require(
      hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(GOVERNANCE_ROLE, _msgSender()),
      "GrantsManager: caller is not an admin or governance contract"
    );
    _;
  }

  // /// @notice Bitmap representing all possible milestone states.
  // bytes32 internal constant ALL_MILESTONE_STATES_BITMAP =
  //   bytes32((2 ** (uint8(type(GovernorTypes.MilestoneState).max) + 1)) - 1);

  // /**
  //  * @dev Encodes a `MilestoneState` into a `bytes32` representation where each bit enabled corresponds to the underlying position in the `MilestoneState` enum.
  //  * @param milestoneState The state to encode.
  //  * @return The encoded state bitmap.
  //  */
  // function encodeMilestoneStateBitmap(GovernorTypes.MilestoneState milestoneState) internal pure returns (bytes32) {
  //   return bytes32(1 << uint8(milestoneState));
  // }

  // // ------------------ Events Funds ------------------ //
  // // TODO : define each events and errors
  // // Events
  // event MilestoneValidated(uint256 indexed proposalId, uint256 indexed milestoneIndex);
  // event MilestoneClaimed(uint256 indexed proposalId, uint256 indexed milestoneIndex, uint256 amount);
  // event FundsReceived(uint256 indexed proposalId, uint256 amount);

  // // ------------------ Milestone Events ------------------ //
  // /**
  //  * @dev Emitted when a milestone is registered.
  //  */
  // event MilestoneRegistered(uint256 indexed proposalId, uint256 indexed milestoneIndex, uint256 amount);

  /**
   * @dev Emitted when a milestone is created.
   */
  event MilestonesCreated(
    uint256 indexed milestonesId,
    uint256 totalAmount,
    address recipient,
    string description,
    GovernorTypes.Milestones milestones
  );

  // // Errors
  // error InvalidMilestoneState();
  // error NotGrantRecipient();
  // error InsufficientFunds();
  // error InvalidMilestoneIndex();
  // error PreviousMilestoneNotClaimed();

  // /// @custom:oz-upgrades-unsafe-allow constructor
  // constructor() {
  //   _disableInitializers();
  // }

  // function initialize(address _governor, address _treasury) external initializer {
  //   _validateAddresses(_governor, _treasury);

  //   __UUPSUpgradeable_init();
  //   __AccessControl_init();
  //   __Pausable_init();
  //   __ReentrancyGuard_init();
  //   GrantsManagerStorage storage $ = _getGrantsManagerStorage();
  //   $.governor = IB3TRGovernor(_governor);
  //   $.treasury = ITreasury(_treasury);
  // }

  /** ------------------ Grants Manager Milestone Functions ------------------ **/
  /**
  //  * @dev Internal function to create milestones for a proposal.
  //  * @param description The description of the proposal.
  //  * @param values The values of the proposal.
  //  * @param targets The targets of the proposal.
  //  * @param calldatas The calldatas of the proposal.
  //  * @return uint256 The milestone id.
  //  */
  function createMilestones(
    string memory description,
    uint256[] memory values,
    address[] memory targets,
    bytes[] memory calldatas
  ) external onlyAdminOrGovernance returns (uint256) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();

    uint256 milestoneId = $.governor.hashProposal(targets, values, calldatas, keccak256(bytes(description)));
    require(milestoneId == 0, "Milestone ID already exists");

    GovernorTypes.ProposalState state = $.governor.state(milestoneId);
    require(
      state == GovernorTypes.ProposalState.Succeeded || state == GovernorTypes.ProposalState.Queued,
      "GovernorMilestoneLogic: Invalid proposal state"
    );
    require(values.length >= $.minimumMilestoneCount, "GovernorMilestoneLogic: Not enough milestones");

    // proposal Id should be the same as the one in the proposal
    // print following solidity code in the console
    GovernorTypes.Milestones storage proposalMilestones = $.proposalMilestones[milestoneId];
    proposalMilestones.id = milestoneId;
    proposalMilestones.recipient = msg.sender;

    uint256 total = 0;
    for (uint256 i = 0; i < values.length; i++) {
      require(values[i] > 0, "Milestone amount must be greater than 0");
      total += values[i];
    }
    proposalMilestones.totalAmount = total;
    proposalMilestones.claimedAmount = 0;

    // Create milestones with Pending status
    for (uint256 i = 0; i < values.length; i++) {
      proposalMilestones.milestone.push(
        GovernorTypes.Milestone({ amount: values[i], status: GovernorTypes.MilestoneState.Pending })
      );
    }

    emit MilestonesCreated(
      proposalMilestones.id,
      proposalMilestones.totalAmount,
      proposalMilestones.recipient,
      description,
      proposalMilestones
    );
  }

  // function setMilestoneStatus(
  //   uint256 proposalId,
  //   uint256 milestoneIndex,
  //   GovernorTypes.MilestoneState newStatus
  // ) external {
  //   GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
  //   require(msg.sender == address($.treasuryGrants), "Only GrantsManager can call");
  //   GovernorStateLogic.validateMilestoneStateBitmap(
  //     $,
  //     proposalId,
  //     milestoneIndex,
  //     GovernorStateLogic.encodeMilestoneStateBitmap(newStatus)
  //   );
  //   $.proposalMilestones[proposalId].milestone[milestoneIndex].status = newStatus;
  // }

  // function validateMilestoneStateBitmap(
  //   GrantsManagerStorage storage self,
  //   uint256 proposalId,
  //   uint256 milestoneIndex, // index of the milestone (1st, 2nd ...)
  //   bytes32 allowedStates
  // ) internal view returns (GovernorTypes.MilestoneState) {
  //   GovernorTypes.MilestoneState currentState = self.proposalMilestones[proposalId].milestone[milestoneIndex].status;
  //   if (encodeMilestoneStateBitmap(currentState) & allowedStates == bytes32(0)) {
  //     revert GovernorUnexpectedMilestoneState(proposalId, milestoneIndex, currentState, allowedStates);
  //   }

  //   return currentState;
  // }

  // function approveMilestones(
  //   GovernorStorageTypes.GovernorStorage storage self,
  //   uint256 proposalId,
  //   uint256 milestoneIndex
  // ) internal {
  //   self.governor.setMilestoneStatus(proposalId, milestoneIndex, GovernorTypes.MilestoneState.Validated);
  // }

  // function rejectMilestone(GovernorStorageTypes.GovernorStorage storage self, uint256 proposalId) internal {
  //   // for every milestones in the proposal, we set the status to Rejected
  //   for (uint256 i = 0; i < self.proposalMilestones[proposalId].milestone.length; i++) {
  //     self.governor.setMilestoneStatus(proposalId, i, GovernorTypes.MilestoneState.Rejected);
  //   }
  // }

  function setMinimumMilestoneCount(uint256 minimumMilestoneCount) external onlyRole(DEFAULT_ADMIN_ROLE) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    $.minimumMilestoneCount = minimumMilestoneCount;
  }

  // /**
  //  * @notice Returns the state of a milestone
  //  * @param self The storage reference for the GovernorStorage
  //  * @param proposalId The id of the proposal
  //  * @param milestoneIndex The index of the milestone
  //  * @return GovernorTypes.MilestoneState The state of the milestone
  //  */
  // function milestoneState(
  //   GovernorStorageTypes.GovernorStorage storage self,
  //   uint256 proposalId,
  //   uint256 milestoneIndex
  // ) external view returns (GovernorTypes.MilestoneState) {
  //   return self.proposalMilestones[proposalId].milestone[milestoneIndex].status;
  // }

  // /**
  //  * @notice Returns a milestone for a proposal.
  //  * @param proposalId The id of the proposal
  //  * @param milestoneIndex The index of the milestone
  //  * @return GovernorTypes.Milestone The milestone
  //  */
  // function getMilestone(
  //   GovernorStorageTypes.GovernorStorage storage self,
  //   uint256 proposalId,
  //   uint256 milestoneIndex
  // ) external view returns (GovernorTypes.Milestone memory) {
  //   return self.proposalMilestones[proposalId].milestone[milestoneIndex];
  // }

  // /**
  //  * @notice Returns the milestones for a proposal.
  //  * @param proposalId The id of the proposal
  //  * @return GovernorTypes.Milestones The milestones for the proposal
  //  */
  // function getMilestones(
  //   GovernorStorageTypes.GovernorStorage storage self,
  //   uint256 proposalId
  // ) external view returns (GovernorTypes.Milestones memory) {
  //   return self.proposalMilestones[proposalId];
  // }

  /**
   * @notice Returns the minimum milestone count for a proposal.
   * @return uint256 The minimum milestone count.
   */
  function getMinimumMilestoneCount() external view returns (uint256) {
    GrantsManagerStorage storage $ = _getGrantsManagerStorage();
    return $.minimumMilestoneCount;
  }

  // function getTotalAmountForMilestones(
  //   GovernorStorageTypes.GovernorStorage storage self,
  //   uint256 milestoneId
  // ) external view returns (uint256) {
  //   return self.proposalMilestones[milestoneId].totalAmount;
  // }

  // /** ------------------ Grants Manager Funds Functions ------------------ **/
  // function _validateAddresses(address _governor, address _treasury) internal view {
  //   require(_governor != address(0), "Governor address cannot be 0");
  //   require(_treasury != address(0), "Treasury address cannot be 0");
  // }

  // /**
  //  * @notice Receives funds for a grant proposal
  //  * @param proposalId The ID of the grant proposal
  //  */
  // function receiveFunds(uint256 proposalId) external payable {
  //   GrantsManagerStorage storage $ = _getTreasuryGrantsStorage();
  //   require(msg.sender == address($.governor), "Only governor can send funds");
  //   emit FundsReceived(proposalId, msg.value);
  // }

  // /**
  //  * @notice Validates a milestone for claiming
  //  * @param proposalId The ID of the grant proposal
  //  * @param milestoneIndex The index of the milestone to validate
  //  */
  // function validateMilestone(uint256 proposalId, uint256 milestoneIndex) external onlyRole(GOVERNANCE_ROLE) {
  //   GrantsManagerStorage storage $ = _getTreasuryGrantsStorage();
  //   GovernorTypes.Milestones memory milestones = $.governor.getMilestones(proposalId);
  //   require(milestoneIndex < milestones.milestone.length, "Invalid milestone index");

  //   // Check if first milestone or previous milestone is claimed
  //   if (milestoneIndex > 0) {
  //     require(
  //       milestones.milestone[milestoneIndex - 1].status == GovernorTypes.MilestoneState.Claimed,
  //       "GrantsManager: Previous milestone not claimed"
  //     );
  //   }

  //   require(
  //     milestones.milestone[milestoneIndex].status == GovernorTypes.MilestoneState.Pending,
  //     "GrantsManager: Milestone is not ready to be validated"
  //   );

  //   $.governor.setMilestoneStatus(proposalId, milestoneIndex, GovernorTypes.MilestoneState.Validated);

  //   emit MilestoneValidated(proposalId, milestoneIndex);
  // }

  // /**
  //  * @notice Claims funds for a validated milestone
  //  * @param proposalId The ID of the grant proposal
  //  * @param milestoneIndex The index of the milestone to claim
  //  */
  // function claimMilestone(uint256 proposalId, uint256 milestoneIndex) external nonReentrant {
  //   GrantsManagerStorage storage $ = _getTreasuryGrantsStorage();

  //   GovernorTypes.Milestones memory milestones = $.governor.getMilestones(proposalId);
  //   require(milestoneIndex < milestones.milestone.length, "Invalid milestone index");

  //   GovernorTypes.Milestone memory milestone = milestones.milestone[milestoneIndex];
  //   require(milestone.status == GovernorTypes.MilestoneState.Validated, "Milestone not validated");

  //   address recipient = milestones.recipient;
  //   require(msg.sender == recipient, "Not grant recipient");

  //   require(address(this).balance >= milestone.amount, "Insufficient funds");

  //   // Update milestone status to Claimed
  //   $.governor.setMilestoneStatus(proposalId, milestoneIndex, GovernorTypes.MilestoneState.Claimed);

  //   // Transfer funds to recipient
  //   (bool success, ) = payable(recipient).call{ value: milestone.amount }("");
  //   require(success, "Transfer failed");

  //   emit MilestoneClaimed(proposalId, milestoneIndex, milestone.amount);
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

  /** ------------------ OVERRIDES ------------------ **/
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
