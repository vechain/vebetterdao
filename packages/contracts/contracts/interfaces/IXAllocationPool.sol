// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IXAllocationPool {
  /**
   * @dev The clock was incorrectly modified.
   */
  error ERC6372InconsistentClock();

  /**
   * @dev Lookup to future votes is not available.
   */
  error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

  event AppAdded(bytes32 indexed id, address addr, string name, string metadata, bool appAvailableForAllocationVoting);

  event AppAvailabilityForAllocationVotingChanged(bytes32 indexed appId, bool isAvailable);

  /**
   * @dev Returns true if the app is available for allocation voting in the latest checkpoint.
   */
  function canBeVotedFor(bytes32 appId) external view returns (bool);

  /**
   * @dev Returns true if the app is available for allocation voting in a specific block number.
   */
  function couldBeVotedFor(bytes32 appId, uint256 timepoint) external view returns (bool);

  function addApp(
    address appAddress,
    string memory name,
    string memory metadata,
    bool availableForAllocationVoting
  ) external;
}
