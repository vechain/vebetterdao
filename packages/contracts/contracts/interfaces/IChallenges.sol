// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { ChallengeTypes } from "../challenges/libraries/ChallengeTypes.sol";

/// @title B3TRChallenges Interface
/// @notice External interface for creating, joining, settling, and administering B3TR challenges.
/// @dev Lifecycle and settlement events emitted from the challenge libraries are declared here as well so the main
/// contract ABI remains complete for docs, tests, and indexers.
interface IChallenges {
  // ---------- Errors ---------- //
  error ZeroAddress();
  error InvalidAmount();
  error BetAmountBelowMinimum(uint256 provided, uint256 minimum);
  error InvalidStartRound(uint256 startRound, uint256 currentRound);
  error InvalidEndRound(uint256 startRound, uint256 endRound);
  error InvalidThresholdConfiguration();
  error TitleTooLong(uint256 provided, uint256 maximum);
  error DescriptionTooLong(uint256 provided, uint256 maximum);
  error ImageURITooLong(uint256 provided, uint256 maximum);
  error MetadataURITooLong(uint256 provided, uint256 maximum);
  error MaxChallengeDurationExceeded(uint256 provided, uint256 maximum);
  error MaxSelectedAppsExceeded(uint256 provided, uint256 maximum);
  error MaxParticipantsExceeded(uint256 provided, uint256 maximum);
  error ChallengeDoesNotExist(uint256 challengeId);
  error ChallengeUnknownApp(bytes32 appId);
  error DuplicateApp(bytes32 appId);
  error ChallengeNotPending(uint256 challengeId);
  error ChallengeNotEnded(uint256 challengeId, uint256 endRound, uint256 currentRound);
  error ChallengeAlreadyFinalized(uint256 challengeId);
  error ChallengeInvalidStatus(uint256 challengeId, ChallengeTypes.ChallengeStatus status);
  error CreatorCannotJoin(uint256 challengeId);
  error CreatorCannotLeave(uint256 challengeId);
 error ChallengePersonhoodVerificationFailed(address participant, string reason);
  error AlreadyParticipating(uint256 challengeId, address participant);
  error NotParticipating(uint256 challengeId, address participant);
  error NotInvited(uint256 challengeId, address participant);
  error NothingToClaim(uint256 challengeId, address account);
  error NothingToRefund(uint256 challengeId, address account);
  error AlreadyClaimed(uint256 challengeId, address account);
  error AlreadyRefunded(uint256 challengeId, address account);
  error AlreadyInvited(uint256 challengeId, address invitee);
  error TransferFailed();
  error InsufficientWithdrawableFunds(uint256 available, uint256 requested);
  error ChallengesUnauthorizedUser(address user);

  // ---------- Events ---------- //

  /// @notice Emitted when the B3TR token address used by challenges is updated.
  /// @param oldAddress Previous B3TR token address.
  /// @param newAddress New B3TR token address.
  event B3TRAddressUpdated(address indexed oldAddress, address indexed newAddress);

  /// @notice Emitted when the VeBetterPassport address used for action accounting is updated.
  /// @param oldAddress Previous VeBetterPassport address.
  /// @param newAddress New VeBetterPassport address.
  event VeBetterPassportAddressUpdated(address indexed oldAddress, address indexed newAddress);

  /// @notice Emitted when the XAllocationVoting governor address is updated.
  /// @param oldAddress Previous XAllocationVoting governor address.
  /// @param newAddress New XAllocationVoting governor address.
  event XAllocationVotingAddressUpdated(address indexed oldAddress, address indexed newAddress);

  /// @notice Emitted when the X2EarnApps registry address is updated.
  /// @param oldAddress Previous X2EarnApps registry address.
  /// @param newAddress New X2EarnApps registry address.
  event X2EarnAppsAddressUpdated(address indexed oldAddress, address indexed newAddress);

  /// @notice Emitted when the maximum challenge duration is updated.
  /// @param oldValue Previous maximum duration, in rounds.
  /// @param newValue New maximum duration, in rounds.
  event MaxChallengeDurationUpdated(uint256 oldValue, uint256 newValue);

