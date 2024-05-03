// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IGalaxyMember.sol";
import "./interfaces/IB3TRGovernor.sol";
import "./interfaces/IXAllocationVotingGovernor.sol";
import "./interfaces/IEmissions.sol";
import "./interfaces/IB3TR.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract VoterRewards is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
  bytes32 public constant VOTE_REGISTRAR_ROLE = keccak256("VOTE_REGISTRAR_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /// @custom:storage-location erc7201:b3tr.storage.VoterRewards
  struct VoterRewardsStorage {
    IGalaxyMember galaxyMember;
    IB3TR b3tr;
    IEmissions emissions;
    // level => percentage multiplier for the level of the GM NFT
    mapping(uint256 => uint256) levelToMultiplier;
    // cycle => total weighted votes in the cycle
    mapping(uint256 => uint256) cycleToTotal;
    // cycle => voter => total weighted votes for the voter in the cycle
    mapping(uint256 => mapping(address => uint256)) cycleToVoterToTotal;
    uint256 scalingFactor;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.VoterRewards")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant VoterRewardsStorageLocation =
    0x114e7ffaaf205d38cd05b17b56f3357806ef2ce889cb4748445ae91cdfc37c00;

  function _getVoterRewardsStorage() internal pure returns (VoterRewardsStorage storage $) {
    assembly {
      $.slot := VoterRewardsStorageLocation
    }
  }

  event VoteRegistered(uint256 indexed cycle, address indexed voter, uint256 votes, uint256 rewardWeightedVote);

  event RewardClaimed(uint256 indexed cycle, address indexed voter, uint256 reward);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    address admin,
    address upgrader,
    address _emissions,
    address _galaxyMember,
    address _b3tr,
    uint256[] memory levels,
    uint256[] memory multipliers
  ) public initializer {
    require(_galaxyMember != address(0), "VoterRewards: _galaxyMember cannot be the zero address");
    require(_emissions != address(0), "VoterRewards: emissions cannot be the zero address");
    require(_b3tr != address(0), "VoterRewards: _b3tr cannot be the zero address");

    require(levels.length > 0, "VoterRewards: levels must have at least one element");
    require(levels.length == multipliers.length, "VoterRewards: levels and multipliers must have the same length");

    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();

    $.galaxyMember = IGalaxyMember(_galaxyMember);
    $.b3tr = IB3TR(_b3tr);
    $.emissions = IEmissions(_emissions);
    $.scalingFactor = 1e6;

    for (uint256 i = 0; i < levels.length; i++) {
      $.levelToMultiplier[levels[i]] = multipliers[i];
    }

    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(UPGRADER_ROLE, upgrader);
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  // @notice Register the votes of a user for rewards calculation.
  // @dev Quadratic rewarding is used to reward users fairly based on their voting power.
  // @param proposalStart The start time of the proposal.
  // @param voter The address of the voter.
  // @param votes The number of votes cast by the voter.
  // @param votePower The square root of the total votes cast by the voter.
  function registerVote(
    uint256 proposalStart,
    address voter,
    uint256 votes,
    uint256 votePower
  ) public onlyRole(VOTE_REGISTRAR_ROLE) {
    // If votePower is zero, exit the function to avoid unnecessary computations.
    if (votePower == 0) {
      return;
    }

    // Ensure the proposal start time is valid and the voter address is not zero.
    require(proposalStart > 0, "VoterRewards: proposalStart must be greater than 0");
    require(voter != address(0), "VoterRewards: voter cannot be the zero address");

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();

    uint256 cycle = $.emissions.getCurrentCycle();

    // Fetch the highest level achieved by the voter in Galaxy Member NFT up to the proposal start time.
    uint256 gmNftLevel = $.galaxyMember.getPastHighestLevel(voter, proposalStart);

    // Determine the reward multiplier based on the GM NFT level.
    uint256 multiplier = $.levelToMultiplier[gmNftLevel]; // Percentage multiplier for the level of the GM NFT

    // Scale vote power by 1e9 to counteract the square root operation on 1e18.
    uint256 scaledVotePower = votePower * 1e9;

    // Calculate the weighted vote power for rewards, adjusting vote power with the level-based multiplier.
    // votePower is the square root of the total votes cast by the voter.
    uint256 rewardWeightedVote = scaledVotePower + (scaledVotePower * multiplier) / 100; // Adjusted vote power used for rewards calculation.

    // Update the total reward-weighted votes in the cycle.
    $.cycleToTotal[cycle] += rewardWeightedVote;

    // Record the reward-weighted vote power for the voter in the cycle.
    $.cycleToVoterToTotal[cycle][voter] += rewardWeightedVote;

    emit VoteRegistered(cycle, voter, votes, rewardWeightedVote);
  }

  function claimReward(uint256 cycle, address voter) public nonReentrant {
    require(cycle > 0, "VoterRewards: cycle must be greater than 0");
    require(voter != address(0), "VoterRewards: voter cannot be the zero address");
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();

    require($.emissions.isCycleEnded(cycle), "VoterRewards: cycle must be ended");

    uint256 reward = getReward(cycle, voter);

    require(reward > 0, "VoterRewards: reward must be greater than 0");
    require($.b3tr.balanceOf(address(this)) >= reward, "VoterRewards: not enough B3TR in the contract to pay reward");

    $.cycleToVoterToTotal[cycle][voter] = 0;

    // transfer reward to voter
    require($.b3tr.transfer(voter, reward), "VoterRewards: transfer failed");

    emit RewardClaimed(cycle, voter, reward);
  }

  // ----------------- Getters ----------------- //

  function getReward(uint256 cycle, address voter) public view returns (uint256) {
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();

    uint256 total = $.cycleToVoterToTotal[cycle][voter];

    uint256 totalCycle = $.cycleToTotal[cycle];

    uint256 emissionsAmount = $.emissions.getVote2EarnAmount(cycle);
    require(emissionsAmount > 0, "VoterRewards: emissionsAmount must be greater than 0");

    // Scale up the numerator before division to improve precision
    uint256 scaledNumerator = total * emissionsAmount * $.scalingFactor; // Scale by a factor of scalingFactor for precision
    uint256 reward = scaledNumerator / totalCycle;

    // Scale down the reward to the original scale
    return reward / $.scalingFactor;
  }

  function cycleToVoterToTotal(uint256 cycle, address voter) public view returns (uint256) {
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    return $.cycleToVoterToTotal[cycle][voter];
  }

  function cycleToTotal(uint256 cycle) public view returns (uint256) {
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    return $.cycleToTotal[cycle];
  }

  function levelToMultiplier(uint256 level) public view returns (uint256) {
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    return $.levelToMultiplier[level];
  }

  function galaxyMember() public view returns (IGalaxyMember) {
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    return $.galaxyMember;
  }

  function emissions() public view returns (IEmissions) {
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    return $.emissions;
  }

  function scalingFactor() public view returns (uint256) {
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    return $.scalingFactor;
  }

  function b3tr() public view returns (IB3TR) {
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    return $.b3tr;
  }

  // ----------------- Setters ----------------- //

  function setGalaxyMember(address _galaxyMember) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_galaxyMember != address(0), "VoterRewards: _galaxyMember cannot be the zero address");

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    $.galaxyMember = IGalaxyMember(_galaxyMember);
  }

  function setLevelToMultiplier(uint256 level, uint256 multiplier) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(level > 0, "VoterRewards: level must be greater than 0");
    require(multiplier > 0, "VoterRewards: multiplier must be greater than 0");

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    $.levelToMultiplier[level] = multiplier;
  }

  function setEmissions(address _emissions) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_emissions != address(0), "VoterRewards: emissions cannot be the zero address");

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    $.emissions = IEmissions(_emissions);
  }

  function setVoteRegistrarRole(address _voteRegistrar) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_voteRegistrar != address(0), "VoterRewards: _voteRegistrar cannot be the zero address");
    _grantRole(VOTE_REGISTRAR_ROLE, _voteRegistrar);
  }

  function setScalingFactor(uint256 newScalingFactor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newScalingFactor > 0, "VoterRewards: Scaling factor must be greater than 0");

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    $.scalingFactor = newScalingFactor;
  }
}
