// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IEmissions } from "../../interfaces/IEmissions.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IB3TRGovernor } from "../../interfaces/IB3TRGovernor.sol";

abstract contract ExternalContractsUpgradeable is Initializable, XAllocationVotingGovernor {
  event EmissionContractSet(address oldContractAddress, address newContractAddress);

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
   */
  function __ExternalContracts_init(
    address initialB3TRGovernor,
    IX2EarnApps initialX2EarnApps,
    IEmissions initialEmissions
  ) internal onlyInitializing {
    __ExternalContracts_init_unchained(initialB3TRGovernor, initialX2EarnApps, initialEmissions);
  }

  function __ExternalContracts_init_unchained(
    address initialB3TRGovernor,
    IX2EarnApps initialX2EarnApps,
    IEmissions initialEmissions
  ) internal onlyInitializing {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    $._b3trGovernor = IB3TRGovernor(payable(initialB3TRGovernor));
    $._x2EarnApps = initialX2EarnApps;
    $._emissions = initialEmissions;
  }

  function b3trGovernor() public view override returns (IB3TRGovernor) {
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    return $._b3trGovernor;
  }

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

  function setEmissions(address newEmisionsAddress) public virtual onlyGovernance {
    _setEmissions(newEmisionsAddress);
  }

  /**
   * @dev Sets the emissions contract.
   */
  function _setEmissions(address newEmisionsAddress) internal virtual {
    require(newEmisionsAddress != address(0), "GovernorSettings: emissions is the zero address");
    ExternalContractsStorage storage $ = _getExternalContractsStorage();
    $._emissions = IEmissions(newEmisionsAddress);

    emit EmissionContractSet(address($._emissions), newEmisionsAddress);
  }

  function setB3trGovernanceAddress(address b3trGovernor_) public virtual {
    require(b3trGovernor_ != address(0), "XAllocationVoting: new B3trGovernor is the zero address");

    ExternalContractsStorage storage $ = _getExternalContractsStorage();

    $._b3trGovernor = IB3TRGovernor(payable(b3trGovernor_));
  }
}
