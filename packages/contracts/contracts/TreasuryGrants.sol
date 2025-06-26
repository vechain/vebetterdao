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

import { GovernorStateLogic } from "./governance/libraries/GovernorStateLogic.sol";
import { GovernorMilestoneLogic } from "./governance/libraries/GovernorMilestoneLogic.sol";
import { GovernorTypes } from "./governance/libraries/GovernorTypes.sol";
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

/**
 * @title TreasuryGrants
 * @notice Contract that manages grant funds and milestone payments
 */
contract TreasuryGrants is
  IERC721Receiver,
  IERC1155Receiver,
  AccessControlUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  /// @notice Role identifier for governance operations
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
  /// @notice Role identifier for upgrading the contract
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  /// @notice Role identifier for pausing the contract
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  /// @notice Storage structure for TreasuryGrants
  /// @custom:storage-location erc7201:b3tr.storage.TreasuryGrants
  struct TreasuryGrantsStorage {
    IB3TRGovernor governor;
    ITreasury treasury;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.TreasuryGrants")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant TREASURY_GRANTS_STORAGE_POSITION =
    0x5e9e1c17086de7a6e077aa6f5e7f4e07cc54a96e4c9d8c0a468e334b50d62f00;

  function _getTreasuryGrantsStorage() private pure returns (TreasuryGrantsStorage storage $) {
    assembly {
      $.slot := TREASURY_GRANTS_STORAGE_POSITION
    }
  }

  // TODO : define each events and errors
  // Events
  event MilestoneValidated(uint256 indexed proposalId, uint256 indexed milestoneIndex);
  event MilestoneClaimed(uint256 indexed proposalId, uint256 indexed milestoneIndex, uint256 amount);
  event FundsReceived(uint256 indexed proposalId, uint256 amount);

  // Errors
  error InvalidMilestoneState();
  error NotGrantRecipient();
  error InsufficientFunds();
  error InvalidMilestoneIndex();
  error PreviousMilestoneNotClaimed();

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address _governor, address _treasury) external initializer {
    _validateAddresses(_governor, _treasury);

    __UUPSUpgradeable_init();
    __AccessControl_init();
    __Pausable_init();
    __ReentrancyGuard_init();
    TreasuryGrantsStorage storage $ = _getTreasuryGrantsStorage();
    $.governor = IB3TRGovernor(_governor);
    $.treasury = ITreasury(_treasury);
  }

  function _validateAddresses(address _governor, address _treasury) internal view {
    require(_governor != address(0), "Governor address cannot be 0");
    require(_treasury != address(0), "Treasury address cannot be 0");
  }

  /**
   * @notice Receives funds for a grant proposal
   * @param proposalId The ID of the grant proposal
   */
  function receiveFunds(uint256 proposalId) external payable {
    TreasuryGrantsStorage storage $ = _getTreasuryGrantsStorage();
    require(msg.sender == address($.governor), "Only governor can send funds");
    emit FundsReceived(proposalId, msg.value);
  }

  /**
   * @notice Validates a milestone for claiming
   * @param proposalId The ID of the grant proposal
   * @param milestoneIndex The index of the milestone to validate
   */
  function validateMilestone(uint256 proposalId, uint256 milestoneIndex) external onlyRole(GOVERNANCE_ROLE) {
    TreasuryGrantsStorage storage $ = _getTreasuryGrantsStorage();
    GovernorTypes.Milestones memory milestones = $.governor.getMilestones(proposalId);
    require(milestoneIndex < milestones.milestone.length, "Invalid milestone index");

    // Check if first milestone or previous milestone is claimed
    if (milestoneIndex > 0) {
      require(
        milestones.milestone[milestoneIndex - 1].status == GovernorTypes.MilestoneState.Claimed,
        "TreasuryGrants: Previous milestone not claimed"
      );
    }

    require(
      milestones.milestone[milestoneIndex].status == GovernorTypes.MilestoneState.Pending,
      "TreasuryGrants: Milestone is not ready to be validated"
    );

    $.governor.setMilestoneStatus(proposalId, milestoneIndex, GovernorTypes.MilestoneState.Validated);

    emit MilestoneValidated(proposalId, milestoneIndex);
  }

  /**
   * @notice Claims funds for a validated milestone
   * @param proposalId The ID of the grant proposal
   * @param milestoneIndex The index of the milestone to claim
   */
  function claimMilestone(uint256 proposalId, uint256 milestoneIndex) external nonReentrant {
    TreasuryGrantsStorage storage $ = _getTreasuryGrantsStorage();

    GovernorTypes.Milestones memory milestones = $.governor.getMilestones(proposalId);
    require(milestoneIndex < milestones.milestone.length, "Invalid milestone index");

    GovernorTypes.Milestone memory milestone = milestones.milestone[milestoneIndex];
    require(milestone.status == GovernorTypes.MilestoneState.Validated, "Milestone not validated");

    address recipient = milestones.recipient;
    require(msg.sender == recipient, "Not grant recipient");

    require(address(this).balance >= milestone.amount, "Insufficient funds");

    // Update milestone status to Claimed
    $.governor.setMilestoneStatus(proposalId, milestoneIndex, GovernorTypes.MilestoneState.Claimed);

    // Transfer funds to recipient
    (bool success, ) = payable(recipient).call{ value: milestone.amount }("");
    require(success, "Transfer failed");

    emit MilestoneClaimed(proposalId, milestoneIndex, milestone.amount);
  }

  /**
   * @notice Returns whether a milestone is claimable
   * @param proposalId The ID of the grant proposal
   * @param milestoneIndex The index of the milestone
   */
  function isClaimable(uint256 proposalId, uint256 milestoneIndex) external view returns (bool) {
    TreasuryGrantsStorage storage $ = _getTreasuryGrantsStorage();
    GovernorTypes.Milestones memory milestones = $.governor.getMilestones(proposalId);
    if (milestoneIndex >= milestones.milestone.length) return false;

    return milestones.milestone[milestoneIndex].status == GovernorTypes.MilestoneState.Validated;
  }
  /**
   * @notice Implements IERC721Receiver interface
   */
  function onERC721Received(
    address,
    address,
    uint256,
    bytes calldata
  ) external pure override returns (bytes4) {
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
  function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlUpgradeable, IERC165) returns (bool) {
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
