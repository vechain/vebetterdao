import { ethers } from "hardhat"
import { addApp, createProposal, createProposalAndExecuteIt, getOrDeployContractInstances, getProposalIdFromTx, mintAndDelegate, waitForNextBlock, waitForVotingPeriodToEnd, waitForVotingPeriodToStart } from "./helpers"
import { expect } from "chai"
import { keccak256 } from "ethers"
import { wait } from "@vechain/web3-providers-connex/dist/utils"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { AppVotingGovernor, GovernorContract } from "../typechain-types"

describe("Apps Governance", function () {
    describe("Add app, start round and vote", function () {
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
            // console.log("Done", await appVotingContract.clock());
            // await waitForNextBlock()
            // console.log("Past total supply",
            //     ethers.formatEther(await vot3.getPastTotalSupply(await appVotingContract.clock() - BigInt(1))))
            console.log("----------------------------------------------------");


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
            // For now there is no round started so we should not be able to see any votes
            console.log("Check current votes");
            let votes = await appVotingContract.getCurrentAppVotes(app1Code)
            console.log("Votes for app 1: ", votes.toString());
            votes = await appVotingContract.getCurrentAppVotes(app2Code)
            console.log("Votes for app 2: ", votes.toString());

            console.log("----------------------------------------------------");
            // 1.There can be only 1 round at a time and the id is incremental
            // 2.Duration of the round is setted upon contract deploy and can be changed
            // 3.Whoever can start a new round, there is no Access Control
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

            // await waitForNextBlock()
            // console.log("Past total supply",
            //     ethers.formatEther(await vot3.getPastTotalSupply(tx.blockNumber)))

            console.log("----------------------------------------------------");

            // As normal governance proposal there is a voting delay period, but this can be set to 0
            console.log("Wait for voting period to start");
            await waitForVotingPeriodToStart(proposalId, appVotingContract)
            console.log("----------------------------------------------------");

            console.log("START VOTING");

            // For sake of simplicity a user can vote only 1 time per round
            console.log("Voter1 votes for app 1 with 100 votes");
            tx = await appVotingContract.connect(voter1).castVotes(proposalId.toString(), [app1Code], [ethers.parseEther("100")])
            console.log("Vote casted");

            console.log("Check current votes");
            votes = await appVotingContract.getCurrentAppVotes(app1Code)
            console.log("Votes for app 1: ", ethers.formatEther(votes));
            votes = await appVotingContract.getCurrentAppVotes(app2Code)
            console.log("Votes for app 2: ", ethers.formatEther(votes));

            console.log("Voter2 votes 50 for app 1 and 50 for app 2");
            tx = await appVotingContract.connect(voter2).castVotes(proposalId.toString(), [app1Code, app2Code], [ethers.parseEther("50"), ethers.parseEther("50")])
            console.log("Vote casted");

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

            console.log("Results: ", result);

            console.log("----------------------------------------------------");
            // 1. When starting a new round votes are resetted
            // 2. If the previous round succeeded but wasn't executed then this step will execute it
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
            // await waitForNextBlock()
            // console.log("Past total supply",
            //     ethers.formatEther(await vot3.getPastTotalSupply(tx.blockNumber)))

            console.log("Votes should be resetted, let's check:");
            votes = await appVotingContract.getCurrentAppVotes(app1Code)
            console.log("Votes for app 1: ", ethers.formatEther(votes));
            votes = await appVotingContract.getCurrentAppVotes(app2Code)
            console.log("Votes for app 2: ", ethers.formatEther(votes));

            await waitForVotingPeriodToStart(proposalId2, appVotingContract)

            console.log("I should still be able to see votes of round 1 while voting for round 2");
            const resultRound1 = await appVotingContract.getRoundResults(proposalId.toString())
            console.log("Result: ", resultRound1);

            console.log("Voter1 votes for app 1 with 100 votes");
            tx = await appVotingContract.connect(voter1).castVotes(proposalId2.toString(), [app1Code], [ethers.parseEther("100")])
            console.log("Vote casted");

            console.log("Voter2 votes for app 2 with 100 votes");
            tx = await appVotingContract.connect(voter2).castVotes(proposalId2.toString(), [app2Code], [ethers.parseEther("100")])
            console.log("Vote casted");

            console.log("Check current votes");
            votes = await appVotingContract.getCurrentAppVotes(app1Code)
            console.log("Votes for app 1: ", ethers.formatEther(votes));
            votes = await appVotingContract.getCurrentAppVotes(app2Code)
            console.log("Votes for app 2: ", ethers.formatEther(votes));

            console.log("Wait for round to end");
            await waitForVotingPeriodToEnd(proposalId2, appVotingContract)

            console.log("Get results for round 2");
            const resultRound2 = await appVotingContract.getRoundResults(proposalId2.toString())

            console.log("Results: ", resultRound2);

            console.log("----------------------------------------------------");

            // To know what a user voted for we will parse events
        })
    })
})

