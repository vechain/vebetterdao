import { ethers } from "hardhat"
import { createProposal, createProposalAndExecuteIt, getOrDeployContractInstances, getProposalIdFromTx, mintAndDelegate, waitForNextBlock, waitForVotingPeriodToEnd, waitForVotingPeriodToStart } from "./helpers"
import { expect } from "chai"
import { keccak256 } from "ethers"

describe("Apps Governance", function () {
    describe("Add app", function () {
        it.only("Governor should be able to add app", async function () {
            const {
                governor,
                b3trApps,
                otherAccounts,
                otherAccount: proposer
            } = await getOrDeployContractInstances(true)

            console.log("createProposalAndExecuteIt");

            await createProposalAndExecuteIt(
                proposer,
                otherAccounts[0],
                governor,
                b3trApps,
                await ethers.getContractFactory("B3trApps"),
                "Add app to the list", "addApp",
                ["test_app", "My sustainable test app", otherAccounts[1].address]
            )
            const app1Code = keccak256(ethers.toUtf8Bytes("test_app"))

            console.log("createProposalAndExecuteIt");

            await createProposalAndExecuteIt(
                proposer,
                otherAccounts[0],
                governor,
                b3trApps,
                await ethers.getContractFactory("B3trApps"),
                "Add app to the list", "addApp",
                ["test_app_2", "Bike 4 Life", otherAccounts[2].address]
            )
            const app2Code = keccak256(ethers.toUtf8Bytes("test_app_2"))

            console.log("Check votes");
            let votes = await b3trApps.getAppVotes(app1Code)
            console.log("Votes for app 1: ", votes.toString());
            votes = await b3trApps.getAppVotes(app2Code)
            console.log("Votes for app 2: ", votes.toString());

            console.log("Check past votes");
            votes = await b3trApps.getAppPastVotes(app1Code, 1)
            console.log("Votes for app 1: ", votes.toString());
            votes = await b3trApps.getAppPastVotes(app2Code, 1)
            console.log("Votes for app 2: ", votes.toString());


        })
    })
})