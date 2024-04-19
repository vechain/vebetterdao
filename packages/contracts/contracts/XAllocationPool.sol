// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { IXAllocationPool } from "./interfaces/IXAllocationPool.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { ITreasury } from "./interfaces/ITreasury.sol";
import { IEmissions } from "./interfaces/IEmissions.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { IB3TR } from "./interfaces/IB3TR.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract XAllocationPool is
  Initializable,
  IXAllocationPool,
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  uint256 public constant percentagePrecisionScalingFactor = 1e4;
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  /// @custom:storage-location erc7201:b3tr.storage.XAllocationPool
  struct XAllocationPoolStorage {
    IXAllocationVotingGovernor _xAllocationVoting;
    IEmissions _emissions;
    IB3TR b3tr;
    ITreasury treasury;
    mapping(bytes32 => mapping(uint256 => bool)) claimedRewards;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationPool")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant XAllocationPoolStorageLocation =
    0xba46220259871765522240056f76631a28aa19c5092d6dd51d6b858b4ebcb300;

  function _getXAllocationPoolStorage() private pure returns (XAllocationPoolStorage storage $) {
    assembly {
      $.slot := XAllocationPoolStorageLocation
    }
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address _admin, address upgrader, address _b3trAddress, address _treasury) public initializer {
    require(_b3trAddress != address(0), "XAllocationPool: new b3tr is the zero address");
    require(_treasury != address(0), "XAllocationPool: new treasury is the zero address");

    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();

    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    $.b3tr = IB3TR(_b3trAddress);
    $.treasury = ITreasury(_treasury);

    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(UPGRADER_ROLE, upgrader);
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  // ---------- Setters ---------- //

  function setXAllocationVotingAddress(address xAllocationVoting_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(xAllocationVoting_ != address(0), "XAllocationPool: new xAllocationVoting is the zero address");

    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    $._xAllocationVoting = IXAllocationVotingGovernor(xAllocationVoting_);
  }

  function setEmissionsAddress(address emissions_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(emissions_ != address(0), "XAllocationPool: new emissions is the zero address");

    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    $._emissions = IEmissions(emissions_);
  }

  function setTreasuryAddress(address treasury_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(treasury_ != address(0), "XAllocationPool: new treasury is the zero address");

    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    $.treasury = ITreasury(treasury_);
  }

  function setB3trAddress(address b3tr_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(b3tr_ != address(0), "XAllocationPool: new b3tr is the zero address");

    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    $.b3tr = IB3TR(b3tr_);
  }

  function claim(uint256 roundId, bytes32 appId) public nonReentrant {
    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();

    require(!$.claimedRewards[appId][roundId], "XAllocationPool: rewards already claimed for this app and round");
    require(!xAllocationVoting().isActive(roundId), "XAllocationPool: round not ended yet");

    (uint256 amountToClaim, uint256 unallocatedAmount) = claimableAmount(roundId, appId);
    require(amountToClaim > 0, "XAllocationPool: no rewards available for this app");

    // update the claimedRewards mapping
    $.claimedRewards[appId][roundId] = true;

    address receiverAddress = xAllocationVoting().getAppReceiverAddress(appId);

    //check that contract has enough funds to pay the reward
    require($.b3tr.balanceOf(address(this)) >= (amountToClaim + unallocatedAmount), "Insufficient funds");

    // Transfer the rewards to the caller
    require($.b3tr.transfer(receiverAddress, amountToClaim), "Allocation transfer failed");

    // Transfer the unallocated rewards to the treasury
    if (unallocatedAmount > 0) {
      require(
        $.b3tr.transfer(address($.treasury), unallocatedAmount),
        "Transfer of unallocated rewards to treasury failed"
      );
    }

    // emit event
    emit AllocationRewardsClaimed(appId, roundId, amountToClaim, receiverAddress, msg.sender, unallocatedAmount);
  }

  // ---------- Internal and private ---------- //

  /**
   * @dev Returns the amount of $B3TR available for allocation in a given cycle.
   * Each cycle is linked to a x-allocation round and they share the same id.
   *
   * @param roundId The round ID for which to calculate the amount available for allocation.
   */
  function _emissionAmount(uint256 roundId) internal view returns (uint256) {
    require(emissions() != IEmissions(address(0)), "Emissions contract not set");

    // Amount available for this round (assuming the amount is already scaled by 1e18 for precision)
    return emissions().getXAllocationAmount(roundId);
  }

  /**
   * @dev Returns the amount of $B3TR to be distrubuted to either the app or the treasury.
   */
  function _rewardAmount(uint256 roundId, uint256 share) internal view returns (uint256) {
    uint256 total = _emissionAmount(roundId);

    uint256 variableAllocationPercentage = 100 - xAllocationVoting().getRoundBaseAllocationPercentage(roundId);
    uint256 available = (total * variableAllocationPercentage) / 100;

    uint256 rewardAmount = (available * share) / percentagePrecisionScalingFactor;
    return rewardAmount;
  }

  // ---------- Getters ---------- //

  /**
   * How much an app can claim for a given round.
   *
   * @param roundId The round ID for which to calculate the amount available for allocation.
   * @param appId The ID of the app for which to calculate the amount available for allocation.
   */
  function claimableAmount(uint256 roundId, bytes32 appId) public view returns (uint256, uint256) {
    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    if ($.claimedRewards[appId][roundId] || xAllocationVoting().isActive(roundId)) {
      return (0, 0);
    }

    return roundEarnings(roundId, appId);
  }

  /**
   * The allocations distribution from the X-Allocation Pool to X-Apps will be in two parts:
   * - `baseAllocationPercentage` of allocations will be on average distributed to each qualified X Application
   *    as the base part of the allocation (so all the x-apps in the ecosystem will receive a minimum amount of $B3TR)
   * - `variableAllocationPercentage` of allocations will be distributed based on the % portion received from entire votes
   *
   * If a round failed then it will calculate the shares against the last successful round.
   * If a round is active then results should be treated as real time estimation and not final.
   * @param roundId The round ID for which to calculate the amount available for allocation.
   * @param appId The ID of the app for which to calculate the amount available for allocation.
   * @return appShare The percentage of the total votes the app received.
   * @return unallocatedShare The percentage of the total votes that were not allocated to the app.
   */
  function roundEarnings(uint256 roundId, bytes32 appId) public view returns (uint256, uint256) {
    require(
      xAllocationVoting() != IXAllocationVotingGovernor(address(0)),
      "XAllocationVotingGovernor contract not set"
    );

    // if app did not participate in the round, return 0
    if (!xAllocationVoting().isEligibleForVote(appId, roundId)) {
      return (0, 0);
    }

    uint256 lastSucceededRoundId;
    IXAllocationVotingGovernor.RoundState state = xAllocationVoting().state(roundId);
    if (
      state == IXAllocationVotingGovernor.RoundState.Active || state == IXAllocationVotingGovernor.RoundState.Succeeded
    ) {
      lastSucceededRoundId = roundId;
    } else {
      // The first round is always considered as the last succeeded round
      // the round where previous round is pointing is the one we need
      lastSucceededRoundId = roundId == 1 ? roundId : xAllocationVoting().latestSucceededRoundId(roundId - 1);
    }

    (uint256 appShare, uint256 unallocatedShare) = getAppShares(lastSucceededRoundId, appId);
    uint256 baseAllocationPerApp = baseAllocationAmount(roundId);
    uint256 variableAllocationForApp = _rewardAmount(roundId, appShare);
    uint256 unallocatedAmount = 0;
    if (unallocatedShare > 0) {
      unallocatedAmount = _rewardAmount(roundId, unallocatedShare);
    }

    return (baseAllocationPerApp + variableAllocationForApp, unallocatedAmount);
  }

  /**
   * Fetches the id of the current round and calculates the earnings.
   */
  function currentRoundEarnings(bytes32 appId) public view returns (uint256) {
    require(
      xAllocationVoting() != IXAllocationVotingGovernor(address(0)),
      "XAllocationVotingGovernor contract not set"
    );

    uint256 roundId = xAllocationVoting().currentRoundId();

    (uint256 earnings, ) = roundEarnings(roundId, appId);
    return earnings;
  }

  /**
   * `baseAllocationPercentage`% of allocations will be on average distributed to each qualified X Application as the base
   * part of the allocation (so all the x-apps in the ecosystem will receive a minimum amount of $B3TR).
   */
  function baseAllocationAmount(uint256 roundId) public view returns (uint256) {
    require(
      xAllocationVoting() != IXAllocationVotingGovernor(address(0)),
      "XAllocationVotingGovernor contract not set"
    );

    uint256 total = _emissionAmount(roundId);
    bytes32[] memory eligibleApps = xAllocationVoting().getRoundApps(roundId);

    uint256 available = (total * xAllocationVoting().getRoundBaseAllocationPercentage(roundId)) / 100;

    uint256 amountPerApp = available / eligibleApps.length;
    return amountPerApp;
  }

  /**
   * @dev Returns the scaled quadratic funding percentage of votes for a given app in a given round.
   *
   * The maximum of each project is X% of the 70% of allocations (from the previous point).
   * That means there will be a cap to how much each x-app will be able to receive each round.
   * That means at least there will be 6 projects participating in voting every week.
   * Any distribution left in this pool will be allocated by DAO voting (BD pool or marketing or tech reserve, etc.)
   *
   */
  function getAppShares(uint256 roundId, bytes32 appId) public view returns (uint256, uint256) {
    require(
      xAllocationVoting() != IXAllocationVotingGovernor(address(0)),
      "XAllocationVotingGovernor contract not set"
    );

    // if app did not participate in the round, return 0
    if (!xAllocationVoting().isEligibleForVote(appId, roundId)) {
      return (0, 0);
    }

    uint256 totalVotesQF = xAllocationVoting().totalVotesQF(roundId);
    uint256 appVotesQF = xAllocationVoting().getAppVotesQF(roundId, appId);

    uint256 appVotesQFValue = appVotesQF * appVotesQF;

    // avoid division by zero
    if (appVotesQFValue == 0) return (0, 0);

    uint256 appShare = (appVotesQFValue * percentagePrecisionScalingFactor) / totalVotesQF;

    // This is the amount unallocated if appShare is greater than max cap, this will be sent to treasury
    uint256 unallocatedShare = 0;

    // Cap the app share to the maximum variable allocation percentage so even if an app has 80 votes out of 100,
    // it will still get a max of `appSharesCap` percentage of the available funds
    uint256 _allocationRewardMaxCap = scaledAppSharesCap(roundId);
    if (appShare > _allocationRewardMaxCap) {
      unallocatedShare = appShare - _allocationRewardMaxCap;
      appShare = _allocationRewardMaxCap;
    }

    // This number is scaled and should be divided by 100 to get the actual percentage on the FE
    return (appShare, unallocatedShare);
  }

  function claimed(uint256 roundId, bytes32 appId) public view returns (bool) {
    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    return $.claimedRewards[appId][roundId];
  }

  /**
   * @dev Returns the maximum app shares cap scaled by 1e2 for precision since our
   * shares calculation is scaled by 1e4.
   */
  function scaledAppSharesCap(uint256 roundId) public view returns (uint256) {
    return xAllocationVoting().getRoundAppSharesCap(roundId) * 1e2;
  }

  /**
   * @dev Returns the XAllocationVotingGovernor contract.
   */
  function xAllocationVoting() public view returns (IXAllocationVotingGovernor) {
    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    return $._xAllocationVoting;
  }

  /**
   * @dev Returns the emissions contract.
   */
  function emissions() public view returns (IEmissions) {
    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    return $._emissions;
  }

  function treasury() public view returns (ITreasury) {
    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    return $.treasury;
  }

  function b3tr() public view returns (IB3TR) {
    XAllocationPoolStorage storage $ = _getXAllocationPoolStorage();
    return $.b3tr;
  }
}