  /// @notice Emitted when the maximum number of explicit apps per challenge is updated.
  /// @param oldValue Previous maximum app count.
  /// @param newValue New maximum app count.
  event MaxSelectedAppsUpdated(uint256 oldValue, uint256 newValue);

  /// @notice Emitted when the maximum number of participants per challenge is updated.
  /// @param oldValue Previous maximum participant count.
  /// @param newValue New maximum participant count.
  event MaxParticipantsUpdated(uint256 oldValue, uint256 newValue);

  /// @notice Emitted when the minimum stake or sponsored prize amount is updated.
  /// @param oldValue Previous minimum B3TR amount.
  /// @param newValue New minimum B3TR amount.
  event MinBetAmountUpdated(uint256 oldValue, uint256 newValue);

  /// @notice Emitted when an admin withdraws B3TR from the contract.
  /// @param admin Address that performed the withdrawal.
  /// @param recipient Address that received the withdrawn tokens.
  /// @param amount Amount withdrawn.
  event AdminWithdrawal(address indexed admin, address indexed recipient, uint256 amount);

  /// @notice Emitted when a challenge is created and funded.
  /// @param challengeId Newly created challenge identifier.
  /// @param creator Address that created the challenge.
  /// @param endRound Last round whose actions count toward the challenge.
  /// @param kind Challenge funding model.
  /// @param visibility Challenge participation mode.
  /// @param thresholdMode Threshold evaluation mode for sponsored challenges.
  /// @param stakeAmount Amount locked at creation and required from each joining participant in stake challenges.
  /// @param startRound First round whose actions count toward the challenge.
  /// @param threshold Minimum action threshold when threshold-based settlement is enabled.
  /// @param allApps True when actions from all apps count, false when only `selectedApps` count.
  /// @param selectedApps Explicit app allowlist when `allApps` is false.
  /// @param title Human-readable challenge title.
  /// @param description Human-readable challenge description.
  /// @param imageURI Optional image URI.
  /// @param metadataURI Optional metadata URI.
  event ChallengeCreated(
    uint256 indexed challengeId,
    address indexed creator,
    uint256 indexed endRound,
    ChallengeTypes.ChallengeKind kind,
    ChallengeTypes.ChallengeVisibility visibility,
    ChallengeTypes.ThresholdMode thresholdMode,
    uint256 stakeAmount,
    uint256 startRound,
    uint256 threshold,
    bool allApps,
    bytes32[] selectedApps,
    string title,
    string description,
    string imageURI,
    string metadataURI
  );

  /// @notice Emitted when an invitee is added to a challenge.
  /// @param challengeId Challenge identifier.
  /// @param invitee Address that was invited.
  event ChallengeInviteAdded(uint256 indexed challengeId, address indexed invitee);

  /// @notice Emitted when a participant joins a challenge.
  /// @param challengeId Challenge identifier.
  /// @param participant Address that joined.
  event ChallengeJoined(uint256 indexed challengeId, address indexed participant);

  /// @notice Emitted when a participant leaves a challenge before it starts.
  /// @param challengeId Challenge identifier.
  /// @param participant Address that left.
  event ChallengeLeft(uint256 indexed challengeId, address indexed participant);

  /// @notice Emitted when an invitee declines a challenge.
  /// @param challengeId Challenge identifier.
  /// @param participant Address that declined.
  event ChallengeDeclined(uint256 indexed challengeId, address indexed participant);

  /// @notice Emitted when the creator cancels a pending challenge.
  /// @param challengeId Challenge identifier.
  event ChallengeCancelled(uint256 indexed challengeId);

  /// @notice Emitted when a pending challenge becomes active.
  /// @param challengeId Challenge identifier.
  event ChallengeActivated(uint256 indexed challengeId);

  /// @notice Emitted when a pending challenge becomes invalid at start time.
  /// @param challengeId Challenge identifier.
  event ChallengeInvalidated(uint256 indexed challengeId);

