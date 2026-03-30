// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title INavigatorRegistry
 * @notice Interface for the NavigatorRegistry contract.
 * Navigators are professional voting delegates who stake B3TR to vote on behalf of citizens.
 */
interface INavigatorRegistry {
  // ======================== Errors ======================== //

  // -- Staking --
  error StakeBelowMinimum(uint256 provided, uint256 minimum);
  error StakeExceedsMaximum(uint256 provided, uint256 maximum);
  error AlreadyRegistered(address navigator);
  error NotRegistered(address navigator);
  error NavigatorDeactivated(address navigator);
  error NavigatorStillActive(address navigator);

  // -- Delegation --
  error AlreadyDelegated(address citizen, address currentNavigator);
  error NotDelegated(address citizen);
  error NotANavigator(address account);
  error NavigatorCannotAcceptDelegations(address navigator);
  error ExceedsNavigatorCapacity(address navigator, uint256 requested, uint256 available);
  error ZeroDelegationAmount();
  error InsufficientDelegation(uint256 requested, uint256 available);

  // -- Voting --
  error EmptyPreferences();
  error TooManyApps(uint256 count);
  error PreferencesAlreadySet(address navigator, uint256 roundId);
  error InvalidDecision(uint8 decision);
  error DecisionAlreadySet(address navigator, uint256 proposalId);
  error DecisionNotSet(address navigator, uint256 proposalId);
  error PreferencesNotSet(address navigator, uint256 roundId);

  // -- Fees --
  error FeesStillLocked(uint256 roundId, uint256 unlockRound, uint256 currentRound);
  error NoFeesToClaim(address navigator, uint256 roundId);
  error FeesForfeited(address navigator);

  // -- Slashing --
  error AlreadySlashed(address navigator, string reason);
  error NoInfractionFound(address navigator, string reason);
  error NoStakeToSlash(address navigator);

  // -- Lifecycle --
  error AlreadyExiting(address navigator);
  error NotExiting(address navigator);
  error NoticePeriodNotElapsed(uint256 currentRound, uint256 requiredRound);
  error AlreadyDeactivated(address navigator);

  // ======================== Events ======================== //

  // -- Staking --
  event NavigatorRegistered(address indexed navigator, uint256 stakeAmount, string metadataURI);
  event StakeAdded(address indexed navigator, uint256 amount, uint256 newTotal);
  event StakeWithdrawn(address indexed navigator, uint256 amount, uint256 remaining);

  // -- Delegation --
  event DelegationCreated(address indexed citizen, address indexed navigator, uint256 amount);
  event DelegationUpdated(address indexed citizen, address indexed navigator, uint256 newAmount);
  event DelegationRemoved(address indexed citizen, address indexed navigator);
  event NavigatorChangeRequested(address indexed citizen, address indexed oldNavigator, address indexed newNavigator);

  // -- Voting --
  event AllocationPreferencesSet(address indexed navigator, uint256 indexed roundId, bytes32[] appIds);
  event ProposalDecisionSet(address indexed navigator, uint256 indexed proposalId, uint8 decision);

  // -- Fees --
  event FeeDeposited(address indexed navigator, uint256 indexed roundId, uint256 amount);
  event FeeClaimed(address indexed navigator, uint256 indexed roundId, uint256 amount);

  // -- Slashing --
  event NavigatorSlashed(address indexed navigator, uint256 amount, uint256 remainingStake, string reason);

  // -- Lifecycle --
  event ExitAnnounced(address indexed navigator, uint256 announcedAtRound, uint256 effectiveRound);
  event ExitFinalized(address indexed navigator);
  event NavigatorDeactivatedEvent(address indexed navigator, uint256 slashPercentage);
  event MetadataURIUpdated(address indexed navigator, string newURI);
  event ReportSubmitted(address indexed navigator, uint256 indexed roundId, string reportURI);

  // ======================== Registration & Staking ======================== //

  function register(uint256 amount, string calldata metadataURI) external;
  function addStake(uint256 amount) external;
  function withdrawStake(uint256 amount) external;

  // ======================== Delegation ======================== //

  function delegate(address navigator, uint256 amount) external;
  function reduceDelegation(uint256 reduceBy) external;
  function undelegate() external;

