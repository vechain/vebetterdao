// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";

contract B3trApps is AccessControl {
  struct App {
    bytes32 code; // must be unique
    string name;
    address payable appAddress;
  }

  App[] public apps;
  mapping(bytes32 => uint) private appCodeToIndex;

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
}
