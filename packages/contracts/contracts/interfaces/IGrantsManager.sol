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

/**
 * @title IGrantsManager
 * @notice Interface for the GrantsManager contract that manages grant execution and milestone creation
 * @dev This contract handles the execution of approved grant proposals and manages milestone-based funding
 */
interface IGrantsManager {
  // ------------------ Events ------------------ //
  /**
   * @notice Emitted when a milestone is registered
   * @param proposalId The ID of the proposal
   * @param milestones The milestones of the proposal
   * @param projectDetailsMetadataURI The metadata URI of the project
   * @param proposer The address of the proposer
   */
  event MilestonesRegistered(
    uint256 indexed proposalId,
    Milestones milestones,
    string projectDetailsMetadataURI,
    address indexed proposer
  );

  /**
   * @notice Emitted when a milestone is validated ( ready to be claimed by the receiver )
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  event MilestoneValidated(uint256 indexed proposalId, uint256 indexed milestoneIndex);

  /**
   * @notice Emitted when a milestone is claimed
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   * @param amount The amount of the milestone
   */
  event MilestoneClaimed(uint256 indexed proposalId, uint256 indexed milestoneIndex, uint256 amount);

  /**
   * @notice Emitted when a milestone is rejected
   * @param proposalId The ID of the proposal
   * @param amount The amount of the milestone
   */
  event MilestoneRejectedAndFundsReturnedToTreasury(uint256 indexed proposalId, uint256 amount);

  /**
   * @notice Emitted when a milestone description metadata URI is updated
   * @param proposalId The ID of the proposal
   * @param newDescriptionMetadataURI The new description metadata URI
   */
  event MilestoneDescriptionMetadataURIUpdated(uint256 indexed proposalId, string newDescriptionMetadataURI);

  // ------------------ Errors ------------------ //
  /**
   * @notice Error thrown when a milestone is already in a specific state
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   * @param newStatus The new state to set
   * @param currentState The current state of the milestone
   */
  error MilestoneAlreadyInState(
    uint256 proposalId,
    uint256 milestoneIndex,
    MilestoneState newStatus,
    MilestoneState currentState
  );

  /**
   * @notice Error thrown when a target is invalid
   * @param target The invalid target
   */
  error InvalidTarget(address target);

  /**
   * @notice Error thrown when a milestone is already validated
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  error MilestoneAlreadyValidated(uint256 proposalId, uint256 milestoneIndex);

  /**
   * @notice Error thrown when milestone status is not pending
   * @param status The current status of the milestone
   */
  error MilestoneNotPending(MilestoneState status);

  /**
   * @notice Error thrown when milestone recipient is zero address
   */
  error MilestoneRecipientZeroAddress();

  /**
   * @notice Error thrown when milestone amount is zero
   * @param milestoneIndex The index of the milestone with zero amount
   */
  error MilestoneAmountZero(uint256 milestoneIndex);

  /**
   * @notice Error thrown when milestone total amount is zero
   */
  error MilestoneTotalAmountZero();

  /**
   * @notice Error thrown when milestone claimed amount exceeds total amount
   * @param claimedAmount The amount claimed
   * @param totalAmount The total amount available
   */
  error MilestoneClaimedAmountExceedsTotalAmount(uint256 claimedAmount, uint256 totalAmount);

  /**
   * @notice Error thrown when number of milestones is less than minimum required
   * @param provided The number of milestones provided
   * @param required The minimum number of milestones required
   */
  error InvalidNumberOfMilestones(uint256 provided, uint256 required);

  /**
   * @notice Error thrown when proposal is not queued or executed
   */
  error ProposalNotQueuedOrExecuted();

  /**
   * @notice Error thrown when milestone state is not pending
   * @param status The current status of the milestone
   */
  error MilestoneStateNotPending(MilestoneState status);