  /// @notice Emitted when challenge settlement is finalized.
  /// @param challengeId Challenge identifier.
  /// @param settlementMode Settlement mode selected for payout or refund.
  /// @param bestScore Highest participant action score recorded.
  /// @param bestCount Number of participants tied for `bestScore`.
  /// @param qualifiedCount Number of participants above threshold in split settlement mode.
  event ChallengeFinalized(
    uint256 indexed challengeId,
    ChallengeTypes.SettlementMode settlementMode,
    uint256 bestScore,
    uint256 bestCount,
    uint256 qualifiedCount
  );

  /// @notice Emitted when a payout is claimed from a finalized challenge.
  /// @param challengeId Challenge identifier.
  /// @param account Recipient of the payout.
  /// @param amount Amount transferred.
  event ChallengePayoutClaimed(uint256 indexed challengeId, address indexed account, uint256 amount);

  /// @notice Emitted when a refund is claimed from a cancelled or invalid challenge.
  /// @param challengeId Challenge identifier.
  /// @param account Recipient of the refund.
  /// @param amount Amount transferred.
  event ChallengeRefundClaimed(uint256 indexed challengeId, address indexed account, uint256 amount);

  // ---------- Functions ---------- //

  /// @notice Initializes the challenge contract.
  /// @param data Initial contract addresses and challenge limits.
  /// @param roles Role assignments for the proxy instance.
  function initialize(
    ChallengeTypes.InitializationData calldata data,
    ChallengeTypes.InitializationRoleData calldata roles
  ) external;

  /// @notice Returns the current implementation version.
  /// @return Current implementation version string.
  function version() external pure returns (string memory);

  /// @notice Returns the total number of created challenges.
  /// @return Number of created challenges.
  function challengeCount() external view returns (uint256);

  /// @notice Returns the maximum duration allowed for a challenge.
  /// @return Maximum challenge duration, in rounds.
  function maxChallengeDuration() external view returns (uint256);

  /// @notice Returns the maximum number of explicit apps allowed in a challenge.
  /// @return Maximum selected app count.
  function maxSelectedApps() external view returns (uint256);

  /// @notice Returns the maximum number of participants allowed in a challenge.
  /// @return Maximum participant count.
  function maxParticipants() external view returns (uint256);

  /// @notice Returns the minimum B3TR amount allowed for challenge funding.
  /// @return Minimum stake or sponsored prize amount.
  function minBetAmount() external view returns (uint256);

  /// @notice Returns a full challenge view with derived counters and status.
  /// @param challengeId Challenge identifier.
  /// @return Challenge data plus derived lifecycle and participation fields.
  function getChallenge(uint256 challengeId) external view returns (ChallengeTypes.ChallengeView memory);

  /// @notice Returns the current challenge status.
  /// @param challengeId Challenge identifier.
  /// @return Current status for the challenge.
  function getChallengeStatus(uint256 challengeId) external view returns (ChallengeTypes.ChallengeStatus);

  /// @notice Returns the current participants of a challenge.
  /// @param challengeId Challenge identifier.
  /// @return Participant addresses.
  function getChallengeParticipants(uint256 challengeId) external view returns (address[] memory);

  /// @notice Returns the accounts currently marked as invited for a challenge.
  /// @param challengeId Challenge identifier.
  /// @return Invited addresses.
  function getChallengeInvited(uint256 challengeId) external view returns (address[] memory);

  /// @notice Returns the accounts that declined a challenge invitation.
  /// @param challengeId Challenge identifier.
  /// @return Declined addresses.
  function getChallengeDeclined(uint256 challengeId) external view returns (address[] memory);

  /// @notice Returns the explicit app allowlist for a challenge.
  /// @param challengeId Challenge identifier.
  /// @return Explicit app ids used by the challenge.
  function getChallengeSelectedApps(uint256 challengeId) external view returns (bytes32[] memory);

  /// @notice Returns the current participant status for an account.
  /// @param challengeId Challenge identifier.
  /// @param account Account to query.
  /// @return Participant status for the account.
  function getParticipantStatus(
    uint256 challengeId,
    address account
  ) external view returns (ChallengeTypes.ParticipantStatus);

