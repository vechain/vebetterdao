// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IVeBetterDAOPassport } from "./interfaces/IVeBetterDAOPassport.sol";
import { IProofModule } from "./interfaces/IProofModule.sol";

contract VeBetterDAOPassport is UUPSUpgradeable, AccessControlUpgradeable, IVeBetterDAOPassport {
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

  struct ModuleInfo {
    address moduleAddress;
    uint256 weight;
  }

  /// @custom:storage-location erc7201:b3tr.storage.VeBetterDAOPassport
  struct VeBetterDAOPassportStorage {
    mapping(bytes32 => ModuleInfo) modules; // Mapping from hashed module name to module info
    bytes32[] moduleHashes; // List of module hashes for easy iteration
    mapping(address => bool) whitelist; // whitelist of users that are valid without any checks
    mapping(address => bool) blacklist; // blacklist of users that are invalid without any checks
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.VeBetterDAOPassport")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant VeBetterDAOPassportStorageLocation =
    0xbcc851e46ae1ae66c9aa72f23f77ac315f6a1a6c6de2050f7fb88b25fe374d00;

  function _getVeBetterDAOPassportStorage() private pure returns (VeBetterDAOPassportStorage storage $) {
    assembly {
      $.slot := VeBetterDAOPassportStorageLocation
    }
  }

  /// @notice Modifier to check if the user has the required role or is the DEFAULT_ADMIN_ROLE
  /// @param role - the role to check
  modifier onlyRoleOrAdmin(bytes32 role) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert VeBetterDAOPassportUnauthorizedUser(msg.sender);
    }
    _;
  }

  // ---------- Initialization ---------- //

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address _admin, address _upgrader) public initializer {
    require(_admin != address(0), "VeBetterDAOPassport: admin is the zero address");
    require(_upgrader != address(0), "VeBetterDAOPassport: upgrader is the zero address");

    __UUPSUpgradeable_init();
    __AccessControl_init();

    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(UPGRADER_ROLE, _upgrader);
  }

  // ---------- Authorizers ---------- //

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(DEFAULT_ADMIN_ROLE) {}

  // ---------- Setters ---------- //

  /// @notice Adds a new proof module
  /// @param moduleName The name of the module (hashed to `bytes32` key)
  /// @param moduleAddress The address of the module contract
  function addModule(string memory moduleName, address moduleAddress) external override onlyRole(DEFAULT_ADMIN_ROLE) {
    require(moduleAddress != address(0), "VeBetterDAOPassport: moduleAddress is the zero address");

    VeBetterDAOPassportStorage storage $ = _getVeBetterDAOPassportStorage();

    // Hash the module name to create the key
    bytes32 moduleHash = keccak256(abi.encodePacked(moduleName));

    require($.modules[moduleHash].moduleAddress == address(0), "VeBetterDAOPassport: module already exists");

    // Add the module
    $.modules[moduleHash] = ModuleInfo({ moduleAddress: moduleAddress, weight: 1e18 }); // Default weight is 1
    $.moduleHashes.push(moduleHash);

    // Emit an event
    emit ModuleAdded(moduleName, moduleHash, moduleAddress);
  }

  /// @notice Removes a proof module
  /// @param moduleName The name of the module to remove (hashed to `bytes32` key)
  function removeModule(string memory moduleName) external override onlyRole(DEFAULT_ADMIN_ROLE) {
    // Hash the module name to create the key
    bytes32 moduleHash = keccak256(abi.encodePacked(moduleName));

    VeBetterDAOPassportStorage storage $ = _getVeBetterDAOPassportStorage();

    require($.modules[moduleHash].moduleAddress != address(0), "VeBetterDAOPassport: module does not exist");
    address moduleAddress = $.modules[moduleHash].moduleAddress;

    // Remove the module
    delete $.modules[moduleHash];

    // Remove the module hash from the list
    for (uint256 i = 0; i < $.moduleHashes.length; i++) {
      if ($.moduleHashes[i] == moduleHash) {
        $.moduleHashes[i] = $.moduleHashes[$.moduleHashes.length - 1];
        $.moduleHashes.pop();
        break;
      }
    }

    // Emit an event
    emit ModuleRemoved(moduleName, moduleHash, moduleAddress);
  }

  /// @notice Sets the whitelisted status of a user
  /// @dev The whitelisted status of a user can be modified by the DEFAULT_ADMIN_ROLE
  /// @dev A whitelisted user is considered as a person without any checks
  /// @param user - the user address
  /// @param isWhitelisted - the whitelisted status
  function setWhitelistedUser(address user, bool isWhitelisted) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    require(user != address(0), "ProofOfPersonhood: user is the zero address");

    _getVeBetterDAOPassportStorage().whitelist[user] = isWhitelisted;

    emit WhitelistedUserSet(user, isWhitelisted);
  }

  function setBlacklistedUser(address user, bool isBlacklisted) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    require(user != address(0), "ProofOfPersonhood: user is the zero address");

    _getVeBetterDAOPassportStorage().blacklist[user] = isBlacklisted;

    emit BlacklistedUserSet(user, isBlacklisted);
  }

  // ---------- Getters ---------- //

  /// @notice Gets the combined score for a user, considering the weights of different modules
  /// @param user The address of the user
  /// @return The combined score for the user
  function getTotalScore(address user) external view override returns (uint256) {
    VeBetterDAOPassportStorage storage $ = _getVeBetterDAOPassportStorage();

    uint256 totalWeightedScore = 0;
    uint256 totalWeight = 0;

    // Iterate through each module and calculate the weighted score
    for (uint256 i = 0; i < $.moduleHashes.length; i++) {
      bytes32 moduleHash = $.moduleHashes[i];
      ModuleInfo memory module = $.modules[moduleHash];

      IProofModule proofModule = IProofModule(module.moduleAddress);
      uint256 normalizedScore = proofModule.getNormalizedScore(user);

      totalWeightedScore += normalizedScore * module.weight;
      totalWeight += module.weight;
    }

    // Normalize the total weighted score to [0, 1]
    return totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
  }

  /// @notice Checks if the user is a real person based on combined scores
  /// @param user The address of the user
  /// @return True if the user is considered a real person, otherwise false
  function isPerson(address user) external view override returns (bool) {
    uint256 totalScore = this.getTotalScore(user);

    // For example, consider a threshold of 0.5 (50% of the maximum possible score) to consider a user a real person
    uint256 threshold = 0.5e18; // Adjust this threshold as needed

    return totalScore >= threshold;
  }

  /// @notice Gets the version of the contract
  /// @return The version string
  function version() public pure returns (string memory) {
    return "1";
  }
}
