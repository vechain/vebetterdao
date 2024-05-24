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
import { GovernorGovernanceLogic } from "./GovernorGovernanceLogic.sol";
import { GovernorFunctionRestrictionsLogic } from "./GovernorFunctionRestrictionsLogic.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { DoubleEndedQueue } from "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";

/**
 * @title Governor Description Validator
 * @dev Library for validating descriptions in governance proposals based on the proposer's address suffix.
 */
library GovernorProposalLogic {
  using GovernorStateLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorClockLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorDepositLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorFunctionRestrictionsLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorGovernanceLogic for GovernorStorageTypes.GovernorStorage;
  using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

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
   * @dev User is not authorized to perform the action.
   */
  error UnauthorizedAccess(address user);

  /**
   * @dev The round when proposal should start is not valid.
   */
  error GovernorInvalidStartRound(uint256 roundId);

  /**
   * @dev Queue operation is not implemented for this governor. Execute should be called directly.
   */
  error GovernorQueueNotImplemented();

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
   * @dev Emitted when a proposal is executed.
   */
  event ProposalExecuted(uint256 proposalId);

  /**
   * @dev Emitted when a proposal is queued.
   */
  event ProposalQueued(uint256 proposalId, uint256 etaSeconds);

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
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
  }

  /**
   * @dev Checks if the description string ends with a proposer's address suffix.
   * Returns `true` if it either does not have a suffix or if the suffix matches the proposer's address.
   */
  function isValidDescriptionForProposer(address proposer, string memory description) private pure returns (bool) {
    uint256 len = bytes(description).length;

    // Length is too short to contain a valid proposer suffix
    if (len < 52) {
      return true;
    }

    // Extract what would be the `#proposer=0x` marker beginning the suffix
    bytes12 marker;
    assembly {
      // Start of the string contents in memory = description + 32
      // First character of the marker = len - 52
      // We read the memory word starting at the first character of the marker:
      // (description + 32) + (len - 52) = description + (len - 20)
      marker := mload(add(description, sub(len, 20)))
    }

    // If the marker is not found, there is no proposer suffix to check
    if (marker != bytes12("#proposer=0x")) {
      return true;
    }

    // Parse the 40 characters following the marker as uint160
    uint160 recovered = 0;
    for (uint256 i = len - 40; i < len; ++i) {
      (bool isHex, uint8 value) = tryHexToUint(bytes(description)[i]);
      // If any of the characters is not a hex digit, ignore the suffix entirely
      if (!isHex) {
        return true;
      }
      recovered = (recovered << 4) | value;
    }

    return recovered == uint160(proposer);
  }

  /**
   * @dev Try to parse a character from a string as a hex value. Returns `(true, value)` if the char is in
   * `[0-9a-fA-F]` and `(false, 0)` otherwise. Value is guaranteed to be in the range `0 <= value < 16`.
   */
  function tryHexToUint(bytes1 char) private pure returns (bool, uint8) {
    uint8 c = uint8(char);
    unchecked {
      // Case 0-9
      if (47 < c && c < 58) {
        return (true, c - 48);
      }
      // Case A-F
      else if (64 < c && c < 71) {
        return (true, c - 55);
      }
      // Case a-f
      else if (96 < c && c < 103) {
        return (true, c - 87);
      }
      // Else: not a hex char
      else {
        return (false, 0);
      }
    }
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
  function canProposalStartInNextRound(GovernorStorageTypes.GovernorStorage storage self) external view returns (bool) {
    return _canProposalStartInNextRound(self);
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
  function _canProposalStartInNextRound(
    GovernorStorageTypes.GovernorStorage storage self
  ) internal view returns (bool) {
    uint256 currentRoundId = self.xAllocationVoting.currentRoundId();
    uint256 currentRoundDeadline = self.xAllocationVoting.roundDeadline(currentRoundId);
    uint48 currentBlock = self.clock();

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
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (address) {
    return self.proposals[proposalId].proposer;
  }

  /**
   * @dev See {IB3TRGovernor-proposalEta}.
   */
  function proposalEta(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (uint256) {
    return self.proposals[proposalId].etaSeconds;
  }

  /**
   * @dev See {IB3TRGovernor-proposalStartRound}
   */
  function proposalStartRound(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (uint256) {
    return self.proposals[proposalId].roundIdVoteStart;
  }

  /**
   * @dev See {IB3TRGovernor-proposalSnapshot}.
   *
   * We take for granted that the round starts the block after it ends. But it can happen that the round is not started yet for whatever reason.
   * Knowing this, if the proposal starts 4 rounds in the future we need to consider also those extra blocks used to start the rounds.
   */
  function proposalSnapshot(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) external view returns (uint256) {
    return _proposalSnapshot(self, proposalId);
  }

  function _proposalSnapshot(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (uint256) {
    // round when proposal should be active is already started
    if (self.xAllocationVoting.currentRoundId() >= self.proposals[proposalId].roundIdVoteStart) {
      return self.xAllocationVoting.roundSnapshot(self.proposals[proposalId].roundIdVoteStart);
    }

    uint256 amountOfRoundsLeft = self.proposals[proposalId].roundIdVoteStart - self.xAllocationVoting.currentRoundId();
    uint256 roundsDurationLeft = self.xAllocationVoting.votingPeriod() * (amountOfRoundsLeft - 1); // -1 because if only 1 round left we want this to be 0
    uint256 currentRoundDeadline = self.xAllocationVoting.currentRoundDeadline();

    // if current round ended and a new one did not start yet
    if (currentRoundDeadline <= self.clock()) {
      currentRoundDeadline = self.clock();
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
    GovernorStorageTypes.GovernorStorage storage self,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    uint256 startRoundId,
    uint256 depositAmount
  ) external returns (uint256) {
    address proposer = msg.sender;

    uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

    validateProposeParams(self, proposer, startRoundId, description, targets, values, calldatas, proposalId);

    return _propose(self, proposer, proposalId, targets, values, calldatas, description, startRoundId, depositAmount);
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
  function _propose(
    GovernorStorageTypes.GovernorStorage storage self,
    address proposer,
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    uint256 startRoundId,
    uint256 depositAmount
  ) private returns (uint256) {
    uint256 depositThresholdAmount = self.depositThreshold();

    _setProposal(
      self,
      proposalId,
      proposer,
      SafeCast.toUint32(self.xAllocationVoting.votingPeriod()),
      startRoundId,
      targets.length > 0,
      depositAmount,
      depositThresholdAmount
    );

    if (depositAmount > 0) {
      self.depositFunds(depositAmount, proposer, proposalId);
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

    return proposalId;
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
    GovernorStorageTypes.GovernorStorage storage self,
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
    proposal.depositThreshold = proposalDepositThreshold;
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
    GovernorStorageTypes.GovernorStorage storage self,
    address proposer,
    uint256 startRoundId,
    string memory description,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    uint256 proposalId
  ) private view {
    // round must be in the future
    if (startRoundId <= self.xAllocationVoting.currentRoundId()) {
      revert GovernorInvalidStartRound(startRoundId);
    }

    // only do this check if user wants to start proposal in the next round
    if (startRoundId == self.xAllocationVoting.currentRoundId() + 1) {
      if (!_canProposalStartInNextRound(self)) {
        revert GovernorInvalidStartRound(startRoundId);
      }
    }

    // check description restriction
    if (!isValidDescriptionForProposer(proposer, description)) {
      revert GovernorRestrictedProposer(proposer);
    }

    if (targets.length != values.length || targets.length != calldatas.length) {
      revert GovernorInvalidProposalLength(targets.length, calldatas.length, values.length);
    }

    if (self.proposals[proposalId].roundIdVoteStart != 0) {
      // Proposal already exists
      revert GovernorUnexpectedProposalState(proposalId, self.state(proposalId), bytes32(0));
    }

    self.checkFunctionsRestriction(targets, calldatas);
  }

  /**
   * @dev Internal cancel mechanism with minimal restrictions. A proposal can be cancelled in any state other than
   * Canceled, Expired, or Executed. Once cancelled a proposal can't be re-submitted.
   *
   * Emits a {IB3TRGovernor-ProposalCanceled} event.
   */
  function cancelPendingProposal(
    GovernorStorageTypes.GovernorStorage storage self,
    address account,
    bool admin,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) external returns (uint256) {
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    if (account != proposalProposer(self, proposalId) && !admin) {
      revert UnauthorizedAccess(account);
    }

    require(self.state(proposalId) == GovernorTypes.ProposalState.Pending, "Governor: proposal not pending");

    return _cancel(self, proposalId);
  }

  /**
   * @dev Internal cancel mechanism with minimal restrictions. A proposal can be cancelled in any state other than
   * Canceled, Expired, or Executed. Once cancelled a proposal can't be re-submitted.
   *
   * Emits a {IB3TRGovernor-ProposalCanceled} event.
   */
  function cancel(
    GovernorStorageTypes.GovernorStorage storage self,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) external returns (uint256) {
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    GovernorStateLogic.validateStateBitmap(
      self,
      proposalId,
      GovernorStateLogic.ALL_PROPOSAL_STATES_BITMAP ^
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Canceled) ^
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Expired) ^
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Executed)
    );

    bytes32 timelockId = self.timelockIds[proposalId];
    if (timelockId != 0) {
      // cancel
      self.timelock.cancel(timelockId);
      // cleanup
      delete self.timelockIds[proposalId];
    }

    return _cancel(self, proposalId);
  }

  function _cancel(GovernorStorageTypes.GovernorStorage storage self, uint256 proposalId) private returns (uint256) {
    self.proposals[proposalId].canceled = true;
    emit ProposalCanceled(proposalId);

    return proposalId;
  }

  /**
   * @dev See {IB3TRGovernor-proposalDeadline}.
   */
  function proposalDeadline(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) external view returns (uint256) {
    return _proposalDeadline(self, proposalId);
  }

  /**
   * @dev See {IB3TRGovernor-proposalDeadline}.
   */
  function _proposalDeadline(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (uint256) {
    // if round is active or already occured proposal end block is the block when round ends
    if (self.xAllocationVoting.currentRoundId() >= self.proposals[proposalId].roundIdVoteStart) {
      return self.xAllocationVoting.roundDeadline(self.proposals[proposalId].roundIdVoteStart);
    }

    // if we call this function before the round starts, it will return 0, so we need to estimate the end block
    return _proposalSnapshot(self, proposalId) + self.xAllocationVoting.votingPeriod();
  }

  function execute(
    GovernorStorageTypes.GovernorStorage storage self,
    address contractAddress, // Address of the calling contract
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) external returns (uint256) {
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    self.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Succeeded) |
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Queued)
    );

    // mark as executed before calls to avoid reentrancy
    self.proposals[proposalId].executed = true;

    // before execute: register governance call in queue.
    if (self.executor() != contractAddress) {
      for (uint256 i = 0; i < targets.length; ++i) {
        if (targets[i] == address(this)) {
          self.governanceCall.pushBack(keccak256(calldatas[i]));
        }
      }
    }

    _executeOperations(self, contractAddress, proposalId, targets, values, calldatas, descriptionHash);

    // after execute: cleanup governance call queue.
    if (self.executor() != contractAddress && !self.governanceCall.empty()) {
      self.governanceCall.clear();
    }

    emit ProposalExecuted(proposalId);

    return proposalId;
  }

  /**
   * @dev See {IB3TRGovernor-queue}.
   */
  function queue(
    GovernorStorageTypes.GovernorStorage storage self,
    address contractAddress, // Address of the calling contract
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) external returns (uint256) {
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    self.validateStateBitmap(proposalId, GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Succeeded));

    uint48 etaSeconds = _queueOperations(
      self,
      contractAddress,
      proposalId,
      targets,
      values,
      calldatas,
      descriptionHash
    );

    if (etaSeconds != 0) {
      self.proposals[proposalId].etaSeconds = etaSeconds;
      emit ProposalQueued(proposalId, etaSeconds);
    } else {
      revert GovernorQueueNotImplemented();
    }

    return proposalId;
  }

  /**
   * @dev Function to know if a proposal is executable or not.
   * If the proposal was creted without any targets, values, or calldatas, it is not executable.
   * to check if the proposal is executable.
   *
   * @param proposalId The id of the proposal
   */
  function proposalNeedsQueuing(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) external view returns (bool) {
    GovernorTypes.ProposalCore storage proposal = self.proposals[proposalId];
    if (proposal.roundIdVoteStart == 0) {
      return false;
    }

    if (proposal.isExecutable) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @dev Internal execution mechanism. Can be overridden (without a super call) to modify the way execution is
   * performed (for example adding a vault/timelock).
   *
   * NOTE: Calling this function directly will NOT check the current state of the proposal, set the executed flag to
   * true or emit the `ProposalExecuted` event. Executing a proposal should be done using {execute} or {_execute}.
   */
  function _executeOperations(
    GovernorStorageTypes.GovernorStorage storage self,
    address contractAddress, // Address of the calling contract
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) private {
    // execute
    self.timelock.executeBatch{ value: msg.value }(
      targets,
      values,
      calldatas,
      0,
      GovernorGovernanceLogic.timelockSalt(descriptionHash, contractAddress)
    );
    // cleanup for refund
    delete self.timelockIds[proposalId];
  }

  /**
   * @dev Function to queue a proposal to the timelock.
   */
  function _queueOperations(
    GovernorStorageTypes.GovernorStorage storage self,
    address contractAddress, // Address of the calling contract
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) private returns (uint48) {
    uint256 delay = self.timelock.getMinDelay();

    bytes32 salt = GovernorGovernanceLogic.timelockSalt(descriptionHash, contractAddress);
    self.timelockIds[proposalId] = self.timelock.hashOperationBatch(targets, values, calldatas, 0, salt);
    self.timelock.scheduleBatch(targets, values, calldatas, 0, salt, delay);

    return SafeCast.toUint48(block.timestamp + delay);
  }

  /**
   * @dev returns the total votes for a proposal
   */
  function getProposalTotalVotes(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (uint256) {
    return self.proposalTotalVotes[proposalId];
  }

  /**
   * @dev Public endpoint to retrieve the timelock id of a proposal.
   */
  function getTimelockId(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (bytes32) {
    return self.timelockIds[proposalId];
  }
}
