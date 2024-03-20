// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IB3TR.sol";
import "./interfaces/IXAllocationVotingGovernor.sol";

contract Emissions is AccessControl, ReentrancyGuard {
  // Roles
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  struct Emission {
    uint256 xAllocations;
    uint256 vote2Earn;
    uint256 treasury;
  }

  /// @custom:storage-location erc7201:b3tr.storage.Emissions
  struct EmissionsStorage {
    IB3TR b3tr; // B3TR token contract
    IXAllocationVotingGovernor xAllocationsGovernor; // XAllocationVotingGovernor contract
    // Destinations for emissions
    address _xAllocations;
    address _vote2Earn;
    address _treasury;
    // ----------- Cycle attributes ----------- //
    uint256 nextCycle; // Next cycle number
    uint256 cycleDuration; // Duration of a cycle in blocks
    // ----------- Decay rates ----------- //
    uint256 xAllocationsDecay; // Decay rate for xAllocations in percentage
    uint256 vote2EarnDecay; // Decay rate for vote2Earn in percentage
    uint256 maxVote2EarnDecay; // Maximum decay rate for vote2Earn in percentage
    // ----------- Decay periods ----------- //
    uint256 xAllocationsDecayPeriod; // Decay period for xAllocations in number of cycles
    uint256 vote2EarnDecayPeriod; // Decay period for vote2Earn in number of cycles
    // ----------- Emissions ----------- //
    uint256 initialXAppAllocation; // Initial emissions for xAllocations scaled with scalingFactor
    uint256 treasuryPercentage; // Percentage of total allocation for treasury (in percentage)
    uint256 lastEmissionBlock; // Block number for last emissions
    mapping(uint256 => Emission) emissions; // Past emissions for each distributed cycle
    uint256 totalEmissions; // Total emissions distributed
    // ----------- Scaling ----------- //
    uint256 scalingFactor;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.Emissions")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant EmissionsStorageLocation =
    0xa3a4dbdafa3539d2a7f76379fff3516428de5d09ad2bbe195434cac5e7193900;

  function _getEmissionsStorage() private pure returns (EmissionsStorage storage $) {
    assembly {
      $.slot := EmissionsStorageLocation
    }
  }

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

    EmissionsStorage storage $ = _getEmissionsStorage();

    // Set B3TR token contract
    $.b3tr = IB3TR(b3trAddress);

    // Set destinations
    $._xAllocations = _destinations[0];
    $._vote2Earn = _destinations[1];
    $._treasury = _destinations[2];

    // Set cycle duration
    $.cycleDuration = _cycleDuration;

    // Set decay settings
    $.xAllocationsDecay = _decaySettings[0];
    $.vote2EarnDecay = _decaySettings[1];
    $.xAllocationsDecayPeriod = _decaySettings[2];
    $.vote2EarnDecayPeriod = _decaySettings[3];

    // Set initial emissions
    $.initialXAppAllocation = _initialXAppAllocation;

    // Set treasury percentage
    $.treasuryPercentage = _treasuryPercentage;

    // Set max vote2Earn decay
    $.maxVote2EarnDecay = _maxVote2EarnDecay;

    // Initialise cycle
    $.nextCycle = 0;

    // Set scaling factor
    $.scalingFactor = 1e6;

    // Set roles
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(MINTER_ROLE, minter);
  }

  function bootstrap() public onlyRole(MINTER_ROLE) nonReentrant {
    EmissionsStorage storage $ = _getEmissionsStorage();
    require($.nextCycle == 0, "Emissions: Can only bootstrap emissions when next cycle = 0");
    $.nextCycle++;

    // Calculate initial emissions
    uint256 initialVote2EarnAllocation = _calculateVote2EarnAmount();
    uint256 initialTreasuryAllocation = _calculateTreasuryAmount();

    // Mint initial allocations
    $.emissions[$.nextCycle] = Emission($.initialXAppAllocation, initialVote2EarnAllocation, initialTreasuryAllocation);
    $.totalEmissions += $.initialXAppAllocation + initialVote2EarnAllocation + initialTreasuryAllocation;
    $.b3tr.mint($._xAllocations, $.initialXAppAllocation);
    $.b3tr.mint($._vote2Earn, initialVote2EarnAllocation);
    $.b3tr.mint($._treasury, initialTreasuryAllocation);

    emit EmissionDistributed(
      $.nextCycle,
      $.initialXAppAllocation,
      initialVote2EarnAllocation,
      initialTreasuryAllocation
    );
  }

  function start() public onlyRole(MINTER_ROLE) nonReentrant {
    EmissionsStorage storage $ = _getEmissionsStorage();
    require($.b3tr.paused() == false, "Emissions: B3TR token is paused");
    require($.nextCycle == 1, "Emissions: Can only start emissions when next cycle = 1");

    $.lastEmissionBlock = block.number;

    $.xAllocationsGovernor.startNewRound();

    $.nextCycle++;
  }

  function distribute() public nonReentrant {
    EmissionsStorage storage $ = _getEmissionsStorage();
    require($.nextCycle > 1, "Emissions: Please start emissions first");
    require(isNextCycleDistributable(), "Emissions: Next cycle not started yet");

    // Mint emissions for current cycle
    uint256 xAllocationsAmount = _calculateNextXAllocation();
    uint256 vote2EarnAmount = _calculateVote2EarnAmount();
    uint256 treasuryAmount = _calculateTreasuryAmount();

    require(
      xAllocationsAmount + vote2EarnAmount + treasuryAmount <= getRemainingEmissions(),
      "Emissions: emissions would exceed B3TR supply cap"
    );

    $.lastEmissionBlock = block.number;
    $.emissions[$.nextCycle] = Emission(xAllocationsAmount, vote2EarnAmount, treasuryAmount);
    $.totalEmissions += xAllocationsAmount + vote2EarnAmount + treasuryAmount;

    $.b3tr.mint($._xAllocations, xAllocationsAmount);
    $.b3tr.mint($._vote2Earn, vote2EarnAmount);
    $.b3tr.mint($._treasury, treasuryAmount);

    $.xAllocationsGovernor.startNewRound();

    emit EmissionDistributed($.nextCycle, xAllocationsAmount, vote2EarnAmount, treasuryAmount);
    $.nextCycle++;
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
    EmissionsStorage storage $ = _getEmissionsStorage();

    // If this is the first cycle, return the initial amount
    if ($.nextCycle < 2) {
      return initialXAppAllocation();
    }

    // Get emissions from the previous cycle
    uint256 lastCycleEmissions = $.emissions[$.nextCycle - 1].xAllocations * $.scalingFactor;

    // Check if we need to decay again by getting the modulus
    if (($.nextCycle - 1) % $.xAllocationsDecayPeriod == 0) {
      lastCycleEmissions = (lastCycleEmissions * (100 - $.xAllocationsDecay)) / 100;
    }
    return lastCycleEmissions / $.scalingFactor;
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
    EmissionsStorage storage $ = _getEmissionsStorage();

    require($.vote2EarnDecayPeriod > 0, "Emissions: Invalid decay period for Vote2Earn");
    require($.nextCycle > 0, "Emissions: Invalid cycle number");
    if ($.nextCycle == 1) {
      return 0;
    }

    return ($.nextCycle - 1) / $.vote2EarnDecayPeriod;
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
    EmissionsStorage storage $ = _getEmissionsStorage();
    uint256 vote2earnDecayPeriods = _calculateVote2EarnDecayPeriods();

    uint256 percentageToDecay = $.vote2EarnDecay * vote2earnDecayPeriods;

    return percentageToDecay > $.maxVote2EarnDecay ? $.maxVote2EarnDecay : percentageToDecay;
  }

  /**
   * Calculate the amount of B3TR to be minted for the Vote2Earn contract for the next cycle
   *
   * @return uint256
   */
  function _calculateVote2EarnAmount() internal view returns (uint256) {
    EmissionsStorage storage $ = _getEmissionsStorage();
    uint256 percentageToDecay = _calculateVote2EarnDecayPercentage();

    uint256 scaledXAllocation = _calculateNextXAllocation() * $.scalingFactor;

    uint256 vote2EarnScaled = (scaledXAllocation * (100 - percentageToDecay)) / 100;

    return vote2EarnScaled / $.scalingFactor;
  }

  /**
   * Calculate the amount of B3TR to be minted for the Treasury for the next cycle
   *
   * @return uint256
   */
  function _calculateTreasuryAmount() internal view returns (uint256) {
    EmissionsStorage storage $ = _getEmissionsStorage();
    uint256 scaledAllocations = (_calculateNextXAllocation() + _calculateVote2EarnAmount()) * $.scalingFactor;
    uint256 treasuryAmount = (scaledAllocations * $.treasuryPercentage) / 10000;

    return treasuryAmount / $.scalingFactor;
  }

  // ----------- Getters ----------- //

  function getXAllocationAmount(uint256 cycle) public view returns (uint256) {
    EmissionsStorage storage $ = _getEmissionsStorage();

    require(cycle <= $.nextCycle, "Emissions: Cycle not reached yet");
    return isCycleDistributed(cycle) ? $.emissions[cycle].xAllocations : _calculateNextXAllocation();
  }

  function getVote2EarnAmount(uint256 cycle) public view returns (uint256) {
    EmissionsStorage storage $ = _getEmissionsStorage();

    require(cycle <= $.nextCycle, "Emissions: Cycle not reached yet");
    return isCycleDistributed(cycle) ? $.emissions[cycle].vote2Earn : _calculateVote2EarnAmount();
  }

  function getTreasuryAmount(uint256 cycle) public view returns (uint256) {
    EmissionsStorage storage $ = _getEmissionsStorage();

    require(cycle <= $.nextCycle, "Emissions: Cycle not reached yet");
    return isCycleDistributed(cycle) ? $.emissions[cycle].treasury : _calculateTreasuryAmount();
  }

  function isCycleDistributed(uint256 cycle) public view returns (bool) {
    EmissionsStorage storage $ = _getEmissionsStorage();
    return $.emissions[cycle].xAllocations != 0;
  }

  function isCycleEnded(uint256 cycle) public view returns (bool) {
    require(cycle <= getCurrentCycle(), "Emissions: Cycle not reached yet");

    if (cycle < getCurrentCycle()) {
      return true;
    }

    EmissionsStorage storage $ = _getEmissionsStorage();
    return block.number >= $.lastEmissionBlock + $.cycleDuration;
  }

  function getCurrentCycle() public view returns (uint256) {
    EmissionsStorage storage $ = _getEmissionsStorage();
    require($.nextCycle > 0, "Emissions: not bootstrapped yet");
    return $.nextCycle - 1;
  }

  function getNextCycleBlock() public view returns (uint256) {
    EmissionsStorage storage $ = _getEmissionsStorage();
    return $.lastEmissionBlock + $.cycleDuration;
  }

  function isNextCycleDistributable() public view returns (bool) {
    EmissionsStorage storage $ = _getEmissionsStorage();
    return block.number >= $.lastEmissionBlock + $.cycleDuration;
  }

  function getRemainingEmissions() public view returns (uint256) {
    EmissionsStorage storage $ = _getEmissionsStorage();
    return $.b3tr.cap() - $.totalEmissions;
  }

  function treasury() public view returns (address) {
    return _getEmissionsStorage()._treasury;
  }

  function vote2Earn() public view returns (address) {
    return _getEmissionsStorage()._vote2Earn;
  }

  function xAllocations() public view returns (address) {
    return _getEmissionsStorage()._xAllocations;
  }

  function b3tr() public view returns (IB3TR) {
    return _getEmissionsStorage().b3tr;
  }

  function xAllocationsGovernor() public view returns (IXAllocationVotingGovernor) {
    return _getEmissionsStorage().xAllocationsGovernor;
  }

  function cycleDuration() public view returns (uint256) {
    return _getEmissionsStorage().cycleDuration;
  }

  function nextCycle() public view returns (uint256) {
    return _getEmissionsStorage().nextCycle;
  }

  function xAllocationsDecay() public view returns (uint256) {
    return _getEmissionsStorage().xAllocationsDecay;
  }

  function vote2EarnDecay() public view returns (uint256) {
    return _getEmissionsStorage().vote2EarnDecay;
  }

  function maxVote2EarnDecay() public view returns (uint256) {
    return _getEmissionsStorage().maxVote2EarnDecay;
  }

  function xAllocationsDecayPeriod() public view returns (uint256) {
    return _getEmissionsStorage().xAllocationsDecayPeriod;
  }

  function vote2EarnDecayPeriod() public view returns (uint256) {
    return _getEmissionsStorage().vote2EarnDecayPeriod;
  }

  function initialXAppAllocation() public view returns (uint256) {
    return _getEmissionsStorage().initialXAppAllocation;
  }

  function treasuryPercentage() public view returns (uint256) {
    return _getEmissionsStorage().treasuryPercentage;
  }

  function lastEmissionBlock() public view returns (uint256) {
    return _getEmissionsStorage().lastEmissionBlock;
  }

  function scalingFactor() public view returns (uint256) {
    return _getEmissionsStorage().scalingFactor;
  }

  function totalEmissions() public view returns (uint256) {
    return _getEmissionsStorage().totalEmissions;
  }

  function emissions(uint256 cycle) public view returns (Emission memory) {
    return _getEmissionsStorage().emissions[cycle];
  }

  // ----------- Setters ----------- //

  function setXallocationsAddress(address xAllocationAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(xAllocationAddress != address(0), "Emissions: xAllocationAddress cannot be the zero address");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $._xAllocations = xAllocationAddress;
  }

  function setVote2EarnAddress(address vote2EarnAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(vote2EarnAddress != address(0), "Emissions: vote2EarnAddress cannot be the zero address");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $._vote2Earn = vote2EarnAddress;
  }

  function setTreasuryAddress(address treasuryAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(treasuryAddress != address(0), "Emissions: treasuryAddress cannot be the zero address");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $._treasury = treasuryAddress;
  }

  function setCycleDuration(uint256 _cycleDuration) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_cycleDuration > 0, "Emissions: Cycle duration must be greater than 0");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $.cycleDuration = _cycleDuration;
  }

  function setXAllocationsDecay(uint256 _decay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_decay <= 100, "Emissions: xAllocations decay must be between 0 and 100");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $.xAllocationsDecay = _decay;
  }

  function setVote2EarnDecay(uint256 _decay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_decay <= 100, "Emissions: vote2Earn decay must be between 0 and 100");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $.vote2EarnDecay = _decay;
  }

  function setXAllocationsDecayPeriod(uint256 _period) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_period > 0, "Emissions: xAllocations decay period must be greater than 0");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $.xAllocationsDecayPeriod = _period;
  }

  function setVote2EarnDecayPeriod(uint256 _period) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_period > 0, "Emissions: vote2Earn decay period must be greater than 0");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $.vote2EarnDecayPeriod = _period;
  }

  /**
   * The percentage of the total allocation that goes to the treasury scaled by 100.
   * The scaling is to allow us to calculate non whole number percentages (87.5% for example)
   * @param _percentage The percentage value (scaled by 100) to set for the treasury allocation.
   */
  function setTreasuryPercentage(uint256 _percentage) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_percentage <= 10000, "Emissions: Treasury percentage must be between 0 and 10000");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $.treasuryPercentage = _percentage;
  }

  function setScalingFactor(uint256 _scalingFactor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_scalingFactor > 0, "Emissions: Scaling factor must be greater than 0");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $.scalingFactor = _scalingFactor;
  }

  function setMaxVote2EarnDecay(uint256 _maxVote2EarnDecay) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_maxVote2EarnDecay <= 100, "Emissions: Max vote2Earn decay must be between 0 and 100");
    EmissionsStorage storage $ = _getEmissionsStorage();
    $.maxVote2EarnDecay = _maxVote2EarnDecay;
  }

  function setXAllocationsGovernorAddress(address _xAllocationsGovernor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_xAllocationsGovernor != address(0), "Emissions: _xAllocationsGovernor cannot be the zero address");
    require(
      IXAllocationVotingGovernor(_xAllocationsGovernor).votingPeriod() < cycleDuration(),
      "Emissions: Voting period must be less than cycle duration"
    );

    EmissionsStorage storage $ = _getEmissionsStorage();
    $.xAllocationsGovernor = IXAllocationVotingGovernor(_xAllocationsGovernor);
  }
}
