// SPDX-License-Identifier: MIT

//                                      #######
//                                 ################
//                               ####################
//                             ###########   #########
//                            #########      #########
//          #######          #########       #########
//          #########       #########      ##########
//           ##########     ########     ####################
//            ##########   #########  #########################
//              ################### ############################
//               #################  ##########          ########
//                 ##############      ###              ########
//                  ############                       #########
//                    ##########                     ##########
//                     ########                    ###########
//                       ###                    ############
//                                          ##############
//                                    #################
//                                   ##############
//                                   #########

pragma solidity 0.8.20;

import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { ERC165Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { ContextUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import { IXAllocationVotingGovernor, IERC6372 } from "../interfaces/IXAllocationVotingGovernor.sol";
import { IX2EarnApps } from "../interfaces/IX2EarnApps.sol";
import { IEmissions } from "../interfaces/IEmissions.sol";
import { IVoterRewards } from "../interfaces/IVoterRewards.sol";
import { IVeBetterPassport } from "../interfaces/IVeBetterPassport.sol";
import { IB3TRGovernor } from "../interfaces/IB3TRGovernor.sol";
import { IRelayerRewardsPool, RelayerAction } from "../interfaces/IRelayerRewardsPool.sol";
import { INavigatorRegistry } from "../interfaces/INavigatorRegistry.sol";
import { X2EarnAppsDataTypes } from "../libraries/X2EarnAppsDataTypes.sol";

// Libraries
import { XAllocationVotingStorageTypes } from "./libraries/XAllocationVotingStorageTypes.sol";
import { ExternalContractsUtils } from "./libraries/ExternalContractsUtils.sol";
import { VotingSettingsUtils } from "./libraries/VotingSettingsUtils.sol";
import { VotesUtils } from "./libraries/VotesUtils.sol";
import { VotesQuorumFractionUtils } from "./libraries/VotesQuorumFractionUtils.sol";
import { RoundEarningsSettingsUtils } from "./libraries/RoundEarningsSettingsUtils.sol";
import { RoundFinalizationUtils } from "./libraries/RoundFinalizationUtils.sol";
import { RoundsStorageUtils } from "./libraries/RoundsStorageUtils.sol";
import { RoundVotesCountingUtils } from "./libraries/RoundVotesCountingUtils.sol";
import { AutoVotingLogic } from "./libraries/AutoVotingLogic.sol";

/**
 * @title XAllocationVoting
 * @notice This contract handles the voting for the most supported x2Earn applications through periodic allocation rounds.
 * The user's voting power is calculated on his VOT3 holdings at the start of each round, using a "Quadratic Funding" formula.
 * @dev Rounds are started by the Emissions contract.
 * @dev Interacts with the X2EarnApps contract to get the app data (eg: app IDs, app existence, eligible apps for each round).
 * @dev Interacts with the VotingRewards contract to save the user from casting a vote.
 * @dev The contract is using AccessControl to handle roles for admin, governance, and round-starting operations.
 *
 * ----- Version 2 -----
 * - Integrated VeBetterPassport
 * - Added check to ensure that the vote weight for an XApp cast by a user is greater than the voting threshold
 *
 * ----- Version 3 -----
 * - Updated the X2EarnApps interface to support node endorsement feature
 *
 * ----- Version 4 -----
 * - Updated the X2EarnApps interface to support node cooldown functionality
 *
 * ----- Version 6 -----
 *  - Align IVoterRewards and IEmissions interfaces with the new contracts
 *
 * ----- Version 7 -----
 * - Proposal Execution: Count proposal deposits to x-allocation voting power
 *
 * ----- Version 8 -----
 *  - Added autovoting functionality allowing users to enable automatic voting with predefined app preferences
 *
 * ----- Version 9 -----
 *  - Refactored from module inheritance to library architecture for contract size optimization
 *  - Removed the following public functions to reduce contract size (accessible via libraries or storage reads):
 *    - name(), initialize(), COUNTING_MODE()
 *    - x2EarnApps(), emissions(), voterRewards(), veBetterPassport(), b3trGovernor(), relayerRewardsPool(), token()
 *    - roundProposer(), getAndValidateVotingPower()
 */
contract XAllocationVoting is
  Initializable,
  ContextUpgradeable,
  ERC165Upgradeable,
  IXAllocationVotingGovernor,
  AccessControlUpgradeable,
  UUPSUpgradeable
{
  /// @notice Role identifier for the address that can start a new round
  bytes32 public constant ROUND_STARTER_ROLE = keccak256("ROUND_STARTER_ROLE");
  /// @notice Role identifier for the address that can upgrade the contract
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  /// @notice Role identifier for governance operations
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
  /// @notice The role that can set the addresses of the contracts used by the VoterRewards contract.
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");
  /// @dev Bitmask with every valid `RoundState` bit set: bit `i` is 1 for enum value `i` (same layout as
  ///      `_encodeStateBitmap`). `2 ** (max + 1) - 1` sets bits `0` through `type(RoundState).max` inclusive.
  bytes32 private constant ALL_ROUND_STATES_BITMAP = bytes32((2 ** (uint8(type(RoundState).max) + 1)) - 1);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @notice Initialize V9: set NavigatorRegistry address
  function initializeV9(INavigatorRegistry _navigatorRegistry) external onlyRole(UPGRADER_ROLE) reinitializer(8) {
    require(address(_navigatorRegistry) != address(0), "XAllocationVoting: invalid navigator registry");
    ExternalContractsUtils.setNavigatorRegistry(_navigatorRegistry);
  }

  // ======================== Authorizations ======================== //

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  // ======================== Core Voting Logic ======================== //

  /**
   * @dev Starts a new round of voting to allocate funds to x-2-earn applications.
   * Orchestrates: finalize previous round → create new round → snapshot earnings → setup auto-voting relayer actions
   */
  function startNewRound() public onlyRole(ROUND_STARTER_ROLE) returns (uint256) {
    address proposer = _msgSender();

    // check that there isn't an already ongoing round
    // but only do it after we have at least 1 round otherwise it will fail with `GovernorNonexistentRound`
    uint256 currentRound = RoundsStorageUtils.currentRoundId();
    if (currentRound > 0) {
      require(!isActive(currentRound), "XAllocationVotingGovernor: there can be only one round per time");
    }

    // Finalize previous round (if not first)
    if (currentRound > 0 && !RoundFinalizationUtils.isFinalized(currentRound)) {
      RoundFinalizationUtils.finalizeRound(currentRound, uint8(state(currentRound)), isActive(currentRound));
    }

    // Get eligible apps
    bytes32[] memory eligibleApps = XAllocationVotingStorageTypes
      ._getExternalContractsStorage()
      ._x2EarnApps
      .allEligibleApps();

    // Create new round
    uint48 currentClock = VotesUtils.clock();
    uint32 currentVotingPeriod = uint32(VotingSettingsUtils.votingPeriod());
    uint256 newRoundId = RoundsStorageUtils.createRound(proposer, currentClock, currentVotingPeriod, eligibleApps);

    // Snapshot earnings settings for the round
    RoundEarningsSettingsUtils.snapshotRoundEarningsCap(newRoundId);

    // Set expected auto-voting actions for relayer rewards
    // Only set if there are auto-voting users (avoids emitting TotalAutoVotingActionsSet with 0)
    uint208 totalAutoVotingUsers = AutoVotingLogic.getTotalAutoVotingUsersAtTimepoint(currentClock);
    if (totalAutoVotingUsers > 0) {
      IRelayerRewardsPool pool = XAllocationVotingStorageTypes._getExternalContractsStorage()._relayerRewardsPool;
      pool.setTotalActionsForRound(newRoundId, totalAutoVotingUsers);
    }

    return newRoundId;
  }

  /**
   * @dev Cast a vote for a set of x-2-earn applications.
   * @notice Only addresses with a valid passport can vote.
   * @notice Reverts if autovoting is enabled for the voter.
   */
  function castVote(uint256 roundId, bytes32[] memory appIds, uint256[] memory voteWeights) public virtual {
    require(appIds.length == voteWeights.length, "XAllocationVotingGovernor: apps and weights length mismatch");
    require(appIds.length > 0, "XAllocationVotingGovernor: no apps to vote for");

    if (this.isUserAutoVotingEnabledAtTimepoint(_msgSender(), SafeCast.toUint48(currentRoundSnapshot()))) {
      revert AutoVotingEnabled(_msgSender());
    }

    validatePersonhoodForCurrentRound(_msgSender());

    _handleCastVote(_msgSender(), roundId, appIds, voteWeights, false);
  }

  /**
   * @dev Cast a vote for a set of x-2-earn applications on behalf of an account (used for autovoting).
   * @notice Reverts if autovoting is not enabled for the voter.
   */
  function castVoteOnBehalfOf(address voter, uint256 roundId) public {
    if (!this.isUserAutoVotingEnabledAtTimepoint(voter, SafeCast.toUint48(roundSnapshot(roundId)))) {
      revert AutoVotingNotEnabled(voter);
    }

    _checkEarlyAccessEligibility(roundId, voter);

    (bool isPerson, ) = XAllocationVotingStorageTypes
      ._getExternalContractsStorage()
      ._veBetterPassport
      .isPersonAtTimepoint(voter, SafeCast.toUint48(currentRoundSnapshot()));

    bytes32[] memory appIds = AutoVotingLogic.getUserVotingPreferences(voter);

    (bytes32[] memory finalAppIds, uint256[] memory voteWeightsArr, uint256 votingPower) = AutoVotingLogic
      .prepareAutoVoteArrays(address(this), voter, roundId, appIds);

    // We disable auto-voting if,
    // - voter is not a person
    // - there are no eligible apps
    // - voter has insufficient voting power
    if (!isPerson || finalAppIds.length == 0) {
      // Only toggle and reduce expected actions if autovoting is enabled
      if (AutoVotingLogic.isAutoVotingEnabled(voter)) {
        AutoVotingLogic.toggleAutoVoting(address(this), voter, VotesUtils.clock());
        XAllocationVotingStorageTypes._getExternalContractsStorage()._relayerRewardsPool.reduceExpectedActionsForRound(
          roundId,
          1
        );
      }
      emit AutoVoteSkipped(voter, roundId, isPerson, finalAppIds.length, votingPower);
      return;
    }

    _handleCastVote(voter, roundId, finalAppIds, voteWeightsArr, true);
  }

  /**
   * @dev Cast a vote on behalf of a citizen delegated to a navigator.
   * Uses the navigator's allocation preferences and equal-weight distribution.
   * No personhood check — delegation already implies trust.
   * @param citizen The delegated citizen whose voting power is used
   * @param roundId The round ID to vote in
   */
  function castNavigatorVote(address citizen, uint256 roundId) public {
    INavigatorRegistry navRegistry = XAllocationVotingStorageTypes._getExternalContractsStorage()._navigatorRegistry;

    // Citizen must be delegated to a navigator
    address navigator = navRegistry.getNavigator(citizen);
    if (navigator == address(0)) revert NotDelegatedToNavigator(citizen);

    // Navigator must have set allocation preferences for this round
    if (!navRegistry.hasSetPreferences(navigator, roundId)) {
      revert NavigatorPreferencesNotSet(navigator, roundId);
    }

    _checkEarlyAccessEligibility(roundId, citizen);

    // Get navigator's preferences with allocation percentages (basis points, sum to 10000)
    (bytes32[] memory appIds, uint256[] memory percentages) = navRegistry.getAllocationPreferences(navigator, roundId);

    // Voting power = delegated amount at round snapshot (not full VOT3 balance)
    uint256 snapshot = roundSnapshot(roundId);
    uint256 delegatedPower = navRegistry.getDelegatedAmountAtTimepoint(citizen, snapshot);

    // Convert percentages to absolute VOT3 amounts (countVote expects absolute weights)
    uint256 basisPoints = navRegistry.BASIS_POINTS();
    uint256[] memory voteWeights = new uint256[](percentages.length);
    uint256 allocated;
    for (uint256 i; i < percentages.length; i++) {
      voteWeights[i] = (delegatedPower * percentages[i]) / basisPoints;
      allocated += voteWeights[i];
    }
    // Assign any dust from rounding to the first app
    if (allocated < delegatedPower && voteWeights.length > 0) {
      voteWeights[0] += delegatedPower - allocated;
    }

    _handleCastVoteWithPower(citizen, roundId, appIds, voteWeights, delegatedPower, false);

    // Register relayer action for the caller
    XAllocationVotingStorageTypes._getExternalContractsStorage()._relayerRewardsPool.registerRelayerAction(
      _msgSender(),
      citizen,
      roundId,
      RelayerAction.VOTE
    );

    emit NavigatorVoteCast(citizen, navigator, roundId, appIds, voteWeights);
  }

  /**
   * @dev Internal function to handle common voting logic
   * @param voter The address casting the vote
   * @param roundId The round ID to vote in
   * @param appIds Array of app IDs to vote for
   * @param voteWeights Array of vote weights for each app
   * @param isAutoVote Whether this is an auto vote (affects events and relayer rewards)
   */
  function _handleCastVote(
    address voter,
    uint256 roundId,
    bytes32[] memory appIds,
    uint256[] memory voteWeights,
    bool isAutoVote
  ) internal {
    // Use voter's full voting power (VOT3 + deposits)
    uint256 voterTotalVotingPower = getTotalVotingPower(voter, roundSnapshot(roundId));
    _handleCastVoteWithPower(voter, roundId, appIds, voteWeights, voterTotalVotingPower, isAutoVote);
  }

  function _handleCastVoteWithPower(
    address voter,
    uint256 roundId,
    bytes32[] memory appIds,
    uint256[] memory voteWeights,
    uint256 votingPower,
    bool isAutoVote
  ) internal {
    _validateStateBitmap(roundId, _encodeStateBitmap(RoundState.Active));

    // Count the vote using the library
    RoundVotesCountingUtils.countVote(roundId, voter, appIds, voteWeights, votingPower, roundSnapshot(roundId));

    if (isAutoVote) {
      XAllocationVotingStorageTypes._getExternalContractsStorage()._relayerRewardsPool.registerRelayerAction(
        _msgSender(),
        voter,
        roundId,
        RelayerAction.VOTE
      );
      emit AllocationAutoVoteCast(voter, roundId, appIds, voteWeights);
    }
  }

  /**
   * @dev Function to store the last succeeded round once a round ends.
   */
  function finalizeRound(uint256 roundId) external {
    RoundFinalizationUtils.finalizeRound(roundId, uint8(state(roundId)), isActive(roundId));
  }

  // ======================== Personhood & Validation ======================== //

  /**
   * @dev Validate that the voter is a person at the current round snapshot
   * @param voter The voter address
   */
  function validatePersonhoodForCurrentRound(address voter) public view returns (bool) {
    (bool isPerson, string memory explanation) = XAllocationVotingStorageTypes
      ._getExternalContractsStorage()
      ._veBetterPassport
      .isPersonAtTimepoint(voter, SafeCast.toUint48(currentRoundSnapshot()));
    if (!isPerson) {
      revert GovernorPersonhoodVerificationFailed(voter, explanation);
    }
    return isPerson;
  }

  /**
   * @dev Check that the current state of a round matches the requirements described by the `allowedStates` bitmap.
   * This bitmap should be built using `_encodeStateBitmap`.
   *
   * If requirements are not met, reverts with a {GovernorUnexpectedRoundState} error.
   */
  function _validateStateBitmap(uint256 roundId, bytes32 allowedStates) private view returns (RoundState) {
    RoundState currentState = state(roundId);
    if (_encodeStateBitmap(currentState) & allowedStates == bytes32(0)) {
      revert GovernorUnexpectedRoundState(roundId, currentState, allowedStates);
    }
    return currentState;
  }

  // ======================== Auto-Voting ======================== //

  /**
   * @dev Toggle autovoting for the caller
   */
  function toggleAutoVoting(address user) external {
    if (_msgSender() != user) {
      revert InvalidCaller(_msgSender());
    }
    AutoVotingLogic.toggleAutoVoting(address(this), user, VotesUtils.clock());
  }

  /**
   * @dev Disable autovoting for a user. Called by NavigatorRegistry when a citizen delegates.
   * No-op if auto-voting is already disabled.
   */
  function disableAutoVotingFor(address user) external {
    INavigatorRegistry navRegistry = XAllocationVotingStorageTypes._getExternalContractsStorage()._navigatorRegistry;
    require(
      address(navRegistry) != address(0) && _msgSender() == address(navRegistry),
      "XAllocationVoting: not navigator registry"
    );

    if (AutoVotingLogic.isAutoVotingEnabled(user)) {
      AutoVotingLogic.toggleAutoVoting(address(this), user, VotesUtils.clock());
    }
  }

  /**
   * @dev Set the voting preferences for the caller
   */
  function setUserVotingPreferences(bytes32[] memory appIds) external {
    AutoVotingLogic.setUserVotingPreferences(
      address(XAllocationVotingStorageTypes._getExternalContractsStorage()._x2EarnApps),
      _msgSender(),
      appIds
    );
  }

  /**
   * @dev Check if the caller is eligible to perform relayer actions during early access period
   */
  function _checkEarlyAccessEligibility(uint256 roundId, address voter) internal view {
    XAllocationVotingStorageTypes._getExternalContractsStorage()._relayerRewardsPool.validateVoteDuringEarlyAccess(
      roundId,
      voter,
      _msgSender()
    );
  }

  // ======================== Setters (role-gated) ======================== //

  /**
   * @dev Set the address of the X2EarnApps contract
   */
  function setX2EarnAppsAddress(IX2EarnApps newX2EarnApps) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    ExternalContractsUtils.setX2EarnApps(newX2EarnApps);
  }

  /**
   * @dev Set the address of the Emissions contract
   */
  function setEmissionsAddress(IEmissions newEmissions) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    ExternalContractsUtils.setEmissions(newEmissions);
  }

  /**
   * @dev Set the address of the VoterRewards contract
   */
  function setVoterRewardsAddress(IVoterRewards newVoterRewards) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    ExternalContractsUtils.setVoterRewards(newVoterRewards);
  }

  /**
   * @dev Set the VeBetterPassport contract
   */
  function setVeBetterPassport(
    IVeBetterPassport newVeBetterPassport
  ) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    ExternalContractsUtils.setVeBetterPassport(newVeBetterPassport);
  }

  /**
   * @dev Set the B3TRGovernor contract
   */
  function setB3TRGovernor(IB3TRGovernor newB3TRGovernor) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    ExternalContractsUtils.setB3TRGovernor(newB3TRGovernor);
  }

  /**
   * @dev Set the address of the RelayerRewardsPool contract
   */
  function setRelayerRewardsPoolAddress(
    IRelayerRewardsPool newRelayerRewardsPool
  ) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    ExternalContractsUtils.setRelayerRewardsPool(newRelayerRewardsPool);
  }

  /**
   * @dev Set the address of the NavigatorRegistry contract
   */
  function setNavigatorRegistry(
    INavigatorRegistry newNavigatorRegistry
  ) external onlyRole(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    ExternalContractsUtils.setNavigatorRegistry(newNavigatorRegistry);
  }

  /**
   * @dev Update the voting threshold. This operation can only be performed through a governance proposal.
   *
   * Emits a {VotingThresholdSet} event.
   */
  function setVotingThreshold(uint256 newVotingThreshold) public onlyRole(GOVERNANCE_ROLE) {
    RoundVotesCountingUtils.setVotingThreshold(newVotingThreshold);
  }

  /**
   * @dev Set the max amount of shares an app can get in a round
   */
  function setAppSharesCap(uint256 appSharesCap_) external onlyRole(GOVERNANCE_ROLE) {
    RoundEarningsSettingsUtils.setAppSharesCap(appSharesCap_);
  }

  /**
   * @dev Set the base allocation percentage for funds distribution in a round
   */
  function setBaseAllocationPercentage(uint256 baseAllocationPercentage_) public onlyRole(GOVERNANCE_ROLE) {
    RoundEarningsSettingsUtils.setBaseAllocationPercentage(baseAllocationPercentage_);
  }

  /**
   * @dev Set the voting period for a round
   */
  function setVotingPeriod(uint32 newVotingPeriod) public onlyRole(GOVERNANCE_ROLE) {
    VotingSettingsUtils.setVotingPeriod(
      newVotingPeriod,
      XAllocationVotingStorageTypes._getExternalContractsStorage()._emissions.cycleDuration()
    );
  }

  /**
   * @dev Update the quorum a round needs to reach to be successful
   */
  function updateQuorumNumerator(uint256 newQuorumNumerator) public onlyRole(GOVERNANCE_ROLE) {
    VotesQuorumFractionUtils.updateQuorumNumerator(newQuorumNumerator, VotesUtils.clock());
  }

  // ======================== Getters ======================== //

  /**
   * @dev Returns the version of the governor.
   */
  function version() public pure returns (string memory) {
    return "9";
  }

  /**
   * @dev Checks if the specified round is in active state or not.
   */
  function isActive(uint256 roundId) public view returns (bool) {
    return state(roundId) == RoundState.Active;
  }

  /**
   * @dev Returns the current state of a round.
   */
  function state(uint256 roundId) public view returns (RoundState) {
    uint256 snapshot = RoundsStorageUtils.roundSnapshot(roundId);

    if (snapshot == 0) {
      revert GovernorNonexistentRound(roundId);
    }

    uint256 currentTimepoint = VotesUtils.clock();
    uint256 deadline = RoundsStorageUtils.roundDeadline(roundId);

    if (deadline >= currentTimepoint) {
      return RoundState.Active;
    } else if (!RoundVotesCountingUtils.voteSucceeded(roundId, quorum(snapshot))) {
      return RoundState.Failed;
    } else {
      return RoundState.Succeeded;
    }
  }

  /**
   * @dev Checks if the quorum has been reached for a given round.
   */
  function quorumReached(uint256 roundId) public view returns (bool) {
    return RoundVotesCountingUtils.quorumReached(roundId, quorum(roundSnapshot(roundId)));
  }

  /**
   * @dev Returns the available votes for a given account at a given timepoint.
   */
  function getVotes(address account, uint256 timepoint) public view returns (uint256) {
    return VotesUtils.getVotes(account, timepoint);
  }

  /**
   * @dev Get the total voting power (VOT3 tokens + deposits) for a voter at a given timepoint
   * @param voter The address of the voter
   * @param roundStart The start of the round (timepoint)
   * @return Combined voting power from held tokens and proposal deposits
   */
  function getTotalVotingPower(address voter, uint256 roundStart) public view returns (uint256) {
    uint256 voterAvailableVotesWithDeposit = getDepositVotingPower(voter, roundStart);
    uint256 voterAvailableVotes = getVotes(voter, roundStart) + voterAvailableVotesWithDeposit;
    return voterAvailableVotes;
  }

  /**
   * @dev Checks if the given appId can be voted for in the given round.
   */
  function isEligibleForVote(bytes32 appId, uint256 roundId) public view returns (bool) {
    return
      XAllocationVotingStorageTypes._getExternalContractsStorage()._x2EarnApps.isEligible(
        appId,
        roundSnapshot(roundId)
      );
  }

  /**
   * @dev Returns the deposit voting power for a given account at a given timepoint.
   */
  function getDepositVotingPower(address account, uint256 timepoint) public view returns (uint256) {
    return
      XAllocationVotingStorageTypes._getExternalContractsStorage()._b3trGovernor.getDepositVotingPower(
        account,
        timepoint
      );
  }

  // ======================== Voting Settings ======================== //

  /// @dev See {IXAllocationVotingGovernor-votingPeriod}.
  function votingPeriod() public view returns (uint256) {
    return VotingSettingsUtils.votingPeriod();
  }

  /// @dev Returns the quorum for a given timepoint, based on token total supply.
  function quorum(uint256 timepoint) public view returns (uint256) {
    return VotesQuorumFractionUtils.quorum(timepoint);
  }

  // ======================== Clock (EIP-6372) ======================== //

  /// @dev Clock used for flagging checkpoints, as specified in EIP-6372. Matched to the token's clock.
  function clock() public view returns (uint48) {
    return VotesUtils.clock();
  }

  /// @dev Machine-readable description of the clock as specified in EIP-6372.
  // solhint-disable-next-line func-name-mixedcase
  function CLOCK_MODE() public view returns (string memory) {
    return VotesUtils.CLOCK_MODE();
  }

  // ======================== Round Storage ======================== //

  /// @dev Returns the latest round id.
  function currentRoundId() public view returns (uint256) {
    return RoundsStorageUtils.currentRoundId();
  }

  /// @dev Returns the block number at which the current round snapshot was taken.
  function currentRoundSnapshot() public view returns (uint256) {
    return RoundsStorageUtils.currentRoundSnapshot();
  }

  /// @dev Returns the block number at which the current round ends.
  function currentRoundDeadline() public view returns (uint256) {
    return RoundsStorageUtils.currentRoundDeadline();
  }

  /// @dev Returns the block number when the round starts (snapshot).
  function roundSnapshot(uint256 roundId) public view returns (uint256) {
    return RoundsStorageUtils.roundSnapshot(roundId);
  }

  /// @dev Returns the block number when the round ends.
  function roundDeadline(uint256 roundId) public view returns (uint256) {
    return RoundsStorageUtils.roundDeadline(roundId);
  }

  /// @dev Returns the ids of the apps eligible for voting in a round.
  function getAppIdsOfRound(uint256 roundId) public view returns (bytes32[] memory) {
    return RoundsStorageUtils.getAppIdsOfRound(roundId);
  }

  /// @dev Returns the data of a round.
  function getRound(uint256 roundId) external view returns (XAllocationVotingStorageTypes.RoundCore memory) {
    return RoundsStorageUtils.getRound(roundId);
  }

  /// @dev Returns all the apps eligible for voting in a round with details.
  /// @notice Could be inefficient with a large number of apps; use {getAppIdsOfRound} + {IX2EarnApps-app} instead.
  function getAppsOfRound(
    uint256 roundId
  ) external view returns (X2EarnAppsDataTypes.AppWithDetailsReturnType[] memory) {
    return RoundsStorageUtils.getAppsOfRound(roundId);
  }

  // ======================== Earnings Settings ======================== //

  /// @dev Returns the current base allocation percentage for funds distribution.
  function baseAllocationPercentage() public view returns (uint256) {
    return RoundEarningsSettingsUtils.baseAllocationPercentage();
  }

  /// @dev Returns the max percentage of votes an app can get in a round.
  function appSharesCap() public view returns (uint256) {
    return RoundEarningsSettingsUtils.appSharesCap();
  }

  /// @dev Returns the base allocation percentage for a given round (snapshotted at round start).
  function getRoundBaseAllocationPercentage(uint256 roundId) public view returns (uint256) {
    return RoundEarningsSettingsUtils.getRoundBaseAllocationPercentage(roundId);
  }

  /// @dev Returns the app shares cap for a given round (snapshotted at round start).
  function getRoundAppSharesCap(uint256 roundId) public view returns (uint256) {
    return RoundEarningsSettingsUtils.getRoundAppSharesCap(roundId);
  }

  // ======================== Vote Counting ======================== //

  /// @dev Returns the total votes received by a specific app in a given round.
  function getAppVotes(uint256 roundId, bytes32 app) public view returns (uint256) {
    return RoundVotesCountingUtils.getAppVotes(roundId, app);
  }

  /// @dev Returns the quadratic funding votes received by a specific app in a given round.
  function getAppVotesQF(uint256 roundId, bytes32 app) public view returns (uint256) {
    return RoundVotesCountingUtils.getAppVotesQF(roundId, app);
  }

  /// @dev Returns the total votes cast in a given round.
  function totalVotes(uint256 roundId) public view returns (uint256) {
    return RoundVotesCountingUtils.totalVotes(roundId);
  }

  /// @dev Returns the total quadratic funding votes cast in a given round.
  function totalVotesQF(uint256 roundId) public view returns (uint256) {
    return RoundVotesCountingUtils.totalVotesQF(roundId);
  }

  /// @dev Returns the total number of voters in a given round.
  function totalVoters(uint256 roundId) public view returns (uint256) {
    return RoundVotesCountingUtils.totalVoters(roundId);
  }

  /// @dev Returns whether a user has voted in a given round.
  function hasVoted(uint256 roundId, address user) public view returns (bool) {
    return RoundVotesCountingUtils.hasVoted(roundId, user);
  }

  /// @dev Returns whether a user has voted at least once across all rounds.
  function hasVotedOnce(address user) public view returns (bool) {
    return RoundVotesCountingUtils.hasVotedOnce(user);
  }

  /// @dev Returns whether a user voted for a specific app in a given round.
  function hasUserVotedForApp(uint256 roundId, address user, bytes32 appId) public view returns (bool) {
    return RoundVotesCountingUtils.hasUserVotedForApp(roundId, user, appId);
  }

  /// @dev Returns the minimum amount of tokens needed to cast a vote.
  function votingThreshold() public view returns (uint256) {
    return RoundVotesCountingUtils.votingThreshold();
  }

  // ======================== Quorum ======================== //

  /// @dev Returns the current quorum numerator (latest checkpoint).
  function quorumNumerator() public view returns (uint256) {
    return VotesQuorumFractionUtils.quorumNumerator();
  }

  /// @dev Returns the quorum numerator at a specific timepoint.
  function quorumNumerator(uint256 timepoint) public view returns (uint256) {
    return VotesQuorumFractionUtils.quorumNumerator(timepoint);
  }

  /// @dev Returns the quorum denominator (always 100).
  function quorumDenominator() public pure returns (uint256) {
    return VotesQuorumFractionUtils.quorumDenominator();
  }

  /// @dev Alias for quorumNumerator() — returns the quorum as a percentage.
  function quorumPercentage() public view returns (uint256) {
    return VotesQuorumFractionUtils.quorumNumerator();
  }

  // ======================== Round Finalization ======================== //

  /// @dev Returns the last succeeded round for the given round.
  function latestSucceededRoundId(uint256 roundId) external view returns (uint256) {
    return RoundFinalizationUtils.latestSucceededRoundId(roundId);
  }

  /// @dev Returns whether a round has been finalized.
  function isFinalized(uint256 roundId) external view returns (bool) {
    return RoundFinalizationUtils.isFinalized(roundId);
  }

  /**
   * Returns the quorum for a given round
   */
  function roundQuorum(uint256 roundId) external view returns (uint256) {
    return quorum(roundSnapshot(roundId));
  }

  // ======================== Auto-voting getters ======================== //

  /**
   * @dev Checks if auto-voting is enabled for an account
   */
  function isUserAutoVotingEnabled(address user) public view returns (bool) {
    return AutoVotingLogic.isAutoVotingEnabled(user);
  }

  /**
   * @dev Checks if auto-voting is enabled for an account at the start of the current cycle
   * @notice Status changes mid-cycle will only take effect in the next cycle
   */
  function isUserAutoVotingEnabledInCurrentRound(address account) public view returns (bool) {
    uint256 lastEmissionBlock = XAllocationVotingStorageTypes
      ._getExternalContractsStorage()
      ._emissions
      .lastEmissionBlock();
    return AutoVotingLogic.isAutoVotingEnabledAtTimepoint(account, uint48(lastEmissionBlock));
  }

  /**
   * @dev Checks if auto-voting is enabled for an account at the start of a specific round
   * @notice Useful function for frontend to consume
   */
  function isUserAutoVotingEnabledForRound(address account, uint256 roundId) public view returns (bool) {
    return AutoVotingLogic.isAutoVotingEnabledAtTimepoint(account, uint48(roundSnapshot(roundId)));
  }

  /**
   * @dev Check if auto-voting is enabled for an account at a specific
   * @param account The address to check
   * @param timepoint block number
   */
  function isUserAutoVotingEnabledAtTimepoint(address account, uint48 timepoint) public view returns (bool) {
    return AutoVotingLogic.isAutoVotingEnabledAtTimepoint(account, timepoint);
  }

  /**
   * @dev Get the voting preferences for an account
   */
  function getUserVotingPreferences(address account) public view returns (bytes32[] memory) {
    return AutoVotingLogic.getUserVotingPreferences(account);
  }

  /**
   * @dev Get the total number of users who enabled auto-voting at the last emission block
   */
  function getTotalAutoVotingUsersAtRoundStart() public view returns (uint208) {
    uint256 lastEmissionBlock = XAllocationVotingStorageTypes
      ._getExternalContractsStorage()
      ._emissions
      .lastEmissionBlock();
    return AutoVotingLogic.getTotalAutoVotingUsersAtTimepoint(uint48(lastEmissionBlock));
  }

  /**
   * @dev Get the total number of users who enabled autovoting at a specific timepoint
   */
  function getTotalAutoVotingUsersAtTimepoint(uint48 timepoint) public view returns (uint208) {
    return AutoVotingLogic.getTotalAutoVotingUsersAtTimepoint(timepoint);
  }

  // ======================== Helpers ======================== //

  /**
   * @dev Encodes a `RoundState` into a `bytes32` representation where each bit enabled corresponds to
   * the underlying position in the `RoundState` enum.
   */
  function _encodeStateBitmap(RoundState roundState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(roundState));
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(AccessControlUpgradeable, IERC165, ERC165Upgradeable) returns (bool) {
    return interfaceId == type(IXAllocationVotingGovernor).interfaceId || super.supportsInterface(interfaceId);
  }
}
