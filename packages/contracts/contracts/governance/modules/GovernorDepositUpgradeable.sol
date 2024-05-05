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

pragma solidity ^0.8.20;

import { GovernorUpgradeable } from "../GovernorUpgradeable.sol";
import { IVOT3 } from "../../interfaces/IVOT3.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @dev Extension of {Governor} for depositing tokens to a proposal.
 */
abstract contract GovernorDepositUpgradeable is Initializable, ReentrancyGuardUpgradeable, GovernorUpgradeable {
  /// @custom:storage-location erc7201:openzeppelin.storage.GovernorDeposit
  struct GovernorDepositStorage {
    mapping(uint256 => mapping(address => uint256)) deposits; // mapping to track deposits made to proposals by address
    IVOT3 vot3;
  }
  // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.GovernorDeposit")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 public constant GovernorDepositStorageLocation =
    0x6e861975245d8f68d2d68ec4cace963e2e161ad0daef78ed15e673f8a3c1c600;

  function _getGovernorDepositStorage() private pure returns (GovernorDepositStorage storage $) {
    assembly {
      $.slot := GovernorDepositStorageLocation
    }
  }

  function __GovernorDeposit_init(address _vot3Token) internal onlyInitializing {
    __GovernorDeposit_init_unchained(_vot3Token);
  }

  function __GovernorDeposit_init_unchained(address _vot3Token) internal onlyInitializing {
    GovernorDepositStorage storage $ = _getGovernorDepositStorage();
    $.vot3 = IVOT3(_vot3Token);
    __ReentrancyGuard_init();
  }

  // ---------- Setters ---------- //

  /**
   * @dev Deposit tokens for a proposal. Proposer and proposal sponsors can contribute
   * towards a proposal's deposit using this function. The proposal must be in the
   * Pending state to make a deposit. The amount deposited from an address is tracked
   * and can be withdrawn by the same address when the voting round is over.
   *
   * @param amount The amount of tokens to deposit.
   * @param proposalId The id of the proposal.
   */
  function deposit(uint256 amount, uint256 proposalId) external {
    if (amount == 0) {
      revert GovernorInvalidDepositAmount();
    }

    GovernorStorage storage $ = _getGovernorStorage();
    ProposalCore storage proposal = $._proposals[proposalId];

    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Pending));

    proposal.depositAmount += amount;

    _depositFunds(amount, _msgSender(), proposalId);
  }

  /**
   * @dev Withdraw tokens previously deposited to a proposal. A depositor can only
   * withdraw their tokens once the proposal is no longer Pending or Active. Each
   * address can only withdraw once per proposal.
   *
   * Reverts if no deposits are available to withdraw or if the deposits have
   * already been withdrawn by the message sender.
   * Reverts if the token transfer fails.
   *
   * @param proposalId The id of the proposal to withdraw deposits from.
   * @param depositer The address of the depositer.
   */
  function withdraw(uint256 proposalId, address depositer) public {
    GovernorDepositStorage storage $ = _getGovernorDepositStorage();
    uint256 amount = $.deposits[proposalId][depositer];

    _validateStateBitmap(
      proposalId,
      ALL_PROPOSAL_STATES_BITMAP ^ _encodeStateBitmap(ProposalState.Pending) ^ _encodeStateBitmap(ProposalState.Active)
    );

    if (amount == 0) {
      revert GovernorNoDepositToWithdraw(proposalId, depositer);
    }

    $.deposits[proposalId][depositer] = 0;

    require($.vot3.transfer(depositer, amount), "B3TRGovernor: transfer failed");
  }

  // ---------- Getters ---------- //

  /**
   * @dev Returns the amount of deposits made to a proposal.
   *
   * @param proposalId The id of the proposal.
   */
  function getProposalDeposits(uint256 proposalId) public view returns (uint256) {
    GovernorStorage storage $ = _getGovernorStorage();
    ProposalCore storage proposal = $._proposals[proposalId];
    return proposal.depositAmount;
  }

  /**
   * @dev Returns true if the threshold of deposits required to reach a proposal has been reached.
   *
   * @param proposalId The id of the proposal.
   */
  function proposalDepositReached(uint256 proposalId) public view override returns (bool) {
    return getProposalDeposits(proposalId) >= depositThreshold();
  }

  /**
   * @dev Returns the amount of tokens a specific user has deposited to a proposal.
   *
   * @param proposalId The id of the proposal.
   * @param user The address of the user.
   */
  function getUserDeposit(uint256 proposalId, address user) public view returns (uint256) {
    GovernorDepositStorage storage $ = _getGovernorDepositStorage();
    return $.deposits[proposalId][user];
  }

  // ---------- Internal and private ---------- //

  /**
   * @dev Deposit tokens to a proposal.
   *
   * Emits a {IB3TRGovernor-ProposalDeposit} event.
   *
   * @param amount The amount of tokens to deposit.
   * @param depositor The address of the depositor.
   * @param proposalId The id of the proposal.
   */
  function _depositFunds(uint256 amount, address depositor, uint256 proposalId) internal override nonReentrant {
    GovernorDepositStorage storage $ = _getGovernorDepositStorage();

    require($.vot3.transferFrom(depositor, address(this), amount), "B3TRGovernor: transfer failed");

    $.deposits[proposalId][depositor] += amount;

    emit ProposalDeposit(depositor, proposalId, amount);
  }
}
