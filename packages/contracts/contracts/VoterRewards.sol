// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IB3TRBadge.sol";
import "./interfaces/IGovernor.sol";
import "./interfaces/IXAllocationVotingGovernor.sol";
import "./interfaces/IEmissions.sol";
import "./interfaces/IB3TR.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract VoterRewards is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
  bytes32 public constant X_ALLOCATION_VOTE_REGISTRAR_ROLE = keccak256("X_ALLOCATION_VOTE_REGISTRAR_ROLE");

  /// @custom:storage-location erc7201:b3tr.storage.VoterRewards
  struct VoterRewardsStorage {
    IB3TRBadge b3trBadge;
    IB3TR b3tr;
    IEmissions emissions;
    // level => percentage multiplier for the level of the badge
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

  event VoteRegistered(uint256 indexed cycle, address indexed voter, uint256 votes);

  event RewardClaimed(uint256 indexed cycle, address indexed voter, uint256 reward);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    address admin,
    address _emissions,
    address _b3trBadge,
    address _b3tr,
    uint256[] memory levels,
    uint256[] memory multipliers
  ) public initializer {
    require(_b3trBadge != address(0), "VoterRewards: _b3trBadge cannot be the zero address");
    require(_emissions != address(0), "VoterRewards: emissions cannot be the zero address");
    require(_b3tr != address(0), "VoterRewards: _b3tr cannot be the zero address");

    require(levels.length > 0, "VoterRewards: levels must have at least one element");
    require(levels.length == multipliers.length, "VoterRewards: levels and multipliers must have the same length");

    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();

    $.b3trBadge = IB3TRBadge(_b3trBadge);
    $.b3tr = IB3TR(_b3tr);
    $.emissions = IEmissions(_emissions);
    $.scalingFactor = 1e6;

    for (uint256 i = 0; i < levels.length; i++) {
      $.levelToMultiplier[levels[i]] = multipliers[i];
    }

    _grantRole(DEFAULT_ADMIN_ROLE, admin);
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

  function registerXallocationVote(
    uint256 proposalStart,
    address voter,
    uint256 votes
  ) public onlyRole(X_ALLOCATION_VOTE_REGISTRAR_ROLE) {
    require(votes > 0, "VoterRewards: votes must be greater than 0");
    require(proposalStart > 0, "VoterRewards: proposalStart must be greater than 0");
    require(voter != address(0), "VoterRewards: voter cannot be the zero address");

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();

    uint256 cycle = $.emissions.getCurrentCycle();

    uint256 badgeLevel = $.b3trBadge.getPastLevel(voter, proposalStart);

    uint256 multiplier = $.levelToMultiplier[badgeLevel]; // Percentage multiplier for the level of the badge
    uint256 total = votes; //TODO - multiply votes by percentage multiplier

    $.cycleToTotal[cycle] += total; // Add total to the cycle
    $.cycleToVoterToTotal[cycle][voter] += total; // Add total to the voter in the cycle

    emit VoteRegistered(cycle, voter, total);
  }

  //TODO - registerGovernorVote (for the general purpose governor proposals)

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

  // TODO - do we want a withdrawal logic for the contract owner?

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

  function b3trBadge() public view returns (IB3TRBadge) {
    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    return $.b3trBadge;
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

  function setB3TRBadge(address _b3trBadge) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_b3trBadge != address(0), "VoterRewards: _b3trBadge cannot be the zero address");

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    $.b3trBadge = IB3TRBadge(_b3trBadge);
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

  function setXallocationVoteRegistrarRole(address _voteRegistrar) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_voteRegistrar != address(0), "VoterRewards: _voteRegistrar cannot be the zero address");
    _grantRole(X_ALLOCATION_VOTE_REGISTRAR_ROLE, _voteRegistrar);
  }

  function setScalingFactor(uint256 newScalingFactor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newScalingFactor > 0, "VoterRewards: Scaling factor must be greater than 0");

    VoterRewardsStorage storage $ = _getVoterRewardsStorage();
    $.scalingFactor = newScalingFactor;
  }
}