  /**
   * @notice Error thrown when previous milestone is not validated
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  error PreviousMilestoneNotValidated(uint256 proposalId, uint256 milestoneIndex);

  /**
   * @notice Error thrown when milestone is already claimed
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  error MilestoneAlreadyClaimed(uint256 proposalId, uint256 milestoneIndex);

  /**
   * @notice Error thrown when caller is not an admin or grants manager
   */
  error NotAuthorized();

  /**
   * @notice Error thrown when milestone ID already exists
   */
  error EmptyMilestoneId();

  /**
   * @notice Error thrown when milestone is not validated
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  error MilestoneNotApprovedByAdmin(uint256 proposalId, uint256 milestoneIndex);

  /**
   * @notice Error thrown when milestone index is invalid
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  error InvalidMilestoneIndex(uint256 proposalId, uint256 milestoneIndex);

  /**
   * @notice Error thrown when caller is not the governor
   * @param caller The address of the caller
   * @param governor The address of the governor
   */
  error CallerIsNotTheGovernor(address caller, address governor);

  /**
   * @notice Error thrown when caller is not the grant proposer
   * @param caller The address of the caller
   * @param recipient The address of the recipient
   */
  error CallerIsNotTheGrantProposer(address caller, address recipient);


  /**
   * @notice Error thrown when transfer fails
   */
  error TransferFailed();


  /**
   * @notice Error thrown when funds are insufficient
   * @param availableFunds The available funds
   * @param requiredFunds The required funds
   */
  error InsufficientFunds(uint256 availableFunds, uint256 requiredFunds);

  /**
   * @notice Error thrown when milestone total amount is not equal to the sum of the milestones amounts
   * @param totalAmount The total amount of the proposal
   * @param milestoneAmount The amount of the milestone
   */
  error MilestoneTotalAmountMismatch(uint256 totalAmount, uint256 milestoneAmount);


  // ------------------ Structs and Enums ------------------ //
  /**
   * @notice MilestoneState enum to store the status of the milestone
   */
  enum MilestoneState {
    Pending, // 0 - default
    Validated, // 1 - milestone is active and claimable
    Claimed, // 2 - funds claimed by recipient
    Rejected, // 3 - admin rejects
    Expired, // 4 - deadline passed without action
    Refunded // 5 - funds returned to treasury
  }

  /**
   * @notice Milestone struct
   */
  struct Milestone {
    uint256 amount;
    MilestoneState status;
  }

  /**
   * @notice Milestones struct
   */
  struct Milestones {
    uint256 id;
    uint256 totalAmount;
    uint256 claimedAmount;  
    address proposer;
    Milestone[] milestone;
    string milestonesDetailsMetadataURI; 
    string projectDetailsMetadataURI; 
  }

  // /**
  //  * @notice Sets the status of a proposal
  //  * @param proposalId The ID of the proposal
  //  * @param status The status to set
  //  */
  // function setProposalStatus(uint256 proposalId, ProposalStatus status) external;

  // /**
  //  * @notice Returns the status of a proposal
  //  * @param proposalId The ID of the proposal
  //  * @return ProposalStatus The status of the proposal
  //  */
  // function getProposalStatus(uint256 proposalId) external view returns (ProposalStatus);

  // ------------------ Grants Manager Milestone Functions ------------------ //

  /**
   * @notice Creates milestones for a proposal
   * @param projectDetailsMetadataURI The IPFS hash containing milestones descriptions and metadata
   * @param milestonesDetailsMetadataURI The IPFS hash containing the milestones descriptions
   * @param proposalId The ID of the proposal
   * @param proposer The address of the proposer
   * @param calldatas The calldatas of the milestones
   */
  function createMilestones(
    string memory projectDetailsMetadataURI,
    string memory milestonesDetailsMetadataURI,
    uint256 proposalId,
    address proposer,
    bytes[] memory calldatas
  ) external;

  /**
   * @notice Returns a milestone for a proposal
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   * @return Milestone The milestone
   */
  function getMilestone(uint256 proposalId, uint256 milestoneIndex) external view returns (Milestone memory);

