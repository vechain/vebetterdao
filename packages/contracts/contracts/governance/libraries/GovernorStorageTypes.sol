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

import "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

library GovernorStorageTypes {
  struct QuorumGovernorStorage {
    Checkpoints.Trace208 quorumNumeratorHistory; // quorum numerator history
  }

  struct GovernorTimeLockStorage {
    TimelockControllerUpgradeable timelock; // Timelock contract
    mapping(uint256 proposalId => bytes32) timelockIds; // mapping of proposalId to timelockId
  }

  struct GovernorSettingsStorage {
    uint256 depositThreshold; // percentage of the total supply of B3TR tokens that need to be deposited in VOT3 to create a proposal
    uint256 minVotingDelay; // min delay before voting can start
    uint256 votingThreshold; // minimum amount of tokens needed to cast a vote
  }

  struct GovernorFunctionRestrictionsStorage {
    mapping(address => mapping(bytes4 => bool)) whitelistedFunctions; // mapping of target address to function selector to bool indicating if function is whitelisted for proposals
    bool isFunctionRestrictionEnabled; // flag to enable/disable function restriction
  }

  struct GovernorExternalContractsStorage {
    IVoterRewards voterRewards; // Voter Rewards contract
    IXAllocationVotingGovernor xAllocationVoting; // XAllocationVotingGovernor contract
    IB3TR b3tr; // B3TR contract
    IVOT3 vot3; // VOT3 contract
  }

  struct GovernorDepositStorage {
    mapping(uint256 => mapping(address => uint256)) deposits; // mapping to track deposits made to proposals by address
  }

  struct GovernorVoteCountingStorage {
    mapping(uint256 => ProposalVote) proposalVotes; // mapping to store the votes for a proposal
    mapping(address => bool) hasVotedOnce; // mapping to store that a user has voted at least one time
    mapping(uint256 => uint256) proposalTotalVotes; // mapping to store the total votes for a proposal
  }

  // ProposalVote struct to store the votes for a proposal
  struct ProposalVote {
    uint256 againstVotes;
    uint256 forVotes;
    uint256 abstainVotes;
    mapping(address => bool) hasVoted;
  }
}
