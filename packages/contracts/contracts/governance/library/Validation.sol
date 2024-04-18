// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Validation {
  /*
   * @dev Check if the proposer is authorized to submit a proposal with the given description.
   *
   * If the proposal description ends with `#proposer=0x???`, where `0x???` is an address written as a hex string
   * (case insensitive), then the submission of this proposal will only be authorized to said address.
   *
   * This is used for frontrunning protection. By adding this pattern at the end of their proposal, one can ensure
   * that no other address can submit the same proposal. An attacker would have to either remove or change that part,
   * which would result in a different proposal id.
   *
   * If the description does not match this pattern, it is unrestricted and anyone can submit it. This includes:
   * - If the `0x???` part is not a valid hex string.
   * - If the `0x???` part is a valid hex string, but does not contain exactly 40 hex digits.
   * - If it ends with the expected suffix followed by newlines or other whitespace.
   * - If it ends with some other similar suffix, e.g. `#other=abc`.
   * - If it does not end with any such suffix.
   */
  function _isValidDescriptionForProposer(address proposer, string memory description) public pure returns (bool) {
    uint256 len = bytes(description).length;

    // Length is too short to contain a valid proposer suffix
    if (len < 52) {
      return true;
    }

    // Extract what would be the `#proposer=0x` marker beginning the suffix
    bytes12 marker;
    assembly {
      // - Start of the string contents in memory = description + 32
      // - First character of the marker = len - 52
      //   - Length of "#proposer=0x0000000000000000000000000000000000000000" = 52
      // - We read the memory word starting at the first character of the marker:
      //   - (description + 32) + (len - 52) = description + (len - 20)
      // - Note: Solidity will ignore anything past the first 12 bytes
      marker := mload(add(description, sub(len, 20)))
    }

    // If the marker is not found, there is no proposer suffix to check
    if (marker != bytes12("#proposer=0x")) {
      return true;
    }

    // Parse the 40 characters following the marker as uint160
    uint160 recovered = 0;
    for (uint256 i = len - 40; i < len; ++i) {
      (bool isHex, uint8 value) = _tryHexToUint(bytes(description)[i]);
      // If any of the characters is not a hex digit, ignore the suffix entirely
      if (!isHex) {
        return true;
      }
      recovered = (recovered << 4) | value;
    }

    return recovered == uint160(proposer);
  }

  /**
   * @dev Try to parse a character from a string as a hex value. Returns `(true, value)` if the char is in
   * `[0-9a-fA-F]` and `(false, 0)` otherwise. Value is guaranteed to be in the range `0 <= value < 16`
   */
  function _tryHexToUint(bytes1 char) public pure returns (bool, uint8) {
    uint8 c = uint8(char);
    unchecked {
      // Case 0-9
      if (47 < c && c < 58) {
        return (true, c - 48);
      }
      // Case A-F
      else if (64 < c && c < 71) {
        return (true, c - 55);
      }
      // Case a-f
      else if (96 < c && c < 103) {
        return (true, c - 87);
      }
      // Else: not a hex char
      else {
        return (false, 0);
      }
    }
  }

  /**
   * @dev See {IGovernor-hashProposal}.
   *
   * The proposal id is produced by hashing the ABI encoded `targets` array, the `values` array, the `calldatas` array
   * and the descriptionHash (bytes32 which itself is the keccak256 hash of the description string). This proposal id
   * can be produced from the proposal data which is part of the {ProposalCreated} event. It can even be computed in
   * advance, before the proposal is submitted.
   *
   * Note that the chainId and the governor address are not part of the proposal id computation. Consequently, the
   * same proposal (with same operation and same description) will have the same id if submitted on multiple governors
   * across multiple networks. This also means that in order to execute the same operation twice (on the same
   * governor) the proposer will have to change the description in order to avoid proposal id conflicts.
   */
  function hashProposal(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public pure returns (uint256) {
    return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
  }
}
