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

import { GovernorTypes } from "./GovernorTypes.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { IB3TR } from "../../interfaces/IB3TR.sol";
import { IVOT3 } from "../../interfaces/IVOT3.sol";
import { DoubleEndedQueue } from "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";
import { TimelockControllerUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

/// @title GovernorStorageTypes
/// @notice Library for defining storage types used in the Governor contract.
library GovernorStorageTypes {
  using Checkpoints for Checkpoints.Trace208;
  using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

  struct GovernorStorage {
    // ------------------------------- Version 1 -------------------------------
    // ------------------------------- General Storage -------------------------------
    string name; // name of the Governor
    mapping(uint256 proposalId => GovernorTypes.ProposalCore) proposals;
    // This queue keeps track of the governor operating on itself. Calls to functions protected by the {onlyGovernance}
    // modifier needs to be whitelisted in this queue. Whitelisting is set in {execute}, consumed by the
    // {onlyGovernance} modifier and eventually reset after {_executeOperations} completes. This ensures that the
    // execution of {onlyGovernance} protected calls can only be achieved through successful proposals.
    DoubleEndedQueue.Bytes32Deque governanceCall;
    uint256 minVotingDelay; // min delay before voting can start
    // ------------------------------- Quorum Storage -------------------------------
    Checkpoints.Trace208 quorumNumeratorHistory; // quorum numerator history
    // ------------------------------- Timelock Storage -------------------------------
    TimelockControllerUpgradeable timelock; // Timelock contract
    mapping(uint256 proposalId => bytes32) timelockIds; // mapping of proposalId to timelockId
    // ------------------------------- Function Restriction Storage -------------------------------
    mapping(address => mapping(bytes4 => bool)) whitelistedFunctions; // mapping of target address to function selector to bool indicating if function is whitelisted for proposals
    bool isFunctionRestrictionEnabled; // flag to enable/disable function restriction
    // ------------------------------- External Contracts Storage -------------------------------
    IVoterRewards voterRewards; // Voter Rewards contract
    IXAllocationVotingGovernor xAllocationVoting; // XAllocationVotingGovernor contract
    IB3TR b3tr; // B3TR contract
    IVOT3 vot3; // VOT3 contract
    // ------------------------------- Desposits Storage -------------------------------
    mapping(uint256 => mapping(address => uint256)) deposits; // mapping to track deposits made to proposals by address
    uint256 depositThresholdPercentage; // percentage of the total supply of B3TR tokens that need to be deposited in VOT3 to create a proposal
    // ------------------------------- Voting Storage -------------------------------
    mapping(uint256 => GovernorTypes.ProposalVote) proposalVotes; // mapping to store the votes for a proposal
    mapping(address => bool) hasVotedOnce; // mapping to store that a user has voted at least one time
    mapping(uint256 => uint256) proposalTotalVotes; // mapping to store the total votes for a proposal
    uint256 votingThreshold; // minimum amount of tokens needed to cast a vote
  }
}
