import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { setupGovernanceFixtureWithEmissions, setupProposer } from "./fixture.test"
import { B3TRGovernor, VOT3, B3TR, Treasury, GrantsManager, VeBetterPassport } from "../../typechain-types"
import { ethers } from "ethers"
import { describe, it, beforeEach } from "mocha"

describe("Proposal - Proposer requirement", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let minterAccount: SignerWithAddress
  let proposer: SignerWithAddress
  let treasury: Treasury
  let grantsManager: GrantsManager
  let owner: SignerWithAddress
  let voter: SignerWithAddress
  let veBetterPassport: VeBetterPassport

  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    minterAccount = fixture.minterAccount
    proposer = fixture.proposer
    treasury = fixture.treasury
    grantsManager = fixture.grantsManager
    owner = fixture.owner
    voter = fixture.voter
    veBetterPassport = fixture.veBetterPassport

    // Setup proposer for all tests
    await setupProposer(proposer, b3tr, vot3, minterAccount)
  })

  describe("Proposer requirement", function () {
    it("Should correctly set the GM for the standard governance proposal", async function () {})

    it("Should correctly set the GM for the grant proposal", async function () {})

    it("Should not create a proposal if the proposer does not have the correct GM", async function () {})
  })
})
