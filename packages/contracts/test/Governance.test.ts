import { assert, ethers } from "hardhat"
import { expect } from "chai"
import {
    createProposal,
    defaultVotingPeriod,
    defaultVotingTreshold,
    getOrDeployContractInstances,
    getProposalIdFromTx,
    mintAndDelegate,
    moveBlocks,
    waitForNextBlock,
    waitForVotingPeriodToEnd,
    waitForVotingPeriodToStart,
    catchRevert
} from "./helpers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

describe("Governor and TimeLock", function () {
    const description = "Test Proposal: testing propsal with random description!"
    const functionToCall = "tokenDetails"
    let proposalId: number = 0

    describe("Governor deployment", function () {
        it("should set constructors correctly", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, timeLock } = await getOrDeployContractInstances(true)
            const votingDelay = (await governor.votingDelay()).toString()
            const votesThreshold = (await governor.proposalThreshold()).toString()
            const votingPeriod = (await governor.votingPeriod()).toString()

            expect(votingDelay).to.eql("1")
            expect(votesThreshold).to.eql(defaultVotingTreshold.toString())
            expect(votingPeriod).to.eql(defaultVotingPeriod.toString())

            // proposers votes should be 0
            const clock = await governor.clock()
            const proposerVotes = await governor.getVotes(owner, (clock - BigInt(1)).toString())
            expect(proposerVotes.toString()).to.eql("0")

            // check name of the governor contract
            const name = await governor.name()
            expect(name).to.eql("GovernorContract")

            // check that the VOT3 address is correct
            const voteTokenAddress = await governor.token()
            expect(voteTokenAddress).to.eql(await vot3.getAddress())

            // check that the TimeLock address is correct
            const timeLockAddress = await governor.timelock()
            expect(timeLockAddress).to.eql(await timeLock.getAddress())

            // clock mode is set correctly
            const clockMode = await governor.CLOCK_MODE()
            expect(clockMode.toString()).to.eql("mode=blocknumber&from=default")
        })
    })

    describe("Proposal Creation", function () {
        it("cannot create a proposal if NOT a VOT3 holder", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner } = await getOrDeployContractInstances(true, 1)
            await catchRevert(createProposal(governor, b3tr, B3trContract, owner, description, functionToCall, [], true))
        })

        it("cannot create a proposal if user did not delegated", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, minterAccount } = await getOrDeployContractInstances()

            // Before creating a proposal, we need to mint some VOT3 tokens to the owner
            await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("1000"))
            await b3tr.approve(await vot3.getAddress(), ethers.parseEther("9"))
            await vot3.stake(ethers.parseEther("9"))

            await catchRevert(createProposal(governor, b3tr, B3trContract, owner, description, functionToCall, [], true))
        })

        it("can create a proposal if VOT3 holder that self-delegated", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, minterAccount } = await getOrDeployContractInstances(true, 1)

            // Now we can create a proposal
            const tx = await createProposal(governor, b3tr, B3trContract, owner, description, functionToCall, [])
            const proposeReceipt = await tx.wait()
            expect(proposeReceipt).not.to.be.null

            // Check that the ProposalCreated event was emitted with the correct parameters
            const event = proposeReceipt?.logs[0]
            expect(event).not.to.be.undefined

            const decodedLogs = governor.interface.parseLog({
                topics: [...(event?.topics as string[])],
                data: event ? event.data : "",
            });

            //event exists
            expect(decodedLogs?.name).to.eql("ProposalCreated")
            // proposal id
            proposalId = decodedLogs?.args[0];
            expect(proposalId).not.to.be.null
            // proposer is the owner
            expect(decodedLogs?.args[1]).to.eql(await owner.getAddress())
            // targets are correct
            const b3trAddress = await b3tr.getAddress()
            expect(decodedLogs?.args[2]).to.eql([b3trAddress])
            // values are correct
            expect(decodedLogs?.args[3].toString()).to.eql("0")
            // calldatas are correct
            const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
            expect(decodedLogs?.args[5]).to.eql([encodedFunctionCall])
            // description is correct
            expect(decodedLogs?.args[8]).to.eql(description)
            // block when proposal will start
            const voteStart = decodedLogs?.args[6]
            expect(voteStart).not.to.be.null
            // block when proposal will end
            const voteEnd = decodedLogs?.args[7]
            expect(voteEnd).not.to.be.null
            expect(voteEnd).to.eql(voteStart + BigInt(defaultVotingPeriod))

            // proposal should be in pending state
            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("0")
        })

        it("can calculate the proposal id from the proposal parameters", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner } = await getOrDeployContractInstances(false)

            const b3trAddress = await b3tr.getAddress()
            const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])

            const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

            const retrievedProposalId = await governor.hashProposal([b3trAddress],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )

            expect(proposalId).to.eql(retrievedProposalId)
        })

        it("ANY user that holds VOT3 and DELEGATED can create a proposal", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, minterAccount } = await getOrDeployContractInstances(true, 1)

            // Now we can create a proposal
            await createProposal(governor, b3tr, B3trContract, otherAccount, description, functionToCall, [])
        })
    })

    // the tests descibed in this section cannot be run in isolation, but need to run in cascade
    describe("Proposal Voting", function () {
        let voter1: HardhatEthersSigner
        let voter2: HardhatEthersSigner
        let voter3: HardhatEthersSigner
        let voter4: HardhatEthersSigner
        this.beforeAll(async function () {
            const { vot3, b3tr, otherAccounts, minterAccount } = await getOrDeployContractInstances(true, 1)
            voter1 = otherAccounts[0] // with no VOT3
            voter2 = otherAccounts[1] // with VOT3 but no delegation
            voter3 = otherAccounts[2] // with VOT3 and delegation
            voter4 = otherAccounts[3] // with VOT3 and delegation

            // Before trying to vote we need to mint some VOT3 tokens to the voter2
            await b3tr.connect(minterAccount).mint(voter2, ethers.parseEther("1000"))
            await b3tr.connect(voter2).approve(await vot3.getAddress(), ethers.parseEther("9"))
            await vot3.connect(voter2).stake(ethers.parseEther("9"))

            // we do it here but will use in the next test
            await mintAndDelegate(voter3, "1000")
            await mintAndDelegate(voter4, "9")

            // Let's wait a block to update the votes snapshot
            await waitForNextBlock()
        })

        it('cannot vote if proposal is not in active state', async function () {
            const { governor, B3trContract, otherAccount, b3tr } = await getOrDeployContractInstances(false)
            // Now we can create a new proposal
            const tx = await createProposal(governor, b3tr, B3trContract, otherAccount, description, functionToCall, [])
            proposalId = await getProposalIdFromTx(tx, governor)

            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("0")

            await catchRevert(governor.connect(voter3).castVote(proposalId, 1))
        })

        it('user without VOT3 can vote with weight 0', async function () {
            const { governor } = await getOrDeployContractInstances(false)

            // wait for the proposal to be in active state
            const voteDealy = await governor.votingDelay()
            const blocksToMove = parseInt((voteDealy + BigInt(1)).toString())
            await moveBlocks(blocksToMove)
            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("1")

            //vote
            const tx = await governor.connect(voter1).castVote(proposalId, 1)
            const proposeReceipt = await tx.wait()
            const event = proposeReceipt?.logs[0]
            const decodedLogs = governor.interface.parseLog({
                topics: [...(event?.topics as string[])],
                data: event ? event.data : "",
            });

            //event exists
            expect(decodedLogs?.name).to.eql("VoteCast")
            // voter
            expect(decodedLogs?.args[0]).to.eql(await voter1.getAddress())
            // proposal id
            expect(decodedLogs?.args[1]).to.eql(proposalId)
            // support
            expect(decodedLogs?.args[2].toString()).to.eql("1")
            // votes
            expect(decodedLogs?.args[3].toString()).to.eql("0")
        })

        it('user that did not delegated can vote with weight 0', async function () {
            const { governor } = await getOrDeployContractInstances(false)

            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("1")

            const tx = await governor.connect(voter2).castVote(proposalId, 1)
            const proposeReceipt = await tx.wait()
            const event = proposeReceipt?.logs[0]
            const decodedLogs = governor.interface.parseLog({
                topics: [...(event?.topics as string[])],
                data: event ? event.data : "",
            });

            //event exists
            expect(decodedLogs?.name).to.eql("VoteCast")
            // voter
            expect(decodedLogs?.args[0]).to.eql(await voter2.getAddress())
            // proposal id
            expect(decodedLogs?.args[1]).to.eql(proposalId)
            // support
            expect(decodedLogs?.args[2].toString()).to.eql("1")
            // votes
            expect(decodedLogs?.args[3].toString()).to.eql("0")
        })

        it('can vote if self-delegated VOT3 holder before snapshot', async function () {
            const { governor } = await getOrDeployContractInstances(false)

            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("1")

            const tx = await governor.connect(voter3).castVote(proposalId, 1)
            const proposeReceipt = await tx.wait()
            const event = proposeReceipt?.logs[0]
            const decodedLogs = governor.interface.parseLog({
                topics: [...(event?.topics as string[])],
                data: event ? event.data : "",
            });

            //event exists
            expect(decodedLogs?.name).to.eql("VoteCast")
            // voter
            expect(decodedLogs?.args[0]).to.eql(await voter3.getAddress())
            // proposal id
            expect(decodedLogs?.args[1]).to.eql(proposalId)
            // support
            expect(decodedLogs?.args[2].toString()).to.eql("1")
            // votes
            expect(decodedLogs?.args[3].toString()).not.to.eql("0")

            const hasVoted = await governor.hasVoted(proposalId, await voter3.getAddress())
            expect(hasVoted).to.eql(true)
        })

        it('vote has weight 0 if self-delegated VOT3 holder after snapshot', async function () {
            const { governor, otherAccounts } = await getOrDeployContractInstances(false)

            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("1")

            const newVoter = otherAccounts[4]
            await mintAndDelegate(newVoter, "1000")

            const tx = await governor.connect(newVoter).castVote(proposalId, 1)
            const proposeReceipt = await tx.wait()
            const event = proposeReceipt?.logs[0]
            const decodedLogs = governor.interface.parseLog({
                topics: [...(event?.topics as string[])],
                data: event ? event.data : "",
            });

            //event exists
            expect(decodedLogs?.name).to.eql("VoteCast")
            // voter
            expect(decodedLogs?.args[0]).to.eql(await newVoter.getAddress())
            // proposal id
            expect(decodedLogs?.args[1]).to.eql(proposalId)
            // support
            expect(decodedLogs?.args[2].toString()).to.eql("1")
            // votes
            expect(decodedLogs?.args[3].toString()).to.eql("0")
        })

        it('can count votes correctly', async function () {
            const { governor } = await getOrDeployContractInstances(false)

            //vote against
            await governor.connect(voter4).castVote(proposalId, 0)

            // now we should have the following votes:
            // voter1: 0 yes
            // voter2: 0 yes
            // voter3: 1000 yes
            // voter4: 9 no
            // abstain: 0
            const votes = await governor.proposalVotes(proposalId)

            // against votes
            expect(votes[0]).to.eql(ethers.parseEther("9"))
            // for
            expect(votes[1]).to.eql(ethers.parseEther("1000"))
            // abstain
            expect(votes[2].toString()).to.eql("0")
        })

        it('cannot vote twice', async function () {
            const { governor } = await getOrDeployContractInstances(false)

            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("1")

            await catchRevert(governor.connect(voter3).castVote(proposalId, 1))
        })

        it('cannot vote after voting period ends', async function () {
            const { governor, otherAccounts } = await getOrDeployContractInstances(false)

            await waitForVotingPeriodToEnd(proposalId, governor)

            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("4") // succeeded

            const voter5 = otherAccounts[5]
            await catchRevert(governor.connect(voter5).castVote(proposalId, 1))
        }).timeout(1800000)
    })

    describe("Proposal Execution", function () {
        it('cannot queue a proposal if not in succeeded state', async function () {
            const { governor, otherAccounts, b3tr, B3trContract, otherAccount: proposer } = await getOrDeployContractInstances(true, 0, 3)

            // load votes
            const voter = otherAccounts[0]
            await mintAndDelegate(voter, "1000")
            await waitForNextBlock()

            // create a new proposal
            const tx = await createProposal(governor, b3tr, B3trContract, proposer, description, functionToCall, [])
            proposalId = await getProposalIdFromTx(tx, governor)

            // wait
            await waitForVotingPeriodToStart(proposalId, governor)

            // vote
            await governor.connect(voter).castVote(proposalId, 0) // vote against

            // wait
            await waitForVotingPeriodToEnd(proposalId, governor)
            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("3") // defeated

            // try to queue
            const b3trAddress = await b3tr.getAddress()
            const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
            const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))
            await catchRevert(governor.queue(
                [b3trAddress],
                [0],
                [encodedFunctionCall],
                descriptionHash
            ))
        })

        it.only('cannot execute a proposal without queueing it to TimeLock first', async function () {
            const { governor, otherAccounts, b3tr, B3trContract, otherAccount: proposer } = await getOrDeployContractInstances(true, 0, 3)

            // load votes
            const voter = otherAccounts[0]
            await mintAndDelegate(voter, "1000")
            await waitForNextBlock()

            // create a new proposal
            const tx = await createProposal(governor, b3tr, B3trContract, proposer, description, functionToCall, [])
            proposalId = await getProposalIdFromTx(tx, governor)

            // wait
            await waitForVotingPeriodToStart(proposalId, governor)

            // vote
            await governor.connect(voter).castVote(proposalId, 1) // vote for

            // wait
            await waitForVotingPeriodToEnd(proposalId, governor)
            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("4") // succeded

            // try to execute
            const b3trAddress = await b3tr.getAddress()
            const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
            const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))
            await catchRevert(governor.execute(
                [b3trAddress],
                [0],
                [encodedFunctionCall],
                descriptionHash
            ))
        })

        it('can correctly queue proposal if vote succeeded', async function () {
            const { governor, otherAccounts, b3tr, B3trContract, otherAccount: proposer } = await getOrDeployContractInstances(true, 0, 2)

            // load votes
            const voter = otherAccounts[0]
            await mintAndDelegate(voter, "1000")
            await waitForNextBlock()

            // create a new proposal
            const tx = await createProposal(governor, b3tr, B3trContract, proposer, description, functionToCall, [])
            proposalId = await getProposalIdFromTx(tx, governor)

            // wait
            await waitForVotingPeriodToStart(proposalId, governor)

            // vote
            await governor.connect(voter).castVote(proposalId, 1) // vote for

            // wait
            await waitForVotingPeriodToEnd(proposalId, governor)
            let proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("4") // succeded

            // queue it
            const b3trAddress = await b3tr.getAddress()
            const encodedFunctionCall = B3trContract.interface.encodeFunctionData(functionToCall, [])
            const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

            const queueingTx = await governor.queue(
                [b3trAddress],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )

            const proposeReceipt = await queueingTx.wait()
            const events = proposeReceipt?.logs ?? []

            // proposal should be in queued state
            proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("5")
        })
    })
})