import { ethers } from "hardhat"
import { expect } from "chai"
import {
  catchRevert,
  createProposalAndExecuteIt,
  filterEventsByName,
  getOrDeployContractInstances,
  getVot3Tokens,
  parseAppAddedEvent,
  startNewAllocationRound,
  waitForVotingPeriodToEnd,
} from "./helpers"
import { describe, it } from "mocha"

describe("X-Allocation Pool", function () {})
