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

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { IB3TR } from "../../interfaces/IB3TR.sol";
import { GovernorUpgradeable } from "../GovernorUpgradeable.sol";

/**
 * @title GovernorExternalContractsUpgradeable
 * @dev Extension of {GovernorUpgradeable} that handles the storage of external contracts for the Governor to interact with.
 */
abstract contract GovernorExternalContractsUpgradeable is Initializable, GovernorUpgradeable {
  /// @custom:storage-location erc7201:b3tr.storage.GovernorExternalContracts
  struct GovernorExternalContractsStorage {
    IVoterRewards voterRewards;
    IXAllocationVotingGovernor xAllocationVoting;
    IB3TR b3tr;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.GovernorExternalContracts")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorExternalContractsStorageLocation =
    0x6d311431325c170b987c30b6d17339e389e296c0263ec970ed19f9bcbef96300;

  function _getGovernorExternalContractsStorage() internal pure returns (GovernorExternalContractsStorage storage $) {
    assembly {
      $.slot := GovernorExternalContractsStorageLocation
    }
  }

  // @dev Emit when the voter rewards contract is set
  event VoterRewardsSet(address oldContractAddress, address newContractAddress);
  // @dev Emit when the XAllocationVotingGovernor contract is set
  event XAllocationVotingSet(address oldContractAddress, address newContractAddress);
  // @dev Emit when the B3TR contract is set
  event B3TRSet(address oldContractAddress, address newContractAddress);

  /**
   * @dev Initializes the contract
   * @param initialVoterRewards The initial voter rewards contract
   * @param initialXAllocationVoting The initial XAllocationVotingGovernor contract
   * @param initialB3trContract The B3TR contract
   */
  function __ExternalContracts_init(
    IVoterRewards initialVoterRewards,
    IXAllocationVotingGovernor initialXAllocationVoting,
    IB3TR initialB3trContract
  ) internal onlyInitializing {
    __ExternalContracts_init_unchained(initialVoterRewards, initialXAllocationVoting, initialB3trContract);
  }

  function __ExternalContracts_init_unchained(
    IVoterRewards initialVoterRewards,
    IXAllocationVotingGovernor initialXAllocationVoting,
    IB3TR initialB3trContract
  ) internal onlyInitializing {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    $.voterRewards = initialVoterRewards;
    $.xAllocationVoting = initialXAllocationVoting;
    $.b3tr = initialB3trContract;
  }

  // ------- Setters ------- //
  /**
   * @dev Set the voter rewards contract
   *
   * @param newVoterRewards The new voter rewards contract
   *
   * Emits a {VoterRewardsSet} event
   */
  function setVoterRewards(IVoterRewards newVoterRewards) public virtual {
    _setVoterRewards(newVoterRewards);
  }

  /**
   * @dev Set the XAllocationVotingGovernor contract
   *
   * @param newXAllocationVoting The new XAllocationVotingGovernor contract
   *
   * Emits a {XAllocationVotingSet} event
   */
  function setXAllocationVoting(IXAllocationVotingGovernor newXAllocationVoting) public virtual {
    _setXAllocationVoting(newXAllocationVoting);
  }

  /**
   * @dev Set the B3TR contract
   *
   * @param newB3trContract The new B3TR contract
   *
   * Emits a {B3TRSet} event
   */
  function setB3tr(IB3TR newB3trContract) public virtual {
    _setB3tr(newB3trContract);
  }

  // ------- Internal Functions ------- //
  /**
   * @dev Internal function to set the voter rewards contract
   *
   * @param newVoterRewards The new voter rewards contract
   *
   * Emits a {VoterRewardsSet} event
   */
  function _setVoterRewards(IVoterRewards newVoterRewards) internal {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    $.voterRewards = newVoterRewards;

    emit VoterRewardsSet(address($.voterRewards), address(newVoterRewards));
  }

  /**
   * @dev Internal function to set the XAllocationVotingGovernor contract
   *
   * @param newXAllocationVoting The new XAllocationVotingGovernor contract
   *
   * Emits a {XAllocationVotingSet} event
   */
  function _setXAllocationVoting(IXAllocationVotingGovernor newXAllocationVoting) internal {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    $.xAllocationVoting = newXAllocationVoting;

    emit XAllocationVotingSet(address($.xAllocationVoting), address(newXAllocationVoting));
  }

  /**
   * @dev Internal function to set the B3TR contract
   *
   * @param newB3trContract The new B3TR contract
   *
   * Emits a {B3TRSet} event
   */
  function _setB3tr(IB3TR newB3trContract) internal {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    $.b3tr = newB3trContract;

    emit B3TRSet(address($.b3tr), address(newB3trContract));
  }

  // ------- Getters ------- //

  /**
   * @dev The voter rewards contract.
   */
  function voterRewards() public view override returns (IVoterRewards) {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    return $.voterRewards;
  }

  /**
   * @dev The XAllocationVotingGovernor contract.
   */
  function xAllocationVoting() public view override returns (IXAllocationVotingGovernor) {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    return $.xAllocationVoting;
  }

  /**
   * @dev See {B3TRGovernor-b3tr}.
   */
  function b3tr() public view override returns (IB3TR) {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    return $.b3tr;
  }
}
