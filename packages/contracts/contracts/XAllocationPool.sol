// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IXAllocationPool } from "./interfaces/IXAllocationPool.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { IEmissions } from "./interfaces/IEmissions.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IB3TR } from "./interfaces/IB3TR.sol";

contract XAllocationPool is IXAllocationPool, AccessControl, ReentrancyGuard {
  IXAllocationVotingGovernor internal _xAllocationVoting;
  IEmissions internal _emissions;

  uint256 public constant percentagePrecisionScalingFactor = 1e4;

  uint256 public baseAllocationPercentage = 30;
  uint256 public variableAllocationPercentage = 70;
  uint256 public appSharesCap = 15;

  // B3TR token contract
  IB3TR public b3tr;

  mapping(bytes32 => mapping(uint256 => bool)) public claimedRewards;

  constructor(address _admin, address b3trAddress) {
    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    b3tr = IB3TR(b3trAddress);
  }

  // ---------- Setters ---------- //

  function setXAllocationVotingAddress(address xAllocationVoting_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _xAllocationVoting = IXAllocationVotingGovernor(xAllocationVoting_);
  }

  function setEmissionsAddress(address emissions_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _emissions = IEmissions(emissions_);
  }

  function setBaseAllocationPercentage(uint256 baseAllocationPercentage_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(baseAllocationPercentage_ <= 100, "Base allocation percentage must be less than or equal to 100");

    baseAllocationPercentage = baseAllocationPercentage_;
    variableAllocationPercentage = 100 - baseAllocationPercentage;
  }

  function setAppSharesCap(uint256 appSharesCap_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(appSharesCap_ <= 100, "App shares cap must be less than or equal to 100");

    appSharesCap = appSharesCap_;
  }

  function claimAllocationRewards(bytes32 appId, uint256 roundId) public nonReentrant {
    require(!claimedRewards[appId][roundId], "XAllocationPool: rewards already claimed for this app and round");
    require(!xAllocationVoting().isActive(roundId), "XAllocationPool: round not ended yet");

    uint256 amountToClaim = claimableAllocationRewards(roundId, appId);
    require(amountToClaim > 0, "XAllocationPool: no rewards available for this app");

    //check that contract has enough funds to pay the reward
    require(b3tr.balanceOf(address(this)) >= amountToClaim, "Insufficient funds");

    address payable receiverAddress = payable(xAllocationVoting().getAppReceiverAddress(appId));

    // Transfer the rewards to the caller
    require(b3tr.transfer(receiverAddress, amountToClaim), "Allocation transfer failed");

    // update the claimedRewards mapping
    claimedRewards[appId][roundId] = true;

    // emit event
    emit AllocationRewardsClaimed(appId, roundId, amountToClaim, receiverAddress, msg.sender);
  }

  // ---------- Internal and private ---------- //

  /**
   * @dev Returns the amount of $B3TR available for allocation in a given cycle.
   * Each cycle is linked to a x-allocation round and they share the same id.
   *
   * Since the Emissions contract handles the first and last cycles differently, this function
   * handles all the possible cases.
   *
   * @param roundId The round ID for which to calculate the amount available for allocation.
   */
  function _emissionAmount(uint256 roundId) internal view returns (uint256) {
    require(emissions() != IEmissions(address(0)), "Emissions contract not set");

    // if it's the first cycle then the amount available is the first custom allocation
    if (roundId == 1) {
      return emissions().getPreMintAllocations()[0];
    } else if (emissions().isLastCycleId(roundId)) {
      // if it's the last cycle then the amount available is the last custom allocation
      return emissions().getLastMintAllocations()[0];
    } else {
      // Amount available for this round (assuming the amount is already scaled by 1e18 for precision)
      return emissions().getXAllocationAmountForCycle(roundId);
    }
  }

  /**
   * `variableAllocationPercentage`% of allocations will be distributed based on the % portion received from entire votes
   */
  function _appRewardAmount(uint256 roundId, uint256 appShare) internal view returns (uint256) {
    uint256 total = _emissionAmount(roundId);

    uint256 available = (total * variableAllocationPercentage) / 100;

    uint256 rewardAmount = (available * appShare) / percentagePrecisionScalingFactor;
    return rewardAmount;
  }

  // ---------- Getters ---------- //
  /**
   * The allocations distribution from the X-Allocation Pool to X-Apps will be in two parts:
   * - `baseAllocationPercentage` of allocations will be on average distributed to each qualified X Application
   *    as the base part of the allocation (so all the x-apps in the ecosystem will receive a minimum amount of $B3TR)
   * - `variableAllocationPercentage` of allocations will be distributed based on the % portion received from entire votes
   *
   * If round failed then it will use the shares from the last successful round.
   */
  function claimableAllocationRewards(uint256 roundId, bytes32 appId) public view returns (uint256) {
    require(!xAllocationVoting().isActive(roundId), "XAllocationPool: round not ended yet");

    if (claimedRewards[appId][roundId]) {
      return 0;
    }

    //If round is not succeded then take shares from previous successful round
    uint256 lastSucceededRoundId = roundId;
    if (xAllocationVoting().state(roundId) == IXAllocationVotingGovernor.AllocationProposalState.Failed) {
      require(xAllocationVoting().isFinalized(roundId), "XAllocationPool: failed round not finalized yet");

      lastSucceededRoundId = xAllocationVoting().latestSucceededRoundId(roundId);
    }

    uint256 appShare = getAppShares(lastSucceededRoundId, appId);
    uint256 baseAllocationPerApp = baseAllocationAmount(roundId);
    uint256 variableAllocationForApp = _appRewardAmount(roundId, appShare);

    return baseAllocationPerApp + variableAllocationForApp;
  }

  /**
   * The allocations distribution from the X-Allocation Pool to X-Apps will be in two parts:
   * - `baseAllocationPercentage` of allocations will be on average distributed to each qualified X Application as the base
   *    part of the allocation (so all the x-apps in the ecosystem will receive a minimum amount of $B3TR)
   * - `variableAllocationPercentage` of allocations will be distributed based on the % portion received from entire votes
   *
   * This function doesn't take care if the round is active or not, or if it was succeeded or not, so it should be used only
   * to display hypothetical rewards while the round is active.
   */
  function realTimeAllocationRewards(uint256 roundId, bytes32 appId) public view returns (uint256) {
    uint256 appShare = getAppShares(roundId, appId);
    uint256 baseAllocationPerApp = baseAllocationAmount(roundId);
    uint256 variableAllocationForApp = _appRewardAmount(roundId, appShare);

    return baseAllocationPerApp + variableAllocationForApp;
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
    bytes32[] memory elegibleApps = xAllocationVoting().appsElegibleForVoting(roundId);

    uint256 available = (total * baseAllocationPercentage) / 100;

    uint256 amountPerApp = available / elegibleApps.length;
    return amountPerApp;
  }

  /**
   * @dev Returns the scaled percentage of votes for a given app in a given round.
   *
   * The maximum of each project is X% of the 70% of allocations (from the previous point).
   * That means there will be a cap to how much each x-app will be able to receive each round.
   * That means at least there will be 6 projects participating in voting every week.
   * Any distribution left in this pool will be allocated by DAO voting (BD pool or marketing or tech reserve, etc.)
   *
   */
  function getAppShares(uint256 roundId, bytes32 appId) public view returns (uint256) {
    require(
      xAllocationVoting() != IXAllocationVotingGovernor(address(0)),
      "XAllocationVotingGovernor contract not set"
    );

    uint256 totalVotes = xAllocationVoting().totalVotes(roundId);
    uint256 appVotes = xAllocationVoting().getAppVotes(roundId, appId);

    // avoid division by zero
    if (totalVotes == 0) return 0;

    uint256 appShare = (appVotes * percentagePrecisionScalingFactor) / totalVotes;

    // Cap the app share to the maximum variable allocation percentage so even if an app has 80 votes out of 100,
    // it will still get a max of `appSharesCap` percentage of the avaialable funds
    uint256 _allocationRewardMaxCap = scaledAppSharesCap();
    if (appShare > _allocationRewardMaxCap) {
      appShare = _allocationRewardMaxCap;
    }

    // This number is scaled and should be divided by 100 to get the actual percentage on the FE
    return appShare;
  }

  /**
   * @dev Returns the maximum app shares cap scaled by 1e2 for precision since our
   * shares calculation is scaled by 1e4.
   */
  function scaledAppSharesCap() public view returns (uint256) {
    return appSharesCap * 1e2;
  }

  /**
   * @dev Returns the XAllocationVotingGovernor contract.
   */
  function xAllocationVoting() public view returns (IXAllocationVotingGovernor) {
    return _xAllocationVoting;
  }

  /**
   * @dev Returns the emissions contract.
   */
  function emissions() public view returns (IEmissions) {
    return _emissions;
  }
}
