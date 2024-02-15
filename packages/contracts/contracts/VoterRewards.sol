// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IB3TRBadge.sol";
import "./interfaces/IGovernor.sol";
import "./interfaces/IXAllocationVotingGovernor.sol";
import "./interfaces/IEmissions.sol";
import "./interfaces/IB3TR.sol";

contract VoterRewards is AccessControl, ReentrancyGuard {
  bytes32 public constant X_ALLOCATION_VOTE_REGISTRAR_ROLE = keccak256("X_ALLOCATION_VOTE_REGISTRAR_ROLE");

  IB3TRBadge public b3trBadge;
  IB3TR public b3tr;
  IEmissions public emissions;

  // level => percentage multiplier for the level of the badge
  mapping(uint256 => uint256) public levelToMultiplier;

  // cycle => total weighted votes in the cycle
  mapping(uint256 => uint256) public cycleToTotal;

  // cycle => voter => total weighted votes for the voter in the cycle
  mapping(uint256 => mapping(address => uint256)) public cycleToVoterToTotal;

  uint256 public scalingFactor = 1e6;

  event VoteRegistered(uint256 indexed cycle, address indexed voter, uint256 votes);

  event RewardClaimed(uint256 indexed cycle, address indexed voter, uint256 reward);

  constructor(
    address admin,
    address _emissions,
    address _b3trBadge,
    address _b3tr,
    uint256[] memory levels,
    uint256[] memory multipliers
  ) {
    require(_b3trBadge != address(0), "VoterRewards: _b3trBadge cannot be the zero address");
    require(_emissions != address(0), "VoterRewards: emissions cannot be the zero address");
    require(_b3tr != address(0), "VoterRewards: _b3tr cannot be the zero address");

    require(levels.length > 0, "VoterRewards: levels must have at least one element");
    require(levels.length == multipliers.length, "VoterRewards: levels and multipliers must have the same length");

    b3trBadge = IB3TRBadge(_b3trBadge);
    b3tr = IB3TR(_b3tr);
    emissions = IEmissions(_emissions);

    for (uint256 i = 0; i < levels.length; i++) {
      levelToMultiplier[levels[i]] = multipliers[i];
    }

    _grantRole(DEFAULT_ADMIN_ROLE, admin);
  }

  function registerXallocationVote(
    uint256 proposalStart,
    address voter,
    uint256 votes
  ) public onlyRole(X_ALLOCATION_VOTE_REGISTRAR_ROLE) {
    require(votes > 0, "VoterRewards: votes must be greater than 0");
    require(proposalStart > 0, "VoterRewards: proposalStart must be greater than 0");
    require(voter != address(0), "VoterRewards: voter cannot be the zero address");

    uint256 cycle = emissions.getPreviousCycle();

    uint256 badgeLevel = b3trBadge.getPastLevel(voter, proposalStart);

    uint256 multiplier = levelToMultiplier[badgeLevel]; // Percentage multiplier for the level of the badge
    uint256 total = votes; //TODO - multiply votes by percentage multiplier

    cycleToTotal[cycle] += total; // Add total to the cycle
    cycleToVoterToTotal[cycle][voter] += total; // Add total to the voter in the cycle

    emit VoteRegistered(cycle, voter, total);
  }

  //TODO - registerGovernorVote (for the general purpose governor proposals)

  function claimReward(uint256 cycle, address voter) public nonReentrant {
    uint256 reward = getReward(cycle, voter);

    require(b3tr.balanceOf(address(this)) >= reward, "VoterRewards: not enough B3TR in the contract to pay reward");

    cycleToVoterToTotal[cycle][voter] = 0;

    // transfer reward to voter
    b3tr.transfer(voter, reward);

    emit RewardClaimed(cycle, voter, reward);
  }

  // TODO - do we want a withdrawal logic for the contract owner?

  // ----------------- Getters ----------------- //

  function getReward(uint256 cycle, address voter) public view returns (uint256) {
    require(cycle > 0, "VoterRewards: cycle must be greater than 0");
    require(voter != address(0), "VoterRewards: voter cannot be the zero address");
    require(emissions.isCycleEnded(cycle), "VoterRewards: cycle must be ended");

    uint256 total = cycleToVoterToTotal[cycle][voter];
    require(total > 0, "VoterRewards: voter has no votes or has already claimed in the cycle");

    uint256 totalCycle = cycleToTotal[cycle];
    require(totalCycle > 0, "VoterRewards: there are no votes in the cycle");

    uint256 emissionsAmount = emissions.getVote2EarnAmountForCycle(cycle);
    require(emissionsAmount > 0, "VoterRewards: emissionsAmount must be greater than 0");

    // Scale up the numerator before division to improve precision
    uint256 scaledNumerator = total * emissionsAmount * scalingFactor; // Scale by a factor of scalingFactor for precision
    uint256 reward = scaledNumerator / totalCycle;

    // Scale down the reward to the original scale
    return reward / scalingFactor;
}

  // ----------------- Setters ----------------- //

  function setB3TRBadge(address _b3trBadge) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_b3trBadge != address(0), "VoterRewards: _b3trBadge cannot be the zero address");
    b3trBadge = IB3TRBadge(_b3trBadge);
  }

  function setLevelToMultiplier(uint256 level, uint256 multiplier) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(level > 0, "VoterRewards: level must be greater than 0");
    require(multiplier > 0, "VoterRewards: multiplier must be greater than 0");

    levelToMultiplier[level] = multiplier;
  }

  function setEmissions(address _emissions) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_emissions != address(0), "VoterRewards: emissions cannot be the zero address");
    emissions = IEmissions(_emissions);
  }

  function setXallocationVoteRegistrarRole(address _voteRegistrar) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_voteRegistrar != address(0), "VoterRewards: _voteRegistrar cannot be the zero address");
    _grantRole(X_ALLOCATION_VOTE_REGISTRAR_ROLE, _voteRegistrar);
  }

  function setScalingFactor(uint256 newScalingFactor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newScalingFactor > 0, "VoterRewards: Scaling factor must be greater than 0");

    scalingFactor = newScalingFactor;
  }
}
