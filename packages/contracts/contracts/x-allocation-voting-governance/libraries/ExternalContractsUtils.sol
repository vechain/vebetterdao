// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IEmissions } from "../../interfaces/IEmissions.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { IVeBetterPassport } from "../../interfaces/IVeBetterPassport.sol";
import { IB3TRGovernor } from "../../interfaces/IB3TRGovernor.sol";
import { IRelayerRewardsPool } from "../../interfaces/IRelayerRewardsPool.sol";
import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";

/**
 * @title ExternalContractsUtils
 * @notice Library for managing external contract references in XAllocationVoting.
 * @dev Self-fetches storage via XAllocationVotingStorageTypes. All functions are external for size reduction.
 */
library ExternalContractsUtils {
  // ------- Events ------- //

  /// @dev Emitted when the emissions contract is set
  event EmissionsSet(address oldContractAddress, address newContractAddress);
  /// @dev Emitted when the X2EarnApps contract is set
  event X2EarnAppsSet(address oldContractAddress, address newContractAddress);
  /// @dev Emitted when the voter rewards contract is set
  event VoterRewardsSet(address oldContractAddress, address newContractAddress);
  /// @dev Emitted when the VeBetterPassport contract is set
  event VeBetterPassportSet(address oldContractAddress, address newContractAddress);
  /// @dev Emitted when the B3TRGovernor contract is set
  event B3TRGovernorSet(address oldContractAddress, address newContractAddress);
  /// @dev Emitted when the RelayerRewardsPool contract is set
  event RelayerRewardsPoolSet(address oldContractAddress, address newContractAddress);

  // ------- Errors ------- //

  error InvalidContractAddress(string contractName);

  // ------- Initialization ------- //

  /**
   * @notice Initializes external contract references.
   * @param initialX2EarnApps The initial X2EarnApps contract
   * @param initialEmissions The initial Emissions contract
   * @param initialVoterRewards The initial VoterRewards contract
   */
  function initialize(
    IX2EarnApps initialX2EarnApps,
    IEmissions initialEmissions,
    IVoterRewards initialVoterRewards
  ) external {
    XAllocationVotingStorageTypes.ExternalContractsStorage storage $ = XAllocationVotingStorageTypes
      ._getExternalContractsStorage();
    $._x2EarnApps = initialX2EarnApps;
    $._emissions = initialEmissions;
    $._voterRewards = initialVoterRewards;
  }

  // ------- Getters ------- //

  // ------- Setters ------- //

  /// @notice Sets the Emissions contract
  /// @param newEmissions The new Emissions contract address
  function setEmissions(IEmissions newEmissions) external {
    if (address(newEmissions) == address(0)) revert InvalidContractAddress("emissions");

    XAllocationVotingStorageTypes.ExternalContractsStorage storage $ = XAllocationVotingStorageTypes
      ._getExternalContractsStorage();
    emit EmissionsSet(address($._emissions), address(newEmissions));
    $._emissions = newEmissions;
  }

  /// @notice Sets the X2EarnApps contract
  /// @param newX2EarnApps The new X2EarnApps contract address
  function setX2EarnApps(IX2EarnApps newX2EarnApps) external {
    if (address(newX2EarnApps) == address(0)) revert InvalidContractAddress("X2EarnApps");

    XAllocationVotingStorageTypes.ExternalContractsStorage storage $ = XAllocationVotingStorageTypes
      ._getExternalContractsStorage();
    emit X2EarnAppsSet(address($._x2EarnApps), address(newX2EarnApps));
    $._x2EarnApps = newX2EarnApps;
  }

  /// @notice Sets the VoterRewards contract
  /// @param newVoterRewards The new VoterRewards contract address
  function setVoterRewards(IVoterRewards newVoterRewards) external {
    if (address(newVoterRewards) == address(0)) revert InvalidContractAddress("voter rewards");

    XAllocationVotingStorageTypes.ExternalContractsStorage storage $ = XAllocationVotingStorageTypes
      ._getExternalContractsStorage();
    emit VoterRewardsSet(address($._voterRewards), address(newVoterRewards));
    $._voterRewards = newVoterRewards;
  }

  /// @notice Sets the VeBetterPassport contract
  /// @param newVeBetterPassport The new VeBetterPassport contract address
  function setVeBetterPassport(IVeBetterPassport newVeBetterPassport) external {
    if (address(newVeBetterPassport) == address(0)) revert InvalidContractAddress("VeBetterPassport");

    XAllocationVotingStorageTypes.ExternalContractsStorage storage $ = XAllocationVotingStorageTypes
      ._getExternalContractsStorage();
    emit VeBetterPassportSet(address($._veBetterPassport), address(newVeBetterPassport));
    $._veBetterPassport = newVeBetterPassport;
  }

  /// @notice Sets the B3TRGovernor contract
  /// @param newB3TRGovernor The new B3TRGovernor contract address
  function setB3TRGovernor(IB3TRGovernor newB3TRGovernor) external {
    if (address(newB3TRGovernor) == address(0)) revert InvalidContractAddress("B3TRGovernor");

    XAllocationVotingStorageTypes.ExternalContractsStorage storage $ = XAllocationVotingStorageTypes
      ._getExternalContractsStorage();
    emit B3TRGovernorSet(address($._b3trGovernor), address(newB3TRGovernor));
    $._b3trGovernor = newB3TRGovernor;
  }

  /// @notice Sets the RelayerRewardsPool contract
  /// @param newRelayerRewardsPool The new RelayerRewardsPool contract address
  function setRelayerRewardsPool(IRelayerRewardsPool newRelayerRewardsPool) external {
    if (address(newRelayerRewardsPool) == address(0)) revert InvalidContractAddress("RelayerRewardsPool");

    XAllocationVotingStorageTypes.ExternalContractsStorage storage $ = XAllocationVotingStorageTypes
      ._getExternalContractsStorage();
    emit RelayerRewardsPoolSet(address($._relayerRewardsPool), address(newRelayerRewardsPool));
    $._relayerRewardsPool = newRelayerRewardsPool;
  }
}
