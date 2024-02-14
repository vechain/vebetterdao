// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IXApps {
  /**
   * @dev The clock was incorrectly modified.
   */
  error ERC6372InconsistentClock();

  /**
   * @dev Lookup to future votes is not available.
   */
  error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

  event AppAdded(bytes32 indexed id, address addr, string name, string metadata, bool appAvailableForAllocationVoting);

  event VotingElegibilityChanged(bytes32 indexed appId, bool isAvailable);

  function hashName(string memory name) external pure returns (bytes32);
}
