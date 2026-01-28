// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IEmissions } from "../../interfaces/IEmissions.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { IVeBetterPassport } from "../../interfaces/IVeBetterPassport.sol";
import { IB3TRGovernor } from "../../interfaces/IB3TRGovernor.sol";
import { IRelayerRewardsPool } from "../../interfaces/IRelayerRewardsPool.sol";
import { INavigator } from "../../interfaces/INavigator.sol";

/**
 * @title ExternalContractsUpgradeable
 * @dev Extension of {XAllocationVotingGovernor} that handles the storage of external contracts for the XAllocationVotingGovernor.
 */
abstract contract ExternalContractsUpgradeable is Initializable, XAllocationVotingGovernor {
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.ExternalContracts
  struct ExternalContractsStorage {
    IX2EarnApps _x2EarnApps;
    IEmissions _emissions;
    IVoterRewards _voterRewards;
    IVeBetterPassport _veBetterPassport;
    IB3TRGovernor _b3trGovernor;
    IRelayerRewardsPool _relayerRewardsPool;
    // --------------------------- V9 Additions --------------------------- //
    INavigator _navigator;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.ExternalContracts")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant ExternalContractsStorageLocation =
    0x1da8cbbb2b12987a437595605432a6bbe84c08e9685afaaee593f05659f50d00;

  function _getExternalContractsStorage() internal pure returns (ExternalContractsStorage storage $) {
    assembly {
      $.slot := ExternalContractsStorageLocation
    }
  }


  /**
   * @dev Initializes the contract
   * @param initialX2EarnApps The initial X2EarnApps contract address
   * @param initialEmissions The initial Emissions contract address
   * @param initialVoterRewards The initial VoterRewards contract address
   */
  function __ExternalContracts_init(
    IX2EarnApps initialX2EarnApps,
    IEmissions initialEmissions,
    IVoterRewards initialVoterRewards
  ) internal onlyInitializing {
    __ExternalContracts_init_unchained(initialX2EarnApps, initialEmissions, initialVoterRewards);
  }

  function __ExternalContracts_init_unchained(
    IX2EarnApps initialX2EarnApps,
    IEmissions initialEmissions,
    IVoterRewards initialVoterRewards
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
  function x2EarnApps() public view virtual override returns (IX2EarnApps) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._x2EarnApps;
  }

  /**
   * @dev The emissions contract.
   */
  function emissions() public view override returns (IEmissions) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._emissions;
  }

  /**
   * @dev Get the voter rewards contract
   */
  function voterRewards() public view override returns (IVoterRewards) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._voterRewards;
  }

  function veBetterPassport() public view override returns (IVeBetterPassport) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._veBetterPassport;
  }

  /**
   * @dev Get the B3TRGovernor contract
   */
  function b3trGovernor() public view override returns (IB3TRGovernor) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._b3trGovernor;
  }

  /**
   * @dev Get the RelayerRewardsPool contract
   */
  function relayerRewardsPool() public view override returns (IRelayerRewardsPool) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._relayerRewardsPool;
  }

  function navigator() public view virtual override returns (INavigator) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._navigator;
  }
}
