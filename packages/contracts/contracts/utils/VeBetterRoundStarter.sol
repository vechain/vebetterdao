// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "../interfaces/IXAllocationPool.sol";
import "../interfaces/IXAllocationVotingGovernor.sol";
import "../interfaces/IX2EarnApps.sol";
import "../interfaces/IEmissions.sol";

/**
 * @title VeBetterRoundStarter
 * @dev A contract to identify X-Apps that have not yet claimed their allocations for the current round.
 * This contract provides utility functions to check which X-Apps are eligible for allocations but haven't claimed them yet.
 * This contract is upgradeable using the UUPS proxy pattern.
 */
contract VeBetterRoundStarter is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuard {
  // Contract addresses
  IXAllocationPool public xAllocationPool;
  IXAllocationVotingGovernor public xAllocationVoting;
  IX2EarnApps public x2EarnApps;
  IEmissions public emissions;

  /**
   * @dev Event emitted when allocations are claimed for multiple app IDs in a batch.
   * @param roundId The round ID for which allocations were claimed
   * @param appIds Array of app IDs for which allocations were claimed
   * @param caller The address that triggered this operation
   */
  event BatchAllocationsClaimed(uint256 indexed roundId, bytes32[] appIds, address indexed caller);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Initializer function to replace the constructor for upgradeable contracts.
   * @param _xAllocationPoolAddress Address of the XAllocationPool contract
   * @param _xAllocationVotingAddress Address of the XAllocationVoting contract
   * @param _x2EarnAppsAddress Address of the X2EarnApps contract
   * @param _emissionsAddress Address of the Emissions contract
   */
  function initialize(
    address _xAllocationPoolAddress,
    address _xAllocationVotingAddress,
    address _x2EarnAppsAddress,
    address _emissionsAddress
  ) public initializer {
    __Ownable_init(msg.sender);
    __UUPSUpgradeable_init();

    xAllocationPool = IXAllocationPool(_xAllocationPoolAddress);
    xAllocationVoting = IXAllocationVotingGovernor(_xAllocationVotingAddress);
    x2EarnApps = IX2EarnApps(_x2EarnAppsAddress);
    emissions = IEmissions(_emissionsAddress);
  }

  /**
   * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
   * Called by {upgradeTo} and {upgradeToAndCall}.
   */
  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  /**
   * @dev Get the current round ID from the Emissions contract.
   * @return The current round ID
   */
  function getCurrentRoundId() public view returns (uint256) {
    return emissions.getCurrentCycle();
  }

  /**
   * @dev Get the previous round ID (current round - 1).
   * @return The previous round ID
   */
  function getPreviousRoundId() public view returns (uint256) {
    uint256 currentRound = getCurrentRoundId();
    return currentRound > 0 ? currentRound - 1 : 0;
  }

  /**
   * @dev Get all X-Apps for a specific round.
   * @param roundId The round ID to get X-Apps for
   * @return An array of X-App IDs for the specified round
   */
  function getAllXAppsForRound(uint256 roundId) public view returns (bytes32[] memory) {
    // Get eligible apps from the XAllocationVoting contract
    bytes32[] memory eligibleApps = xAllocationVoting.getAppIdsOfRound(roundId);

    // Get unendorsed apps from the X2EarnApps contract
    bytes32[] memory unendorsedApps = x2EarnApps.unendorsedAppIds();

    // Combine eligible and unendorsed apps (removing duplicates)
    return _combineArraysWithoutDuplicates(eligibleApps, unendorsedApps);
  }

  /**
   * @dev Get X-Apps that haven't claimed their allocations for a specific round.
   * @param roundId The round ID to check for unclaimed allocations
   * @return An array of X-App IDs that haven't claimed their allocations
   */
  function getUnclaimedXAppsForRound(uint256 roundId) public view returns (bytes32[] memory) {
    bytes32[] memory allApps = getAllXAppsForRound(roundId);
    uint256 unclaimedCount = 0;

    // First, count how many apps haven't claimed
    for (uint256 i = 0; i < allApps.length; i++) {
      if (!xAllocationPool.claimed(roundId, allApps[i])) {
        unclaimedCount++;
      }
    }

    // Create array of unclaimed app IDs
    bytes32[] memory unclaimedApps = new bytes32[](unclaimedCount);
    uint256 index = 0;

    for (uint256 i = 0; i < allApps.length; i++) {
      if (!xAllocationPool.claimed(roundId, allApps[i])) {
        unclaimedApps[index] = allApps[i];
        index++;
      }
    }

    return unclaimedApps;
  }

  /**
   * @dev Get X-Apps that haven't claimed their allocations for the previous round.
   * @return An array of X-App IDs that haven't claimed their allocations for the previous round
   */
  function getUnclaimedXAppsForPreviousRound() public view returns (bytes32[] memory) {
    return getUnclaimedXAppsForRound(getPreviousRoundId());
  }

  /**
   * @dev Check if a specific X-App has claimed its allocation for a specific round.
   * @param roundId The round ID to check
   * @param appId The X-App ID to check
   * @return True if the X-App has claimed its allocation, false otherwise
   */
  function hasXAppClaimed(uint256 roundId, bytes32 appId) public view returns (bool) {
    return xAllocationPool.claimed(roundId, appId);
  }

  /**
   * @dev Get detailed information about unclaimed X-Apps for a specific round.
   * @param roundId The round ID to check for unclaimed allocations
   * @return appIds Array of X-App IDs that haven't claimed their allocations
   * @return claimableAmounts Array of claimable amounts for each unclaimed X-App
   */
  function getUnclaimedXAppsWithAmounts(
    uint256 roundId
  ) public view returns (bytes32[] memory appIds, uint256[] memory claimableAmounts) {
    bytes32[] memory unclaimedApps = getUnclaimedXAppsForRound(roundId);
    uint256[] memory amounts = new uint256[](unclaimedApps.length);

    for (uint256 i = 0; i < unclaimedApps.length; i++) {
      (uint256 totalAmount, , , ) = xAllocationPool.claimableAmount(roundId, unclaimedApps[i]);
      amounts[i] = totalAmount;
    }

    return (unclaimedApps, amounts);
  }

  /**
   * @dev Get detailed information about unclaimed X-Apps for the previous round.
   * @return appIds Array of X-App IDs that haven't claimed their allocations
   * @return claimableAmounts Array of claimable amounts for each unclaimed X-App
   */
  function getUnclaimedXAppsWithAmountsForPreviousRound()
    public
    view
    returns (bytes32[] memory appIds, uint256[] memory claimableAmounts)
  {
    return getUnclaimedXAppsWithAmounts(getPreviousRoundId());
  }

  /**
   * @dev Get X-Apps that haven't claimed their allocations for a specific round and have non-zero claimable amounts.
   * @param roundId The round ID to check for unclaimed allocations
   * @return An array of X-App IDs that haven't claimed their allocations and have non-zero amounts
   *
   * @dev This is useful and will most likely be used the most when claimining allocation after the round ended.
   */
  function getUnclaimedXAppsWithNonZeroAmounts(uint256 roundId) public view returns (bytes32[] memory) {
    bytes32[] memory unclaimedApps = getUnclaimedXAppsForRound(roundId);

    // First count how many apps have non-zero amounts
    uint256 nonZeroCount = 0;
    for (uint256 i = 0; i < unclaimedApps.length; i++) {
      (uint256 totalAmount, , , ) = xAllocationPool.claimableAmount(roundId, unclaimedApps[i]);
      if (totalAmount > 0) {
        nonZeroCount++;
      }
    }

    // Create array of app IDs with non-zero amounts
    bytes32[] memory nonZeroApps = new bytes32[](nonZeroCount);
    uint256 index = 0;

    for (uint256 i = 0; i < unclaimedApps.length; i++) {
      (uint256 totalAmount, , , ) = xAllocationPool.claimableAmount(roundId, unclaimedApps[i]);
      if (totalAmount > 0) {
        nonZeroApps[index] = unclaimedApps[i];
        index++;
      }
    }

    return nonZeroApps;
  }

  /**
   * @dev Get X-Apps that haven't claimed their allocations for the previous round and have non-zero claimable amounts.
   * @return An array of X-App IDs that haven't claimed their allocations for the previous round and have non-zero amounts
   */
  function getUnclaimedXAppsWithNonZeroAmountsForPreviousRound() public view returns (bytes32[] memory) {
    return getUnclaimedXAppsWithNonZeroAmounts(getPreviousRoundId());
  }

  /**
   * @dev Claims allocations for all unclaimed X-Apps with non-zero amounts for a specific round.
   * @param roundId The round ID to claim allocations for
   * @return claimedAppIds Array of X-App IDs for which allocations were claimed
   */
  function claimAllocationsForRound(uint256 roundId) public nonReentrant returns (bytes32[] memory claimedAppIds) {
    bytes32[] memory appsWithNonZeroAmounts = getUnclaimedXAppsWithNonZeroAmounts(roundId);

    for (uint256 i = 0; i < appsWithNonZeroAmounts.length; i++) {
      try xAllocationPool.claim(roundId, appsWithNonZeroAmounts[i]) {
        // Claim successful, do nothing
      } catch {
        // Claim failed
        revert("Claim failed");
      }
    }

    emit BatchAllocationsClaimed(roundId, appsWithNonZeroAmounts, msg.sender);
    return appsWithNonZeroAmounts;
  }

  /**
   * @dev Claims allocations for all unclaimed X-Apps with non-zero amounts for the previous round.
   */
  function claimAllocationsForPreviousRound() public nonReentrant {
    uint256 prevRoundId = getPreviousRoundId();
    require(prevRoundId > 0, "No previous round exists");
    claimAllocationsForRound(prevRoundId);
  }

  /**
   * @dev Starts a new round and distributes allocations for the previous round.
   */
  function startNewRoundAndDistributeAllocations() public {
    // Start a new round
    emissions.distribute();
  }

  /**
   * @dev Internal helper function to combine two arrays without duplicates.
   * @param array1 First array to combine
   * @param array2 Second array to combine
   * @return Combined array without duplicates
   */
  function _combineArraysWithoutDuplicates(
    bytes32[] memory array1,
    bytes32[] memory array2
  ) internal pure returns (bytes32[] memory) {
    // Create a temporary array to store unique values
    bytes32[] memory temp = new bytes32[](array1.length + array2.length);
    uint256 count = 0;

    // Add all elements from array1
    for (uint256 i = 0; i < array1.length; i++) {
      temp[count] = array1[i];
      count++;
    }

    // Add elements from array2 if they're not already in the combined array
    for (uint256 i = 0; i < array2.length; i++) {
      bool isDuplicate = false;

      // Check if the element exists in array1 (more efficient than checking temp)
      for (uint256 j = 0; j < array1.length; j++) {
        if (array2[i] == array1[j]) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        temp[count] = array2[i];
        count++;
      }
    }

    // Create the final array with the correct size
    bytes32[] memory result = new bytes32[](count);
    for (uint256 i = 0; i < count; i++) {
      result[i] = temp[i];
    }

    return result;
  }
}
