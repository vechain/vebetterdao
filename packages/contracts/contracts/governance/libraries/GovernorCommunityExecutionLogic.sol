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

import { GovernorTypes } from "./GovernorTypes.sol";
import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { GovernorStateLogic } from "./GovernorStateLogic.sol";
import { ITreasury } from "../../interfaces/ITreasury.sol";

/// @title GovernorCommunityExecutionLogic
/// @notice Library implementing the V11 Community Execution Framework: per-proposal
///         B3TR implementation cost, a single payout address that receives the full
///         budget after the proposal is marked Completed, free-text description /
///         implementation-discussion link, and a list of contributor handles.
/// @dev All state-changing functions are designed to be called via delegatecall from
///      {B3TRGovernor}; they read and write the namespaced GovernorStorage slot and
///      use `msg.sender` (which resolves to the original caller in delegatecall
///      context, matching the convention used by the existing logic libraries).
library GovernorCommunityExecutionLogic {
  // ------------------ EVENTS ------------------ //

  /// @notice Emitted when an implementation-cost budget is recorded for a proposal.
  event ProposalBudgetSet(uint256 indexed proposalId, uint256 maxBudget);

  /// @notice Re-declared backward-compatible event so the new flow keeps emitting the
  ///         same signature as the legacy `markAsInDevelopment(uint256)` path used to.
  event ProposalInDevelopment(uint256 proposalId);

  /// @notice Off-chain metadata registered alongside the payee when entering development
  ///         (or replaced via {updateCommunityExecution} before payout).
  event ProposalInDevelopmentDetails(
    uint256 indexed proposalId,
    address indexed payee,
    string description,
    string implementationDiscussion
  );

  /// @notice Emitted when the contributor handles are (re)set for a proposal.
  event ProposalContributorsSet(uint256 indexed proposalId, string[] contributors);

  /// @notice Emitted when the single payout is pulled from Treasury to the registered payee.
  event ProposalPayoutClaimed(uint256 indexed proposalId, address indexed payee, uint256 amount);

  // ------------------ ERRORS ------------------ //

  /// @dev Caller is neither the proposal proposer nor a PROPOSAL_STATE_MANAGER_ROLE holder.
  error UnauthorizedCommunityExecution(address caller, uint256 proposalId);

  /// @dev No max budget was recorded for the proposal; the V11 flow cannot be used.
  error MissingProposalBudget(uint256 proposalId);

  /// @dev The payee address is the zero address.
  error InvalidPayeeAddress();

  /// @dev Contributors array is larger than `maxContributorsPerProposal`.
  error TooManyContributors(uint256 provided, uint256 max);

  /// @dev markAsInDevelopment was already called for this proposal.
  error PayeesAlreadyFinalized(uint256 proposalId);

  /// @dev The payout was already pulled from Treasury.
  error PayoutAlreadyClaimed(uint256 proposalId);

  /// @dev The proposal is not in a state where the budget can be paid out.
  error NotReadyToClaim(uint256 proposalId);

  // ------------------ INTERNAL (called from other libraries) ------------------ //

  /// @notice Record the immutable max B3TR implementation cost for a proposal.
  /// @dev Called from `GovernorProposalLogic._propose` when `maxBudget > 0`. Idempotent
  ///      for `maxBudget == 0` (early return).
  function setProposalBudget(uint256 proposalId, uint256 maxBudget) internal {
    if (maxBudget == 0) {
      return;
    }
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    $.proposalMaxBudget[proposalId] = maxBudget;
    emit ProposalBudgetSet(proposalId, maxBudget);
  }

  // ------------------ EXTERNAL: STATE-CHANGING ------------------ //

  /// @notice Mark a proposal as InDevelopment and register the V11 payee + metadata.
  /// @dev Authorized to the proposer OR a PROPOSAL_STATE_MANAGER_ROLE caller; the role
  ///      check is performed by the Governor wrapper and forwarded as `callerHasManagerRole`.
  ///
  ///      Validation:
  ///      - Proposal must be a Standard proposal (Grants follow the milestone payout flow)
  ///      - Proposal state must be `Executed`, or `Succeeded` when not executable
  ///      - The function must not have been called before for this proposal
  ///      - When `maxBudget > 0` (community-execution proposal): `payee` must be != 0
  ///      - When `maxBudget == 0`: `payee` may be zero (pure state transition, no payout)
  ///      - Contributors list size must be <= maxContributorsPerProposal
  ///
  ///      The single registered payee receives the FULL `maxBudget` when {claimPayout}
  ///      is later called. It is the payee's responsibility to forward funds to any
  ///      contributors / dev team / project manager off-chain.
  function markAsInDevelopment(
    uint256 proposalId,
    address payee,
    string calldata description,
    string calldata implementationDiscussion,
    string[] calldata contributors,
    bool callerHasManagerRole
  ) external {
    _checkMarkAsInDevelopmentGuards(proposalId, callerHasManagerRole);
    _validateBudgetVsPayee(proposalId, payee);
    _validateContributorsCount(contributors);

    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    if ($.proposalPayeesFinalized[proposalId]) {
      revert PayeesAlreadyFinalized(proposalId);
    }
    $.proposalPayeesFinalized[proposalId] = true;

    _writeCommunityExecutionData(proposalId, payee, description, implementationDiscussion, contributors);
    $.proposalDevelopmentState[proposalId] = GovernorTypes.ProposalDevelopmentState.InDevelopment;
    emit ProposalInDevelopment(proposalId);
  }

  function _checkMarkAsInDevelopmentGuards(uint256 proposalId, bool callerHasManagerRole) private view {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    GovernorTypes.ProposalCore storage proposal = $.proposals[proposalId];

    if (msg.sender != proposal.proposer && !callerHasManagerRole) {
      revert UnauthorizedCommunityExecution(msg.sender, proposalId);
    }

    GovernorTypes.ProposalType proposalType = $.proposalType[proposalId];
    if (proposalType != GovernorTypes.ProposalType.Standard) {
      revert GovernorRestrictedProposal(proposalId, proposalType);
    }

    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Executed) |
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Succeeded)
    );
    if (
      proposal.isExecutable && GovernorStateLogic._state(proposalId) == GovernorTypes.ProposalState.Succeeded
    ) {
      revert GovernorRestrictedProposal(proposalId, proposalType);
    }
  }

  function _validateBudgetVsPayee(uint256 proposalId, address payee) private view {
    uint256 budget = GovernorStorageTypes.getGovernorStorage().proposalMaxBudget[proposalId];
    if (budget > 0 && payee == address(0)) {
      revert InvalidPayeeAddress();
    }
    if (budget == 0 && payee != address(0)) {
      revert MissingProposalBudget(proposalId);
    }
  }

  function _validateContributorsCount(string[] calldata contributors) private view {
    uint256 max = GovernorStorageTypes.getGovernorStorage().maxContributorsPerProposal;
    if (contributors.length > max) {
      revert TooManyContributors(contributors.length, max);
    }
  }

  function _writeCommunityExecutionData(
    uint256 proposalId,
    address payee,
    string calldata description,
    string calldata implementationDiscussion,
    string[] calldata contributors
  ) private {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    $.proposalPayee[proposalId] = payee;
    $.proposalDescription[proposalId] = description;
    $.proposalImplementationDiscussion[proposalId] = implementationDiscussion;
    _setContributors($, proposalId, contributors);
    emit ProposalInDevelopmentDetails(proposalId, payee, description, implementationDiscussion);
    emit ProposalContributorsSet(proposalId, contributors);
  }

  /// @notice Replace the payee / description / discussion / contributors for an
  ///         in-development proposal whose payout has not yet been claimed.
  /// @dev Authorized to the proposer OR a PROPOSAL_STATE_MANAGER_ROLE caller (matching
  ///      markAsInDevelopment access rules). Allowed while the proposal is `InDevelopment`
  ///      or `Completed` so the proposer can still correct the payout target up until
  ///      {claimPayout} is called. Once `proposalPaid` is true the data is immutable.
  function updateCommunityExecution(
    uint256 proposalId,
    address payee,
    string calldata description,
    string calldata implementationDiscussion,
    string[] calldata contributors,
    bool callerHasManagerRole
  ) external {
    _checkUpdateCommunityExecutionGuards(proposalId, callerHasManagerRole);
    _validateBudgetVsPayee(proposalId, payee);
    _validateContributorsCount(contributors);
    _writeCommunityExecutionData(proposalId, payee, description, implementationDiscussion, contributors);
  }

  function _checkUpdateCommunityExecutionGuards(uint256 proposalId, bool callerHasManagerRole) private view {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    GovernorTypes.ProposalCore storage proposal = $.proposals[proposalId];

    if (msg.sender != proposal.proposer && !callerHasManagerRole) {
      revert UnauthorizedCommunityExecution(msg.sender, proposalId);
    }

    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.InDevelopment) |
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Completed)
    );
    if ($.proposalPaid[proposalId]) {
      revert PayoutAlreadyClaimed(proposalId);
    }
  }

  /// @notice Pull the full implementation cost from Treasury to the registered payee.
  /// @dev Callable by anyone. Requires the proposal to be `Completed`. Idempotent.
  function claimPayout(uint256 proposalId) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();

    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Completed)
    );

    if ($.proposalPaid[proposalId]) {
      revert PayoutAlreadyClaimed(proposalId);
    }

    address payee = $.proposalPayee[proposalId];
    uint256 amount = $.proposalMaxBudget[proposalId];
    if (payee == address(0) || amount == 0) {
      revert NotReadyToClaim(proposalId);
    }

    $.proposalPaid[proposalId] = true;
    $.treasury.transferB3TR(payee, amount);
    emit ProposalPayoutClaimed(proposalId, payee, amount);
  }

  // ------------------ EXTERNAL: VIEWS ------------------ //

  function getProposalBudget(uint256 proposalId) external view returns (uint256) {
    return GovernorStorageTypes.getGovernorStorage().proposalMaxBudget[proposalId];
  }

  function getProposalPayee(uint256 proposalId) external view returns (address) {
    return GovernorStorageTypes.getGovernorStorage().proposalPayee[proposalId];
  }

  function isProposalPaid(uint256 proposalId) external view returns (bool) {
    return GovernorStorageTypes.getGovernorStorage().proposalPaid[proposalId];
  }

  function isProposalCommunityExecutionFinalized(uint256 proposalId) external view returns (bool) {
    return GovernorStorageTypes.getGovernorStorage().proposalPayeesFinalized[proposalId];
  }

  function getProposalDescription(uint256 proposalId) external view returns (string memory) {
    return GovernorStorageTypes.getGovernorStorage().proposalDescription[proposalId];
  }

  function getProposalImplementationDiscussion(uint256 proposalId) external view returns (string memory) {
    return GovernorStorageTypes.getGovernorStorage().proposalImplementationDiscussion[proposalId];
  }

  function getProposalContributors(uint256 proposalId) external view returns (string[] memory) {
    return GovernorStorageTypes.getGovernorStorage().proposalContributors[proposalId];
  }

  function getMaxContributorsPerProposal() external view returns (uint256) {
    return GovernorStorageTypes.getGovernorStorage().maxContributorsPerProposal;
  }

  // ------------------ INTERNAL HELPERS ------------------ //

  function _setContributors(
    GovernorStorageTypes.GovernorStorage storage $,
    uint256 proposalId,
    string[] calldata contributors
  ) private {
    delete $.proposalContributors[proposalId];
    for (uint256 i; i < contributors.length; ++i) {
      $.proposalContributors[proposalId].push(contributors[i]);
    }
  }

  // ------------------ ERRORS USED FROM OTHER LIBRARIES ------------------ //

  /// @dev Re-declared here so it can be referenced from this library's revert paths.
  ///      Matches the existing selector declared in GovernorProposalLogic / IB3TRGovernor.
  error GovernorRestrictedProposal(uint256 proposalId, GovernorTypes.ProposalType proposalType);
}
