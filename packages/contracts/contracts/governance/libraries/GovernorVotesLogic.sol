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

import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { GovernorTypes } from "./GovernorTypes.sol";
import { GovernorStateLogic } from "./GovernorStateLogic.sol";
import { GovernorConfigurator } from "./GovernorConfigurator.sol";
import { GovernorProposalLogic } from "./GovernorProposalLogic.sol";
import { GovernorClockLogic } from "./GovernorClockLogic.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { RelayerAction } from "../../interfaces/IRelayerRewardsPool.sol";

/// @title GovernorVotesLogic
/// @notice Library for handling voting logic in the Governor contract.
/// @dev Difference from V1: `proposalId` is passed as an argument to `registerVote` function instead of `proposalSnapshot`.
library GovernorVotesLogic {
  using Checkpoints for Checkpoints.Trace208;

  /// @dev Thrown when a vote has already been cast by the voter.
  /// @param voter The address of the voter who already cast a vote.
  error GovernorAlreadyCastVote(address voter);

  /// @dev Thrown when an invalid vote type is used.
  error GovernorInvalidVoteType();

  /// @dev Thrown when the voting threshold is not met.
  /// @param threshold The required voting threshold.
  /// @param votes The actual votes received.
  error GovernorVotingThresholdNotMet(uint256 threshold, uint256 votes);

  /// @dev Thrown when the personhood verification fails.
  /// @param voter The address of the voter.
  /// @param explanation The reason for the failure.
  error GovernorPersonhoodVerificationFailed(address voter, string explanation);

  /// @notice Emitted when a vote is cast without parameters.
  /// @param voter The address of the voter.
  /// @param proposalId The ID of the proposal being voted on.
  /// @param support The support value of the vote.
  /// @param weight The weight of the vote.
  /// @param power The voting power of the voter.
  /// @param reason The reason for the vote.
  event VoteCast(
    address indexed voter,
    uint256 indexed proposalId,
    uint8 support,
    uint256 weight,
    uint256 power,
    string reason
  );

  /// @notice Emitted when a navigator governance vote is skipped (navigator dead or no decision set)
  event NavigatorGovernanceVoteSkipped(address indexed citizen, address indexed navigator, uint256 indexed proposalId);

  /// @notice Emitted when a navigator casts a vote on behalf of a delegated citizen
  event NavigatorGovernanceVoteCast(
    address indexed citizen,
    address indexed navigator,
    uint256 indexed proposalId,
    uint8 support,
    uint256 weight,
    uint256 power
  );

  /// @dev Thrown when citizen is not delegated to any navigator
  error NotDelegatedToNavigator(address citizen);

  /// @dev Thrown when citizen is delegated to a navigator and cannot vote manually
  error DelegatedToNavigator(address citizen);

  /// @dev Thrown when navigator has not set a decision for the proposal
  error NavigatorDecisionNotSet(address navigator, uint256 proposalId);

  /// @dev The governance skip window has not been reached yet
  error GovernanceSkipWindowNotReached(uint256 proposalId);

  /// @notice Emits true if quadratic voting is disabled, false otherwise.
  /// @param disabled - The flag to enable or disable quadratic voting.
  event QuadraticVotingToggled(bool indexed disabled);

  /** ------------------ INTERNAL FUNCTIONS ------------------ **/

  /**
   * @dev Internal function to count a vote for a proposal.
   * @param proposalId The ID of the proposal.
   * @param account The address of the voter.
   * @param support The support value of the vote.
   * @param weight The weight of the vote.
   * @param power The voting power of the voter.
   */
  function _countVote(uint256 proposalId, address account, uint8 support, uint256 weight, uint256 power) private {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    GovernorTypes.ProposalVote storage proposalVote = $.proposalVotes[proposalId];

    if (proposalVote.hasVoted[account]) {
      revert GovernorAlreadyCastVote(account);
    }
    proposalVote.hasVoted[account] = true;

    // if quadratic voting is disabled, use the weight as the vote otherwise use the power as the vote
    uint256 vote = isQuadraticVotingDisabledForCurrentRound() ? weight : power;

    if (support == uint8(GovernorTypes.VoteType.Against)) {
      proposalVote.againstVotes += vote;
    } else if (support == uint8(GovernorTypes.VoteType.For)) {
      proposalVote.forVotes += vote;
    } else if (support == uint8(GovernorTypes.VoteType.Abstain)) {
      proposalVote.abstainVotes += vote;
    } else {
      revert GovernorInvalidVoteType();
    }

    $.proposalTotalVotes[proposalId] += weight;

    // Save that user cast vote only the first time
    if (!$.hasVotedOnce[account]) {
      $.hasVotedOnce[account] = true;
    }
  }

  /**
   * @dev Internal function to check if the vote succeeded.
   * @param proposalId The ID of the proposal.
   * @return True if the vote succeeded, false otherwise.
   */
  function voteSucceeded(uint256 proposalId) internal view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    GovernorTypes.ProposalVote storage proposalVote = $.proposalVotes[proposalId];
    return proposalVote.forVotes > proposalVote.againstVotes;
  }

  /** ------------------ GETTERS ------------------ **/

  /**
   * @notice Retrieves the effective voting power for an account at a given timepoint.
   * @dev If citizen had a navigator at the snapshot and that navigator is still alive (not deactivated/exiting),
   *      returns the delegated amount (their effective participation via navigator).
   *      If navigator is dead, delegation is void and citizen has full VOT3 balance.
   *      If not delegated, returns full VOT3 balance + staked B3TR (converted to VOT3) for navigators.
   *      The staked amount is checkpointed in NavigatorRegistry and returns 0 for non-navigators.
   * @param account The address of the account.
   * @param timepoint The specific timepoint.
   * @return The effective voting power at the given timepoint.
   */
  function getVotes(address account, uint256 timepoint) internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    uint256 totalVotes = $.vot3.getPastVotes(account, timepoint);

    if (address($.navigatorRegistry) == address(0)) return totalVotes;
    // getNavigatorAtTimepoint returns address(0) if not delegated or navigator was dead
    if ($.navigatorRegistry.getNavigatorAtTimepoint(account, timepoint) != address(0)) {
      return $.navigatorRegistry.getDelegatedAmountAtTimepoint(account, timepoint);
    }

    // Include staked amount for navigators (B3TR converted to VOT3 under the hood)
    // Returns 0 for non-navigators (no checkpoints)
    totalVotes += $.navigatorRegistry.getStakedAmountAtTimepoint(account, timepoint);
    return totalVotes;
  }

  /**
   * @notice Retrieves the quadratic voting power of an account at a given timepoint.
   * @param account The address of the account.
   * @param timepoint The specific timepoint.
   * @return The quadratic voting power of the account.
   */
  function getQuadraticVotingPower(address account, uint256 timepoint) external view returns (uint256) {
    // Scale the votes by 1e9 so that the number returned is 1e18
    return Math.sqrt(getVotes(account, timepoint)) * 1e9;
  }

  /**
   * @notice Checks if an account has voted on a specific proposal.
   * @param proposalId The ID of the proposal.
   * @param account The address of the account.
   * @return True if the account has voted, false otherwise.
   */
  function hasVoted(uint256 proposalId, address account) internal view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.proposalVotes[proposalId].hasVoted[account];
  }

  /**
   * @notice Retrieves the votes for a proposal.
   * @param proposalId The ID of the proposal.
   * @return againstVotes The number of votes against the proposal.
   * @return forVotes The number of votes for the proposal.
   * @return abstainVotes The number of abstain votes.
   */
  function getProposalVotes(
    uint256 proposalId
  ) internal view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    GovernorTypes.ProposalVote storage proposalVote = $.proposalVotes[proposalId];
    return (proposalVote.againstVotes, proposalVote.forVotes, proposalVote.abstainVotes);
  }

  /**
   * @notice Checks if a user has voted at least once.
   * @param user The address of the user.
   * @return True if the user has voted once, false otherwise.
   */
  function userVotedOnce(address user) internal view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.hasVotedOnce[user];
  }

  /** ------------------ EXTERNAL FUNCTIONS ------------------ **/

  /**
   * @notice Casts a vote on a proposal.
   * @param proposalId The ID of the proposal.
   * @param voter The address of the voter.
   * @param support The support value of the vote.
   * @param reason The reason for the vote.
   * @return The weight of the vote.
   */
  function castVote(
    uint256 proposalId,
    address voter,
    uint8 support,
    string calldata reason
  ) external returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Active)
    );

    uint256 proposalSnapshot = GovernorProposalLogic._proposalSnapshot(proposalId);

    // Citizens delegated to an alive navigator at the proposal snapshot cannot vote manually
    if (address($.navigatorRegistry) != address(0)) {
      if ($.navigatorRegistry.getNavigatorAtTimepoint(voter, proposalSnapshot) != address(0)) {
        revert DelegatedToNavigator(voter);
      }
    }

    (bool isPerson, string memory explanation) = $.veBetterPassport.isPersonAtTimepoint(
      voter,
      SafeCast.toUint48(proposalSnapshot)
    );

    // Check if the voter or the delegator of personhood to the voter is a person and returning error with the reason
    if (!isPerson) {
      revert GovernorPersonhoodVerificationFailed(voter, explanation);
    }

    uint256 weight = getVotes(voter, proposalSnapshot); // voting power including staked B3TR for navigators
    uint256 power = Math.sqrt(weight) * 1e9;
    GovernorTypes.ProposalType proposalType = GovernorTypes.ProposalType(
      GovernorProposalLogic.proposalType(proposalId)
    );

    _checkVotingThreshold(weight, proposalType);

    _countVote(proposalId, voter, support, weight, power);

    // Apply governance intent multiplier and register vote for rewards
    _registerVoteWithIntentMultiplier($, proposalId, voter, weight, support, proposalSnapshot);

    emit VoteCast(voter, proposalId, support, weight, power, reason);

    return weight;
  }

  /**
   * @notice Cast a governance vote on behalf of a citizen delegated to a navigator,
   *         or auto-skip if the navigator is dead / has not set a decision (after skip window).
   *
   * Decision flow:
   *   1. Navigator dead at snapshot → revert (citizen not delegated)
   *   2. Citizen not a person at snapshot → skip, reduce governance vote expectation
   *   3. Navigator dead NOW → skip immediately, reduce governance vote expectation
   *   4. Navigator alive + decision set → vote normally
   *   5. Navigator alive + no decision + skip window reached → skip
   *   6. Navigator alive + no decision + skip window NOT reached → revert (relayer retries later)
   */
  function castNavigatorVote(uint256 proposalId, address citizen) external returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Active)
    );

    uint256 proposalSnapshot = GovernorProposalLogic._proposalSnapshot(proposalId);
    address navigator = $.navigatorRegistry.getNavigatorAtTimepoint(citizen, proposalSnapshot);
    if (navigator == address(0)) revert NotDelegatedToNavigator(citizen);

    uint256 roundId = $.proposals[proposalId].roundIdVoteStart;

    // Citizen without valid passport → skip (same pattern as auto-voting)
    (bool isPerson, ) = $.veBetterPassport.isPersonAtTimepoint(
      citizen,
      SafeCast.toUint48(proposalSnapshot)
    );
    if (!isPerson) {
      if (address($.relayerRewardsPool) != address(0)) {
        $.relayerRewardsPool.reduceUserGovernanceVote(roundId, citizen, proposalId);
      }
      emit NavigatorGovernanceVoteSkipped(citizen, navigator, proposalId);
      return 0;
    }

    // Dead navigator → skip immediately
    if ($.navigatorRegistry.isDeactivated(navigator)) {
      if (address($.relayerRewardsPool) != address(0)) {
        $.relayerRewardsPool.reduceUserGovernanceVote(roundId, citizen, proposalId);
      }
      emit NavigatorGovernanceVoteSkipped(citizen, navigator, proposalId);
      return 0;
    }

    // Navigator alive — check decision
    if (!$.navigatorRegistry.hasSetDecision(navigator, proposalId)) {
      // No decision set — skip only after window
      uint256 deadline = GovernorProposalLogic._proposalDeadline(proposalId);
      if (block.number + GovernorConfigurator.governanceSkipWindowBlocks() < deadline) {
        revert GovernanceSkipWindowNotReached(proposalId);
      }
      if (address($.relayerRewardsPool) != address(0)) {
        $.relayerRewardsPool.reduceUserGovernanceVote(roundId, citizen, proposalId);
      }
      emit NavigatorGovernanceVoteSkipped(citizen, navigator, proposalId);
      return 0;
    }

    // Decision is offset by 1 in NavigatorRegistry: 1=Against, 2=For, 3=Abstain
    // B3TRGovernor uses: 0=Against, 1=For, 2=Abstain
    uint8 decision = $.navigatorRegistry.getProposalDecision(navigator, proposalId);
    uint8 support = decision - 1;

    uint256 weight = $.navigatorRegistry.getDelegatedAmountAtTimepoint(citizen, proposalSnapshot);
    uint256 power = Math.sqrt(weight) * 1e9;
    GovernorTypes.ProposalType proposalType = GovernorTypes.ProposalType(
      GovernorProposalLogic.proposalType(proposalId)
    );

    _checkVotingThreshold(weight, proposalType);
    _countVote(proposalId, citizen, support, weight, power);

    _registerVoteWithIntentMultiplier($, proposalId, citizen, weight, support, proposalSnapshot);
    _registerRelayerActionForNavigatorVote($, proposalId, citizen);

    emit NavigatorGovernanceVoteCast(citizen, navigator, proposalId, support, weight, power);

    return weight;
  }

  /**
   * @notice Checks if the voting threshold is met.
   * @param weight - The weight of the vote.
   * @param proposalType - The type of proposal.
   */
  function _checkVotingThreshold(uint256 weight, GovernorTypes.ProposalType proposalType) private view {
    uint256 threshold = GovernorConfigurator.getVotingThreshold(proposalType);
    if (weight < threshold) {
      revert GovernorVotingThresholdNotMet(threshold, weight);
    }
  }

  /**
   * @notice Toggle quadratic voting for a specific cycle.
   * @dev This function toggles the state of quadratic voting for a specific cycle.
   * The state will flip between enabled and disabled each time the function is called.
   */
  function toggleQuadraticVoting() external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    bool isQuadraticDisabled = $.quadraticVotingDisabled.upperLookupRecent(GovernorClockLogic.clock()) == 1; // 0: enabled, 1: disabled

    // If quadratic voting is disabled, set the new status to enabled, otherwise set it to disabled.
    uint208 newStatus = isQuadraticDisabled ? 0 : 1;

    // Toggle the status -> 0: enabled, 1: disabled
    $.quadraticVotingDisabled.push(GovernorClockLogic.clock(), newStatus);

    // Emit an event to log the new quadratic voting status.
    emit QuadraticVotingToggled(!isQuadraticDisabled);
  }

  /**
   * @notice Check if quadratic voting is disabled at a specific round.
   * @dev To check if quadratic voting was disabled for a round, use the block number the round started.
   * @param roundId - The round ID for which to check if quadratic voting is disabled.
   * @return true if quadratic voting is disabled, false otherwise.
   */
  function isQuadraticVotingDisabledForRound(uint256 roundId) external view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    // Get the block number the round started.
    uint48 blockNumber = SafeCast.toUint48($.xAllocationVoting.roundSnapshot(roundId));

    // Check if quadratic voting is enabled or disabled at the block number.
    return $.quadraticVotingDisabled.upperLookupRecent(blockNumber) == 1; // 0: enabled, 1: disabled
  }

  /**
   * @notice Check if quadratic voting is disabled for the current round.
   * @return true if quadratic voting is disabled, false otherwise.
   */
  function isQuadraticVotingDisabledForCurrentRound() public view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    // Get the block number the emission round started.
    uint256 roundStartBlock = $.xAllocationVoting.currentRoundSnapshot();

    // Check if quadratic voting is enabled or disabled for the current round.
    return $.quadraticVotingDisabled.upperLookupRecent(SafeCast.toUint48(roundStartBlock)) == 1; // 0: enabled, 1: disabled
  }

  /// @dev Register a vote with governance intent multiplier applied to reward weight
  /// @param $ The governor storage
  /// @param proposalId The proposal ID
  /// @param voter The voter address
  /// @param weight The raw voting weight (unmultiplied)
  /// @param support The vote support value (0=Against, 1=For, 2=Abstain)
  /// @param proposalSnapshot The proposal snapshot timepoint for multiplier lookup
  function _registerVoteWithIntentMultiplier(
    GovernorStorageTypes.GovernorStorage storage $,
    uint256 proposalId,
    address voter,
    uint256 weight,
    uint8 support,
    uint256 proposalSnapshot
  ) private {
    // Get intent multiplier based on vote support type
    // support: 0 = Against, 1 = For, 2 = Abstain
    (uint256 forAgainstMultiplier, uint256 abstainMultiplier) = IVoterRewards(address($.voterRewards))
      .getIntentMultipliers(proposalSnapshot);
    uint256 intentMultiplier = (support == 2) ? abstainMultiplier : forAgainstMultiplier;
    uint256 rewardWeight = (weight * intentMultiplier) / 10000;

    $.voterRewards.registerVote(proposalId, voter, rewardWeight, Math.sqrt(rewardWeight));
  }

  function _registerRelayerActionForNavigatorVote(
    GovernorStorageTypes.GovernorStorage storage $,
    uint256 proposalId,
    address citizen
  ) private {
    if (address($.relayerRewardsPool) == address(0)) return;
    $.relayerRewardsPool.registerRelayerAction(
      msg.sender,
      citizen,
      $.proposals[proposalId].roundIdVoteStart,
      RelayerAction.VOTE
    );
  }
}
