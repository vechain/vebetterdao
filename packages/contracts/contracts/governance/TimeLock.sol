//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TimeLock is Initializable, TimelockControllerUpgradeable, UUPSUpgradeable {
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "TimeLock: caller is not an executor");
    _;
  }

  function initialize(
    uint256 minDelay,
    address[] memory proposers,
    address[] memory executors,
    address admin
  ) public initializer {
    __TimelockController_init(minDelay, proposers, executors, admin);
  }

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyAdmin {}
}
