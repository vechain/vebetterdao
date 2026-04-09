// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import { IERC5805 } from "@openzeppelin/contracts/interfaces/IERC5805.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";
import { INavigatorRegistry } from "../../interfaces/INavigatorRegistry.sol";
import { IB3TRGovernor } from "../../interfaces/IB3TRGovernor.sol";

/**
 * @title VotesUtils
 * @notice Library for managing the voting token and extracting voting weight in the XAllocationVoting system.
 * @dev Extracted from VotesUpgradeable module. Uses ERC-7201 namespaced storage.
 */
library VotesUtils {
  /**
   * @notice Initializes the voting token
   * @param tokenAddress The ERC20Votes / ERC721Votes token used for voting power
   */
  function initialize(IVotes tokenAddress) external {
    XAllocationVotingStorageTypes.VotesStorage storage $ = XAllocationVotingStorageTypes._getVotesStorage();
    $._token = IERC5805(address(tokenAddress));
  }

  /**
   */

  /**
   * @notice Clock as specified in EIP-6372, matched to the token's clock.
   * @dev Falls back to block number if the token does not implement EIP-6372.
   * @return The current timepoint
   */
  function clock() external view returns (uint48) {
    XAllocationVotingStorageTypes.VotesStorage storage $ = XAllocationVotingStorageTypes._getVotesStorage();
    try $._token.clock() returns (uint48 timepoint) {
      return timepoint;
    } catch {
      return Time.blockNumber();
    }
  }

  /**
   * @notice Machine-readable description of the clock as specified in EIP-6372.
   * @dev Falls back to default block number mode if the token does not implement EIP-6372.
   * @return The clock mode string
   */
  // solhint-disable-next-line func-name-mixedcase
  function CLOCK_MODE() external view returns (string memory) {
    XAllocationVotingStorageTypes.VotesStorage storage $ = XAllocationVotingStorageTypes._getVotesStorage();
    try $._token.CLOCK_MODE() returns (string memory clockmode) {
      return clockmode;
    } catch {
      return "mode=blocknumber&from=default";
    }
  }

  /**
   * @notice Returns the effective voting power of an account at a given timepoint.
   * @dev For non-delegated users: VOT3 balance + deposit voting power (proposal support).
   *      For navigator-delegated citizens: delegated amount only (deposits excluded
   *      because the navigator votes with only the delegated amount).
   * @param account The address to get votes for
   * @param timepoint The timepoint (block number / timestamp) to query
   * @return The effective voting power at the given timepoint
   */
  function getVotes(address account, uint256 timepoint) external view returns (uint256) {
    XAllocationVotingStorageTypes.VotesStorage storage vs = XAllocationVotingStorageTypes._getVotesStorage();
    XAllocationVotingStorageTypes.ExternalContractsStorage storage ext = XAllocationVotingStorageTypes
      ._getExternalContractsStorage();

    uint256 totalVotes = vs._token.getPastVotes(account, timepoint);

    INavigatorRegistry navRegistry = ext._navigatorRegistry;
    if (address(navRegistry) != address(0) && navRegistry.getNavigatorAtTimepoint(account, timepoint) != address(0)) {
      return navRegistry.getDelegatedAmountAtTimepoint(account, timepoint);
    }

    // Non-delegated: include deposit voting power (VOT3 locked in proposal support)
    IB3TRGovernor b3trGovernor = ext._b3trGovernor;
    if (address(b3trGovernor) != address(0)) {
      totalVotes += b3trGovernor.getDepositVotingPower(account, timepoint);
    }

    return totalVotes;
  }
}