  /// @notice Returns whether an account is eligible to join or be re-invited to a challenge.
  /// @param challengeId Challenge identifier.
  /// @param account Account to query.
  /// @return True if the account is marked as invitation-eligible.
  function isInvitationEligible(uint256 challengeId, address account) external view returns (bool);

  /// @notice Returns the total counted actions for a participant across the challenge scope.
  /// @param challengeId Challenge identifier.
  /// @param participant Participant address to query.
  /// @return Total counted actions.
  function getParticipantActions(uint256 challengeId, address participant) external view returns (uint256);

  /// @notice Creates and funds a new challenge.
  /// @dev If `params.startRound` is zero, the next round is used.
  /// @param params Challenge creation payload.
  /// @return Newly created challenge identifier.
  function createChallenge(ChallengeTypes.CreateChallengeParams calldata params) external returns (uint256);

  /// @notice Adds new invitees to a pending challenge.
  /// @param challengeId Challenge identifier.
  /// @param invitees Accounts to invite.
  function addInvites(uint256 challengeId, address[] calldata invitees) external;

  /// @notice Joins a pending challenge.
  /// @param challengeId Challenge identifier.
  function joinChallenge(uint256 challengeId) external;

  /// @notice Leaves a pending challenge before it starts.
  /// @param challengeId Challenge identifier.
  function leaveChallenge(uint256 challengeId) external;

  /// @notice Declines a challenge invitation.
  /// @param challengeId Challenge identifier.
  function declineChallenge(uint256 challengeId) external;

  /// @notice Cancels a pending challenge.
  /// @param challengeId Challenge identifier.
  function cancelChallenge(uint256 challengeId) external;

  /// @notice Resolves the latest status for a pending challenge.
  /// @param challengeId Challenge identifier.
  /// @return Status after syncing.
  function syncChallenge(uint256 challengeId) external returns (ChallengeTypes.ChallengeStatus);

  /// @notice Finalizes a challenge after its end round has passed.
  /// @param challengeId Challenge identifier.
  function finalizeChallenge(uint256 challengeId) external;

  /// @notice Claims the caller's payout from a finalized challenge.
  /// @param challengeId Challenge identifier.
  /// @return Amount transferred to the caller.
  function claimChallengePayout(uint256 challengeId) external returns (uint256);

  /// @notice Claims the caller's refund from a cancelled or invalid challenge.
  /// @param challengeId Challenge identifier.
  /// @return Amount transferred to the caller.
  function claimChallengeRefund(uint256 challengeId) external returns (uint256);

  /// @notice Withdraws B3TR from the contract.
  /// @dev Emergency admin function that can drain any B3TR currently held by the contract.
  /// @param to Recipient of the withdrawn B3TR.
  /// @param amount Amount of B3TR to withdraw.
  function withdraw(address to, uint256 amount) external;

  /// @notice Updates the B3TR token address.
  /// @param newAddress New B3TR token address.
  function setB3TRAddress(address newAddress) external;

  /// @notice Updates the VeBetterPassport address.
  /// @param newAddress New VeBetterPassport address.
  function setVeBetterPassportAddress(address newAddress) external;

  /// @notice Updates the XAllocationVoting governor address.
  /// @param newAddress New XAllocationVoting governor address.
  function setXAllocationVotingAddress(address newAddress) external;

  /// @notice Updates the X2EarnApps registry address.
  /// @param newAddress New X2EarnApps registry address.
  function setX2EarnAppsAddress(address newAddress) external;

  /// @notice Updates the maximum duration allowed for new challenges.
  /// @param newValue New maximum duration, in rounds.
  function setMaxChallengeDuration(uint256 newValue) external;

  /// @notice Updates the maximum number of explicit apps allowed for new challenges.
  /// @param newValue New maximum selected app count.
  function setMaxSelectedApps(uint256 newValue) external;

  /// @notice Updates the maximum number of participants allowed for new challenges.
  /// @param newValue New maximum participant count.
  function setMaxParticipants(uint256 newValue) external;

  /// @notice Updates the minimum B3TR amount allowed for challenge funding.
  /// @param newValue New minimum B3TR amount.
  function setMinBetAmount(uint256 newValue) external;
}
