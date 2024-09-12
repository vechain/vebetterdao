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

import { GovernorTypesV3 } from "./GovernorTypesV3.sol";
import { IVoterRewardsV3 } from "../../interfaces/IVoterRewardsV3.sol";
import { IXAllocationVotingGovernorV3 } from "../../interfaces/IXAllocationVotingGovernorV3.sol";
import { IB3TRV3 } from "../../interfaces/IB3TRV3.sol";
import { IVOT3V3 } from "../../interfaces/IVOT3V3.sol";
import { DoubleEndedQueue } from "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";
import { TimelockControllerUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

/// @title GovernorStorageTypesV3
/// @notice Library for defining storage types used in the Governor contract.
library GovernorStorageTypesV3 {
  struct GovernorStorage {
    // ------------------------------- Version 1 -------------------------------

    // ------------------------------- General Storage -------------------------------
    string name; // name of the Governor
    mapping(uint256 proposalId => GovernorTypesV3.ProposalCore) proposals;
    // This queue keeps track of the governor operating on itself. Calls to functions protected by the {onlyGovernance}
    // modifier needs to be whitelisted in this queue. Whitelisting is set in {execute}, consumed by the
    // {onlyGovernance} modifier and eventually reset after {_executeOperations} completes. This ensures that the
    // execution of {onlyGovernance} protected calls can only be achieved through successful proposals.
    DoubleEndedQueue.Bytes32Deque governanceCall;
    // min delay before voting can start
    uint256 minVotingDelay;
    // ------------------------------- Quorum Storage -------------------------------
    // quorum numerator history
    Checkpoints.Trace208 quorumNumeratorHistory;
    // ------------------------------- Timelock Storage -------------------------------
    // Timelock contract
    TimelockControllerUpgradeable timelock;
    // mapping of proposalId to timelockId
    mapping(uint256 proposalId => bytes32) timelockIds;
    // ------------------------------- Function Restriction Storage -------------------------------
    // mapping of target address to function selector to bool indicating if function is whitelisted for proposals
    mapping(address => mapping(bytes4 => bool)) whitelistedFunctions;
    // flag to enable/disable function restrictions
    bool isFunctionRestrictionEnabled;
    // ------------------------------- External Contracts Storage -------------------------------
    // Voter Rewards contract
    IVoterRewardsV3 voterRewards;
    // XAllocationVotingGovernor contract
    IXAllocationVotingGovernorV3 xAllocationVoting;
    // B3TR contract
    IB3TRV3 b3tr;
    // VOT3 contract
    IVOT3V3 vot3;
    // ------------------------------- Desposits Storage -------------------------------
    // mapping to track deposits made to proposals by address
    mapping(uint256 => mapping(address => uint256)) deposits;
    // percentage of the total supply of B3TR tokens that need to be deposited in VOT3 to create a proposal
    uint256 depositThresholdPercentage;
    // ------------------------------- Voting Storage -------------------------------
    // mapping to store the votes for a proposal
    mapping(uint256 => GovernorTypesV3.ProposalVote) proposalVotes;
    // mapping to store that a user has voted at least one time
    mapping(address => bool) hasVotedOnce;
    // mapping to store the total votes for a proposal
    mapping(uint256 => uint256) proposalTotalVotes;
    // minimum amount of tokens needed to cast a vote
    uint256 votingThreshold;
  }
}
