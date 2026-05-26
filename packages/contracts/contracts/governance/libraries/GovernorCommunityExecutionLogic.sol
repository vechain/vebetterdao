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
///         B3TR budgets, developer-payee registration, and pull-based payouts from
///         the Treasury after the proposal is marked Completed.
/// @dev All state-changing functions are designed to be called via delegatecall from
///      {B3TRGovernor}; they read and write the namespaced GovernorStorage slot and
///      use `msg.sender` (which resolves to the original caller in delegatecall
///      context, matching the convention used by the existing logic libraries).
library GovernorCommunityExecutionLogic {
  // ------------------ EVENTS ------------------ //

  /// @notice Emitted when a maximum implementation budget is recorded for a proposal.
  /// @dev Emitted from {setProposalBudget}, called during `propose(7)`.
  event ProposalBudgetSet(uint256 indexed proposalId, uint256 maxBudget);

  /// @notice Re-declared backward-compatible event so the new flow keeps emitting the
  ///         same signature as the legacy `markAsInDevelopment(uint256)` path.
  event ProposalInDevelopment(uint256 proposalId);

  /// @notice Off-chain metadata registered alongside payees when entering development.
  event ProposalInDevelopmentDetails(uint256 indexed proposalId, string devNickname, string discussionLink);

  /// @notice Emitted once per payee at registration or after {updatePayees}.
  event ProposalPayeeRegistered(
    uint256 indexed proposalId,
    uint256 indexed payeeIndex,
    address indexed account,
    uint256 amount
  );

  /// @notice Emitted when the registered payee list is replaced via {updatePayees}.
  event ProposalPayeesReset(uint256 indexed proposalId);

  /// @notice Emitted when a single payee successfully pulls their payout from Treasury.
  event ProposalPayoutClaimed(
    uint256 indexed proposalId,
    uint256 indexed payeeIndex,
    address indexed account,
    uint256 amount
  );

  // ------------------ ERRORS ------------------ //

  /// @dev Caller is neither the proposal proposer nor a PROPOSAL_STATE_MANAGER_ROLE holder.
  error UnauthorizedCommunityExecution(address caller, uint256 proposalId);

  /// @dev The targeted proposal is not a Standard proposal (e.g. it is a Grant).
  error RestrictedProposalType(uint256 proposalId, GovernorTypes.ProposalType proposalType);

  /// @dev No max budget was recorded for the proposal; the new flow cannot be used.
  error MissingProposalBudget(uint256 proposalId);

  /// @dev Payees array length is outside the allowed bounds.
  error InvalidPayeeCount(uint256 provided, uint256 max);

  /// @dev A payee entry has a zero address or zero amount.
  error InvalidPayee(uint256 payeeIndex);

  /// @dev Sum of payee amounts exceeds the recorded max budget.
  error BudgetExceeded(uint256 requested, uint256 maxBudget);

  /// @dev markAsInDevelopmentWithPayees was already called for this proposal.
  error PayeesAlreadyFinalized(uint256 proposalId);

  /// @dev Cannot update payees because at least one payout has already been claimed.
  error PayoutAlreadyOccurred(uint256 proposalId, uint256 payeeIndex);

  /// @dev Payee index out of bounds for the registered list.
  error PayeeIndexOutOfBounds(uint256 proposalId, uint256 payeeIndex, uint256 length);

  /// @dev The targeted payee has already been paid.
  error PayoutAlreadyClaimed(uint256 proposalId, uint256 payeeIndex);

  /// @dev claimAllPayouts found no unclaimed entries.
  error NothingToClaim(uint256 proposalId);

  // ------------------ INTERNAL (called from other libraries) ------------------ //

  /// @notice Record the immutable max B3TR budget for a proposal.
  /// @dev Called from `GovernorProposalLogic._propose` when `maxBudget > 0`.
  ///      Idempotent for `maxBudget == 0` (early return) so legacy `propose(6)` is a no-op.
  /// @param proposalId The id of the proposal whose budget is being set.
  /// @param maxBudget  Maximum amount (B3TR wei) that may be paid out to developers.
  function setProposalBudget(uint256 proposalId, uint256 maxBudget) internal {
    if (maxBudget == 0) {
      return;
    }
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    $.proposalMaxBudget[proposalId] = maxBudget;
    emit ProposalBudgetSet(proposalId, maxBudget);
  }

  // ------------------ EXTERNAL: STATE-CHANGING ------------------ //

  /// @notice Mark a proposal as InDevelopment and register the developer payees and metadata.
  /// @dev Authorized to the proposer OR the PROPOSAL_STATE_MANAGER_ROLE caller. The role check
  ///      is performed by the Governor wrapper and forwarded as `callerHasManagerRole`.
  ///      Requirements:
  ///      - Proposal must be a Standard proposal
  ///      - Proposal state must be `Succeeded` (non-executable) or `Executed` — matches the
  ///        guard in the legacy {GovernorProposalLogic.markAsInDevelopment}
  ///      - Budget must have been registered at proposal creation
  ///      - Payee list size in [1, maxPayeesPerProposal]
  ///      - Every payee account != address(0) and amount > 0
  ///      - sum(amounts) <= maxBudget
  ///      - Function must not have been called before for this proposal
  /// @param proposalId       The proposal id.
  /// @param payees           The payees being registered.
  /// @param devNickname      Developer nickname / display identifier (stored on chain).
  /// @param discussionLink   URL to the Discourse / discussion thread (stored on chain).
  /// @param callerHasManagerRole True iff `msg.sender` holds PROPOSAL_STATE_MANAGER_ROLE on the Governor.
  function markAsInDevelopmentWithPayees(
    uint256 proposalId,
    GovernorTypes.Payee[] calldata payees,
    string calldata devNickname,
    string calldata discussionLink,
    bool callerHasManagerRole
  ) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    GovernorTypes.ProposalCore storage proposal = $.proposals[proposalId];

    if (msg.sender != proposal.proposer && !callerHasManagerRole) {
      revert UnauthorizedCommunityExecution(msg.sender, proposalId);
    }

    GovernorTypes.ProposalType proposalType = $.proposalType[proposalId];
    if (proposalType != GovernorTypes.ProposalType.Standard) {
      revert RestrictedProposalType(proposalId, proposalType);
    }

    // Mirror legacy markAsInDevelopment guards: allowed states + executable-not-yet-executed reject.
    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Executed) |
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Succeeded)
    );
    if (
      proposal.isExecutable && GovernorStateLogic._state(proposalId) == GovernorTypes.ProposalState.Succeeded
    ) {
      revert RestrictedProposalType(proposalId, proposalType);
    }

    if ($.proposalPayeesFinalized[proposalId]) {
      revert PayeesAlreadyFinalized(proposalId);
    }

    uint256 budget = $.proposalMaxBudget[proposalId];
    if (budget == 0) {
      revert MissingProposalBudget(proposalId);
    }

    _validatePayees($, payees, budget);

    // Persist payees + metadata.
    $.proposalPayeesFinalized[proposalId] = true;
    for (uint256 i; i < payees.length; ++i) {
      $.proposalPayees[proposalId].push(payees[i]);
    }
    $.proposalDevNickname[proposalId] = devNickname;
    $.proposalDiscussionLink[proposalId] = discussionLink;

    // Transition development state.
    $.proposalDevelopmentState[proposalId] = GovernorTypes.ProposalDevelopmentState.InDevelopment;

    // Emit both legacy + new events so existing indexers keep working.
    emit ProposalInDevelopment(proposalId);
    emit ProposalInDevelopmentDetails(proposalId, devNickname, discussionLink);
    for (uint256 i; i < payees.length; ++i) {
      emit ProposalPayeeRegistered(proposalId, i, payees[i].account, payees[i].amount);
    }
  }

  /// @notice Replace the registered payee list for an in-development proposal.
  /// @dev Caller must hold PROPOSAL_STATE_MANAGER_ROLE — that check is enforced by the
  ///      Governor wrapper. The proposal must still be `InDevelopment` and no payout
  ///      may have been claimed yet (otherwise per-index claim flags would alias).
  /// @param proposalId The proposal id.
  /// @param payees     The new payee list (fully replaces the previous one).
  function updatePayees(uint256 proposalId, GovernorTypes.Payee[] calldata payees) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();

    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.InDevelopment)
    );

    uint256 budget = $.proposalMaxBudget[proposalId];
    if (budget == 0) {
      revert MissingProposalBudget(proposalId);
    }

    _validatePayees($, payees, budget);

    // Guard against claim-index aliasing: no existing payee may be claimed.
    GovernorTypes.Payee[] storage existing = $.proposalPayees[proposalId];
    for (uint256 i; i < existing.length; ++i) {
      if ($.proposalPayeeClaimed[proposalId][i]) {
        revert PayoutAlreadyOccurred(proposalId, i);
      }
    }

    // Replace the array atomically.
    delete $.proposalPayees[proposalId];
    for (uint256 i; i < payees.length; ++i) {
      $.proposalPayees[proposalId].push(payees[i]);
    }

    emit ProposalPayeesReset(proposalId);
    for (uint256 i; i < payees.length; ++i) {
      emit ProposalPayeeRegistered(proposalId, i, payees[i].account, payees[i].amount);
    }
  }

  /// @notice Claim a single payout for a registered payee. Callable by anyone.
  /// @dev Idempotent at the (proposalId, payeeIndex) granularity.
  /// @param proposalId  The proposal id (must be in `Completed` state).
  /// @param payeeIndex  The index into the registered payees array.
  function claimPayout(uint256 proposalId, uint256 payeeIndex) external {
    _claimPayout(proposalId, payeeIndex, true);
  }

  /// @notice Claim payouts for every unclaimed payee of a Completed proposal in one tx.
  /// @dev Iterates the registered payees and silently skips any already-claimed index.
  ///      Reverts if every payee has already been paid.
  /// @param proposalId The proposal id (must be in `Completed` state).
  function claimAllPayouts(uint256 proposalId) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();

    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Completed)
    );

    GovernorTypes.Payee[] storage payees = $.proposalPayees[proposalId];
    uint256 n = payees.length;

    ITreasury treasury = $.treasury;
    bool anyClaimed = false;

    for (uint256 i; i < n; ++i) {
      if ($.proposalPayeeClaimed[proposalId][i]) {
        continue;
      }
      $.proposalPayeeClaimed[proposalId][i] = true;
      address account = payees[i].account;
      uint256 amount = payees[i].amount;
      treasury.transferB3TR(account, amount);
      emit ProposalPayoutClaimed(proposalId, i, account, amount);
      anyClaimed = true;
    }

    if (!anyClaimed) {
      revert NothingToClaim(proposalId);
    }
  }

  // ------------------ EXTERNAL: VIEWS ------------------ //

  /// @notice Maximum implementation budget recorded for the proposal (B3TR wei).
  function getProposalBudget(uint256 proposalId) external view returns (uint256) {
    return GovernorStorageTypes.getGovernorStorage().proposalMaxBudget[proposalId];
  }

  /// @notice Whether {markAsInDevelopmentWithPayees} has been called for the proposal.
  function isProposalPayeesFinalized(uint256 proposalId) external view returns (bool) {
    return GovernorStorageTypes.getGovernorStorage().proposalPayeesFinalized[proposalId];
  }

  /// @notice Registered payee list for the proposal.
  function getProposalPayees(uint256 proposalId) external view returns (GovernorTypes.Payee[] memory) {
    return GovernorStorageTypes.getGovernorStorage().proposalPayees[proposalId];
  }

  /// @notice A specific registered payee by index.
  function getProposalPayee(
    uint256 proposalId,
    uint256 payeeIndex
  ) external view returns (GovernorTypes.Payee memory) {
    GovernorTypes.Payee[] storage payees = GovernorStorageTypes.getGovernorStorage().proposalPayees[proposalId];
    if (payeeIndex >= payees.length) {
      revert PayeeIndexOutOfBounds(proposalId, payeeIndex, payees.length);
    }
    return payees[payeeIndex];
  }

  /// @notice Whether the payout at `payeeIndex` for `proposalId` has already been claimed.
  function isPayoutClaimed(uint256 proposalId, uint256 payeeIndex) external view returns (bool) {
    return GovernorStorageTypes.getGovernorStorage().proposalPayeeClaimed[proposalId][payeeIndex];
  }

  /// @notice The developer nickname + discussion link registered for the proposal.
  function getProposalDevInfo(
    uint256 proposalId
  ) external view returns (string memory devNickname, string memory discussionLink) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return ($.proposalDevNickname[proposalId], $.proposalDiscussionLink[proposalId]);
  }

  /// @notice The current Treasury reference used for payouts.
  function getTreasury() external view returns (ITreasury) {
    return GovernorStorageTypes.getGovernorStorage().treasury;
  }

  /// @notice Current maximum allowed payee count per proposal.
  function getMaxPayeesPerProposal() external view returns (uint256) {
    return GovernorStorageTypes.getGovernorStorage().maxPayeesPerProposal;
  }

  // ------------------ INTERNAL HELPERS ------------------ //

  /// @dev Common per-payee-array validation used by both registration paths.
  function _validatePayees(
    GovernorStorageTypes.GovernorStorage storage $,
    GovernorTypes.Payee[] calldata payees,
    uint256 budget
  ) private view {
    uint256 max = $.maxPayeesPerProposal;
    if (payees.length == 0 || payees.length > max) {
      revert InvalidPayeeCount(payees.length, max);
    }
    uint256 sum;
    for (uint256 i; i < payees.length; ++i) {
      if (payees[i].account == address(0) || payees[i].amount == 0) {
        revert InvalidPayee(i);
      }
      sum += payees[i].amount;
    }
    if (sum > budget) {
      revert BudgetExceeded(sum, budget);
    }
  }

  /// @dev Per-payee claim path with CEI ordering.
  function _claimPayout(uint256 proposalId, uint256 payeeIndex, bool revertOnAlreadyClaimed) private {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();

    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Completed)
    );

    GovernorTypes.Payee[] storage payees = $.proposalPayees[proposalId];
    if (payeeIndex >= payees.length) {
      revert PayeeIndexOutOfBounds(proposalId, payeeIndex, payees.length);
    }

    if ($.proposalPayeeClaimed[proposalId][payeeIndex]) {
      if (revertOnAlreadyClaimed) {
        revert PayoutAlreadyClaimed(proposalId, payeeIndex);
      }
      return;
    }

    $.proposalPayeeClaimed[proposalId][payeeIndex] = true;
    address account = payees[payeeIndex].account;
    uint256 amount = payees[payeeIndex].amount;
    $.treasury.transferB3TR(account, amount);
    emit ProposalPayoutClaimed(proposalId, payeeIndex, account, amount);
  }
}
