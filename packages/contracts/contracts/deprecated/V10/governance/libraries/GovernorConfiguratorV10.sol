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

import { GovernorStorageTypesV10 } from "./GovernorStorageTypesV10.sol";
import { IVOT3 } from "../../../../interfaces/IVOT3.sol";
import { IVoterRewards } from "../../../../interfaces/IVoterRewards.sol";
import { IXAllocationVotingGovernor } from "../../../../interfaces/IXAllocationVotingGovernor.sol";
import { TimelockControllerUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import { IB3TR } from "../../../../interfaces/IB3TR.sol";
import { IVeBetterPassport } from "../../../../interfaces/IVeBetterPassport.sol";
import { GovernorProposalLogicV10 } from "./GovernorProposalLogicV10.sol";
import { GovernorTypesV10 } from "./GovernorTypesV10.sol";
import { IGalaxyMember } from "../../../../interfaces/IGalaxyMember.sol";
import { IGrantsManager } from "../../../../interfaces/IGrantsManager.sol";
import { INavigatorRegistry } from "../../../../interfaces/INavigatorRegistry.sol";
import { IRelayerRewardsPool } from "../../../../interfaces/IRelayerRewardsPool.sol";

/// @title GovernorConfiguratorV10 Library
/// @notice Library for managing the configuration of a Governor contract.
/// @dev This library provides functions to set and get various configuration parameters and contracts used by the Governor contract.
library GovernorConfiguratorV10 {
  /// @dev Emitted when the `votingThreshold` is set.
  event VotingThresholdSet(uint256 oldVotingThreshold, uint256 newVotingThreshold);

  /// @dev Emitted when the minimum delay before vote starts is set.
  event MinVotingDelaySet(uint256 oldMinMinVotingDelay, uint256 newMinVotingDelay);

  /// @dev Emitted when the deposit threshold percentage is set.
  event DepositThresholdSet(uint256 oldDepositThreshold, uint256 newDepositThreshold);

  /// @dev Emitted when the voter rewards contract is set.
  event VoterRewardsSet(address oldContractAddress, address newContractAddress);

  /// @dev Emitted when the XAllocationVotingGovernor contract is set.
  event XAllocationVotingSet(address oldContractAddress, address newContractAddress);

  /// @dev Emitted when the timelock controller used for proposal execution is modified.
  event TimelockChange(address oldTimelock, address newTimelock);

  /// @dev Emitted when the VeBetterPassport contract is set.
  event VeBetterPassportSet(address oldVeBetterPassport, address newVeBetterPassport);
  event NavigatorRegistrySet(address oldNavigatorRegistry, address newNavigatorRegistry);
  event RelayerRewardsPoolSet(address oldRelayerRewardsPool, address newRelayerRewardsPool);
  event GovernanceSkipWindowBlocksSet(uint256 oldValue, uint256 newValue);

  /// @dev The deposit threshold is not in the valid range for a percentage - 0 to 100.
  error GovernorDepositThresholdNotInRange(uint256 depositThreshold);

  /// @dev The GM level is not in the valid range - 0 to max level.
  error GMLevelAboveMaxLevel(uint256 gmLevel);

  /// @dev Emitted when the `votingThreshold` for a proposal type is set.
  event VotingThresholdSetV2(
    GovernorTypesV10.ProposalType proposalType,
    uint256 oldVotingThreshold,
    uint256 newVotingThreshold
  );

  /// @dev Emitted when the deposit threshold percentage for a proposal type is set.
  event DepositThresholdSetV2(
    GovernorTypesV10.ProposalType proposalType,
    uint256 oldDepositThreshold,
    uint256 newDepositThreshold
  );
  /// @dev Emitted when the deposit threshold cap for a proposal type is set.
  event DepositThresholdCapSet(
    GovernorTypesV10.ProposalType proposalType,
    uint256 oldDepositThresholdCap,
    uint256 newDepositThresholdCap
  );

  /// @dev Emitted when the required GM level for a proposal type is set.
  event RequiredGMLevelSet(
    GovernorTypesV10.ProposalType proposalType,
    uint256 oldRequiredGMLevel,
    uint256 newRequiredGMLevel
  );

  /**------------------ SETTERS ------------------**/

  /**
   * @notice Sets the VeBetterPassport contract.
   * @dev Sets a new VeBetterPassport contract and emits a {VeBetterPassportSet} event.
   * @param newVeBetterPassport The new VeBetterPassport contract.
   */
  function setVeBetterPassport(IVeBetterPassport newVeBetterPassport) external {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    emit VeBetterPassportSet(address($.veBetterPassport), address(newVeBetterPassport));
    $.veBetterPassport = newVeBetterPassport;
  }

  /**
   * @notice Sets the NavigatorRegistry contract.
   * @param newNavigatorRegistry The new NavigatorRegistry contract.
   */
  function setNavigatorRegistry(INavigatorRegistry newNavigatorRegistry) external {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    emit NavigatorRegistrySet(address($.navigatorRegistry), address(newNavigatorRegistry));
    $.navigatorRegistry = newNavigatorRegistry;
  }

  /**
   * @notice Sets the RelayerRewardsPool contract.
   * @param newRelayerRewardsPool The new RelayerRewardsPool contract.
   */
  function setRelayerRewardsPool(IRelayerRewardsPool newRelayerRewardsPool) external {
    require(
      address(newRelayerRewardsPool) != address(0),
      "GovernorConfiguratorV10: relayer rewards pool address cannot be zero"
    );
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    emit RelayerRewardsPoolSet(address($.relayerRewardsPool), address(newRelayerRewardsPool));
    $.relayerRewardsPool = newRelayerRewardsPool;
  }

  /**
   * @notice Sets the governance skip window in blocks.
   * @param newValue The new skip window in blocks (must be > 0).
   */
  function setGovernanceSkipWindowBlocks(uint256 newValue) external {
    require(newValue > 0, "GovernorConfiguratorV10: skip window must be > 0");
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    emit GovernanceSkipWindowBlocksSet($.governanceSkipWindowBlocks, newValue);
    $.governanceSkipWindowBlocks = newValue;
  }

  /**
   * @notice Sets the minimum delay before vote starts.
   * @dev Sets a new minimum voting delay and emits a {MinVotingDelaySet} event.
   * @param newMinVotingDelay The new minimum voting delay.
   */
  function setMinVotingDelay(uint256 newMinVotingDelay) external {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    emit MinVotingDelaySet($.minVotingDelay, newMinVotingDelay);
    $.minVotingDelay = newMinVotingDelay;
  }

  /**
   * @notice Sets the voter rewards contract.
   * @dev Sets a new voter rewards contract and emits a {VoterRewardsSet} event.
   * @param newVoterRewards The new voter rewards contract.
   */
  function setVoterRewards(IVoterRewards newVoterRewards) external {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    require(address(newVoterRewards) != address(0), "GovernorConfiguratorV10: voterRewards address cannot be zero");
    emit VoterRewardsSet(address($.voterRewards), address(newVoterRewards));
    $.voterRewards = newVoterRewards;
  }

  /**
   * @notice Sets the XAllocationVotingGovernor contract.
   * @dev Sets a new XAllocationVotingGovernor contract and emits a {XAllocationVotingSet} event.
   * @param newXAllocationVoting The new XAllocationVotingGovernor contract.
   */
  function setXAllocationVoting(IXAllocationVotingGovernor newXAllocationVoting) external {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    require(
      address(newXAllocationVoting) != address(0),
      "GovernorConfiguratorV10: xAllocationVoting address cannot be zero"
    );
    emit XAllocationVotingSet(address($.xAllocationVoting), address(newXAllocationVoting));
    $.xAllocationVoting = newXAllocationVoting;
  }

  /**
   * @notice Updates the timelock controller.
   * @dev Sets a new timelock controller and emits a {TimelockChange} event.
   * @param newTimelock The new timelock controller.
   */
  function updateTimelock(TimelockControllerUpgradeable newTimelock) external {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    require(address(newTimelock) != address(0), "GovernorConfiguratorV10: timelock address cannot be zero");
    emit TimelockChange(address($.timelock), address(newTimelock));
    $.timelock = newTimelock;
  }

  /**
   * @notice Sets the deposit threshold percentage for a proposal type.
   * @dev Sets a new deposit threshold percentage for a proposal type and emits a {DepositThresholdSet} event.
   * @param proposalType The proposal type.
   * @param newDepositThreshold The new deposit threshold percentage.
   */
  function setProposalTypeDepositThresholdPercentage(
    GovernorTypesV10.ProposalType proposalType,
    uint256 newDepositThreshold
  ) external {
    require(GovernorProposalLogicV10.isValidProposalType(proposalType), "GovernorConfiguratorV10: invalid proposal type");
    if (newDepositThreshold > 100) {
      revert GovernorDepositThresholdNotInRange(newDepositThreshold);
    }
    _setProposalTypeDepositThresholdPercentage(proposalType, newDepositThreshold); //
  }

  /**
   * @notice Sets the deposit threshold percentage for a proposal type.
   * @dev Sets a new deposit threshold percentage for a proposal type and emits a {DepositThresholdSet} event.
   * @param proposalType The proposal type.
   * @param newDepositThreshold The new deposit threshold percentage.
   */
  function _setProposalTypeDepositThresholdPercentage(
    GovernorTypesV10.ProposalType proposalType,
    uint256 newDepositThreshold
  ) internal {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    emit DepositThresholdSetV2(
      proposalType,
      $.proposalTypeDepositThresholdPercentage[proposalType],
      newDepositThreshold
    );
    $.proposalTypeDepositThresholdPercentage[proposalType] = newDepositThreshold;
  }

  /**
   * @notice Sets the voting threshold for a proposal type.
   * @dev Sets a new voting threshold for a proposal type and emits a {VotingThresholdSet} event.
   * @param proposalType The proposal type.
   * @param newVotingThreshold The new voting threshold.
   */
  function setProposalTypeVotingThreshold(
    GovernorTypesV10.ProposalType proposalType,
    uint256 newVotingThreshold
  ) external {
    require(GovernorProposalLogicV10.isValidProposalType(proposalType), "GovernorConfiguratorV10: invalid proposal type");
    _setProposalTypeVotingThreshold(proposalType, newVotingThreshold);
  }

  /**
   * @notice Sets the voting threshold for a proposal type.
   * @dev Sets a new voting threshold for a proposal type and emits a {VotingThresholdSet} event.
   * @param proposalType The proposal type.
   * @param newVotingThreshold The new voting threshold.
   */
  function _setProposalTypeVotingThreshold(
    GovernorTypesV10.ProposalType proposalType,
    uint256 newVotingThreshold
  ) internal {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    emit VotingThresholdSetV2(proposalType, $.proposalTypeVotingThreshold[proposalType], newVotingThreshold);
    $.proposalTypeVotingThreshold[proposalType] = newVotingThreshold;
  }

  /**
   * @notice Sets the deposit threshold cap for a proposal type.
   * @dev Sets a new deposit threshold cap for a proposal type and emits a {DepositThresholdCapSet} event.
   * @param proposalType The proposal type.
   * @param newDepositThresholdCap The new deposit threshold cap.
   */
  function setProposalTypeDepositThresholdCap(
    GovernorTypesV10.ProposalType proposalType,
    uint256 newDepositThresholdCap
  ) external {
    require(GovernorProposalLogicV10.isValidProposalType(proposalType), "GovernorConfiguratorV10: invalid proposal type");
    _setProposalTypeDepositThresholdCap(proposalType, newDepositThresholdCap);
  }

  /**
   * @notice Sets the deposit threshold cap for a proposal type.
   * @dev Sets a new deposit threshold cap for a proposal type and emits a {DepositThresholdCapSet} event.
   * @param proposalType The proposal type.
   * @param newDepositThresholdCap The new deposit threshold cap.
   */
  function _setProposalTypeDepositThresholdCap(
    GovernorTypesV10.ProposalType proposalType,
    uint256 newDepositThresholdCap
  ) internal {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    emit DepositThresholdCapSet(proposalType, $.proposalTypeDepositThresholdCap[proposalType], newDepositThresholdCap);
    $.proposalTypeDepositThresholdCap[proposalType] = newDepositThresholdCap;
  }

  function setGalaxyMemberContract(IGalaxyMember newGalaxyMember) external {
    require(address(newGalaxyMember) != address(0), "GovernorConfiguratorV10: GalaxyMember address cannot be zero");
    _setGalaxyMemberContract(newGalaxyMember);
  }

  /**
   * @notice Sets the GalaxyMember contract.
   * @param newGalaxyMember The new GalaxyMember contract.
   */
  function _setGalaxyMemberContract(IGalaxyMember newGalaxyMember) internal {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    require(address(newGalaxyMember) != address(0), "GovernorConfiguratorV10: GalaxyMember address cannot be zero");
    $.galaxyMember = newGalaxyMember;
  }

  function setGrantsManagerContract(IGrantsManager newGrantsManager) external {
    require(address(newGrantsManager) != address(0), "GovernorConfiguratorV10: GrantsManager address cannot be zero");
    _setGrantsManagerContract(newGrantsManager);
  }

  /**
   * @notice Sets the GrantsManager contract.
   * @param newGrantsManager The new GrantsManager contract.
   */
  function _setGrantsManagerContract(IGrantsManager newGrantsManager) internal {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    require(address(newGrantsManager) != address(0), "GovernorConfiguratorV10: GrantsManager address cannot be zero");
    $.grantsManager = newGrantsManager;
  }

  /**------------------ GETTERS ------------------**/
  /**
   * @notice Returns the voting threshold.
   * @param proposalType The proposal type.
   * @return The current voting threshold.
   */
  function getVotingThreshold(GovernorTypesV10.ProposalType proposalType) internal view returns (uint256) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    require(GovernorProposalLogicV10.isValidProposalType(proposalType), "GovernorConfiguratorV10: invalid proposal type");
    return $.proposalTypeVotingThreshold[proposalType];
  }

  /**
   * @notice Returns the minimum delay before vote starts.
   * @return The current minimum voting delay.
   */
  function getMinVotingDelay() internal view returns (uint256) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    return $.minVotingDelay;
  }

  /**
   * @notice Returns the deposit threshold percentage.
   * @param proposalType The proposal type.
   * @return The current deposit threshold percentage.
   */
  function getDepositThresholdPercentage(GovernorTypesV10.ProposalType proposalType) internal view returns (uint256) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    require(GovernorProposalLogicV10.isValidProposalType(proposalType), "GovernorConfiguratorV10: invalid proposal type");
    return $.proposalTypeDepositThresholdPercentage[proposalType];
  }

  /**
   * @notice Returns the VeBetterPassport contract.
   * @return The current VeBetterPassport contract.
   */
  function veBetterPassport() internal view returns (IVeBetterPassport) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    return $.veBetterPassport;
  }

  /**
   * @notice Returns the deposit threshold cap for a proposal type.
   * @param proposalType The proposal type.
   * @return The current deposit threshold cap.
   */
  function getDepositThresholdCap(GovernorTypesV10.ProposalType proposalType) internal view returns (uint256) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    require(GovernorProposalLogicV10.isValidProposalType(proposalType), "GovernorConfiguratorV10: invalid proposal type");
    return $.proposalTypeDepositThresholdCap[proposalType];
  }

  /**
   * @notice Returns the GalaxyMember contract.
   * @return The current GalaxyMember contract.
   */
  function getGalaxyMemberContract() internal view returns (IGalaxyMember) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    return $.galaxyMember;
  }

  /**
   * @notice Returns the GrantsManager contract.
   * @return The current GrantsManager contract.
   */
  function getGrantsManagerContract() internal view returns (IGrantsManager) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    return $.grantsManager;
  }

  /**
   * @notice Returns the GM weight for a proposal type.
   * @param proposalTypeValue The proposal type.
   * @return The current GM weight for the proposal type.
   */
  function getRequiredGMLevelByProposalType(
    GovernorTypesV10.ProposalType proposalTypeValue
  ) internal view returns (uint256) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    require(
      GovernorProposalLogicV10.isValidProposalType(proposalTypeValue),
      "GovernorConfiguratorV10: invalid proposal type"
    );
    return $.requiredGMLevelByProposalType[proposalTypeValue];
  }

  /**
   * @notice Sets the GM weight for a proposal type.
   * @param proposalTypeValue The proposal type.
   * @param newGMWeight The new GM weight for the proposal type.
   */
  /**
   * @notice Returns the governance skip window in blocks.
   * @return The governance skip window in blocks.
   */
  function governanceSkipWindowBlocks() internal view returns (uint256) {
    return GovernorStorageTypesV10.getGovernorStorage().governanceSkipWindowBlocks;
  }

  function setRequiredGMLevelByProposalType(
    GovernorTypesV10.ProposalType proposalTypeValue,
    uint256 newGMWeight
  ) internal {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    uint256 maxGMWeight = $.galaxyMember.MAX_LEVEL();
    uint256 oldRequiredGMLevel = $.requiredGMLevelByProposalType[proposalTypeValue];
    require(
      GovernorProposalLogicV10.isValidProposalType(proposalTypeValue),
      "GovernorConfiguratorV10: invalid proposal type"
    );

    if (newGMWeight > maxGMWeight) {
      revert GMLevelAboveMaxLevel(newGMWeight);
    }
    emit RequiredGMLevelSet(proposalTypeValue, oldRequiredGMLevel, newGMWeight);
    $.requiredGMLevelByProposalType[proposalTypeValue] = newGMWeight;
  }
}
