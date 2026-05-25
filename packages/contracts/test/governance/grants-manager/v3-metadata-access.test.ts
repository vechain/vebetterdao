import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { ContractFactory, Interface } from "ethers"
import { ethers } from "hardhat"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

import {
  B3TR,
  B3TRGovernor,
  Emissions,
  GrantsManager,
  GrantsManager__factory,
  TimeLock,
  Treasury,
  VeBetterPassport,
  VOT3,
  XAllocationVoting,
} from "../../../typechain-types"
import { createProposalWithMultipleFunctionsAndExecuteItGrant, waitForCurrentRoundToEnd } from "../../helpers/common"
import { setupGovernanceFixtureWithEmissions, setupProposer, setupVoter } from "../fixture.test"

/**
 * V3 widens updateMilestoneMetadataURI from proposer-only to
 *   proposer + grants receiver + GRANTS_APPROVER_ROLE + GOVERNANCE_ROLE.
 *
 * In production the grants approver wallet acts as the proposer for nearly every grant, so the
 * receiving app cannot persist expenditure reports under the V2 rule. V3 unblocks that flow.
 */
describe("GrantsManager - V3 Metadata URI Access - @shard4k", function () {
  let governor: B3TRGovernor
  let vot3: VOT3
  let b3tr: B3TR
  let minterAccount: SignerWithAddress
  let proposer: SignerWithAddress
  let secondaryAccount: SignerWithAddress // grants receiver
  let outsider: SignerWithAddress
  let approver: SignerWithAddress
  let treasury: Treasury
  let grantsManager: GrantsManager
  let owner: SignerWithAddress
  let voter: SignerWithAddress
  let veBetterPassport: VeBetterPassport
  let timeLock: TimeLock
  let grantsManagerAddress: string
  let treasuryAddress: string
  let emissions: Emissions
  let xAllocationVoting: XAllocationVoting
  let contractToPassToMethods: any
  let treasuryContract: ContractFactory
  let grantsManagerInterface: Interface

  beforeEach(async function () {
    const fixture = await setupGovernanceFixtureWithEmissions()
    governor = fixture.governor
    vot3 = fixture.vot3
    b3tr = fixture.b3tr
    minterAccount = fixture.minterAccount
    proposer = fixture.proposer
    secondaryAccount = fixture.otherAccount
    treasury = fixture.treasury
    grantsManager = fixture.grantsManager
    owner = fixture.owner
    voter = fixture.voter
    veBetterPassport = fixture.veBetterPassport
    timeLock = fixture.timeLock
    emissions = fixture.emissions
    xAllocationVoting = fixture.xAllocationVoting

    outsider = fixture.otherAccounts[2]
    approver = fixture.otherAccounts[3]

    await emissions.connect(minterAccount).start()
    await setupProposer(proposer, b3tr, vot3, minterAccount)
    await setupVoter(voter, b3tr, vot3, minterAccount, owner, veBetterPassport)
    await vot3.connect(proposer).approve(await governor.getAddress(), ethers.parseEther("1000"))

    grantsManagerAddress = await grantsManager.getAddress()
    treasuryAddress = await treasury.getAddress()
    treasuryContract = await ethers.getContractFactory("Treasury")
    contractToPassToMethods = {
      b3tr,
      vot3,
      minterAccount,
      governor,
      treasury,
      emissions,
      xAllocationVoting,
      veBetterPassport,
      owner,
      timeLock,
      grantsManager,
    }
    grantsManagerInterface = GrantsManager__factory.createInterface()
  })

  async function createGrantWithSecondaryReceiver(): Promise<bigint> {
    const description = `metadata-access-${Date.now()}-${Math.random()}`
    const milestonesDetailsMetadataURI = "ipfs://Qm-initial"
    const values = [ethers.parseEther("10000"), ethers.parseEther("10000")]

    const { proposalId } = await createProposalWithMultipleFunctionsAndExecuteItGrant(
      proposer,
      voter,
      [treasury, treasury],
      treasuryContract,
      description,
      ["transferB3TR", "transferB3TR"],
      [
        [grantsManagerAddress, values[0]],
        [grantsManagerAddress, values[1]],
      ],
      "0",
      secondaryAccount.address,
      milestonesDetailsMetadataURI,
      contractToPassToMethods,
    )
    return BigInt(proposalId)
  }

  it("reports version 3", async () => {
    expect(await grantsManager.version()).to.equal(3n)
  })

  it("proposer can update milestone metadata URI", async () => {
    const proposalId = await createGrantWithSecondaryReceiver()
    const newURI = "ipfs://Qm-proposer"
    await grantsManager.connect(proposer).updateMilestoneMetadataURI(proposalId, newURI)
    expect((await grantsManager.getGrantProposal(proposalId)).metadataURI).to.equal(newURI)
  })

  it("grants receiver can update milestone metadata URI (V3)", async () => {
    const proposalId = await createGrantWithSecondaryReceiver()
    const newURI = "ipfs://Qm-receiver"
    await grantsManager.connect(secondaryAccount).updateMilestoneMetadataURI(proposalId, newURI)
    expect((await grantsManager.getGrantProposal(proposalId)).metadataURI).to.equal(newURI)
  })

  it("GRANTS_APPROVER_ROLE holder can update milestone metadata URI (V3)", async () => {
    const proposalId = await createGrantWithSecondaryReceiver()
    await grantsManager.connect(owner).grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), approver.address)

    const newURI = "ipfs://Qm-approver"
    await grantsManager.connect(approver).updateMilestoneMetadataURI(proposalId, newURI)
    expect((await grantsManager.getGrantProposal(proposalId)).metadataURI).to.equal(newURI)
  })

  it("GOVERNANCE_ROLE holder can update milestone metadata URI (V3)", async () => {
    const proposalId = await createGrantWithSecondaryReceiver()
    await grantsManager.connect(owner).grantRole(await grantsManager.GOVERNANCE_ROLE(), owner.address)

    const newURI = "ipfs://Qm-governance"
    await grantsManager.connect(owner).updateMilestoneMetadataURI(proposalId, newURI)
    expect((await grantsManager.getGrantProposal(proposalId)).metadataURI).to.equal(newURI)
  })

  it("unrelated account cannot update milestone metadata URI", async () => {
    const proposalId = await createGrantWithSecondaryReceiver()
    await expect(
      grantsManager.connect(outsider).updateMilestoneMetadataURI(proposalId, "ipfs://Qm-bad"),
    ).to.be.revertedWithCustomError({ interface: grantsManagerInterface }, "NotAuthorized")
  })

  it("emits MilestoneMetadataURIUpdated for every authorized writer", async () => {
    const proposalId = await createGrantWithSecondaryReceiver()
    await grantsManager.connect(owner).grantRole(await grantsManager.GRANTS_APPROVER_ROLE(), approver.address)

    await expect(grantsManager.connect(proposer).updateMilestoneMetadataURI(proposalId, "ipfs://Qm-p"))
      .to.emit(grantsManager, "MilestoneMetadataURIUpdated")
      .withArgs(proposalId, "ipfs://Qm-p")
    await expect(grantsManager.connect(secondaryAccount).updateMilestoneMetadataURI(proposalId, "ipfs://Qm-r"))
      .to.emit(grantsManager, "MilestoneMetadataURIUpdated")
      .withArgs(proposalId, "ipfs://Qm-r")
    await expect(grantsManager.connect(approver).updateMilestoneMetadataURI(proposalId, "ipfs://Qm-a"))
      .to.emit(grantsManager, "MilestoneMetadataURIUpdated")
      .withArgs(proposalId, "ipfs://Qm-a")
  })

  // Silence unused-import lint warnings for helpers referenced via contractToPassToMethods.
  void waitForCurrentRoundToEnd
})
