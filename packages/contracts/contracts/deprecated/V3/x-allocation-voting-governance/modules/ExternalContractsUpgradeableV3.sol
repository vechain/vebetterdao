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

import { XAllocationVotingGovernorV3 } from "../XAllocationVotingGovernorV3.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IEmissionsV3 } from "../../interfaces/IEmissionsV3.sol";
import { IX2EarnAppsV3 } from "../../interfaces/IX2EarnAppsV3.sol";
import { IVoterRewardsV3 } from "../../interfaces/IVoterRewardsV3.sol";

/**
 * @title ExternalContractsUpgradeableV3
 * @dev Extension of {XAllocationVotingGovernorV3} that handles the storage of external contracts for the XAllocationVotingGovernorV3.
 */
abstract contract ExternalContractsUpgradeableV3 is Initializable, XAllocationVotingGovernorV3 {
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.ExternalContracts
  struct ExternalContractsStorage {
    IX2EarnAppsV3 _x2EarnApps;
    IEmissionsV3 _emissions;
    IVoterRewardsV3 _voterRewards;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.ExternalContracts")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant ExternalContractsStorageLocation =
    0x1da8cbbb2b12987a437595605432a6bbe84c08e9685afaaee593f05659f50d00;

  function _getExternalContractsStorage() internal pure returns (ExternalContractsStorage storage $) {
    assembly {
      $.slot := ExternalContractsStorageLocation
    }
  }

  // @dev Emit when the emissions contract is set
  event EmissionsSet(address oldContractAddress, address newContractAddress);
  // @dev Emit when the X2EarnApps contract is set
  event X2EarnAppsSet(address oldContractAddress, address newContractAddress);
  // @dev Emit when the voter rewards contract is set
  event VoterRewardsSet(address oldContractAddress, address newContractAddress);

  /**
   * @dev Initializes the contract
   * @param initialX2EarnApps The initial X2EarnApps contract address
   * @param initialEmissions The initial Emissions contract address
   * @param initialVoterRewards The initial VoterRewards contract address
   */
  function __ExternalContracts_init(
    IX2EarnAppsV3 initialX2EarnApps,
    IEmissionsV3 initialEmissions,
    IVoterRewardsV3 initialVoterRewards
  ) internal onlyInitializing {
    __ExternalContracts_init_unchained(initialX2EarnApps, initialEmissions, initialVoterRewards);
  }

  function __ExternalContracts_init_unchained(
    IX2EarnAppsV3 initialX2EarnApps,
    IEmissionsV3 initialEmissions,
    IVoterRewardsV3 initialVoterRewards
  ) internal onlyInitializing {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    $._x2EarnApps = initialX2EarnApps;
    $._emissions = initialEmissions;
    $._voterRewards = initialVoterRewards;
  }

  // ------- Getters ------- //
  /**
   * @dev The X2EarnApps contract.
   */
  function x2EarnApps() public view override returns (IX2EarnAppsV3) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._x2EarnApps;
  }

  /**
   * @dev The emissions contract.
   */
  function emissions() public view override returns (IEmissionsV3) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._emissions;
  }

  /**
   * @dev Get the voter rewards contract
   */
  function voterRewards() public view override returns (IVoterRewardsV3) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._voterRewards;
  }

  // ------- Internal Functions ------- //

  /**
   * @dev Sets the emissions contract.
   *
   * Emits a {EmissionContractSet} event
   */
  function _setEmissions(IEmissionsV3 newEmisionsAddress) internal virtual {
    require(address(newEmisionsAddress) != address(0), "XAllocationVotingGovernorV3: emissions is the zero address");
    ExternalContractsStorage storage $ = _getExternalContractsStorage();

    emit EmissionsSet(address($._emissions), address(newEmisionsAddress));
    $._emissions = IEmissionsV3(newEmisionsAddress);
  }

  /**
   * @dev Sets the X2EarnApps contract
   * @param newX2EarnApps The new X2EarnApps contract address
   *
   * Emits a {X2EarnAppsSet} event
   */
  function _setX2EarnApps(IX2EarnAppsV3 newX2EarnApps) internal virtual {
    require(address(newX2EarnApps) != address(0), "XAllocationVotingGovernorV3: new X2EarnApps is the zero address");

    ExternalContractsStorage storage $ = _getExternalContractsStorage();

    emit X2EarnAppsSet(address($._x2EarnApps), address(newX2EarnApps));
    $._x2EarnApps = newX2EarnApps;
  }

  /**
   * @dev Sets the voter rewards contract
   * @param newVoterRewards The new voter rewards contract address
   */
  function _setVoterRewards(IVoterRewardsV3 newVoterRewards) internal virtual {
    require(address(newVoterRewards) != address(0), "XAllocationVotingGovernorV3: new voter rewards is the zero address");

    ExternalContractsStorage storage $ = _getExternalContractsStorage();

    emit VoterRewardsSet(address($._voterRewards), address(newVoterRewards));
    $._voterRewards = newVoterRewards;
  }
}
