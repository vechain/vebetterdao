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

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/V2/IGalaxyMemberV2.sol";
import "./interfaces/IB3TRGovernor.sol";
import "./interfaces/IXAllocationVotingGovernor.sol";
import "./interfaces/IEmissions.sol";
import "./interfaces/IB3TR.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


/**
 * @title VoterRewardsV2
 * @author VeBetterDAO
 *
 * @notice This contract handles the rewards for voters in the VeBetterDAO ecosystem.
 * It calculates the rewards for voters based on their voting power and the level of their Galaxy Member NFT.
 *
 * @dev Differences from V1:
 * - Added the ability to track if a Galaxy Member NFT has voted in a proposal.
 * - Added the ability to track if a Vechain node attached to a Galaxy Member NFT has voted in a proposal.
 * - Proposal Id is now required when registering votes instead of proposal snapshot.
 * - Core logic functions are now virtual allowing to be overridden through inheritance.
 */
contract VoterRewardsV2 is AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
  /// @notice The role that can register votes for rewards calculation.
  bytes32 public constant VOTE_REGISTRAR_ROLE = keccak256("VOTE_REGISTRAR_ROLE");

  /// @notice The role that can upgrade the contract.
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /// @notice The role that can set the addresses of the contracts used by the VoterRewards contract.
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");

  /// @notice The scaling factor for the rewards calculation.
  uint256 public constant SCALING_FACTOR = 1e6;

  /// @custom:storage-location erc7201:b3tr.storage.VoterRewards
  struct VoterRewardsStorageV2 {
    IGalaxyMemberV2 galaxyMember;
    IB3TR b3tr;
    IEmissions emissions;
    // level => percentage multiplier for the level of the GM NFT
    mapping(uint256 => uint256) levelToMultiplier;
    // cycle => total weighted votes in the cycle
    mapping(uint256 => uint256) cycleToTotal;
    // cycle => voter => total weighted votes for the voter in the cycle
    mapping(uint256 cycle => mapping(address voter => uint256 total)) cycleToVoterToTotal;
    // --------------------------- V2 Additions --------------------------- //
    // proposalId => tokenId => hasVoted (keeps track of whether a galaxy member has voted in a proposal)
    mapping(uint256 proposalId => mapping(uint256 tokenId => bool)) proposalToGalaxyMemberToHasVoted;
    // proposalId => nodeId => hasVoted (keeps track of whether a vechain node has been used while attached to a galaxy member NFT when voting for a proposal)
    mapping(uint256 proposalId => mapping(uint256 nodeId => bool)) proposalToNodeToHasVoted;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.VoterRewards")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant VoterRewardsStorageLocation =
    0x114e7ffaaf205d38cd05b17b56f3357806ef2ce889cb4748445ae91cdfc37c00;

  /// @notice Get the VoterRewardsStorage struct from the specified storage slot specified by the VoterRewardsStorageLocation.
  function _getVoterRewardsStorageV2() internal pure returns (VoterRewardsStorageV2 storage $) {
    assembly {
      $.slot := VoterRewardsStorageLocation
    }
  }

  /// @notice Emitted when a user registers their votes for rewards calculation.
  /// @param cycle - The cycle in which the votes were registered.
  /// @param voter- The address of the voter.
  /// @param votes - The number of votes cast by the voter.
  /// @param rewardWeightedVote - The reward-weighted vote power for the voter based on their voting power and GM NFT level.
  event VoteRegistered(uint256 indexed cycle, address indexed voter, uint256 votes, uint256 rewardWeightedVote);

  /// @notice Emitted when a user claims their rewards.
  /// @param cycle - The cycle in which the rewards were claimed.
  /// @param voter - The address of the voter.
  /// @param reward - The amount of B3TR reward claimed by the voter.
  event RewardClaimed(uint256 indexed cycle, address indexed voter, uint256 reward);

  /// @notice Emitted when the Galaxy Member contract address is set.
  /// @param newAddress - The address of the new Galaxy Member contract.
  /// @param oldAddress - The address of the old Galaxy Member contract.
  event GalaxyMemberAddressUpdated(address indexed newAddress, address indexed oldAddress);

  /// @notice Emitted when the Emissions contract address is set.
  /// @param newAddress - The address of the new Emissions contract.
  /// @param oldAddress - The address of the old Emissions contract.
  event EmissionsAddressUpdated(address indexed newAddress, address indexed oldAddress);

  /// @notice Emitted when the level to multiplier mapping is set.
  /// @param level - The level of the Galaxy Member NFT.
  /// @param multiplier - The percentage multiplier for the level of the Galaxy Member NFT.
  event LevelToMultiplierSet(uint256 indexed level, uint256 multiplier);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @notice Upgrade the implementation of the VoterRewards contract.
  /// @dev Only the address with the UPGRADER_ROLE can call this function.
  /// @param newImplementation - The address of the new implementation contract.
  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  /// @notice Register the votes of a user for rewards calculation.
  /// @dev Quadratic rewarding is used to reward users with quadratic-weight based on their voting power and the level of their Galaxy Member NFT.
  /// @param proposalId - The ID of the proposal.
  /// @param voter - The address of the voter.
  /// @param votes - The number of votes cast by the voter.
  /// @param votePower - The square root of the total votes cast by the voter.
  function registerVote(
    uint256 proposalId,
    address voter,
    uint256 votes,
    uint256 votePower
  ) public virtual onlyRole(VOTE_REGISTRAR_ROLE) {
    // If votePower is zero, exit the function to avoid unnecessary computations.
    if (votePower == 0) {
      return;
    }

    require(proposalId != 0, "VoterRewards: proposalId cannot be 0");
    require(voter != address(0), "VoterRewards: voter cannot be the zero address");

    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();

    uint256 selectedGMNFT = $.galaxyMember.getSelectedTokenId(voter);

    // Get the current cycle number.
    uint256 cycle = $.emissions.getCurrentCycle();

    // Determine the reward multiplier based on the GM NFT level and if the GM NFT or Vechain node attached have already voted on this proposal.
    uint256 multiplier = getMultiplier(selectedGMNFT, proposalId);

    // Scale vote power by 1e9 to counteract the square root operation on 1e18.
    uint256 scaledVotePower = votePower * 1e9;

    // Calculate the weighted vote power for rewards, adjusting vote power with the level-based multiplier.
    // votePower is the square root of the total votes cast by the voter.
    uint256 rewardWeightedVote = scaledVotePower + ((scaledVotePower * multiplier) / 100); // Adjusted vote power used for rewards calculation.

    // Update the total reward-weighted votes in the cycle.
    $.cycleToTotal[cycle] += rewardWeightedVote;

    // Record the reward-weighted vote power for the voter in the cycle.
    $.cycleToVoterToTotal[cycle][voter] += rewardWeightedVote;

    if (selectedGMNFT != 0) {
      $.proposalToGalaxyMemberToHasVoted[proposalId][selectedGMNFT] = true;
    }

    uint256 nodeIdAttached = $.galaxyMember.getNodeIdAttached(selectedGMNFT);

    if (nodeIdAttached != 0) {
      $.proposalToNodeToHasVoted[proposalId][nodeIdAttached] = true;
    }

    // Emit an event to log the registration of the votes.
    emit VoteRegistered(cycle, voter, votes, rewardWeightedVote);
  }

  /// @notice Claim the rewards for a user in a specific cycle.
  /// @dev The rewards are claimed based on the reward-weighted votes of the user in the cycle.
  /// @param cycle - The cycle in which the rewards are claimed.
  /// @param voter - The address of the voter.
  function claimReward(uint256 cycle, address voter) public virtual nonReentrant {
    require(cycle > 0, "VoterRewards: cycle must be greater than 0");
    require(voter != address(0), "VoterRewards: voter cannot be the zero address");
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();

    // Check if the cycle has ended before claiming rewards.
    require($.emissions.isCycleEnded(cycle), "VoterRewards: cycle must be ended");

    // Get the reward for the voter in the cycle.
    uint256 reward = getReward(cycle, voter);

    require(reward > 0, "VoterRewards: reward must be greater than 0");
    require($.b3tr.balanceOf(address(this)) >= reward, "VoterRewards: not enough B3TR in the contract to pay reward");

    // Reset the reward-weighted votes for the voter in the cycle.
    $.cycleToVoterToTotal[cycle][voter] = 0;

    // transfer reward to voter
    require($.b3tr.transfer(voter, reward), "VoterRewards: transfer failed");

    // Emit an event to log the reward claimed by the voter.
    emit RewardClaimed(cycle, voter, reward);
  }

  // ----------------- Getters ----------------- //

  /// @notice Get the reward multiplier for a user in a specific proposal.
  /// @param tokenId Id of the Galaxy Member NFT
  /// @param proposalId Id of the proposal
  function getMultiplier(uint256 tokenId, uint256 proposalId) public view virtual returns (uint256) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();

    if (hasTokenVoted(tokenId, proposalId)) return 0;

    uint256 nodeIdAttached = $.galaxyMember.getNodeIdAttached(tokenId);

    if (hasNodeVoted(nodeIdAttached, proposalId)) return 0;

    uint256 gmNftLevel = $.galaxyMember.levelOf(tokenId);

    return $.levelToMultiplier[gmNftLevel];
  }

  /// @notice Check if a Vechain Node has voted in a proposal
  /// @param nodeId Id of the Vechain node
  /// @param proposalId Id of the proposal
  function hasNodeVoted(uint256 nodeId, uint256 proposalId) public view returns (bool) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();

    return $.proposalToNodeToHasVoted[proposalId][nodeId];
  }

  /// @notice Check if a Galaxy Member has voted in a proposal
  /// @param tokenId Id of the Galaxy Member NFT
  /// @param proposalId Id of the proposal
  function hasTokenVoted(uint256 tokenId, uint256 proposalId) public view returns (bool) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();

    return $.proposalToGalaxyMemberToHasVoted[proposalId][tokenId];
  }

  /// @notice Get the reward for a user in a specific cycle.
  /// @param cycle - The cycle in which the rewards are claimed.
  /// @param voter - The address of the voter.
  function getReward(uint256 cycle, address voter) public view virtual returns (uint256) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();

    // Get the total reward-weighted votes for the voter in the cycle.
    uint256 total = $.cycleToVoterToTotal[cycle][voter];

    // Get the total reward-weighted votes in the cycle.
    uint256 totalCycle = $.cycleToTotal[cycle];

    // Get the emissions for voter rewards in the cycle.
    uint256 emissionsAmount = $.emissions.getVote2EarnAmount(cycle);
    require(emissionsAmount > 0, "VoterRewards: emissionsAmount must be greater than 0");

    // Scale up the numerator before division to improve precision
    uint256 scaledNumerator = total * emissionsAmount * SCALING_FACTOR; // Scale by a factor of SCALING_FACTOR for precision
    uint256 reward = scaledNumerator / totalCycle;

    // Scale down the reward to the original scale
    return reward / SCALING_FACTOR;
  }

  /// @notice Get the total reward-weighted votes for a user in a specific cycle.
  /// @param cycle - The cycle in which the rewards are claimed.
  /// @param voter - The address of the voter.
  function cycleToVoterToTotal(uint256 cycle, address voter) external view returns (uint256) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();
    return $.cycleToVoterToTotal[cycle][voter];
  }

  /// @notice Get the total reward-weighted votes in a specific cycle.
  /// @param cycle - The cycle in which the rewards are claimed.
  function cycleToTotal(uint256 cycle) external view returns (uint256) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();
    return $.cycleToTotal[cycle];
  }

  /// @notice Get the reward multiplier for a specific level of the Galaxy Member NFT.
  /// @param level - The level of the Galaxy Member NFT.
  function levelToMultiplier(uint256 level) external view returns (uint256) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();
    return $.levelToMultiplier[level];
  }

  /// @notice Get the Galaxy Member contract.
  function galaxyMember() external view returns (IGalaxyMemberV2) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();
    return $.galaxyMember;
  }

  /// @notice Get the Emissions contract.
  function emissions() external view returns (IEmissions) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();
    return $.emissions;
  }

  /// @notice Get the B3TR token contract.
  function b3tr() external view returns (IB3TR) {
    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();
    return $.b3tr;
  }

  // ----------------- Setters ----------------- //

  /// @notice Set the Galaxy Member contract.
  /// @param _galaxyMember - The address of the Galaxy Member contract.
  function setGalaxyMember(address _galaxyMember) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    require(_galaxyMember != address(0), "VoterRewards: _galaxyMember cannot be the zero address");

    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();

    emit GalaxyMemberAddressUpdated(_galaxyMember, address($.galaxyMember));

    $.galaxyMember = IGalaxyMemberV2(_galaxyMember);
  }

  /// @notice Set the Galaxy Member level to multiplier mapping.
  /// @param level - The level of the Galaxy Member NFT.
  /// @param multiplier - The percentage multiplier for the level of the Galaxy Member NFT.
  function setLevelToMultiplier(uint256 level, uint256 multiplier) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(level > 0, "VoterRewards: level must be greater than 0");
    require(multiplier > 0, "VoterRewards: multiplier must be greater than 0");

    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();
    $.levelToMultiplier[level] = multiplier;

    emit LevelToMultiplierSet(level, multiplier);
  }

  /// @notice Set the Emmissions contract.
  /// @param _emissions - The address of the emissions contract.
  function setEmissions(address _emissions) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    require(_emissions != address(0), "VoterRewards: emissions cannot be the zero address");

    VoterRewardsStorageV2 storage $ = _getVoterRewardsStorageV2();

    emit EmissionsAddressUpdated(_emissions, address($.emissions));

    $.emissions = IEmissions(_emissions);
  }

  /// @notice Returns the version of the contract
  /// @dev This should be updated every time a new version of implementation is deployed
  /// @return string The version of the contract
  function version() external pure virtual returns (string memory) {
    return "2";
  }
}
