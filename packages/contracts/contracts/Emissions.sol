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

  // Starting block for emissions
  uint256 public START_BLOCK;

  // Destinations for emissions
  address public xAllocations;
  address public vote2Earn;
  address public treasury;

  // Pre-mint allocations
  uint256[] public preMintAllocations;
  // Last mint allocations
  uint256[] public lastMintAllocations;

  // ----------- Cycle attributes ----------- //
  uint256 public nextCycle; // Next cycle number
  uint256 public cycleDuration; // Duration of a cycle in blocks
  uint256 private _lastCycleId; // Last cycle number, only set after the last cycle is distributed

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
  uint256[] public lastEmissions; // Last emissions for xAllocations & vote2Earn

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
    uint256 _treasuryPercentage,
    uint256[2] memory _lastEmissions
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
    require(
      _lastEmissions[0] + _lastEmissions[1] > 0 && _lastEmissions[0] + _lastEmissions[1] < 100,
      "Emissions: Last emissions for x allocations and vote2Earn must be between 0 and 100"
    );

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

    // Set last emissions
    lastEmissions = _lastEmissions;

    // Next cycle is pre-mint
    nextCycle = 1;

    // Set roles
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(MINTER_ROLE, minter);
  }

  function preMint() public onlyRole(MINTER_ROLE) nonReentrant {
    require(preMintAllocations[0] > 0, "Emissions: Pre-mint allocations not set");
    require(START_BLOCK == 0, "Emissions: Pre-mint already done");
    require(xAllocationsGovernor != IXAllocationVotingGovernor(address(0)), "Emissions: XAllocationsGovernor not set");

    // Mint pre-mint allocations
    b3tr.mint(xAllocations, preMintAllocations[0]);
    b3tr.mint(vote2Earn, preMintAllocations[1]);
    b3tr.mint(treasury, preMintAllocations[2]);

    START_BLOCK = block.number;

    xAllocationsGovernor.proposeNewAllocationRound();

    nextCycle++;
  }

  function distribute() public nonReentrant {
    require(START_BLOCK > 0, "Emissions: Pre-mint not done");
    require(isCycleDistributable(nextCycle), "Emissions: Next cycle not started yet");

    // Mint emissions for current cycle
    uint256 xAllocationsAmount = getCurrentXAllocationsAmount();
    uint256 vote2EarnAmount = getCurrentVote2EarnAmount();
    uint256 treasuryAmount = getCurrentTreasuryAmount();

    // Check if emissions exceed B3TR cap. distributeLast should be used in this case
    require(!isLastCycle(), "Emissions: Emissions exceed B3TR cap. Use `distributeLast` instead.");

    b3tr.mint(xAllocations, xAllocationsAmount);
    b3tr.mint(vote2Earn, vote2EarnAmount);
    b3tr.mint(treasury, treasuryAmount);

    xAllocationsGovernor.proposeNewAllocationRound();

    nextCycle++;
  }

  function distributeLast() public nonReentrant {
    require(START_BLOCK > 0, "Emissions: Pre-mint not done");
    require(isLastCycle(), "Emissions: Last cycle not reached");
    require(isCycleDistributable(nextCycle), "Emissions: Last cycle not started yet");

    _lastCycleId = nextCycle;

    uint256 remainingEmissions = getRemainingEmissions();

    uint256 xAllocationAmount = getDecayedAmount(remainingEmissions, 100 - lastEmissions[0], 1);
    uint256 vote2EarnAmount = getDecayedAmount(remainingEmissions, 100 - lastEmissions[1], 1);
    uint256 treasuryAmount = remainingEmissions - xAllocationAmount - vote2EarnAmount;

    b3tr.mint(xAllocations, xAllocationAmount);
    b3tr.mint(vote2Earn, vote2EarnAmount);
    b3tr.mint(treasury, treasuryAmount);

    lastMintAllocations.push(xAllocationAmount);
    lastMintAllocations.push(vote2EarnAmount);
    lastMintAllocations.push(treasuryAmount);

    nextCycle++;
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

    return (blockNumber - cycleDuration - START_BLOCK) / (xAllocationsDecayDelay * cycleDuration);
  }

  function getXAllocationsAmount(uint256 blockNumber) public view returns (uint256) {
    return getDecayedAmount(initialEmissions, xAllocationsDecay, getXAllocationDecayPeriods(blockNumber));
  }

  function getVote2EarnDecayPeriods(uint256 blockNumber) public view returns (uint256) {
    require(blockNumber >= START_BLOCK, "Emissions: Invalid block number");

    return (blockNumber - cycleDuration - START_BLOCK) / (vote2EarnDecayDelay * cycleDuration);
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

  function getLastMintAllocations() public view returns (uint256[] memory) {
    return lastMintAllocations;
  }

  function getXAllocationAmountForCycle(uint256 cycle) public view returns (uint256) {
    if (cycle == 1) {
      return preMintAllocations[0];
    }
    return getXAllocationsAmount(getCycleBlock(cycle));
  }

  function getVote2EarnAmountForCycle(uint256 cycle) public view returns (uint256) {
    if (cycle == 1) {
      return preMintAllocations[1];
    }
    return getVote2EarnAmount(getCycleBlock(cycle));
  }

  function getTreasuryAmountForCycle(uint256 cycle) public view returns (uint256) {
    if (cycle == 1) {
      return preMintAllocations[2];
    }
    return getTreasuryAmount(getCycleBlock(cycle));
  }

  function getCycleBlock(uint256 cycle) public view returns (uint256) {
    require(cycle >= 1, "Emissions: Invalid cycle number");

    return START_BLOCK + (cycle - 1) * cycleDuration;
  }

  function getCycleFromBlock(uint256 blockNumber) public view returns (uint256) {
    require(blockNumber >= START_BLOCK, "Emissions: Invalid block number");

    return ((blockNumber - START_BLOCK) / cycleDuration) + 1;
  }

  function isCycleDistributed(uint256 cycle) public view returns (bool) {
    return cycle < nextCycle;
  }

  function getCurrentCycle() public view returns (uint256) {
    return nextCycle - 1;
  }

  function isCycleEnded(uint256 cycle) public view returns (bool) {
    require(cycle >= 1, "Emissions: Invalid cycle number");
    require(isCycleDistributed(cycle), "Emissions: Cycle not distributed");

    return block.number >= getCycleBlock(nextCycle);
  }

  function isCycleDistributable(uint256 cycle) public view returns (bool) {
    return block.number >= getCycleBlock(cycle);
  }

  function isLastCycle() public view returns (bool) {
    uint256 remainingEmissions = getRemainingEmissions();

    return ((getCurrentXAllocationsAmount() + getCurrentVote2EarnAmount() + getCurrentTreasuryAmount()) >
      remainingEmissions);
  }

  function isLastCycleId(uint256 id) public view returns (bool) {
    if (id == 0) {
      return false;
    }

    return id == _lastCycleId;
  }

  function getLastXAllocationsAmount() public view returns (uint256) {
    require(isLastCycle(), "Emissions: Last cycle not reached");

    uint256 remainingEmissions = getRemainingEmissions();

    return getDecayedAmount(remainingEmissions, 100 - lastEmissions[0], 1);
  }

  function getLastVote2EarnAmount() public view returns (uint256) {
    require(isLastCycle(), "Emissions: Last cycle not reached");

    uint256 remainingEmissions = getRemainingEmissions();

    return getDecayedAmount(remainingEmissions, 100 - lastEmissions[1], 1);
  }

  function getLastTreasuryAmount() public view returns (uint256) {
    require(isLastCycle(), "Emissions: Last cycle not reached");

    uint256 remainingEmissions = getRemainingEmissions();
    uint256 xAllocationAmount = getLastXAllocationsAmount();
    uint256 vote2EarnAmount = getLastVote2EarnAmount();

    return remainingEmissions - xAllocationAmount - vote2EarnAmount;
  }

  function getRemainingEmissions() public view returns (uint256) {
    return b3tr.cap() - b3tr.totalSupply();
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
    require(
      _maxVote2EarnDecay >= 0 && _maxVote2EarnDecay <= 100,
      "Emissions: Max vote2Earn decay must be between 0 and 100"
    );
    maxVote2EarnDecay = _maxVote2EarnDecay;
  }

  function setLastEmissions(uint256[] memory _lastEmissions) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_lastEmissions.length == 2, "Emissions: Invalid input length. Expected 2.");
    require(
      _lastEmissions[0] + _lastEmissions[1] > 0 && _lastEmissions[0] + _lastEmissions[1] < 100,
      "Emissions: Last emissions for x allocations and vote2Earn must be between 0 and 100"
    );

    lastEmissions = _lastEmissions;
  }

  function setXAllocationsGovernorAddress(address _xAllocationsGovernor) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_xAllocationsGovernor != address(0), "Emissions: _xAllocationsGovernor cannot be the zero address");
    require(
      IXAllocationVotingGovernor(_xAllocationsGovernor).votingPeriod() +
        IXAllocationVotingGovernor(_xAllocationsGovernor).votingDelay() <
        cycleDuration,
      "Emissions: Voting period and delay must be less than cycle duration"
    );
    xAllocationsGovernor = IXAllocationVotingGovernor(_xAllocationsGovernor);
  }
}
