// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IEmissions } from "../../interfaces/IEmissions.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IB3TRGovernor } from "../../interfaces/IB3TRGovernor.sol";

/**
 * @title ExternalContractsUpgradeable
 * @dev Contract module that handles the storage of external contracts for the XAllocationVotingGovernor.
 */
abstract contract ExternalContractsUpgradeable is Initializable, XAllocationVotingGovernor {
  event EmissionsSet(address oldContractAddress, address newContractAddress);
  event B3trGovernanceSet(address oldContractAddress, address newContractAddress);
  event X2EarnAppsSet(address oldContractAddress, address newContractAddress);

  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.ExternalContracts
  struct ExternalContractsStorage {
    IB3TRGovernor _b3trGovernor;
    IX2EarnApps _x2EarnApps;
    IEmissions _emissions;
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
   * @param initialB3TRGovernor The initial B3TRGovernor contract address
   * @param initialX2EarnApps The initial X2EarnApps contract address
   * @param initialEmissions The initial Emissions contract address
   */
  function __ExternalContracts_init(
    IB3TRGovernor initialB3TRGovernor,
    IX2EarnApps initialX2EarnApps,
    IEmissions initialEmissions
  ) internal onlyInitializing {
    __ExternalContracts_init_unchained(initialB3TRGovernor, initialX2EarnApps, initialEmissions);
  }

  function __ExternalContracts_init_unchained(
    IB3TRGovernor initialB3TRGovernor,
    IX2EarnApps initialX2EarnApps,
    IEmissions initialEmissions
  ) internal onlyInitializing {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    $._b3trGovernor = initialB3TRGovernor;
    $._x2EarnApps = initialX2EarnApps;
    $._emissions = initialEmissions;
  }

  // ------- Getters ------- //

  /**
   * @dev The B3TRGovernor contract.
   */
  function b3trGovernor() public view override returns (IB3TRGovernor) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._b3trGovernor;
  }

  /**
   * @dev The X2EarnApps contract.
   */
  function x2EarnApps() public view override returns (IX2EarnApps) {
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

  // ------- Internal Functions ------- //

  /**
   * @dev Sets the emissions contract.
   *
   * Emits a {EmissionContractSet} event
   */
  function _setEmissions(IEmissions newEmisionsAddress) internal virtual {
    require(address(newEmisionsAddress) != address(0), "GovernorSettings: emissions is the zero address");
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    $._emissions = IEmissions(newEmisionsAddress);

    emit EmissionsSet(address($._emissions), address(newEmisionsAddress));
  }

  /**
   * @dev Sets the B3TRGovernor contract
   * @param newB3trGovernance The new B3TRGovernor contract address
   *
   * Emits a {B3trGovernanceSet} event
   */
  function _setB3trGovernor(IB3TRGovernor newB3trGovernance) internal virtual {
    require(address(newB3trGovernance) != address(0), "XAllocationVoting: new B3trGovernor is the zero address");

    ExternalContractsStorage storage $ = _getExternalContractsStorage();

    $._b3trGovernor = newB3trGovernance;

    emit B3trGovernanceSet(address($._b3trGovernor), address(newB3trGovernance));
  }

  /**
   * @dev Sets the X2EarnApps contract
   * @param newX2EarnApps The new X2EarnApps contract address
   *
   * Emits a {X2EarnAppsSet} event
   */
  function _setX2EarnApps(IX2EarnApps newX2EarnApps) internal virtual {
    require(address(newX2EarnApps) != address(0), "XAllocationVoting: new X2EarnApps is the zero address");

    ExternalContractsStorage storage $ = _getExternalContractsStorage();

    $._x2EarnApps = newX2EarnApps;

    emit X2EarnAppsSet(address($._x2EarnApps), address(newX2EarnApps));
  }
}
