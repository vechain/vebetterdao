// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";

// import { Governor } from "./Governor.sol";

contract B3trApps is AccessControl {
  // using Checkpoints for Checkpoints.Trace208;

  // mapping(bytes32 appCode => Checkpoints.Trace208) private _appCheckpoints;

  // Checkpoints.Trace208 private _totalCheckpoints;

  struct App {
    bytes32 code; // must be unique
    string name;
    address payable appAddress;
  }

  App[] public apps;
  mapping(bytes32 => uint) private appCodeToIndex;

  // /**
  //  * @dev Lookup to future votes is not available.
  //  */
  // error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

  event AppAdded(bytes32 code, string appName, address appAddress);

  constructor(address _admin) {
    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
  }

  function addApp(
    string memory code,
    string memory appName,
    address payable appAddress
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(appCodeToIndex[keccak256(bytes(code))] == 0, "App code already exists");

    apps.push(App(keccak256(bytes(code)), appName, appAddress));
    appCodeToIndex[keccak256(bytes(code))] = apps.length;

    emit AppAdded(keccak256(bytes(code)), appName, appAddress);
  }

  // /**
  //  * @dev Returns the current amount of votes that an `app` has.
  //  */
  // function getAppVotes(bytes32 appCode) public view virtual returns (uint256) {
  //   return _appCheckpoints[appCode].latest();
  // }

  // /**
  //  * @dev Returns the amount of votes that `app` had at a specific moment in the past. If the `clock()` is
  //  * configured to use block numbers, this will return the value at the end of the corresponding block.
  //  *
  //  * Requirements:
  //  *
  //  * - `timepoint` must be in the past. If operating using block numbers, the block must be already mined.
  //  */
  // function getAppPastVotes(bytes32 appCode, uint256 timepoint) public view virtual returns (uint256) {
  //   // qua si potrebbe accettare proposalId come parametro e ritrovarci blocco di quando la proposta è finita e poi fare il lookup
  //   uint48 currentTimepoint = clock();
  //   if (timepoint >= currentTimepoint) {
  //     revert ERC5805FutureLookup(timepoint, currentTimepoint);
  //   }
  //   return _appCheckpoints[appCode].upperLookupRecent(SafeCast.toUint48(timepoint));
  // }

  // /**
  //  * @dev Clock used for flagging checkpoints. Can be overridden to implement timestamp based
  //  * checkpoints (and voting), in which case {CLOCK_MODE} should be overridden as well to match.
  //  */
  // function clock() public view virtual returns (uint48) {
  //   return Time.blockNumber();
  // }

  // // when proposal is created votes are resetted

  // function propose() public virtual returns (uint256) {
  //   address proposer = _msgSender();

  //   // check that there isn't an already ongoing or pending proposal
  //   require(state(_proposalCount) == ProposalState.Executed, "Governor: there can be only one proposal per time");

  //   // check proposal threshold
  //   uint256 proposerVotes = getVotes(proposer, clock() - 1); //GovernorVotes
  //   uint256 votesThreshold = proposalThreshold(); //GovernorSettings

  //   require(proposerVotes >= votesThreshold, "Governor: proposer votes below proposal threshold");

  //   //return _propose(proposer);
  // }

  // function state(uint256 proposalId) public view virtual override returns (ProposalState) {
  //   ProposalCore storage proposal = _proposals[proposalId];

  //   if (proposal.executed) {
  //     return ProposalState.Executed;
  //   }

  //   uint256 snapshot = proposalSnapshot(proposalId); //Governor

  //   if (snapshot == 0) {
  //     revert("Governor: unknown proposal id");
  //   }

  //   uint256 currentTimepoint = clock();

  //   if (snapshot >= currentTimepoint) {
  //     return ProposalState.Pending;
  //   }

  //   uint256 deadline = proposalDeadline(proposalId); //Governor

  //   if (deadline >= currentTimepoint) {
  //     return ProposalState.Active;
  //   }

  //   if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
  //     //GovernorCounting
  //     return ProposalState.Succeeded;
  //   }
  // }
}
