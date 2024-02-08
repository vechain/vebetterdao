// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (governance/extensions/GovernorVotes.sol)

pragma solidity ^0.8.0;

import "../XAllocationVotingGovernor.sol";
import "@openzeppelin/contracts/interfaces/IERC5805.sol";

/**
 * @dev Extension of {XAllocationVotingGovernor} for voting weight extraction from an {ERC20Votes} token, or since v4.5 an {ERC721Votes} token.
 * Forked from OpenZeppelin's GovernorVotes.sol.
 *
 * _Available since v4.3._
 */
abstract contract GovernorVotes is XAllocationVotingGovernor {
  IERC5805 private immutable _token;

  constructor(IVotes tokenAddress) {
    _token = IERC5805(address(tokenAddress));
  }

  /**
   * @dev The token that voting power is sourced from.
   */
  function token() public view virtual returns (IERC5805) {
    return _token;
  }

  /**
   * @dev Clock (as specified in EIP-6372) is set to match the token's clock. Fallback to block numbers if the token
   * does not implement EIP-6372.
   */
  function clock() public view virtual override returns (uint48) {
    try token().clock() returns (uint48 timepoint) {
      return timepoint;
    } catch {
      return SafeCast.toUint48(block.number);
    }
  }

  /**
   * @dev Machine-readable description of the clock as specified in EIP-6372.
   */
  // solhint-disable-next-line func-name-mixedcase
  function CLOCK_MODE() public view virtual override returns (string memory) {
    try token().CLOCK_MODE() returns (string memory clockmode) {
      return clockmode;
    } catch {
      return "mode=blocknumber&from=default";
    }
  }

  /**
   * Read the voting weight from the token's built in snapshot mechanism (see {Governor-_getVotes}).
   */
  function _getVotes(
    address account,
    uint256 timepoint,
    bytes memory /*params*/
  ) internal view virtual override returns (uint256) {
    return token().getPastVotes(account, timepoint);
  }
}
