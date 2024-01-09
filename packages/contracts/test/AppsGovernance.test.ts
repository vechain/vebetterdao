import { ethers } from "hardhat"
import { createProposal, createProposalAndExecuteIt, getOrDeployContractInstances, getProposalIdFromTx, mintAndDelegate, waitForNextBlock, waitForVotingPeriodToEnd, waitForVotingPeriodToStart } from "./helpers"
import { expect } from "chai"

describe("Apps Governance", function () {
    describe("Add app", function () {
        it.only("Governor should be able to add app", async function () {
            const {
                governor,
                b3trApps,
                otherAccounts,
                otherAccount: proposer
            } = await getOrDeployContractInstances(true)

            await createProposalAndExecuteIt(
                proposer,
                otherAccounts[0],
                governor,
                b3trApps,
                await ethers.getContractFactory("B3trApps"),
                "Add app to the list", "addApp",
                ["test_app", "My sustainable test app", otherAccounts[1].address]
            )

            await createProposalAndExecuteIt(
                proposer,
                otherAccounts[0],
                governor,
                b3trApps,
                await ethers.getContractFactory("B3trApps"),
                "Add app to the list", "addApp",
                ["test_app_2", "Bike 4 Life", otherAccounts[2].address]
            )
        })
    })
})