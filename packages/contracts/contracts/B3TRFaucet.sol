// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title B3TRFaucet
 * @dev A faucet contract to distribute B3TR tokens with claim limits and funding capabilities.
 */
contract B3TRFaucet is Initializable, OwnableUpgradeable, UUPSUpgradeable {
  IERC20 public token;
  uint256 public amountPerClaim;
  uint256 public maxClaimsPerDay;

  struct ClaimInfo {
    uint256 claimsToday;
    uint256 lastClaimedAt;
  }

  mapping(address => ClaimInfo) public claims;

  event TokensClaimed(address indexed user, uint256 amount);
  event FaucetFunded(address indexed from, uint256 amount);

  /**
   * @dev Initializes the faucet contract.
   * @param tokenAddress The address of the B3TR token contract.
   * @param initialAmountPerClaim The initial amount of tokens to distribute per claim.
   * @param initialMaxClaimsPerDay The initial maximum number of claims allowed per day.
   * @param initialOwner The address of the initial owner of the contract.
   */
  function initialize(
    address tokenAddress,
    uint256 initialAmountPerClaim,
    uint256 initialMaxClaimsPerDay,
    address initialOwner
  ) public initializer {
    __Ownable_init(initialOwner);
    __UUPSUpgradeable_init();

    token = IERC20(tokenAddress);
    amountPerClaim = initialAmountPerClaim;
    maxClaimsPerDay = initialMaxClaimsPerDay;
  }

  /**
   * @dev Sets the amount of tokens to distribute per claim.
   * @param newAmount The new amount of tokens to distribute per claim.
   */
  function setAmountPerClaim(uint256 newAmount) external onlyOwner {
    amountPerClaim = newAmount;
  }

  /**
   * @dev Sets the maximum number of claims allowed per day.
   * @param newMaxClaims The new maximum number of claims allowed per day.
   */
  function setMaxClaimsPerDay(uint256 newMaxClaims) external onlyOwner {
    maxClaimsPerDay = newMaxClaims;
  }

  /**
   * @dev Funds the faucet with tokens.
   * @param amount The amount of tokens to fund the faucet with.
   */
  function fundFaucet(uint256 amount) external {
    require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    emit FaucetFunded(msg.sender, amount);
  }

  /**
   * @dev Allows users to claim tokens from the faucet.
   * Users can claim tokens up to the maximum daily limit.
   */
  function claimTokens() external {
    ClaimInfo storage userClaimInfo = claims[msg.sender];
    uint256 currentTime = block.timestamp;

    // Check if it's a new day for the user
    if (currentTime - userClaimInfo.lastClaimedAt >= 1 days) {
      userClaimInfo.claimsToday = 0;
      userClaimInfo.lastClaimedAt = currentTime;
    }

    require(userClaimInfo.claimsToday < maxClaimsPerDay, "Daily limit reached");
    require(token.balanceOf(address(this)) >= amountPerClaim, "Faucet empty");

    userClaimInfo.claimsToday += 1;
    require(token.transfer(msg.sender, amountPerClaim), "Transfer failed");

    emit TokensClaimed(msg.sender, amountPerClaim);
  }

  /**
   * @dev Checks if the user can claim tokens or not.
   * @param user The address of the user.
   * @return True if the user can claim tokens, otherwise false.
   */
  function canClaim(address user) external view returns (bool) {
    ClaimInfo storage userClaimInfo = claims[user];
    uint256 currentTime = block.timestamp;

    // Check if it's a new day for the user
    if (currentTime - userClaimInfo.lastClaimedAt >= 1 days) {
      return true;
    }

    if (userClaimInfo.claimsToday < maxClaimsPerDay) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @dev Returns the remaining claims for the user for the day.
   * @param user The address of the user.
   * @return The remaining claims for the user for the day.
   */
  function remainingClaimsForToday(address user) external view returns (uint256) {
    ClaimInfo storage userClaimInfo = claims[user];
    return maxClaimsPerDay - userClaimInfo.claimsToday;
  }

  /**
   * @dev Authorizes the contract upgrade. Only the owner can authorize upgrades.
   * @param newImplementation The address of the new contract implementation.
   */
  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  /**
   * @dev Returns the version of the contract.
   * @return The version of the contract.
   */
  function version() public pure virtual returns (string memory) {
    return "1";
  }
}
