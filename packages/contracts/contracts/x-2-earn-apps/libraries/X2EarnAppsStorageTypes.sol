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

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { PassportTypes } from "../../ve-better-passport/libraries/PassportTypes.sol";
import { INodeManagementV3 } from "../../mocks/Stargate/interfaces/INodeManagement/INodeManagementV3.sol";
import { IVeBetterPassport } from "../../interfaces/IVeBetterPassport.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { IStargateNFT } from "../../mocks/Stargate/interfaces/IStargateNFT.sol";
import { X2EarnAppsDataTypes } from "../../libraries/X2EarnAppsDataTypes.sol";
import { IX2EarnCreator } from "../../interfaces/IX2EarnCreator.sol";
import { IX2EarnRewardsPool } from "../../interfaces/IX2EarnRewardsPool.sol";

/**
 * @title X2EarnAppsStorageTypes
 * @notice This library defines the primary storage types used within the X2EarnApps contract.
 */
library X2EarnAppsStorageTypes {
  bytes32 private constant VoteEligibilityStorageLocation =
    0xb5b8d618af1ffb8d5bcc4bd23f445ba34ed08d7a16d1e1b5411cfbe7913e5900;
  bytes32 private constant EndorsementStorageLocation =
    0xc1a7bcdc0c77e8c77ade4541d1777901ab96ca598d164d89afa5c8dfbfc44300;
  bytes32 private constant SettingsStorageLocation = 0x83b9a7e51f394efa93107c3888716138908bbbe611dfc86afa3639a826441100;
  bytes32 private constant AppsStorageStorageLocation =
    0xb6909058bd527140b8d55a44344c5e42f1f148f1b3b16df7641882df8dd72900;
  bytes32 private constant AdministrationStorageLocation =
    0x5830f0e95c01712d916c34d9e2fa42e9f749b325b67bce7382d70bb99c623500;

  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.VoteEligibility
  struct VoteEligibilityStorage {
    bytes32[] _eligibleApps; // Array containing an up to date list of apps that are eligible for voting
    mapping(bytes32 appId => uint256 index) _eligibleAppIndex; // Mapping from app ID to index in the _eligibleApps array, so we can remove an app in O(1)
    mapping(bytes32 appId => Checkpoints.Trace208) _isAppEligibleCheckpoints; // Checkpoints to track the eligibility changes of an app over time
    mapping(bytes32 => bool) _blackList; // Mapping to store the blacklisted apps
  }

  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.Endorsment
  struct EndorsementStorage {
    bytes32[] _unendorsedApps; // List of apps pending endorsement
    mapping(bytes32 => uint256) _unendorsedAppsIndex; // Mapping from app ID to index in the _unendorsedApps array, so we can remove an app in O(1)
    mapping(bytes32 => uint256[]) _appEndorsers; // Maps each app ID to an array of node IDs that have endorsed it
    mapping(uint8 => uint256) _nodeEnodorsmentScore; // The endorsement score for each node level
    mapping(bytes32 => uint48) _appGracePeriodStart; // The grace period elapsed by the app since endorsed
    mapping(uint256 => bytes32) _nodeToEndorsedApp; // Maps a node ID to the app it currently endorses
    uint48 _gracePeriodDuration; // The grace period threshold for no endorsement in BLOCKS
    uint256 _endorsementScoreThreshold; // The endorsement score threshold for an app to be eligible for voting
    mapping(bytes32 => uint256) _appScores; // The score of each app
    mapping(bytes32 => PassportTypes.APP_SECURITY) _appSecurity; // The security score of each app
    INodeManagementV3 _nodeManagementContract; // The token auction contract
    IVeBetterPassport _veBetterPassport; // The VeBetterPassport contract
    mapping(uint256 => uint256) _endorsementRound; // The latest round in which a node endorsed an app
    uint256 _cooldownPeriod; // Cooldown duration in rounds for a node to endorse an app
    IXAllocationVotingGovernor _xAllocationVotingGovernor; // The XAllocationVotingGovernor contract
    //------- Version 7 -------//
    IStargateNFT _stargateNFT; // The Stargate NFT contract
  }

  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.Settings
  struct ContractSettingsStorage {
    string _baseURI;
  }

  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.AppsStorage
  struct AppsStorageStorage {
    // Mapping from app ID to app
    mapping(bytes32 appId => X2EarnAppsDataTypes.App) _apps;
    // List of app IDs to enable retrieval of all _apps
    bytes32[] _appIds;
  }

  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.Administration
  struct AdministrationStorage {
    mapping(bytes32 appId => address) _admin;
    mapping(bytes32 appId => address[]) _moderators;
    mapping(bytes32 appId => address[]) _rewardDistributors; // addresses that can distribute rewards from X2EarnRewardsPool
    mapping(bytes32 appId => address) _teamWalletAddress;
    mapping(bytes32 appId => uint256) _teamAllocationPercentage; // by default this is 0 and all funds are sent to the X2EarnRewardsPool
    mapping(bytes32 appId => string) _metadataURI;
    mapping(bytes32 appId => address[]) _creators; // addresses that have a creators NFT and can manage interactions with Node holders
    mapping(address creator => uint256 apps) _creatorApps; // number of apps created by a creator
    IX2EarnCreator _x2EarnCreatorContract;
    IX2EarnRewardsPool _x2EarnRewardsPoolContract; // x2earn rewards pool contract to enable rewards pool for new apps
  }

  function _getVoteEligibilityStorage()
    internal
    pure
    returns (X2EarnAppsStorageTypes.VoteEligibilityStorage storage $)
  {
    assembly {
      $.slot := VoteEligibilityStorageLocation
    }
  }

  function _getEndorsementStorage() internal pure returns (X2EarnAppsStorageTypes.EndorsementStorage storage $) {
    assembly {
      $.slot := EndorsementStorageLocation
    }
  }

  function _getContractSettingsStorage()
    internal
    pure
    returns (X2EarnAppsStorageTypes.ContractSettingsStorage storage $)
  {
    assembly {
      $.slot := SettingsStorageLocation
    }
  }

  function _getAppsStorageStorage() internal pure returns (X2EarnAppsStorageTypes.AppsStorageStorage storage $) {
    assembly {
      $.slot := AppsStorageStorageLocation
    }
  }

  function _getAdministrationStorage() internal pure returns (X2EarnAppsStorageTypes.AdministrationStorage storage $) {
    assembly {
      $.slot := AdministrationStorageLocation
    }
  }
}
