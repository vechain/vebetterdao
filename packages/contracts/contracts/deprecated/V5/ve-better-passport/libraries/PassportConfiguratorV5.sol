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

import { PassportStorageTypesV5 } from "./PassportStorageTypesV5.sol";
import { PassportTypesV5 } from "./PassportTypesV5.sol";
import { PassportClockLogicV5 } from "./PassportClockLogicV5.sol";
import { IX2EarnApps } from "../../../../interfaces/IX2EarnApps.sol";
import { IXAllocationVotingGovernor } from "../../../../interfaces/IXAllocationVotingGovernor.sol";
import { IGalaxyMember } from "../../../../interfaces/IGalaxyMember.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

/// @title PassportConfiguratorV5 Library
/// @notice Library for managing the configuration of a Passport contract.
/// @dev This library provides functions to set and get various configuration parameters and contracts used by the Passport contract.
library PassportConfiguratorV5 {
  using Checkpoints for Checkpoints.Trace208;

  // ---------- Getters ---------- //
  /// @notice Gets the x2EarnApps contract address
  function getX2EarnApps() internal view returns (IX2EarnApps) {
    PassportStorageTypesV5.PassportStorage storage self = PassportStorageTypesV5.getPassportStorage();
    return self.x2EarnApps;
  }

  /// @notice Gets the xAllocationVoting contract address
  function getXAllocationVoting() internal view returns (IXAllocationVotingGovernor) {
    PassportStorageTypesV5.PassportStorage storage self = PassportStorageTypesV5.getPassportStorage();
    return self.xAllocationVoting;
  }

  /// @notice Gets the galaxy member contract address
  function getGalaxyMember() internal view returns (IGalaxyMember) {
    PassportStorageTypesV5.PassportStorage storage self = PassportStorageTypesV5.getPassportStorage();
    return self.galaxyMember;
  }

  // ---------- Setters ---------- //

  /// @notice Initializes the PassportStorage struct with the provided initialization data
  function initializePassportStorage(
    PassportTypesV5.InitializationData memory initializationData
  ) external {
    PassportStorageTypesV5.PassportStorage storage self = PassportStorageTypesV5.getPassportStorage();
    // Initialize the external contracts
    setX2EarnApps(initializationData.x2EarnApps);
    setXAllocationVoting(initializationData.xAllocationVoting);
    setGalaxyMember(initializationData.galaxyMember);

    // Initialize the bot signals threshold
    self.signalsThreshold = initializationData.signalingThreshold;

    // Initialize the minimum Galaxy Member level to be considered human by Personhood checks
    self.minimumGalaxyMemberLevel = initializationData.minimumGalaxyMemberLevel;

    // Initialize the participant score threshold to be considered human by Personhood checks
    self.popScoreThreshold.push(PassportClockLogicV5.clock(), 0);

    // Initialize the number of rounds for cumulative score
    self.roundsForCumulativeScore = initializationData.roundsForCumulativeScore;

    // Initialize the secuirty multiplier
    self.securityMultiplier[PassportTypesV5.APP_SECURITY.LOW] = 100;
    self.securityMultiplier[PassportTypesV5.APP_SECURITY.MEDIUM] = 200;
    self.securityMultiplier[PassportTypesV5.APP_SECURITY.HIGH] = 400;

    // Decay
    self.decayRate = initializationData.decayRate;

    // Set the threshold percentage of blacklisted or whitelisted entities to consider a passport user as blacklisted or whitelisted
    self.blacklistThreshold = initializationData.blacklistThreshold;
    self.whitelistThreshold = initializationData.whitelistThreshold;

    // Set the maximum number of entities per passport
    self.maxEntitiesPerPassport = initializationData.maxEntitiesPerPassport;
  }

  /// @notice Sets the X2EarnApps contract address
  /// @dev The X2EarnApps contract address can be modified by the CONTRACTS_ADDRESS_MANAGER_ROLE
  /// @param _x2EarnApps - the X2EarnApps contract address
  function setX2EarnApps(IX2EarnApps _x2EarnApps) public {
    PassportStorageTypesV5.PassportStorage storage self = PassportStorageTypesV5.getPassportStorage();
    require(address(_x2EarnApps) != address(0), "VeBetterPassportV5: x2EarnApps is the zero address");

    self.x2EarnApps = _x2EarnApps;
  }

  /// @dev Sets the xAllocationVoting contract
  /// @param _xAllocationVoting - the xAllocationVoting contract address
  function setXAllocationVoting(
    IXAllocationVotingGovernor _xAllocationVoting
  ) public {
    PassportStorageTypesV5.PassportStorage storage self = PassportStorageTypesV5.getPassportStorage();
    require(address(_xAllocationVoting) != address(0), "VeBetterPassportV5: xAllocationVoting is the zero address");

    self.xAllocationVoting = _xAllocationVoting;
  }

  /// @notice Sets the galaxy member contract address
  /// @param _galaxyMember - the galaxy member contract address
  function setGalaxyMember(IGalaxyMember _galaxyMember) public {
    PassportStorageTypesV5.PassportStorage storage self = PassportStorageTypesV5.getPassportStorage();
    require(address(_galaxyMember) != address(0), "VeBetterPassportV5: galaxyMember is the zero address");

    self.galaxyMember = _galaxyMember;
  }
}
