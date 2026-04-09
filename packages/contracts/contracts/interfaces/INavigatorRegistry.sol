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

  /// @notice Thrown when stake is below minimum
  error StakeBelowMinimum(uint256 provided, uint256 minimum);

  /// @notice Thrown when stake exceeds maximum (percentage of VOT3 supply)
  error StakeExceedsMaximum(uint256 provided, uint256 maximum);

  /// @notice Thrown when caller is already a registered navigator
  error AlreadyRegistered(address navigator);

  /// @notice Thrown when caller is currently delegating to a navigator
  error DelegatorCannotRegister(address delegator, address currentNavigator);

  /// @notice Thrown when caller is not a registered navigator
  error NotRegistered(address navigator);

  /// @notice Thrown when navigator is deactivated
  error NavigatorDeactivated(address navigator);

  /// @notice Thrown when navigator is still active and must exit first
  error NavigatorStillActive(address navigator);

  // -- Delegation --

  /// @notice Thrown when citizen is already delegated to a navigator
  error AlreadyDelegated(address citizen, address currentNavigator);

  /// @notice Thrown when citizen is not delegated to any navigator
  error NotDelegated(address citizen);

  /// @notice Thrown when target address is not a registered navigator
  error NotANavigator(address account);

  /// @notice Thrown when navigator cannot accept new delegations
  error NavigatorCannotAcceptDelegations(address navigator);

  /// @notice Thrown when delegation would exceed navigator's capacity
  error ExceedsNavigatorCapacity(address navigator, uint256 requested, uint256 available);

  /// @notice Thrown when delegation amount is zero
  error ZeroDelegationAmount();

  /// @notice Thrown when trying to reduce more than the delegated amount
  error InsufficientDelegation(uint256 requested, uint256 available);

  /// @notice Thrown when a navigator tries to delegate to themselves
  error SelfDelegationNotAllowed(address account);

  // -- Voting --

  /// @notice Thrown when appIds and percentages arrays have different lengths
  error LengthMismatch(uint256 appsLength, uint256 percentagesLength);

  /// @notice Thrown when allocation preferences array is empty
  error EmptyPreferences();

  /// @notice Thrown when too many apps in preferences
  error TooManyApps(uint256 count);

  /// @notice Thrown when preferences already set for this round
  error PreferencesAlreadySet(address navigator, uint256 roundId);

  /// @notice Thrown when governance decision value is invalid
  error InvalidDecision(uint8 decision);

  /// @notice Thrown when decision already set for this proposal
  error DecisionAlreadySet(address navigator, uint256 proposalId);

  /// @notice Thrown when querying a decision that hasn't been set
  error DecisionNotSet(address navigator, uint256 proposalId);

  /// @notice Thrown when querying preferences that haven't been set
  error PreferencesNotSet(address navigator, uint256 roundId);

  // -- Fees --

  /// @notice Thrown when trying to claim fees that are still locked
  error FeesStillLocked(uint256 roundId, uint256 unlockRound, uint256 currentRound);

  /// @notice Thrown when there are no fees to claim for the round
  error NoFeesToClaim(address navigator, uint256 roundId);

  /// @notice Thrown when navigator's fees have been forfeited via major slash
  error FeesForfeited(address navigator);

  // -- Slashing --

  /// @notice Thrown when navigator has already been slashed for this infraction
  error AlreadySlashed(address navigator, string reason);

  /// @notice Thrown when no infraction was found (report is invalid)
  error NoInfractionFound(address navigator, string reason);

  /// @notice Thrown when navigator has no stake to slash
  error NoStakeToSlash(address navigator);

  // -- Lifecycle --

  /// @notice Thrown when navigator has already announced exit
  error AlreadyExiting(address navigator);

  /// @notice Thrown when navigator has not announced exit
  error NotExiting(address navigator);

  /// @notice Thrown when notice period has not elapsed
  error NoticePeriodNotElapsed(uint256 currentRound, uint256 requiredRound);

  /// @notice Thrown when navigator is already deactivated
  error AlreadyDeactivated(address navigator);

  // -- General --

  /// @notice Thrown when a zero address is provided for a required parameter
  error ZeroAddress(string param);

  /// @notice Thrown when a parameter value is invalid
  error InvalidParameter(string reason);

  /// @notice Thrown when caller is not authorized
  error UnauthorizedCaller(address caller);

  /// @notice Thrown when trying to withdraw more stake than available
  error InsufficientStake(uint256 available, uint256 requested);

  /// @notice Thrown when a duplicate app ID is found in preferences
  error DuplicateApp(bytes32 appId);

  /// @notice Thrown when allocation percentages don't sum to BASIS_POINTS
  error PercentageMismatch(uint256 total, uint256 expected);

  /// @notice Thrown when slash percentage exceeds maximum
  error SlashExceedsMax(uint256 slashPercentage, uint256 max);

  /// @notice Thrown when a percentage value is zero
  error ZeroPercentage();

  // ======================== Events ======================== //

  // -- Staking --

  /// @notice Emitted when a navigator registers by staking B3TR
  /// @param navigator The navigator address
  /// @param stakeAmount The B3TR amount staked
  /// @param metadataURI The navigator's metadata URI
  event NavigatorRegistered(address indexed navigator, uint256 stakeAmount, string metadataURI);

  /// @notice Emitted when a navigator adds to their stake
  /// @param navigator The navigator address
  /// @param amount The additional B3TR staked
  /// @param newTotal The new total stake
  event StakeAdded(address indexed navigator, uint256 amount, uint256 newTotal);

  /// @notice Emitted when a navigator withdraws stake after exit
  /// @param navigator The navigator address
  /// @param amount The B3TR amount withdrawn
  /// @param remaining The remaining stake
  event StakeWithdrawn(address indexed navigator, uint256 amount, uint256 remaining);

  // -- Delegation --

  /// @notice Emitted when a citizen delegates VOT3 to a navigator for the first time
  /// @param citizen The delegating citizen address
  /// @param navigator The navigator receiving the delegation
  /// @param amount The VOT3 amount delegated
  event DelegationCreated(address indexed citizen, address indexed navigator, uint256 amount);

  /// @notice Emitted when a citizen increases their existing delegation
  /// @param citizen The citizen address
  /// @param navigator The navigator address
  /// @param addedAmount The additional VOT3 delegated
  /// @param newTotal The new total delegation amount
  event DelegationIncreased(address indexed citizen, address indexed navigator, uint256 addedAmount, uint256 newTotal);

  /// @notice Emitted when a citizen reduces their delegation (but doesn't fully remove)
  /// @param citizen The citizen address
  /// @param navigator The navigator address
  /// @param removedAmount The VOT3 amount removed
  /// @param newTotal The new total delegation amount
  event DelegationDecreased(address indexed citizen, address indexed navigator, uint256 removedAmount, uint256 newTotal);

  /// @notice Emitted when a citizen fully undelegates from a navigator
  /// @param citizen The citizen address
  /// @param navigator The navigator address
  event DelegationRemoved(address indexed citizen, address indexed navigator);

  // -- Voting --

  /// @notice Emitted when a navigator sets allocation preferences for a round
  /// @param navigator The navigator address
  /// @param roundId The allocation round ID
  /// @param appIds The app IDs selected
  event AllocationPreferencesSet(address indexed navigator, uint256 indexed roundId, bytes32[] appIds);

  /// @notice Emitted when a navigator sets a governance proposal decision
  /// @param navigator The navigator address
  /// @param proposalId The proposal ID
  /// @param decision The vote decision (1=Against, 2=For, 3=Abstain)
  event ProposalDecisionSet(address indexed navigator, uint256 indexed proposalId, uint8 decision);

  // -- Fees --

  /// @notice Emitted when fees are deposited for a navigator
  /// @param navigator The navigator address
  /// @param roundId The round the fee was earned in
  /// @param amount The B3TR fee amount
  event FeeDeposited(address indexed navigator, uint256 indexed roundId, uint256 amount);

  /// @notice Emitted when a navigator claims their unlocked fees
  /// @param navigator The navigator address
  /// @param roundId The round claimed for
  /// @param amount The B3TR amount claimed
  event FeeClaimed(address indexed navigator, uint256 indexed roundId, uint256 amount);

  // -- Slashing --

  /// @notice Emitted when a navigator is slashed (minor or major)
  /// @param navigator The navigator address
  /// @param amount The B3TR amount slashed
  /// @param remainingStake The stake remaining after slash
  /// @param reason The infraction reason string
  event NavigatorSlashed(address indexed navigator, uint256 amount, uint256 remainingStake, string reason);

  // -- Lifecycle --

  /// @notice Emitted when a navigator announces their intent to exit
  /// @param navigator The navigator address
  /// @param announcedAtRound The round when exit was announced
  /// @param effectiveDeadline The block number when the navigator becomes dead
  event ExitAnnounced(address indexed navigator, uint256 announcedAtRound, uint256 effectiveDeadline);

  /// @notice Emitted when a navigator is deactivated by governance
  /// @param navigator The navigator address
  /// @param slashPercentage The slash percentage applied (basis points)
  event NavigatorDeactivatedEvent(address indexed navigator, uint256 slashPercentage);

  /// @notice Emitted when a navigator updates their metadata URI
  /// @param navigator The navigator address
  /// @param newURI The new metadata URI
  event MetadataURIUpdated(address indexed navigator, string newURI);

  /// @notice Emitted when a navigator submits a periodic report
  /// @param navigator The navigator address
  /// @param roundId The round the report covers
  /// @param reportURI The report metadata URI
  event ReportSubmitted(address indexed navigator, uint256 indexed roundId, string reportURI);

  // ======================== Registration & Staking ======================== //

  /// @notice Register as a navigator by staking B3TR
  /// @param amount The B3TR amount to stake (must meet minimum)
  /// @param metadataURI The navigator's metadata URI
  function register(uint256 amount, string calldata metadataURI) external;

  /// @notice Add more B3TR to an existing navigator's stake
  /// @param amount The additional B3TR to stake
  function addStake(uint256 amount) external;

  /// @notice Reduce stake while active (must stay above min stake and maintain delegation capacity)
  /// @param amount The B3TR amount to reduce
  function reduceStake(uint256 amount) external;

  /// @notice Withdraw staked B3TR (only after exit is finalized or deactivation)
  /// @param amount The B3TR amount to withdraw
  function withdrawStake(uint256 amount) external;

  // ======================== Delegation ======================== //

  /// @notice Delegate VOT3 to a navigator (first-time only)
  /// @param navigator The navigator to delegate to
  /// @param amount The VOT3 amount to delegate
  function delegate(address navigator, uint256 amount) external;

  /// @notice Increase delegation to the current navigator
  /// @param amount The additional VOT3 to delegate
  function increaseDelegation(uint256 amount) external;

  /// @notice Partially reduce delegation amount
  /// @param reduceBy The VOT3 amount to reduce delegation by
  function reduceDelegation(uint256 reduceBy) external;

  /// @notice Fully undelegate from the current navigator
  function undelegate() external;

  // ======================== Voting Decisions ======================== //

  /// @notice Set allocation voting preferences for a round
  /// @param roundId The allocation round ID
  /// @param appIds Array of app IDs to vote for
  /// @param percentages Allocation percentage per app in basis points (must sum to 10000)
  function setAllocationPreferences(uint256 roundId, bytes32[] calldata appIds, uint256[] calldata percentages) external;

  /// @notice Set a governance proposal voting decision
  /// @param proposalId The governance proposal ID
  /// @param decision The vote decision (1=Against, 2=For, 3=Abstain)
  function setProposalDecision(uint256 proposalId, uint8 decision) external;

  // ======================== Fees ======================== //

  /// @notice Claim unlocked fees for a specific round
  /// @param roundId The round to claim fees for
  function claimFee(uint256 roundId) external;

  /// @notice Deposit a fee for a navigator in a specific round
  /// @param navigator The navigator to receive the fee
  /// @param roundId The round the fee was earned in
  /// @param amount The B3TR fee amount
  function depositNavigatorFee(address navigator, uint256 roundId, uint256 amount) external;

  // ======================== Slashing Reports ======================== //

  /// @notice Report a navigator for missing allocation vote in a round
  /// @param navigator The navigator address
  /// @param roundId The round they missed
  function reportMissedAllocationVote(address navigator, uint256 roundId) external;

  /// @notice Report a navigator for missing a governance proposal vote
  /// @param navigator The navigator address
  /// @param proposalId The proposal they missed
  function reportMissedGovernanceVote(address navigator, uint256 proposalId) external;

  /// @notice Report a navigator for stale allocation preferences (no update in 3+ rounds)
  /// @param navigator The navigator address
  /// @param roundId The round to check staleness against
  function reportStalePreferences(address navigator, uint256 roundId) external;

  /// @notice Report a navigator for missing a required periodic report
  /// @param navigator The navigator address
  /// @param roundId The current round to check against
  function reportMissedReport(address navigator, uint256 roundId) external;

  /// @notice Report a navigator for setting allocation preferences after the cutoff
  /// @param navigator The navigator address
  /// @param roundId The round to check
  function reportLatePreferences(address navigator, uint256 roundId) external;

  /// @notice Deactivate a navigator by governance decision with optional slashing
  /// @param navigator The navigator address
  /// @param slashPercentage Percentage of stake to slash (basis points)
  /// @param slashFees Whether to also forfeit all unclaimed locked fees
  function deactivateNavigator(address navigator, uint256 slashPercentage, bool slashFees) external;

  // ======================== Lifecycle ======================== //

  /// @notice Announce intent to exit as a navigator, starting the notice period
  function announceExit() external;

  /// @notice Update the navigator's metadata URI
  /// @param uri The new metadata URI
  function setMetadataURI(string calldata uri) external;

  /// @notice Submit a periodic report for the current round
  /// @param reportURI The report metadata URI
  function submitReport(string calldata reportURI) external;

  // ======================== Governance Setters ======================== //

  /// @notice Set the minimum B3TR stake required to register as a navigator
  /// @param newMinStake The new minimum stake
  function setMinStake(uint256 newMinStake) external;

  /// @notice Set the maximum stake as a percentage of VOT3 total supply
  /// @param newPercentage The new max stake percentage (basis points)
  function setMaxStakePercentage(uint256 newPercentage) external;

  /// @notice Set the number of rounds fees are locked before claiming
  /// @param newPeriod The new fee lock period (in rounds)
  function setFeeLockPeriod(uint256 newPeriod) external;

  /// @notice Set the navigator fee percentage deducted from citizen rewards
  /// @param newPercentage The new fee percentage (basis points)
  function setFeePercentage(uint256 newPercentage) external;

  /// @notice Set the exit notice period navigators must remain active after announcing exit
  /// @param newPeriod The new notice period (in rounds)
  function setExitNoticePeriod(uint256 newPeriod) external;

  /// @notice Set the interval at which navigators must submit reports
  /// @param newInterval The new report interval (in rounds)
  function setReportInterval(uint256 newInterval) external;

  /// @notice Set the percentage of stake slashed for minor infractions
  /// @param newPercentage The new minor slash percentage (basis points)
  function setMinorSlashPercentage(uint256 newPercentage) external;

  /// @notice Set the cutoff period before round end for setting preferences
  /// @param newPeriod The new cutoff period (in blocks)
  function setPreferenceCutoffPeriod(uint256 newPeriod) external;

  /// @notice Set the XAllocationVoting contract address
  /// @param newAddress The new XAllocationVoting address
  function setXAllocationVoting(address newAddress) external;

  /// @notice Set the RelayerRewardsPool contract address
  /// @param newAddress The new RelayerRewardsPool address
  function setRelayerRewardsPool(address newAddress) external;

  /// @notice Set the VoterRewards contract address
  /// @param newAddress The new VoterRewards address
  function setVoterRewards(address newAddress) external;

  // ======================== View Functions ======================== //

  // -- Staking --

  /// @notice Get the staked B3TR amount for a navigator
  /// @param navigator The navigator address
  /// @return The staked B3TR amount
  function getStake(address navigator) external view returns (uint256);

  /// @notice Check if an address is a registered and active navigator
  /// @param account The address to check
  /// @return True if the account is a registered, non-deactivated navigator
  function isNavigator(address account) external view returns (bool);

  /// @notice Check if a navigator can accept new delegations
  /// @param navigator The navigator address
  /// @return True if the navigator is active, above min stake, and not exiting
  function canAcceptDelegations(address navigator) external view returns (bool);

  /// @notice Get the maximum VOT3 that can be delegated to a navigator
  /// @param navigator The navigator address
  /// @return The maximum delegation capacity (stake * 10)
  function getDelegationCapacity(address navigator) external view returns (uint256);

  /// @notice Get the remaining delegation capacity for a navigator
  /// @param navigator The navigator address
  /// @return The remaining capacity (0 if at or over capacity)
  function getRemainingCapacity(address navigator) external view returns (uint256);

  /// @notice Get the minimum B3TR stake required to register
  /// @return The minimum stake amount
  function getMinStake() external view returns (uint256);

  /// @notice Get the current maximum stake allowed (based on VOT3 supply)
  /// @return The maximum stake amount
  function getMaxStake() external view returns (uint256);

  // -- Delegation --

  /// @notice Get the navigator a citizen is delegated to
  /// @param citizen The citizen address
  /// @return The navigator address (address(0) if not delegated or delegation is void)
  function getNavigator(address citizen) external view returns (address);

  /// @notice Get the raw navigator stored for a citizen, ignoring dead-navigator status
  /// @param citizen The citizen address
  /// @return The raw navigator address, or address(0) if never delegated or undelegated
  function getRawNavigator(address citizen) external view returns (address);

  /// @notice Get the current VOT3 amount a citizen has delegated
  /// @param citizen The citizen address
  /// @return The delegated VOT3 amount (0 if not delegated or delegation is void)
  function getDelegatedAmount(address citizen) external view returns (uint256);

  /// @notice Get the total VOT3 delegated to a navigator
  /// @param navigator The navigator address
  /// @return The total delegated VOT3 amount
  function getTotalDelegated(address navigator) external view returns (uint256);

  /// @notice Get total VOT3 delegated to a navigator at a past block
  /// @param navigator The navigator address
  /// @param timepoint The block number to query
  /// @return The total VOT3 delegated at that block
  function getTotalDelegatedAtTimepoint(address navigator, uint256 timepoint) external view returns (uint256);

  /// @notice Check if a citizen has an active delegation
  /// @param citizen The citizen address
  /// @return True if delegated to an active navigator
  function isDelegated(address citizen) external view returns (bool);

  /// @notice Get the delegated amount at a past block (for snapshot-based voting power)
  /// @param citizen The citizen address
  /// @param timepoint The block number to query
  /// @return The delegated VOT3 amount at the given block
  function getDelegatedAmountAtTimepoint(address citizen, uint256 timepoint) external view returns (uint256);

  /// @notice Get the navigator a citizen was delegated to at a past block (checkpointed)
  /// @dev Does NOT apply dead-navigator invalidation — callers decide.
  /// @param citizen The citizen address
  /// @param timepoint The block number to query
  /// @return The navigator address at the given block (address(0) if not delegated)
  function getNavigatorAtTimepoint(address citizen, uint256 timepoint) external view returns (address);

  /// @notice Check if a citizen was delegated at a past block (checkpointed)
  /// @dev Does NOT apply dead-navigator invalidation — callers decide.
  /// @param citizen The citizen address
  /// @param timepoint The block number to query
  /// @return True if the citizen had a navigator at the given block
  function isDelegatedAtTimepoint(address citizen, uint256 timepoint) external view returns (bool);

  // -- Voting --

  /// @notice Get allocation preferences for a navigator in a round
  /// @param navigator The navigator address
  /// @param roundId The allocation round ID
  /// @return appIds The app IDs selected
  /// @return percentages The allocation percentages per app (basis points)
  function getAllocationPreferences(address navigator, uint256 roundId) external view returns (bytes32[] memory appIds, uint256[] memory percentages);

  /// @notice Check if a navigator has set preferences for a round
  /// @param navigator The navigator address
  /// @param roundId The allocation round ID
  /// @return True if preferences have been set
  function hasSetPreferences(address navigator, uint256 roundId) external view returns (bool);

  /// @notice Get the block number when preferences were set
  /// @param navigator The navigator address
  /// @param roundId The allocation round ID
  /// @return The block number (0 if not set)
  function getPreferencesSetBlock(address navigator, uint256 roundId) external view returns (uint256);

  /// @notice Get a navigator's decision for a governance proposal
  /// @param navigator The navigator address
  /// @param proposalId The proposal ID
  /// @return The vote decision (1=Against, 2=For, 3=Abstain)
  function getProposalDecision(address navigator, uint256 proposalId) external view returns (uint8);

  /// @notice Check if a navigator has set a decision for a proposal
  /// @param navigator The navigator address
  /// @param proposalId The proposal ID
  /// @return True if a decision has been set
  function hasSetDecision(address navigator, uint256 proposalId) external view returns (bool);

  // -- Fees --

  /// @notice Get the fee amount for a navigator in a specific round
  /// @param navigator The navigator address
  /// @param roundId The round ID
  /// @return The B3TR fee amount
  function getRoundFee(address navigator, uint256 roundId) external view returns (uint256);

  /// @notice Get the fee lock period (number of rounds)
  /// @return The fee lock period
  function getFeeLockPeriod() external view returns (uint256);

  /// @notice Get the navigator fee percentage in basis points
  /// @return The fee percentage
  function getFeePercentage() external view returns (uint256);

  /// @notice Check if fees for a round are unlocked
  /// @param roundId The round to check
  /// @return True if the round's fees are claimable
  function isRoundFeeUnlocked(uint256 roundId) external view returns (bool);

  // -- Slashing --

  /// @notice Get the total amount slashed from a navigator over their lifetime
  /// @param navigator The navigator address
  /// @return The total B3TR amount slashed
  function getTotalSlashed(address navigator) external view returns (uint256);

  /// @notice Get the minor slash percentage in basis points
  /// @return The minor slash percentage
  function getMinorSlashPercentage() external view returns (uint256);

  /// @notice Get the preference cutoff period (in blocks before round end)
  /// @return The cutoff period in blocks
  function getPreferenceCutoffPeriod() external view returns (uint256);

  // -- Lifecycle --

  /// @notice Check if a navigator is in the exit process
  /// @param navigator The navigator address
  /// @return True if the navigator has announced exit
  function isExiting(address navigator) external view returns (bool);

  /// @notice Check if a navigator has been deactivated
  /// @param navigator The navigator address
  /// @return True if deactivated
  function isDeactivated(address navigator) external view returns (bool);

  /// @notice Check if a navigator was deactivated (exited or governance-deactivated) at a given timepoint
  /// @dev Uses checkpointed navigatorDeactivated mapping.
  /// @param navigator The navigator address
  /// @param timepoint The block number to query
  /// @return True if the navigator was dead at the given timepoint
  function isDeactivatedAtTimepoint(address navigator, uint256 timepoint) external view returns (bool);

  /// @notice Get the round when exit was announced (0 = not exiting)
  /// @param navigator The navigator address
  /// @return The exit-announced round ID (0 if not exiting)
  function exitAnnouncedRound(address navigator) external view returns (uint256);

  /// @notice Get the exit notice period (in rounds)
  /// @return The notice period
  function getExitNoticePeriod() external view returns (uint256);

  /// @notice Get the report submission interval (in rounds)
  /// @return The report interval
  function getReportInterval() external view returns (uint256);

  // -- Profile --

  /// @notice Get the navigator's metadata URI
  /// @param navigator The navigator address
  /// @return The metadata URI string
  function getMetadataURI(address navigator) external view returns (string memory);

  /// @notice Get the round of the navigator's last report submission
  /// @param navigator The navigator address
  /// @return The round ID of the last report
  function getLastReportRound(address navigator) external view returns (uint256);

  /// @notice Get the navigator's last report URI
  /// @param navigator The navigator address
  /// @return The report URI string
  function getLastReportURI(address navigator) external view returns (string memory);

  // -- Meta --

  /// @notice Get the contract version string
  /// @return The version string
  function version() external pure returns (string memory);

  /// @notice Get the GOVERNANCE_ROLE identifier
  /// @return The role bytes32 hash
  function GOVERNANCE_ROLE() external view returns (bytes32);

  /// @notice Get the UPGRADER_ROLE identifier
  /// @return The role bytes32 hash
  function UPGRADER_ROLE() external view returns (bytes32);

  /// @notice Get the BASIS_POINTS constant (10000)
  /// @return The basis points scale
  function BASIS_POINTS() external view returns (uint256);
}
