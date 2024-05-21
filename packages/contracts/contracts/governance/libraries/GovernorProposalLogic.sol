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

pragma solidity ^0.8.20;

import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { GovernorTypes } from "./GovernorTypes.sol";
import { GovernorStateLogic } from "./GovernorStateLogic.sol";
import { GovernorClockLogic } from "./GovernorClockLogic.sol";
import { GovernorDepositLogic } from "./GovernorDepositLogic.sol";
import { GovernorFunctionRestrictionsLogic } from "./GovernorFunctionRestrictionsLogic.sol";
import { GovernorDescriptionValidator } from "./GovernorDescriptionValidator.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title Governor Description Validator
 * @dev Library for validating descriptions in governance proposals based on the proposer's address suffix.
 */
library GovernorProposalLogic {
  using GovernorStateLogic for GovernorStorageTypes.GovernorGeneralStorage;
  using GovernorClockLogic for GovernorStorageTypes.GovernorExternalContractsStorage;
  using GovernorDepositLogic for GovernorStorageTypes.GovernorDepositStorage;
  using GovernorFunctionRestrictionsLogic for GovernorStorageTypes.GovernorFunctionRestrictionsStorage;

  /**
   * @dev Emitted when a proposal is canceled.
   */
  event ProposalCanceled(uint256 proposalId);

  /**
   * @dev The current state of a proposal is not the required for performing an operation.
   * The `expectedStates` is a bitmap with the bits enabled for each ProposalState enum position
   * counting from right to left.
   *
   * NOTE: If `expectedState` is `bytes32(0)`, the proposal is expected to not be in any state (i.e. not exist).
   * This is the case when a proposal that is expected to be unset is already initiated (the proposal is duplicated).
   *
   * See {Governor-_encodeStateBitmap}.
   */
  error GovernorUnexpectedProposalState(
    uint256 proposalId,
    GovernorTypes.ProposalState current,
    bytes32 expectedStates
  );

  /**
   * @dev The round when proposal should start is not valid.
   */
  error GovernorInvalidStartRound(uint256 roundId);

  /**
   * @dev Empty proposal or a mismatch between the parameters length for a proposal call.
   */
  error GovernorInvalidProposalLength(uint256 targets, uint256 calldatas, uint256 values);

  /**
   * @dev The `proposer` is not allowed to create a proposal.
   */
  error GovernorRestrictedProposer(address proposer);

  /**
   * @dev Emitted when a proposal is created
   */
  event ProposalCreated(
    uint256 indexed proposalId,
    address indexed proposer,
    address[] targets,
    uint256[] values,
    string[] signatures,
    bytes[] calldatas,
    string description,
    uint256 indexed roundIdVoteStart,
    uint256 depositThreshold
  );

  /**
   * @dev See {IB3TRGovernor-hashProposal}.
   *
   * The proposal id is produced by hashing the ABI encoded `targets` array, the `values` array, the `calldatas` array
   * and the descriptionHash (bytes32 which itself is the keccak256 hash of the description string). This proposal id
   * can be produced from the proposal data which is part of the {ProposalCreated} event. It can even be computed in
   * advance, before the proposal is submitted.
   *
   * Note that the chainId and the governor address are not part of the proposal id computation. Consequently, the
   * same proposal (with same operation and same description) will have the same id if submitted on multiple governors
   * across multiple networks. This also means that in order to execute the same operation twice (on the same
   * governor) the proposer will have to change the description in order to avoid proposal id conflicts.
   */
  function hashProposal(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public pure returns (uint256) {
    return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
  }

  /**
   * @dev Check if the proposal can start in the next round
   *
   * If we are in round 0 (so emissions did not start yet) there is an unknown amount of time between now
   * and the start of the first round: it could start in 1 hour or 1 week.
   * For this reason, the check we have in place to enforce a minimum delay period will fail.
   *
   * We can still create proposals that starts in round 2, because we know the voting period of first round.
   */
  function canProposalStartInNextRound(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts
  ) public view returns (bool) {
    uint256 currentRoundId = externalContracts.xAllocationVoting.currentRoundId();
    uint256 currentRoundDeadline = externalContracts.xAllocationVoting.roundDeadline(currentRoundId);
    uint48 currentBlock = externalContracts.clock();

    // this could happen if the round ended and the next one not started yet
    if (currentRoundDeadline <= currentBlock) {
      return false;
    }

    // if between now and the start of the new round is less then the min delay, revert
    if (self.minVotingDelay > currentRoundDeadline - currentBlock) {
      return false;
    }

    return true;
  }

  /**
   * @dev See {IB3TRGovernor-proposalProposer}.
   */
  function proposalProposer(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    uint256 proposalId
  ) internal view returns (address) {
    return self.proposals[proposalId].proposer;
  }

  /**
   * @dev See {IB3TRGovernor-proposalEta}.
   */
  function proposalEta(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    uint256 proposalId
  ) internal view returns (uint256) {
    return self.proposals[proposalId].etaSeconds;
  }

  /**
   * @dev See {IB3TRGovernor-proposalStartRound}
   */
  function proposalStartRound(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    uint256 proposalId
  ) public view returns (uint256) {
    return self.proposals[proposalId].roundIdVoteStart;
  }

  /**
   * @dev See {IB3TRGovernor-proposalSnapshot}.
   *
   * We take for granted that the round starts the block after it ends. But it can happen that the round is not started yet for whatever reason.
   * Knowing this, if the proposal starts 4 rounds in the future we need to consider also those extra blocks used to start the rounds.
   */
  function proposalSnapshot(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    uint256 proposalId
  ) public view returns (uint256) {
    // round when proposal should be active is already started
    if (externalContracts.xAllocationVoting.currentRoundId() >= self.proposals[proposalId].roundIdVoteStart) {
      return externalContracts.xAllocationVoting.roundSnapshot(self.proposals[proposalId].roundIdVoteStart);
    }

    uint256 amountOfRoundsLeft = self.proposals[proposalId].roundIdVoteStart -
      externalContracts.xAllocationVoting.currentRoundId();
    uint256 roundsDurationLeft = externalContracts.xAllocationVoting.votingPeriod() * (amountOfRoundsLeft - 1); // -1 because if only 1 round left we want this to be 0
    uint256 currentRoundDeadline = externalContracts.xAllocationVoting.currentRoundDeadline();

    // if current round ended and a new one did not start yet
    if (currentRoundDeadline <= externalContracts.clock()) {
      currentRoundDeadline = externalContracts.clock();
    }

    return currentRoundDeadline + roundsDurationLeft + amountOfRoundsLeft;
  }

  /**
   * @dev See {IB3TRGovernor-propose}. This function has opt-in frontrunning protection, described in {_isValidDescriptionForProposer}.
   *
   * The {startRoundId} parameter is used to specify the round in which the proposal should be active. The round must be in the future.
   *
   * @param targets The addresses of the contracts to call
   * @param values The values to send to the contracts
   * @param calldatas Function signatures and arguments
   * @param description The description of the proposal
   * @param startRoundId The round in which the proposal should be active
   * @param depositAmount The amount of tokens the proposer intends to deposit
   */
  function propose(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    GovernorStorageTypes.GovernorDepositStorage storage depositStorage,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    GovernorStorageTypes.GovernorFunctionRestrictionsStorage storage functionRestrictions,
    GovernorStorageTypes.GovernorVotesStorage storage votes,
    GovernorStorageTypes.GovernorQuoromStorage storage quorum,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    uint256 startRoundId,
    uint256 depositAmount
  ) public returns (uint256) {
    address proposer = msg.sender;

    uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

    validateProposeParams(
      self,
      externalContracts,
      votes,
      quorum,
      functionRestrictions,
      proposer,
      startRoundId,
      description,
      targets,
      values,
      calldatas,
      proposalId
    );

    uint256 depositThresholdAmount = depositStorage.depositThreshold(externalContracts);

    _setProposal(
      self,
      depositStorage,
      externalContracts,
      proposalId,
      proposer,
      SafeCast.toUint32(externalContracts.xAllocationVoting.votingPeriod()),
      startRoundId,
      targets.length > 0,
      depositAmount,
      depositThresholdAmount
    );

    if (depositAmount > 0) {
      depositStorage.depositFunds(externalContracts, depositAmount, proposer, proposalId);
    }

    emit ProposalCreated(
      proposalId,
      proposer,
      targets,
      values,
      new string[](targets.length),
      calldatas,
      description,
      startRoundId,
      depositThresholdAmount
    );
  }

  /**
   * @dev Internal function to save the proposal data in storage
   *
   * @param proposalId The id of the proposal
   * @param proposer The address of the proposer
   * @param voteDuration The duration of the vote
   * @param roundIdVoteStart The round in which the proposal should be active
   * @param isExecutable If the proposal is executable
   * @param depositAmount The amount of tokens the proposer intends to deposit
   * @param proposalDepositThreshold The deposit threshold for the proposal
   */
  function _setProposal(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    GovernorStorageTypes.GovernorDepositStorage storage depositStorage,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    uint256 proposalId,
    address proposer,
    uint32 voteDuration,
    uint256 roundIdVoteStart,
    bool isExecutable,
    uint256 depositAmount,
    uint256 proposalDepositThreshold
  ) private {
    GovernorTypes.ProposalCore storage proposal = self.proposals[proposalId];

    proposal.proposer = proposer;
    proposal.roundIdVoteStart = roundIdVoteStart;
    proposal.voteDuration = voteDuration;
    proposal.isExecutable = isExecutable;
    proposal.depositAmount = depositAmount;
    proposal.depositThreshold = depositStorage.depositThreshold(externalContracts);
  }

  /**
   * @dev Internal function to validate the propose parameters
   *
   * @param targets The addresses of the contracts to call
   * @param values The values to send to the contracts
   * @param calldatas Function signatures and arguments
   * @param proposalId The id of the proposal
   */
  function validateProposeParams(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    GovernorStorageTypes.GovernorVotesStorage storage votes,
    GovernorStorageTypes.GovernorQuoromStorage storage quorum,
    GovernorStorageTypes.GovernorFunctionRestrictionsStorage storage functionRestrictions,
    address proposer,
    uint256 startRoundId,
    string memory description,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    uint256 proposalId
  ) private view {
    // round must be in the future
    if (startRoundId <= externalContracts.xAllocationVoting.currentRoundId()) {
      revert GovernorInvalidStartRound(startRoundId);
    }

    // only do this check if user wants to start proposal in the next round
    if (startRoundId == externalContracts.xAllocationVoting.currentRoundId() + 1) {
      if (!canProposalStartInNextRound(self, externalContracts)) {
        revert GovernorInvalidStartRound(startRoundId);
      }
    }

    // check description restriction
    if (!GovernorDescriptionValidator.isValidDescriptionForProposer(proposer, description)) {
      revert GovernorRestrictedProposer(proposer);
    }

    if (targets.length != values.length || targets.length != calldatas.length) {
      revert GovernorInvalidProposalLength(targets.length, calldatas.length, values.length);
    }

    if (self.proposals[proposalId].roundIdVoteStart != 0) {
      // Proposal already exists
      revert GovernorUnexpectedProposalState(
        proposalId,
        self.state(externalContracts, votes, quorum, proposalId),
        bytes32(0)
      );
    }

    functionRestrictions.checkFunctionsRestriction(targets, calldatas);
  }

  /**
   * @dev Internal cancel mechanism with minimal restrictions. A proposal can be cancelled in any state other than
   * Canceled, Expired, or Executed. Once cancelled a proposal can't be re-submitted.
   *
   * Emits a {IB3TRGovernor-ProposalCanceled} event.
   */
  function cancel(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    GovernorStorageTypes.GovernorVotesStorage storage votes,
    GovernorStorageTypes.GovernorQuoromStorage storage quorum,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public returns (uint256) {
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    GovernorStateLogic.validateStateBitmap(
      self,
      externalContracts,
      votes,
      quorum,
      proposalId,
      GovernorStateLogic.ALL_PROPOSAL_STATES_BITMAP ^
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Canceled) ^
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Expired) ^
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Executed)
    );

    self.proposals[proposalId].canceled = true;
    emit ProposalCanceled(proposalId);

    return proposalId;
  }

  /**
   * @dev See {IB3TRGovernor-proposalDeadline}.
   */
  function proposalDeadline(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    uint256 proposalId
  ) public view returns (uint256) {
    // if round is active or already occured proposal end block is the block when round ends
    if (externalContracts.xAllocationVoting.currentRoundId() >= self.proposals[proposalId].roundIdVoteStart) {
      return externalContracts.xAllocationVoting.roundDeadline(self.proposals[proposalId].roundIdVoteStart);
    }

    // if we call this function before the round starts, it will return 0, so we need to estimate the end block
    return proposalSnapshot(self, externalContracts, proposalId) + externalContracts.xAllocationVoting.votingPeriod();
  }
}
