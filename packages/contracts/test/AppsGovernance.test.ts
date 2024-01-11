import { ethers } from "hardhat"
import { createProposal, createProposalAndExecuteIt, getOrDeployContractInstances, getProposalIdFromTx, mintAndDelegate, waitForNextBlock, waitForVotingPeriodToEnd, waitForVotingPeriodToStart } from "./helpers"
import { expect } from "chai"
import { keccak256 } from "ethers"
import { wait } from "@vechain/web3-providers-connex/dist/utils"

describe("Apps Governance", function () {
    describe("Add app, start round and vote", function () {
        async function addApp(proposer, voter, appAddress, governor, appVotingContract, appCode = "test_app" + Math.random()) {
            console.log("Create proposal to add a new App and execute it");
            await createProposalAndExecuteIt(
                proposer,
                voter,
                governor,
                appVotingContract,
                await ethers.getContractFactory("B3trApps"),
                "Add app to the list", "addApp",
                [appCode, "Bike 4 Life" + Math.random(), appAddress]
            )

            console.log("Done");
        }

        it.only("Governor should be able to add app", async function () {
            const {
                b3tr,
                vot3,
                governor,
                appVotingContract,
                otherAccounts,
                otherAccount: proposer
            } = await getOrDeployContractInstances(true)

            console.log("Minting and delegating to voters");
            const voter1 = otherAccounts[0]
            const voter2 = otherAccounts[1]
            const voter3 = otherAccounts[2]
            await mintAndDelegate(voter1, "100")
            await mintAndDelegate(voter2, "100")
            await mintAndDelegate(voter3, "100")
            console.log("Done", await appVotingContract.clock());
            // await waitForNextBlock()
            // console.log("Past total supply",
            //     ethers.formatEther(await vot3.getPastTotalSupply(await appVotingContract.clock() - BigInt(1))))
            // console.log("----------------------------------------------------");


            console.log("Create proposal to add a new App and execute it");
            await createProposalAndExecuteIt(
                proposer,
                otherAccounts[0],
                governor,
                appVotingContract,
                await ethers.getContractFactory("B3trApps"),
                "Add app to the list", "addApp",
                ["test_app", "My sustainable test app", otherAccounts[1].address]
            )
            const app1Code = keccak256(ethers.toUtf8Bytes("test_app"))
            console.log("Done");


            console.log("Create proposal to add a new App and execute it");
            await createProposalAndExecuteIt(
                proposer,
                otherAccounts[0],
                governor,
                appVotingContract,
                await ethers.getContractFactory("B3trApps"),
                "Add app to the list", "addApp",
                ["test_app_2", "Bike 4 Life", otherAccounts[2].address]
            )
            const app2Code = keccak256(ethers.toUtf8Bytes("test_app_2"))
            console.log("Done");

            // for (let i = 0; i < 50; i++) {
            //     await addApp(proposer, otherAccounts[0], otherAccounts[i + 2].address, governor, appVotingContract)
            // }

            console.log("----------------------------------------------------");

            console.log("Check current votes");
            let votes = await appVotingContract.getCurrentAppVotes(app1Code)
            console.log("Votes for app 1: ", votes.toString());
            votes = await appVotingContract.getCurrentAppVotes(app2Code)
            console.log("Votes for app 2: ", votes.toString());

            console.log("----------------------------------------------------");

            console.log("Start a new voting round");
            let tx = await appVotingContract.propose()
            const proposeReceipt = await tx.wait()
            const event = proposeReceipt?.logs[0]
            const decodedLogs = appVotingContract.interface.parseLog({
                topics: [...(event?.topics as string[])],
                data: event ? event.data : "",
            });
            const proposalId = decodedLogs?.args[0]
            console.log("Done, proposal id", proposalId);

            await waitForNextBlock()
            console.log("Past total supply",
                ethers.formatEther(await vot3.getPastTotalSupply(tx.blockNumber)))

            console.log("----------------------------------------------------");

            console.log("Wait for voting period to start");
            await waitForVotingPeriodToStart(proposalId, appVotingContract)

            console.log("Voter1 votes for app 1 with 100 votes");
            tx = await appVotingContract.connect(voter1).castVotes(1, [app1Code], [ethers.parseEther("100")])
            console.log("Done");


            console.log("Check current votes");
            votes = await appVotingContract.getCurrentAppVotes(app1Code)
            console.log("Votes for app 1: ", ethers.formatEther(votes));
            votes = await appVotingContract.getCurrentAppVotes(app2Code)
            console.log("Votes for app 2: ", ethers.formatEther(votes));

            console.log("Voter2 votes 50 for app 1 and 50 for app 2");
            tx = await appVotingContract.connect(voter2).castVotes(1, [app1Code, app2Code], [ethers.parseEther("50"), ethers.parseEther("50")])
            console.log("Done");

            console.log("Check current votes");
            votes = await appVotingContract.getCurrentAppVotes(app1Code)
            console.log("Votes for app 1: ", ethers.formatEther(votes));
            votes = await appVotingContract.getCurrentAppVotes(app2Code)
            console.log("Votes for app 2: ", ethers.formatEther(votes));


            console.log("Wait for round to end");
            await waitForVotingPeriodToEnd(proposalId, appVotingContract)


            // console.log("Proposal snapshot",
            //     await appVotingContract.proposalSnapshot(proposalId.toString()))

            // console.log("Past total supply",
            //     ethers.formatEther(await vot3.getPastTotalSupply(await appVotingContract.proposalSnapshot(proposalId.toString()))))
            // console.log("Proposal deadline",
            //     await appVotingContract.proposalDeadline(proposalId.toString()))
            // console.log("Latest quorum numarator", await appVotingContract.quorumNumerator());

            // console.log("Quorum reached", await appVotingContract.quorumReached(proposalId.toString()));
            // console.log("Quorum is", ethers.formatEther(await appVotingContract.quorum(await appVotingContract.proposalSnapshot(proposalId.toString()))));
            // console.log("Total checkpoints", await appVotingContract.latestCheckpoints());

            // console.log("current block", await appVotingContract.clock());

            // const state = await appVotingContract.state(proposalId.toString())
            // console.log("State: ", state.toString());

            console.log("Get results for round 1");
            const result = await appVotingContract.getRoundResults(proposalId.toString())


            console.log("Result: ", result);

            console.log("----------------------------------------------------");

            console.log("Start new round");
            tx = await appVotingContract.propose()
            const proposeReceipt2 = await tx.wait()
            const event2 = proposeReceipt2?.logs[1]
            const decodedLogs2 = appVotingContract.interface.parseLog({
                topics: [...(event2?.topics as string[])],
                data: event2 ? event2.data : "",
            });
            const proposalId2 = decodedLogs2?.args[0]
            console.log("Done, proposal id", proposalId2);
            await waitForNextBlock()
            console.log("Past total supply",
                ethers.formatEther(await vot3.getPastTotalSupply(tx.blockNumber)))

            console.log("Votes should be resetted");
            console.log("Check current votes");
            votes = await appVotingContract.getCurrentAppVotes(app1Code)
            console.log("Votes for app 1: ", ethers.formatEther(votes));
            votes = await appVotingContract.getCurrentAppVotes(app2Code)
            console.log("Votes for app 2: ", ethers.formatEther(votes));

            console.log("I shoudl still be able to see votes of round 1");
            const resultRound1 = await appVotingContract.getRoundResults(proposalId.toString())
            console.log("Result: ", result);

            // To know what a user voted for we will parse events
        })
    })
})

