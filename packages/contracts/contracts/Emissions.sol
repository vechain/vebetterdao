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
  address internal _xAllocations;
  address internal _vote2Earn;
  address internal _treasury;

  // ----------- Cycle attributes ----------- //
  uint256 public nextCycle; // Next cycle number
  uint256 public cycleDuration; // Duration of a cycle in blocks

  // ----------- Decay rates ----------- //
  uint256 public xAllocationsDecay; // Decay rate for xAllocations in percentage
  uint256 public vote2EarnDecay; // Decay rate for vote2Earn in percentage
  uint256 public maxVote2EarnDecay; // Maximum decay rate for vote2Earn in percentage

  // ----------- Decay periods ----------- //
  uint256 public xAllocationsDecayPeriod; // Decay period for xAllocations in number of cycles
  uint256 public vote2EarnDecayPeriod; // Decay period for vote2Earn in number of cycles

  // ----------- Emissions ----------- //
  uint256 public initialXAppAllocation; // Initial emissions for xAllocations scaled with scalingFactor
  uint256 public treasuryPercentage; // Percentage of total allocation for treasury (in percentage)

  uint256 public lastEmissionBlock; // Block number for last emissions
  mapping(uint256 => Emission) public emissions; // Past emissions for each distributed cycle
  uint256 public totalEmissions; // Total emissions distributed

  // ----------- Scaling ----------- //
  uint256 public scalingFactor = 1e6;

  event EmissionDistributed(uint256 indexed cycle, uint256 xAllocations, uint256 vote2Earn, uint256 treasury);

  constructor(
    address minter,
    address admin,
    address b3trAddress,
    address[3] memory _destinations,
    uint256 _initialXAppAllocation,
    uint256 _cycleDuration,
    uint256[4] memory _decaySettings,
    uint256 _treasuryPercentage,
    uint256 _maxVote2EarnDecay
  ) {
    // Assertions
    require(_destinations.length == 3, "Emissions: Invalid destinations input length. Expected 3.");
    require(_initialXAppAllocation > 0, "Emissions: Initial xApp allocation must be greater than 0");
    require(_cycleDuration > 0, "Emissions: Cycle duration must be greater than 0");
    require(_decaySettings.length == 4, "Emissions: Invalid decay settings input length. Expected 4.");
    require(
      _treasuryPercentage > 0 && _treasuryPercentage < 10000,
      "Emissions: Treasury percentage must be between 0 and 10000"
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
    _xAllocations = _destinations[0];
    _vote2Earn = _destinations[1];
    _treasury = _destinations[2];

    // Set cycle duration
    cycleDuration = _cycleDuration;

    // Set decay settings
    xAllocationsDecay = _decaySettings[0];
    vote2EarnDecay = _decaySettings[1];
    xAllocationsDecayPeriod = _decaySettings[2];
    vote2EarnDecayPeriod = _decaySettings[3];

    // Set initial emissions
    initialXAppAllocation = _initialXAppAllocation;

    // Set treasury percentage
    treasuryPercentage = _treasuryPercentage;

    // Set max vote2Earn decay
    maxVote2EarnDecay = _maxVote2EarnDecay;

    // Initialise cycle
    nextCycle = 0;

    // Set roles
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(MINTER_ROLE, minter);
  }

  function bootstrap() public onlyRole(MINTER_ROLE) nonReentrant {
    require(nextCycle == 0, "Emissions: Can only bootstrap emissions when next cycle = 0");
    nextCycle++;

    // Calculate initial emissions
    uint256 initialVote2EarnAllocation = _calculateVote2EarnAmount();
    uint256 initialTreasuryAllocation = _calculateTreasuryAmount();

    // Mint initial allocations
    emissions[nextCycle] = Emission(initialXAppAllocation, initialVote2EarnAllocation, initialTreasuryAllocation);
    totalEmissions += initialXAppAllocation + initialVote2EarnAllocation + initialTreasuryAllocation;
    b3tr.mint(_xAllocations, initialXAppAllocation);
    b3tr.mint(_vote2Earn, initialVote2EarnAllocation);
    b3tr.mint(_treasury, initialTreasuryAllocation);

    emit EmissionDistributed(nextCycle, initialXAppAllocation, initialVote2EarnAllocation, initialTreasuryAllocation);
  }

  function start() public onlyRole(MINTER_ROLE) nonReentrant {
    require(nextCycle == 1, "Emissions: Can only start emissions when next cycle = 1");

    lastEmissionBlock = block.number;
    
    xAllocationsGovernor.startNewRound();

    nextCycle++;
  }

  function distribute() public nonReentrant {
    require(nextCycle > 1, "Emissions: Please start emissions first");
    require(isNextCycleDistributable(), "Emissions: Next cycle not started yet");

    // Mint emissions for current cycle
    uint256 xAllocationsAmount = _calculateNextXAllocation();
    uint256 vote2EarnAmount = _calculateVote2EarnAmount();
    uint256 treasuryAmount = _calculateTreasuryAmount();

    require(
      xAllocationsAmount + vote2EarnAmount + treasuryAmount <= getRemainingEmissions(),
      "Emissions: emissions would exceed B3TR supply cap"
    );

    lastEmissionBlock = block.number;
    emissions[nextCycle] = Emission(xAllocationsAmount, vote2EarnAmount, treasuryAmount);
    totalEmissions += xAllocationsAmount + vote2EarnAmount + treasuryAmount;

    b3tr.mint(_xAllocations, xAllocationsAmount);
    b3tr.mint(_vote2Earn, vote2EarnAmount);
    b3tr.mint(_treasury, treasuryAmount);

    xAllocationsGovernor.startNewRound();

    emit EmissionDistributed(nextCycle, xAllocationsAmount, vote2EarnAmount, treasuryAmount);
    nextCycle++;
  }

  // ------ Emissions calculations ------ //
  /**
   * Calculates the next XAllocation amount for the next cycle
   * If the next cycle is the first cycle, the initial emissions are returned
   * Values are calculated based on the value from the previous cycle with a
   * decay rate applied at a set period based on the decay period
   *
   * @return uint256
   */
  function _calculateNextXAllocation() internal view returns (uint256) {
    // If this is the first cycle, return the initial amount
    if (nextCycle < 2) {
      return initialXAppAllocation;
    }
    // Get emissions from the previous cycle
    uint256 lastCycleEmissions = emissions[nextCycle - 1].xAllocations * scalingFactor;

    // Check if we need to decay again by getting the modulus
    if ((nextCycle - 1) % xAllocationsDecayPeriod == 0) {
      lastCycleEmissions = (lastCycleEmissions * (100 - xAllocationsDecay)) / 100;
    }
    return lastCycleEmissions / scalingFactor;
  }

  /**
   * Calculates the number of decay periods that have passed since the start of the emissions
   * The number of decay periods is calculated by taking the current cycle number and subtracting 2
   * and then dividing by the decay period
   *
   *    `number of decay periods = floor(number of periods / decay period)`
   *
   * @return uint256
   */
  function _calculateVote2EarnDecayPeriods() internal view returns (uint256) {
    require(vote2EarnDecayPeriod > 0, "Emissions: Invalid decay period for Vote2Earn");
    require(nextCycle > 0, "Emissions: Invalid cycle number");
    if (nextCycle == 1) {
      return 0;
    }
    return (nextCycle - 1) / vote2EarnDecayPeriod;
  }

  /**
   * Calculates the Vot2Earn decay percentage for the next cycle
   * The decay percentage is calculated based on the number of decay periods
   * that have passed since the start of the emissions, multiplied by the decay rate
   *
   *
   *    `decay percentage = decay rate * number of decay periods`
   *
   * In addition to this calculation, the decay percentage is capped at a maximum value `maxVote2EarnDecay`
   *
   * @return uint256
   */
  function _calculateVote2EarnDecayPercentage() internal view returns (uint256) {
    uint256 vote2earnDecayPeriods = _calculateVote2EarnDecayPeriods();

    uint256 percentageToDecay = vote2EarnDecay * vote2earnDecayPeriods;

    return percentageToDecay > maxVote2EarnDecay ? maxVote2EarnDecay : percentageToDecay;
  }

  /**
   * Calculate the amount of B3TR to be minted for the Vote2Earn contract for the next cycle
   *
   * @return uint256
   */
  function _calculateVote2EarnAmount() internal view returns (uint256) {

    uint256 percentageToDecay = _calculateVote2EarnDecayPercentage();

    uint256 scaledXAllocation = _calculateNextXAllocation() * scalingFactor;

    uint256 vote2EarnScaled = (scaledXAllocation * (100 - percentageToDecay)) / 100;

    return vote2EarnScaled / scalingFactor;
  }

  /**
   * Calculate the amount of B3TR to be minted for the Treasury for the next cycle
   *
   * @return uint256
   */
  function _calculateTreasuryAmount() internal view returns (uint256) {
    uint256 scaledAllocations = (_calculateNextXAllocation() + _calculateVote2EarnAmount()) * scalingFactor;
    uint256 treasuryAmount = (scaledAllocations * treasuryPercentage) / 10000;

    return treasuryAmount / scalingFactor;
  }


  // ----------- Getters ----------- //

  function getXAllocationAmount(uint256 cycle) public view returns (uint256) {
    require(cycle <= nextCycle, "Emissions: Cycle not reached yet");

    return isCycleDistributed(cycle) ? emissions[cycle].xAllocations : _calculateNextXAllocation();
  }

  function getVote2EarnAmount(uint256 cycle) public view returns (uint256) {
    require(cycle <= nextCycle, "Emissions: Cycle not reached yet");

    return isCycleDistributed(cycle) ? emissions[cycle].vote2Earn : _calculateVote2EarnAmount();
  }

  function getTreasuryAmount(uint256 cycle) public view returns (uint256) {
    require(cycle <= nextCycle, "Emissions: Cycle not reached yet");

    return isCycleDistributed(cycle) ? emissions[cycle].treasury : _calculateTreasuryAmount();
  }

  function isCycleDistributed(uint256 cycle) public view returns (bool) {
    return emissions[cycle].xAllocations != 0;
  }

  function isCycleEnded(uint256 cycle) public view returns (bool) {
    require(cycle <= getCurrentCycle(), "Emissions: Cycle not reached yet");

    if(cycle < getCurrentCycle()) {
      return true;
    }

    return block.number >= lastEmissionBlock + cycleDuration;
  }

  function getCurrentCycle() public view returns (uint256) {
    require(nextCycle > 0, "Emissions: not bootstrapped yet");
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

  function treasury() public view returns (address) {
    return _treasury;
  }

  function vote2Earn() public view returns (address) {
    return _vote2Earn;
  }

  function xAllocations() public view returns (address) {
    return _xAllocations;
  }

  // ----------- Setters ----------- //

  function setXallocationsAddress(address xAllocationAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(xAllocationAddress != address(0), "Emissions: xAllocationAddress cannot be the zero address");
    _xAllocations = xAllocationAddress;
  }

  function setVote2EarnAddress(address vote2EarnAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(vote2EarnAddress != address(0), "Emissions: vote2EarnAddress cannot be the zero address");
    _vote2Earn = vote2EarnAddress;
  }

  function setTreasuryAddress(address treasuryAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(treasuryAddress != address(0), "Emissions: treasuryAddress cannot be the zero address");
    _treasury = treasuryAddress;
  }

  function setCycleDuration(uint256 _cycleDuration) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_cycleDuration > 0, "Emissions: Cycle duration must be greater than 0");
    cycleDuration = _cycleDuration;
  }

  function setXAllocationsDecay(uint256 _decay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_decay <= 100, "Emissions: xAllocations decay must be between 0 and 100");
    xAllocationsDecay = _decay;
  }

  function setVote2EarnDecay(uint256 _decay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_decay <= 100, "Emissions: vote2Earn decay must be between 0 and 100");
    vote2EarnDecay = _decay;
  }

  function setXAllocationsDecayPeriod(uint256 _period) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_period > 0, "Emissions: xAllocations decay period must be greater than 0");
    xAllocationsDecayPeriod = _period;
  }

  function setVote2EarnDecayPeriod(uint256 _period) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_period > 0, "Emissions: vote2Earn decay period must be greater than 0");
    vote2EarnDecayPeriod = _period;
  }

  /**
   * The percentage of the total allocation that goes to the treasury scaled by 100.
   * The scaling is to allow us to calculate non whole number percentages (87.5% for example)
   * @param _percentage The percentage value (scaled by 100) to set for the treasury allocation.
   */
  function setTreasuryPercentage(uint256 _percentage) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_percentage <= 10000, "Emissions: Treasury percentage must be between 0 and 10000");
    treasuryPercentage = _percentage;
  }

  function setScalingFactor(uint256 _scalingFactor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_scalingFactor > 0, "Emissions: Scaling factor must be greater than 0");
    scalingFactor = _scalingFactor;
  }

  function setMaxVote2EarnDecay(uint256 _maxVote2EarnDecay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_maxVote2EarnDecay <= 100, "Emissions: Max vote2Earn decay must be between 0 and 100");
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
