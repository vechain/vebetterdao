// SPDX-License-Identifier: MIT

//                                      #######
//                                 ################
//                               ####################
//                             ###########   #########
//                            #########      #########
//          #######          #########       #########
//          #########       #########      ##########
//           ##########     ########     ####################
//            ##########   #########  #########################
//              ################### ############################
//               #################  ##########          ########
//                 ##############      ###              ########
//                  ############                       #########
//                    ##########                     ##########
//                     ########                    ###########
//                       ###                    ############
//                                          ##############
//                                    #################
//                                   ##############
//                                   #########

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import "@openzeppelin/contracts/interfaces/IERC6372.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import "@openzeppelin/contracts/interfaces/IERC6372.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title B3TR Token Contract
/// @dev Extends ERC20 Token Standard with capping, pausing, and access control functionalities to manage B3TR tokens in the VeBetter ecosystem.
/// @notice This contract governs the issuance and management of B3TR fungible tokens within the VeBetter ecosystem, allowing for minting under a capped total supply.
contract B3TR is ERC20Capped, ERC20Pausable, IERC6372, AccessControl {
  using Checkpoints for Checkpoints.Trace208;

  /// @notice Role identifier for addresses allowed to mint new tokens
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  /// @notice Checkpoints for tracking total B3TR supply
  Checkpoints.Trace208 private _totalCheckpoints;

  /// @dev The clock was incorrectly modified
  error ERC6372InconsistentClock();

  ///@dev Lookup to future votes is not available.
  error FutureLookup(uint256 timepoint, uint48 clock);

  /// @dev Initializes the contract with specified cap, token details, and admin roles
  /// @param _admin The address that will be granted the default admin role
  /// @param _defaultMinter The address that will be granted the minter role initially
  /// @param _cap The maximum amount of tokens that can be minted (expressed in token units)
  constructor(address _admin, address _defaultMinter, uint256 _cap) ERC20("B3TR", "B3TR") ERC20Capped(_cap * 1e18) {
    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(MINTER_ROLE, _defaultMinter);
  }

  /// @notice Pauses all token transfers and minting actions
  /// @dev Accessible only by accounts with the default admin role
  function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  /// @notice Resumes all token transfers and minting actions
  /// @dev Accessible only by accounts with the default admin role
  function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  /// @notice Mints new tokens to a specified address
  /// @dev The caller must have the MINTER_ROLE, and the total token supply after minting must not exceed the cap
  /// @param to The address that will receive the minted tokens
  /// @param amount The amount of tokens to be minted
  function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
    _mint(to, amount);
  }

  /// @notice Retrieves token details in a single call
  /// @return name The name of the token
  /// @return symbol The symbol of the token
  /// @return decimals The number of decimals the token uses
  /// @return totalSupply The total supply of the tokens
  /// @return cap The cap on the token's total supply
  function tokenDetails() external view returns (string memory, string memory, uint8, uint256, uint256) {
    return (name(), symbol(), decimals(), totalSupply(), cap());
  }

  /// @dev Returns the clock used for flagging checkpoints, which can be overridden to implement timestamp based checkpoints
  function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  /// @dev Provides a machine-readable description of the clock as specified in EIP-6372
  function CLOCK_MODE() public view virtual returns (string memory) {
    if (clock() != Time.blockNumber()) {
      revert ERC6372InconsistentClock();
    }
    return "mode=blocknumber&from=default";
  }

  /// @notice Returns the total supply of B3TR available at a specific moment in the past
  /// @dev This function requires that the specified timepoint must be in the past
  /// @param timepoint The specific past time at which to look up the total supply
  /// @return The total supply at the specified past timepoint
  function getPastTotalSupply(uint256 timepoint) external view virtual returns (uint256) {
    uint48 currentTimepoint = clock();
    if (timepoint >= currentTimepoint) {
      revert FutureLookup(timepoint, currentTimepoint);
    }
    return _totalCheckpoints.upperLookupRecent(SafeCast.toUint48(timepoint));
  }

  /// @dev Returns the current total supply of b3tr, reflecting the latest state in the checkpoints
  function getCurrentTotalSupply() external view virtual returns (uint256) {
    return _totalCheckpoints.latest();
  }

  /// @dev Internal function to update checkpoints by applying a given operation
  /// @param store The storage location of the checkpoints data
  /// @param op The operation (function) to apply, which should take two uint208 arguments and return a uint208 result
  /// @param delta The value to be combined with the current latest value in the store by the operation
  /// @return Returns the updated value as a result of applying the operation
  function _push(
    Checkpoints.Trace208 storage store,
    function(uint208, uint208) view returns (uint208) op,
    uint208 delta
  ) private returns (uint208, uint208) {
    return store.push(clock(), op(store.latest(), delta));
  }

  /// @dev Adds two uint208 numbers and returns the result
  /// @param a The first number to add
  /// @param b The second number to add
  /// @return The sum of a and b
  function _add(uint208 a, uint208 b) private pure returns (uint208) {
    return a + b;
  }

  /// @dev Subtracts one uint208 number from another and returns the result
  /// @param a The number from which to subtract
  /// @param b The number to subtract from a
  /// @return The difference of a and b
  function _subtract(uint208 a, uint208 b) private pure returns (uint208) {
    return a - b;
  }

  /// @dev Internal function to update checkpoint during token transfers and burns
  /// @param from The address from which tokens are being transferred or burned
  /// @param to The address to which tokens are being transferred
  /// @param value The amount of tokens being transferred or burned
  /// @notice This function overrides ERC20Capped and ERC20Pausable to ensure proper hook chaining
  function _update(address from, address to, uint256 value) internal override(ERC20Capped, ERC20Pausable) {
    if (from == address(0)) {
      _push(_totalCheckpoints, _add, SafeCast.toUint208(value));
    }
    if (to == address(0)) {
      _push(_totalCheckpoints, _subtract, SafeCast.toUint208(value));
    }
    super._update(from, to, value);
  }
}