  /**
   * @notice Returns the milestones for a proposal
   * @param proposalId The ID of the proposal
   * @return Milestones The milestones for the proposal
   */
  function getMilestones(uint256 proposalId) external view returns (Milestones memory);

  /**
   * @notice Approves a milestone
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  function approveMilestones(uint256 proposalId, uint256 milestoneIndex) external;

  /**
   * @notice Sets the minimum milestone count
   * @param minimumMilestoneCount The minimum milestone count
   */
  function setMinimumMilestoneCount(uint256 minimumMilestoneCount) external;

  /**
   * @notice Returns the minimum milestone count
   * @return The minimum milestone count
   */
  function getMinimumMilestoneCount() external view returns (uint256);

  /**
   * @notice Returns the state of a milestone
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   * @return MilestoneState The state of the milestone
   */
  function getMilestoneState(uint256 proposalId, uint256 milestoneIndex) external view returns (MilestoneState);

  /**
   * @notice Rejects a milestone
   * @param proposalId The ID of the proposal
   */
  function rejectMilestone(uint256 proposalId) external;

  /**
   * @notice Returns the total amount for milestones
   * @param milestoneId The ID of the milestone
   * @return The total amount for the milestones
   */
  function getTotalAmountForMilestones(uint256 milestoneId) external view returns (uint256);

  // ------------------ Grants Manager Funds Functions ------------------ //
  /**
   * @notice Claims milestones
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   */
  function claimMilestone(uint256 proposalId, uint256 milestoneIndex) external;

  /**
   * @notice Returns if a milestone is claimable
   * @param proposalId The ID of the proposal
   * @param milestoneIndex The index of the milestone
   * @return bool True if the milestone is claimable, false otherwise
   */
  function isClaimable(uint256 proposalId, uint256 milestoneIndex) external view returns (bool);
  // ------------------ Grants Manager Contract Functions ------------------ //
  /**
   * @notice Sets the governor contract
   * @param _governor The address of the governor contract
   */
  function setGovernorContract(address _governor) external;

  /**
   * @notice Sets the treasury contract
   * @param _treasury The address of the treasury contract
   */
  function setTreasuryContract(address _treasury) external;

  /**
   * @notice Returns the governor contract
   * @return The address of the governor contract
   */
  function getGovernorContract() external view returns (address);

  /**
   * @notice Returns the treasury contract
   * @return The address of the treasury contract
   */
  function getTreasuryContract() external view returns (address);

  /**
   * @notice Returns the b3tr contract
   * @return The address of the b3tr contract
   */
  function getB3trContract() external view returns (address);

  /**
   * @notice Sets the b3tr contract
   * @param _b3tr The address of the b3tr contract
   */
  function setB3trContract(address _b3tr) external;

  // ------------------ Metadata Functions ------------------ //

  // /**
  //  * @notice Returns the project details metadata URI for a proposal
  //  * @param proposalId The ID of the proposal
  //  * @return The project details metadata URI for the proposal
  //  */
  // function getProjectDetailsMetadataURI(uint256 proposalId) external view returns (string memory);

  /**
   * @notice Updates the milestone description metadata URI for a proposal
   * @param proposalId The ID of the proposal
   * @param newDescriptionMetadataURI The milestone description metadata URI to set
   */
  function updateMilestoneDescriptionMetadataURI(uint256 proposalId, string memory newDescriptionMetadataURI) external;

  /**
   * @notice Returns the project details metadata URI for a proposal
   * @param proposalId The ID of the proposal
   * @return The project details metadata URI for the proposal
   */
  function getMilestoneDescriptionMetadataURI(uint256 proposalId) external view returns (string memory);

  /**
   * @notice Returns the project details metadata URI for a proposal
   * @param proposalId The ID of the proposal
   * @return The project details metadata URI for the proposal
   */
  function getProjectDetailsMetadataURI(uint256 proposalId) external view returns (string memory);
}
