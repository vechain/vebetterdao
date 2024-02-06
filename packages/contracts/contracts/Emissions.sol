// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IB3TR.sol";

contract Emissions is AccessControl, ReentrancyGuard {
  // Roles
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  // B3TR token contract
  IB3TR public b3tr;

  // Starting block for emissions
  uint256 public START_BLOCK;

  // Destinations for emissions
  address public xAllocations;
  address public vote2Earn;
  address public treasury;

  // Pre-mint allocations
  uint256[] public preMintAllocations;

  // ----------- Cycle attributes ----------- //
  uint256 public nextCycle; // Next cycle number
  uint256 public cycleDuration; // Duration of a cycle in blocks

  // ----------- Decay rates ----------- //
  uint256 public xAllocationsDecay; // Decay rate for xAllocations in percentage
  uint256 public vote2EarnDecay; // Decay rate for vote2Earn in percentage
  uint256 public maxVote2EarnDecay = 80; // Maximum decay rate for vote2Earn in percentage

  // ----------- Decay Delays ----------- //
  uint256 public xAllocationsDecayDelay; // Delay for xAllocations decay in seconds
  uint256 public vote2EarnDecayDelay; // Delay for vote2Earn decay in seconds

  // ----------- Emissions ----------- //
  uint256 public initialEmissions; // Initial emissions for xAllocations & vote2Earn
  uint256 public treasuryPercentage; // Percentage of total allocation for treasury (in percentage)

  // ----------- Scaling ----------- //
  uint256 public scalingFactor = 1e6;

  constructor(
    address minter,
    address admin,
    address b3trAddress,
    address[3] memory _destinations,
    uint256[3] memory _preMintAllocations,
    uint256 _cycleDuration,
    uint256[4] memory _decaySettings,
    uint256 _initialEmissions,
    uint256 _treasuryPercentage
  ) {
    // Assertions
    require(_destinations.length == 3, "Emissions: Invalid destinations input length. Expected 3.");
    require(
      _destinations.length == _preMintAllocations.length,
      "Emissions: Expected destinations and pre-mint allocations to have the same length."
    );
    require(_cycleDuration > 0, "Emissions: Cycle duration must be greater than 0");
    require(_decaySettings.length == 4, "Emissions: Invalid decay settings input length. Expected 4.");
    require(_initialEmissions > 0, "Emissions: Initial emissions must be greater than 0");
    require(
      _treasuryPercentage > 0 && _treasuryPercentage < 100,
      "Emissions: Treasury percentage must be between 0 and 100"
    );
    require(
      _decaySettings[0] > 0 && _decaySettings[0] < 100,
      "Emissions: xAllocations decay must be between 0 and 100"
    );
    require(_decaySettings[1] > 0 && _decaySettings[1] < 100, "Emissions: vote2Earn decay must be between 0 and 100");
    require(_decaySettings[2] > 0, "Emissions: xAllocations decay delay must be greater than 0");
    require(_decaySettings[3] > 0, "Emissions: vote2Earn decay delay must be greater than 0");

    // Set B3TR token contract
    b3tr = IB3TR(b3trAddress);

    // Set destinations
    xAllocations = _destinations[0];
    vote2Earn = _destinations[1];
    treasury = _destinations[2];

    // Set pre-mint allocations
    preMintAllocations = _preMintAllocations;

    // Set cycle duration
    cycleDuration = _cycleDuration;

    // Set decay settings
    xAllocationsDecay = _decaySettings[0];
    vote2EarnDecay = _decaySettings[1];
    xAllocationsDecayDelay = _decaySettings[2];
    vote2EarnDecayDelay = _decaySettings[3];

    // Set initial emissions
    initialEmissions = _initialEmissions;

    // Set treasury percentage
    treasuryPercentage = _treasuryPercentage;

    // Set roles
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(MINTER_ROLE, minter);
  }

  function preMint() public onlyRole(MINTER_ROLE) nonReentrant {
    require(preMintAllocations[0] > 0, "Emissions: Pre-mint allocations not set");
    require(START_BLOCK == 0, "Emissions: Pre-mint already done");

    // Mint pre-mint allocations
    b3tr.mint(xAllocations, preMintAllocations[0]);
    b3tr.mint(vote2Earn, preMintAllocations[1]);
    b3tr.mint(treasury, preMintAllocations[2]);

    START_BLOCK = block.number;
    nextCycle = 0;
  }

  function distribute() public nonReentrant {
    require(START_BLOCK > 0, "Emissions: Pre-mint not done");
    require(block.number >= getCycleBlock(nextCycle), "Emissions: Next cycle not started yet");

    // Mint emissions for current cycle
    uint256 xAllocationsAmount = getCurrentXAllocationsAmount();
    uint256 vote2EarnAmount = getCurrentVote2EarnAmount();
    uint256 treasuryAmount = getCurrentTreasuryAmount();

    uint256 remainingEmissions = b3tr.cap() - b3tr.totalSupply();

    if (xAllocationsAmount + vote2EarnAmount + treasuryAmount <= remainingEmissions) {
      b3tr.mint(xAllocations, xAllocationsAmount);
      b3tr.mint(vote2Earn, vote2EarnAmount);
      b3tr.mint(treasury, treasuryAmount);
    }
    else {
      distributeLast();
    }

    nextCycle++;
  }

  function distributeLast() internal {
    uint256 remainingEmissions = b3tr.cap() - b3tr.totalSupply();

    uint256 xAllocationAmount = getDecayedAmount(remainingEmissions, 66, 1); // 66% decay for xAllocations in the last cycle
    uint256 vote2EarnAmount = getDecayedAmount(remainingEmissions - xAllocationAmount, 13, 1); // 13% decay for vote2Earn in the last cycle

    b3tr.mint(xAllocations, xAllocationAmount); 
    b3tr.mint(vote2Earn, vote2EarnAmount);
    b3tr.mint(treasury, remainingEmissions - xAllocationAmount - vote2EarnAmount);
  }

  // ----------- Getters ----------- //

  function getScaledDecayPercentage(uint256 decayPercentage) public view returns (uint256) {
    require(decayPercentage >= 0 && decayPercentage < 100, "Decay percentage must be between 0 and 100");
    return (100 - decayPercentage) * (scalingFactor / 100);
  }

  function getDecayedAmount(
    uint256 initialAmount,
    uint256 decayPercentage,
    uint256 periods
  ) internal view returns (uint256) {
    uint256 scaledAmount = initialAmount * scalingFactor;

    for (uint256 i = 0; i < periods; i++) {
      scaledAmount = (scaledAmount * getScaledDecayPercentage(decayPercentage)) / scalingFactor;
    }

    return scaledAmount / scalingFactor;
  }

  function getXAllocationDecayPeriods(uint256 blockNumber) public view returns (uint256) {
    require(blockNumber >= START_BLOCK, "Emissions: Invalid block number");

    return (blockNumber - START_BLOCK) / (xAllocationsDecayDelay * cycleDuration);
  }

  function getXAllocationsAmount(uint256 blockNumber) public view returns (uint256) {
    return getDecayedAmount(initialEmissions, xAllocationsDecay, getXAllocationDecayPeriods(blockNumber));
  }

  function getVote2EarnDecayPeriods(uint256 blockNumber) public view returns (uint256) {
    require(blockNumber >= START_BLOCK, "Emissions: Invalid block number");

    return (blockNumber - START_BLOCK) / (vote2EarnDecayDelay * cycleDuration);
  }

  function getVote2EarnAmount(uint256 blockNumber) public view returns (uint256) {
    uint256 vote2earnDecayPeriods = getVote2EarnDecayPeriods(blockNumber);

    uint256 percentageToDecay = vote2EarnDecay * vote2earnDecayPeriods;

    return
      getDecayedAmount(
        getXAllocationsAmount(blockNumber),
        percentageToDecay > maxVote2EarnDecay ? maxVote2EarnDecay : percentageToDecay,
        1 // We are calculating the decay directly from the `decayPercentage, thus the period is always 1
      );
  }

  function getTreasuryAmount(uint256 blockNumber) public view returns (uint256) {
    return ((getXAllocationsAmount(blockNumber) + getVote2EarnAmount(blockNumber)) * treasuryPercentage) / 100;
  }

  function getCurrentXAllocationsAmount() public view returns (uint256) {
    return getXAllocationsAmount(block.number);
  }

  function getCurrentVote2EarnAmount() public view returns (uint256) {
    return getVote2EarnAmount(block.number);
  }

  function getCurrentTreasuryAmount() public view returns (uint256) {
    return getTreasuryAmount(block.number);
  }

  function getPreMintAllocations() public view returns (uint256[] memory) {
    return preMintAllocations;
  }

  function getCycleBlock(uint256 cycle) public view returns (uint256) {
    require(cycle >= 0, "Emissions: Invalid cycle number");

    return START_BLOCK + cycle * cycleDuration;
  }

  // ----------- Setters ----------- //

  function setPreMintAllocations(uint256[] memory _allocations) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(START_BLOCK == 0, "Emissions: Pre-mint already done");
    require(_allocations.length == 3, "Emissions: Invalid input length. Expected 3.");

    preMintAllocations = _allocations;
  }

  function setXallocationsAddress(address xAllocationAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    xAllocations = xAllocationAddress;
  }

  function setVote2EarnAddress(address vote2EarnAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    vote2Earn = vote2EarnAddress;
  }

  function setTreasuryAddress(address treasuryAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    treasury = treasuryAddress;
  }

  function setCycleDuration(uint256 _cycleDuration) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_cycleDuration > 0, "Emissions: Cycle duration must be greater than 0");
    cycleDuration = _cycleDuration;
  }

  function setXAllocationsDecay(uint256 _decay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_decay >= 0 && _decay <= 100, "Emissions: xAllocations decay must be between 0 and 100");
    xAllocationsDecay = _decay;
  }

  function setVote2EarnDecay(uint256 _decay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_decay >= 0 && _decay <= 100, "Emissions: vote2Earn decay must be between 0 and 100");
    vote2EarnDecay = _decay;
  }

  function setXAllocationsDecayDelay(uint256 _delay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_delay > 0, "Emissions: xAllocations decay delay must be greater than 0");
    xAllocationsDecayDelay = _delay;
  }

  function setVote2EarnDecayDelay(uint256 _delay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_delay > 0, "Emissions: vote2Earn decay delay must be greater than 0");
    vote2EarnDecayDelay = _delay;
  }

  function setInitialEmissions(uint256 _emissions) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_emissions > 0, "Emissions: Initial emissions must be greater than 0");
    initialEmissions = _emissions;
  }

  function setTreasuryPercentage(uint256 _percentage) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_percentage >= 0 && _percentage <= 100, "Emissions: Treasury percentage must be between 0 and 100");
    treasuryPercentage = _percentage;
  }

  function setScalingFactor(uint256 _scalingFactor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_scalingFactor > 0, "Emissions: Scaling factor must be greater than 0");
    scalingFactor = _scalingFactor;
  }

  function setMaxVote2EarnDecay(uint256 _maxVote2EarnDecay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_maxVote2EarnDecay >= 0 && _maxVote2EarnDecay <= 100, "Emissions: Max vote2Earn decay must be between 0 and 100");
    maxVote2EarnDecay = _maxVote2EarnDecay;
  }
}
