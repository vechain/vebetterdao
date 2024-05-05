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

  /**
   * @dev Initializes the contract
   * @param initialVoterRewards The initial voter rewards contract
   * @param initialXAllocationVoting The initial XAllocationVotingGovernor contract
   */
  function __ExternalContracts_init(
    IVoterRewards initialVoterRewards,
    IXAllocationVotingGovernor initialXAllocationVoting
  ) internal onlyInitializing {
    __ExternalContracts_init_unchained(initialVoterRewards, initialXAllocationVoting);
  }

  function __ExternalContracts_init_unchained(
    IVoterRewards initialVoterRewards,
    IXAllocationVotingGovernor initialXAllocationVoting
  ) internal onlyInitializing {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    $.voterRewards = initialVoterRewards;
    $.xAllocationVoting = initialXAllocationVoting;
  }

  // ------- Setters ------- //
  function setVoterRewards(IVoterRewards newVoterRewards) public virtual {
    _setVoterRewards(newVoterRewards);
  }

  function setXAllocationVoting(IXAllocationVotingGovernor newXAllocationVoting) public virtual {
    _setXAllocationVoting(newXAllocationVoting);
  }

  // ------- Internal Functions ------- //
  function _setVoterRewards(IVoterRewards newVoterRewards) internal {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    $.voterRewards = newVoterRewards;

    emit VoterRewardsSet(address($.voterRewards), address(newVoterRewards));
  }

  function _setXAllocationVoting(IXAllocationVotingGovernor newXAllocationVoting) internal {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    $.xAllocationVoting = newXAllocationVoting;

    emit XAllocationVotingSet(address($.xAllocationVoting), address(newXAllocationVoting));
  }

  // ------- Getters ------- //

  function voterRewards() public view virtual override returns (IVoterRewards) {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    return $.voterRewards;
  }

  function xAllocationVoting() public view virtual override returns (IXAllocationVotingGovernor) {
    GovernorExternalContractsStorage storage $ = _getGovernorExternalContractsStorage();
    return $.xAllocationVoting;
  }
}
