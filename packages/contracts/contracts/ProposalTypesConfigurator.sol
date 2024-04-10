// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IProposalTypesConfigurator } from "./interfaces/IProposalTypesConfigurator.sol";
import { IB3TRGovernor } from "./interfaces/IB3TRGovernor.sol";

/**
 * Contract that stores proposalTypes for B3TRGovernor.
 */
contract ProposalTypesConfigurator is IProposalTypesConfigurator {
  /*//////////////////////////////////////////////////////////////
                           IMMUTABLE STORAGE
    //////////////////////////////////////////////////////////////*/

  IB3TRGovernor public immutable governor;
  uint16 public constant PERCENT_DIVISOR = 10_000;
  bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

  /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

  mapping(uint256 proposalTypeId => ProposalType) internal _proposalTypes;

  /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

  modifier onlyAdmin() {
    if (!governor.hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert NotAdmin();
    _;
  }

  /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

  constructor(IB3TRGovernor governor_) {
    governor = governor_;
  }

  /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/

  function proposalTypes(uint256 proposalTypeId) external view override returns (ProposalType memory) {
    return _proposalTypes[proposalTypeId];
  }

  /**
   * @dev Set the parameters for a proposal type. Only callable by the manager.
   *
   * @param proposalTypeId Id of the proposal type
   * @param quorum Quorum percentage, scaled by `PERCENT_DIVISOR`
   * @param approvalThreshold Approval threshold percentage, scaled by `PERCENT_DIVISOR`
   * @param name Name of the proposal type
   */
  function setProposalType(
    uint256 proposalTypeId,
    uint16 quorum,
    uint16 approvalThreshold, //TODO: do we need this?
    string memory name
  ) external override onlyAdmin {
    if (quorum > PERCENT_DIVISOR) revert InvalidQuorum();
    if (approvalThreshold > PERCENT_DIVISOR) revert InvalidApprovalThreshold();

    _proposalTypes[proposalTypeId] = ProposalType(quorum, approvalThreshold, name);

    emit ProposalTypeSet(proposalTypeId, quorum, approvalThreshold, name);
  }
}
