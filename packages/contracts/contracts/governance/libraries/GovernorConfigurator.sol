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

import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { IVOT3 } from "../../interfaces/IVOT3.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { TimelockControllerUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import { IB3TR } from "../../interfaces/IB3TR.sol";
import { IVeBetterPassport } from "../../interfaces/IVeBetterPassport.sol";
import { GovernorProposalLogic } from "./GovernorProposalLogic.sol";
import { GovernorTypes } from "./GovernorTypes.sol";
import { IGalaxyMember } from "../../interfaces/IGalaxyMember.sol";
import { IGrantsManager } from "../../interfaces/IGrantsManager.sol";

/// @title GovernorConfigurator Library
/// @notice Library for managing the configuration of a Governor contract.
/// @dev This library provides functions to set and get various configuration parameters and contracts used by the Governor contract.
library GovernorConfigurator {
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

  /// @dev The deposit threshold is not in the valid range for a percentage - 0 to 100.
  error GovernorDepositThresholdNotInRange(uint256 depositThreshold);

  /// @dev The GM level is not in the valid range - 0 to max level.
  error GMLevelAboveMaxLevel(uint256 gmLevel);

  /// @dev Emitted when the `votingThreshold` for a proposal type is set.
  event VotingThresholdSetV2(
    GovernorTypes.ProposalType proposalType,
    uint256 oldVotingThreshold,
    uint256 newVotingThreshold
  );

  /// @dev Emitted when the deposit threshold percentage for a proposal type is set.
  event DepositThresholdSetV2(
    GovernorTypes.ProposalType proposalType,
    uint256 oldDepositThreshold,
    uint256 newDepositThreshold
  );
  /// @dev Emitted when the deposit threshold cap for a proposal type is set.
  event DepositThresholdCapSet(
    GovernorTypes.ProposalType proposalType,
    uint256 oldDepositThresholdCap,
    uint256 newDepositThresholdCap
  );

  /// @dev Emitted when the required GM level for a proposal type is set.
  event RequiredGMLevelSet(
    GovernorTypes.ProposalType proposalType,
    uint256 oldRequiredGMLevel,
    uint256 newRequiredGMLevel
  );

  /**------------------ SETTERS ------------------**/

  /**
   * @notice Sets the VeBetterPassport contract.
   * @dev Sets a new VeBetterPassport contract and emits a {VeBetterPassportSet} event.
   * @param newVeBetterPassport The new VeBetterPassport contract.
   */
  function setVeBetterPassport(
    IVeBetterPassport newVeBetterPassport
  ) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    emit VeBetterPassportSet(address($.veBetterPassport), address(newVeBetterPassport));
    $.veBetterPassport = newVeBetterPassport;
  }

  /**
   * @notice Sets the minimum delay before vote starts.
   * @dev Sets a new minimum voting delay and emits a {MinVotingDelaySet} event.
   * @param newMinVotingDelay The new minimum voting delay.
   */
  function setMinVotingDelay(uint256 newMinVotingDelay) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    emit MinVotingDelaySet($.minVotingDelay, newMinVotingDelay);
    $.minVotingDelay = newMinVotingDelay;
  }

  /**
   * @notice Sets the voter rewards contract.
   * @dev Sets a new voter rewards contract and emits a {VoterRewardsSet} event.
   * @param newVoterRewards The new voter rewards contract.
   */
  function setVoterRewards(IVoterRewards newVoterRewards) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(address(newVoterRewards) != address(0), "GovernorConfigurator: voterRewards address cannot be zero");
    emit VoterRewardsSet(address($.voterRewards), address(newVoterRewards));
    $.voterRewards = newVoterRewards;
  }

  /**
   * @notice Sets the XAllocationVotingGovernor contract.
   * @dev Sets a new XAllocationVotingGovernor contract and emits a {XAllocationVotingSet} event.
   * @param newXAllocationVoting The new XAllocationVotingGovernor contract.
   */
  function setXAllocationVoting(
    IXAllocationVotingGovernor newXAllocationVoting
  ) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(
      address(newXAllocationVoting) != address(0),
      "GovernorConfigurator: xAllocationVoting address cannot be zero"
    );
    emit XAllocationVotingSet(address($.xAllocationVoting), address(newXAllocationVoting));
    $.xAllocationVoting = newXAllocationVoting;
  }

  /**
   * @notice Updates the timelock controller.
   * @dev Sets a new timelock controller and emits a {TimelockChange} event.
   * @param newTimelock The new timelock controller.
   */
  function updateTimelock(
    TimelockControllerUpgradeable newTimelock
  ) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(address(newTimelock) != address(0), "GovernorConfigurator: timelock address cannot be zero");
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
    GovernorTypes.ProposalType proposalType,
    uint256 newDepositThreshold
  ) external {
    require(GovernorProposalLogic.isValidProposalType(proposalType), "GovernorConfigurator: invalid proposal type");
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
    GovernorTypes.ProposalType proposalType,
    uint256 newDepositThreshold
  ) internal {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
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
    GovernorTypes.ProposalType proposalType,
    uint256 newVotingThreshold
  ) external {
    require(GovernorProposalLogic.isValidProposalType(proposalType), "GovernorConfigurator: invalid proposal type");
    _setProposalTypeVotingThreshold(proposalType, newVotingThreshold);
  }

  /**
   * @notice Sets the voting threshold for a proposal type.
   * @dev Sets a new voting threshold for a proposal type and emits a {VotingThresholdSet} event.
   * @param proposalType The proposal type.
   * @param newVotingThreshold The new voting threshold.
   */
  function _setProposalTypeVotingThreshold(
    GovernorTypes.ProposalType proposalType,
    uint256 newVotingThreshold
  ) internal {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
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
    GovernorTypes.ProposalType proposalType,
    uint256 newDepositThresholdCap
  ) external {
    require(GovernorProposalLogic.isValidProposalType(proposalType), "GovernorConfigurator: invalid proposal type");
    _setProposalTypeDepositThresholdCap(proposalType, newDepositThresholdCap);
  }

  /**
   * @notice Sets the deposit threshold cap for a proposal type.
   * @dev Sets a new deposit threshold cap for a proposal type and emits a {DepositThresholdCapSet} event.
   * @param proposalType The proposal type.
   * @param newDepositThresholdCap The new deposit threshold cap.
   */
  function _setProposalTypeDepositThresholdCap(
    GovernorTypes.ProposalType proposalType,
    uint256 newDepositThresholdCap
  ) internal {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    emit DepositThresholdCapSet(
      proposalType,
      $.proposalTypeDepositThresholdCap[proposalType],
      newDepositThresholdCap
    );
    $.proposalTypeDepositThresholdCap[proposalType] = newDepositThresholdCap;
  }

  function setGalaxyMemberContract(
    IGalaxyMember newGalaxyMember
  ) external {
    require(address(newGalaxyMember) != address(0), "GovernorConfigurator: GalaxyMember address cannot be zero");
    _setGalaxyMemberContract(newGalaxyMember);
  }

  /**
   * @notice Sets the GalaxyMember contract.
   * @param newGalaxyMember The new GalaxyMember contract.
   */
  function _setGalaxyMemberContract(
    IGalaxyMember newGalaxyMember
  ) internal {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(address(newGalaxyMember) != address(0), "GovernorConfigurator: GalaxyMember address cannot be zero");
    $.galaxyMember = newGalaxyMember;
  }

  function setGrantsManagerContract(
    IGrantsManager newGrantsManager
  ) external {
    require(address(newGrantsManager) != address(0), "GovernorConfigurator: GrantsManager address cannot be zero");
    _setGrantsManagerContract(newGrantsManager);
  }

  /**
   * @notice Sets the GrantsManager contract.
   * @param newGrantsManager The new GrantsManager contract.
   */
  function _setGrantsManagerContract(
    IGrantsManager newGrantsManager
  ) internal {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(address(newGrantsManager) != address(0), "GovernorConfigurator: GrantsManager address cannot be zero");
    $.grantsManager = newGrantsManager;
  }

  /**------------------ GETTERS ------------------**/
  /**
   * @notice Returns the voting threshold.
   * @param proposalType The proposal type.
   * @return The current voting threshold.
   */
  function getVotingThreshold(
    GovernorTypes.ProposalType proposalType
  ) internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(GovernorProposalLogic.isValidProposalType(proposalType), "GovernorConfigurator: invalid proposal type");
    return $.proposalTypeVotingThreshold[proposalType];
  }

  /**
   * @notice Returns the minimum delay before vote starts.
   * @return The current minimum voting delay.
   */
  function getMinVotingDelay() internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.minVotingDelay;
  }

  /**
   * @notice Returns the deposit threshold percentage.
   * @param proposalType The proposal type.
   * @return The current deposit threshold percentage.
   */
  function getDepositThresholdPercentage(
    GovernorTypes.ProposalType proposalType
  ) internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(GovernorProposalLogic.isValidProposalType(proposalType), "GovernorConfigurator: invalid proposal type");
    return $.proposalTypeDepositThresholdPercentage[proposalType];
  }

  /**
   * @notice Returns the VeBetterPassport contract.
   * @return The current VeBetterPassport contract.
   */
  function veBetterPassport(
  ) internal view returns (IVeBetterPassport) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.veBetterPassport;
  }

  /**
   * @notice Returns the deposit threshold cap for a proposal type.
   * @param proposalType The proposal type.
   * @return The current deposit threshold cap.
   */
  function getDepositThresholdCap(
    GovernorTypes.ProposalType proposalType
  ) internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(GovernorProposalLogic.isValidProposalType(proposalType), "GovernorConfigurator: invalid proposal type");
    return $.proposalTypeDepositThresholdCap[proposalType];
  }

  /**
   * @notice Returns the GalaxyMember contract.
   * @return The current GalaxyMember contract.
   */
  function getGalaxyMemberContract(
  ) internal view returns (IGalaxyMember) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.galaxyMember;
  }

  /**
   * @notice Returns the GrantsManager contract.
   * @return The current GrantsManager contract.
   */
  function getGrantsManagerContract(
  ) internal view returns (IGrantsManager) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.grantsManager;
  }

  /**
   * @notice Returns the GM weight for a proposal type.
   * @param proposalTypeValue The proposal type.
   * @return The current GM weight for the proposal type.
   */
  function getRequiredGMLevelByProposalType(
    GovernorTypes.ProposalType proposalTypeValue
  ) internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require(
      GovernorProposalLogic.isValidProposalType(proposalTypeValue),
      "GovernorConfigurator: invalid proposal type"
    );
    return $.requiredGMLevelByProposalType[proposalTypeValue];
  }

  /**
   * @notice Sets the GM weight for a proposal type.
   * @param proposalTypeValue The proposal type.
   * @param newGMWeight The new GM weight for the proposal type.
   */
  function setRequiredGMLevelByProposalType(
    GovernorTypes.ProposalType proposalTypeValue,
    uint256 newGMWeight
  ) internal {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    uint256 maxGMWeight = $.galaxyMember.MAX_LEVEL();
    uint256 oldRequiredGMLevel = $.requiredGMLevelByProposalType[proposalTypeValue];
    require(
      GovernorProposalLogic.isValidProposalType(proposalTypeValue),
      "GovernorConfigurator: invalid proposal type"
    );

    if (newGMWeight > maxGMWeight) {
      revert GMLevelAboveMaxLevel(newGMWeight);
    }
    emit RequiredGMLevelSet(proposalTypeValue, oldRequiredGMLevel, newGMWeight);
    $.requiredGMLevelByProposalType[proposalTypeValue] = newGMWeight;
  }
}