  // ======================== Voting Decisions ======================== //

  function setAllocationPreferences(uint256 roundId, bytes32[] calldata appIds) external;
  function setProposalDecision(uint256 proposalId, uint8 decision) external;

  // ======================== Fees ======================== //

  function claimFee(uint256 roundId) external;
  function depositNavigatorFee(address navigator, uint256 roundId, uint256 amount) external;

  // ======================== Slashing Reports ======================== //

  function reportMissedAllocationVote(address navigator, uint256 roundId) external;
  function reportMissedGovernanceVote(address navigator, uint256 proposalId) external;
  function reportStalePreferences(address navigator, uint256 roundId) external;
  function reportMissedReport(address navigator, uint256 roundId) external;
  function deactivateNavigator(address navigator, uint256 slashPercentage, bool slashFees) external;

  // ======================== Lifecycle ======================== //

  function announceExit() external;
  function finalizeExit() external;
  function setMetadataURI(string calldata uri) external;
  function submitReport(string calldata reportURI) external;

  // ======================== Governance Setters ======================== //

  function setMinStake(uint256 newMinStake) external;
  function setMaxStakePercentage(uint256 newPercentage) external;
  function setFeeLockPeriod(uint256 newPeriod) external;
  function setFeePercentage(uint256 newPercentage) external;
  function setExitNoticePeriod(uint256 newPeriod) external;
  function setReportInterval(uint256 newInterval) external;
  function setMinorSlashPercentage(uint256 newPercentage) external;
  function setXAllocationVoting(address newAddress) external;
  function setRelayerRewardsPool(address newAddress) external;

  // ======================== View Functions ======================== //

  // -- Staking --
  function getStake(address navigator) external view returns (uint256);
  function isNavigator(address account) external view returns (bool);
  function canAcceptDelegations(address navigator) external view returns (bool);
  function getDelegationCapacity(address navigator) external view returns (uint256);
  function getRemainingCapacity(address navigator) external view returns (uint256);
  function getMinStake() external view returns (uint256);
  function getMaxStake() external view returns (uint256);

  // -- Delegation --
  function getNavigator(address citizen) external view returns (address);
  function getDelegatedAmount(address citizen) external view returns (uint256);
  function getTotalDelegated(address navigator) external view returns (uint256);
  function getCitizens(address navigator) external view returns (address[] memory);
  function getCitizenCount(address navigator) external view returns (uint256);
  function isDelegated(address citizen) external view returns (bool);
  function getDelegatedAmountAtTimepoint(address citizen, uint256 timepoint) external view returns (uint256);

  // -- Voting --
  function getAllocationPreferences(address navigator, uint256 roundId) external view returns (bytes32[] memory);
  function hasSetPreferences(address navigator, uint256 roundId) external view returns (bool);
  function getProposalDecision(address navigator, uint256 proposalId) external view returns (uint8);
  function hasSetDecision(address navigator, uint256 proposalId) external view returns (bool);

  // -- Fees --
  function getRoundFee(address navigator, uint256 roundId) external view returns (uint256);
  function getFeeLockPeriod() external view returns (uint256);
  function getFeePercentage() external view returns (uint256);
  function isRoundFeeUnlocked(uint256 roundId) external view returns (bool);

  // -- Slashing --
  function getTotalSlashed(address navigator) external view returns (uint256);
  function getMinorSlashPercentage() external view returns (uint256);

  // -- Lifecycle --
  function isExiting(address navigator) external view returns (bool);
  function isExitReady(address navigator) external view returns (bool);
  function isDeactivated(address navigator) external view returns (bool);
  function getExitNoticePeriod() external view returns (uint256);
  function getReportInterval() external view returns (uint256);

  // -- Profile --
  function getMetadataURI(address navigator) external view returns (string memory);
  function getLastReportRound(address navigator) external view returns (uint256);
  function getLastReportURI(address navigator) external view returns (string memory);

  // -- Meta --
  function version() external pure returns (string memory);
  function GOVERNANCE_ROLE() external view returns (bytes32);
  function UPGRADER_ROLE() external view returns (bytes32);
  function BASIS_POINTS() external view returns (uint256);
}
