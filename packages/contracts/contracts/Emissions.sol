// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IB3TR.sol";
import "./interfaces/IXAllocationVotingGovernor.sol";

contract Emissions is AccessControl, ReentrancyGuard {
  // Roles
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  IB3TR public b3tr; // B3TR token contract
  IXAllocationVotingGovernor public xAllocationsGovernor; // XAllocationVotingGovernor contract

  struct Emission {
    uint256 xAllocations;
    uint256 vote2Earn;
    uint256 treasury;
  }

  // Destinations for emissions
  address public xAllocations;
  address public vote2Earn;
  address public treasury;

  // Initial allocations
  uint256[] public initialAllocations;

  // ----------- Cycle attributes ----------- //
  uint256 public nextCycle; // Next cycle number
  uint256 public cycleDuration; // Duration of a cycle in blocks

  // ----------- Decay rates ----------- //
  uint256 public xAllocationsDecay; // Decay rate for xAllocations in percentage
  uint256 public vote2EarnDecay; // Decay rate for vote2Earn in percentage
  uint256 public maxVote2EarnDecay; // Maximum decay rate for vote2Earn in percentage

  // ----------- Decay Delays ----------- //
  uint256 public xAllocationsDecayDelay; // Delay for xAllocations decay in seconds
  uint256 public vote2EarnDecayDelay; // Delay for vote2Earn decay in seconds

  // ----------- Emissions ----------- //
  uint256 public initialEmissions; // Initial emissions for xAllocations & vote2Earn
  uint256 public treasuryPercentage; // Percentage of total allocation for treasury (in percentage)

  uint256 public lastEmissionBlock; // Block number for last emissions
  mapping(uint256 => Emission) public emissions; // Past emissions for each distributed cycle
  uint256 public totalEmissions; // Total emissions distributed

  // ----------- Scaling ----------- //
  uint256 public scalingFactor = 1e6;

  constructor(
    address minter,
    address admin,
    address b3trAddress,
    address[3] memory _destinations,
    uint256[3] memory _initialAllocations,
    uint256 _cycleDuration,
    uint256[4] memory _decaySettings,
    uint256 _initialEmissions,
    uint256 _treasuryPercentage,
    uint256 _maxVote2EarnDecay
  ) {
    // Assertions
    require(_destinations.length == 3, "Emissions: Invalid destinations input length. Expected 3.");
    require(
      _destinations.length == _initialAllocations.length,
      "Emissions: Expected destinations and initial allocations to have the same length."
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
    require(
      _maxVote2EarnDecay > 0 && _maxVote2EarnDecay < 100,
      "Emissions: Max vote2Earn decay must be between 0 and 100"
    );

    // Set B3TR token contract
    b3tr = IB3TR(b3trAddress);

    // Set destinations
    xAllocations = _destinations[0];
    vote2Earn = _destinations[1];
    treasury = _destinations[2];

    // Set initial allocations
    initialAllocations = _initialAllocations;

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

    // Set max vote2Earn decay
    maxVote2EarnDecay = _maxVote2EarnDecay;

    // Initialise cycle
    nextCycle = 1;

    // Set roles
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(MINTER_ROLE, minter);
  }

  function start() public onlyRole(MINTER_ROLE) nonReentrant {
    require(initialAllocations[0] > 0, "Emissions: Initial allocations not set");
    require(nextCycle == 1, "Emissions: Already started");
    require(xAllocationsGovernor != IXAllocationVotingGovernor(address(0)), "Emissions: XAllocationsGovernor not set");

    lastEmissionBlock = block.number;
    emissions[nextCycle] = Emission(initialAllocations[0], initialAllocations[1], initialAllocations[2]);
    totalEmissions += initialAllocations[0] + initialAllocations[1] + initialAllocations[2];

    nextCycle++;

    // Mint initial allocations
    b3tr.mint(xAllocations, initialAllocations[0]);
    b3tr.mint(vote2Earn, initialAllocations[1]);
    b3tr.mint(treasury, initialAllocations[2]);

    xAllocationsGovernor.startNewRound();
  }

  function distribute() public nonReentrant {
    require(nextCycle > 1, "Emissions: Please start emissions first");
    require(isNextCycleDistributable(), "Emissions: Next cycle not started yet");

    // Mint emissions for current cycle
    uint256 xAllocationsAmount = getCurrentXAllocationsAmount();
    uint256 vote2EarnAmount = getCurrentVote2EarnAmount();
    uint256 treasuryAmount = getCurrentTreasuryAmount();

    require(
      xAllocationsAmount + vote2EarnAmount + treasuryAmount <= getRemainingEmissions(),
      "Emissions: emissions would exceed B3TR supply cap"
    );

    lastEmissionBlock = block.number;
    emissions[nextCycle] = Emission(xAllocationsAmount, vote2EarnAmount, treasuryAmount);
    totalEmissions += xAllocationsAmount + vote2EarnAmount + treasuryAmount;

    nextCycle++;

    b3tr.mint(xAllocations, xAllocationsAmount);
    b3tr.mint(vote2Earn, vote2EarnAmount);
    b3tr.mint(treasury, treasuryAmount);

    xAllocationsGovernor.startNewRound();
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

  function getXAllocationDecayPeriods() public view returns (uint256) {
    return (getCurrentCycle() - 1) / xAllocationsDecayDelay;
  }

  function getCurrentXAllocationsAmount() public view returns (uint256) {
    return getDecayedAmount(initialEmissions, xAllocationsDecay, getXAllocationDecayPeriods());
  }

  function getVote2EarnDecayPeriods() public view returns (uint256) {
    return (getCurrentCycle() - 1) / vote2EarnDecayDelay;
  }

  function getCurrentVote2EarnAmount() public view returns (uint256) {
    uint256 vote2earnDecayPeriods = getVote2EarnDecayPeriods();

    uint256 percentageToDecay = vote2EarnDecay * vote2earnDecayPeriods;

    return
      getDecayedAmount(
        getCurrentXAllocationsAmount(),
        percentageToDecay > maxVote2EarnDecay ? maxVote2EarnDecay : percentageToDecay,
        1 // We are calculating the decay directly from the `decayPercentage, thus the period is always 1
      );
  }

  function getCurrentTreasuryAmount() public view returns (uint256) {
    return ((getCurrentXAllocationsAmount() + getCurrentVote2EarnAmount()) * treasuryPercentage) / 100;
  }

  function getInitialAllocations() public view returns (uint256[] memory) {
    return initialAllocations;
  }

  function getXAllocationAmountForCycle(uint256 cycle) public view returns (uint256) {
    require(cycle <= getCurrentCycle(), "Emissions: Cycle not reached yet");

    return isCycleDistributed(cycle) ? emissions[cycle].xAllocations : getCurrentXAllocationsAmount();
  }

  function getVote2EarnAmountForCycle(uint256 cycle) public view returns (uint256) {
    require(cycle <= getCurrentCycle(), "Emissions: Cycle not reached yet");

    return isCycleDistributed(cycle) ? emissions[cycle].vote2Earn : getCurrentVote2EarnAmount();
  }

  function getTreasuryAmountForCycle(uint256 cycle) public view returns (uint256) {
    require(cycle <= getCurrentCycle(), "Emissions: Cycle not reached yet");

    return isCycleDistributed(cycle) ? emissions[cycle].treasury : getCurrentTreasuryAmount();
  }

  function isCycleDistributed(uint256 cycle) public view returns (bool) {
    return cycle < nextCycle;
  }

  function isCycleEnded(uint256 cycle) public view returns (bool) {
    require(isCycleDistributed(cycle), "Emissions: Cycle not distributed yet");

    return block.number >= lastEmissionBlock + cycleDuration;
  }

  function getCurrentCycle() public view returns (uint256) {
    return nextCycle - 1;
  }

  function getNextCycleBlock() public view returns (uint256) {
    return lastEmissionBlock + cycleDuration;
  }

  function isNextCycleDistributable() public view returns (bool) {
    return block.number >= lastEmissionBlock + cycleDuration;
  }

  function getRemainingEmissions() public view returns (uint256) {
    return b3tr.cap() - totalEmissions;
  }

  // ----------- Setters ----------- //

  function setInitialAllocations(uint256[] memory _allocations) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(nextCycle == 1, "Emissions: already started");
    require(_allocations.length == 3, "Emissions: Invalid input length. Expected 3.");

    initialAllocations = _allocations;
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
    require(
      _maxVote2EarnDecay >= 0 && _maxVote2EarnDecay <= 100,
      "Emissions: Max vote2Earn decay must be between 0 and 100"
    );
    maxVote2EarnDecay = _maxVote2EarnDecay;
  }

  function setXAllocationsGovernorAddress(address _xAllocationsGovernor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_xAllocationsGovernor != address(0), "Emissions: _xAllocationsGovernor cannot be the zero address");
    require(
      IXAllocationVotingGovernor(_xAllocationsGovernor).votingPeriod() < cycleDuration,
      "Emissions: Voting period must be less than cycle duration"
    );
    xAllocationsGovernor = IXAllocationVotingGovernor(_xAllocationsGovernor);
  }
}
