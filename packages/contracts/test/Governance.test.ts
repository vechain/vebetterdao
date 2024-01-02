import { assert, ethers } from "hardhat"
import { expect } from "chai"
import { defaultVotingPeriod, defaultVotingTreashold, getOrDeployContractInstances } from "./helpers"

describe("Governor and TimeLock", function () {

    describe("Governor deployment", function () {
        it("should set constructors correctly", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, timeLock } = await getOrDeployContractInstances(true)
            const votingDelay = (await governor.votingDelay()).toString()
            const votesThreshold = (await governor.proposalThreshold()).toString()
            const votingPeriod = (await governor.votingPeriod()).toString()

            expect(votingDelay).to.eql("1")
            expect(votesThreshold).to.eql(defaultVotingTreashold.toString())
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
        const description = "Test Proposal: testing propsal with random description!"
        let encodedFunctionCall: string = ""
        let proposalId: number = 0

        it("cannot create a proposal if NOT a VOT3 holder", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner } = await getOrDeployContractInstances(true, 1)

            const b3trAddress = await b3tr.getAddress()
            encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])

            try {
                await governor.propose(
                    [b3trAddress],
                    [0],
                    [encodedFunctionCall],
                    description,
                )
                assert.fail("The transaction should have failed")
            } catch (err: any) {
                assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
            }
        })

        it("cannot create a proposal if VOT3 holder but NO DELEGATION", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, minterAccount } = await getOrDeployContractInstances()

            // Before creating a proposal, we need to mint some VOT3 tokens to the owner
            await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("1000"))
            await b3tr.approve(await vot3.getAddress(), ethers.parseEther("9"))
            await vot3.stake(ethers.parseEther("9"))

            const b3trAddress = await b3tr.getAddress()
            encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])

            try {
                await governor.propose(
                    [b3trAddress],
                    [0],
                    [encodedFunctionCall],
                    description,
                )
                assert.fail("The transaction should have failed")
            } catch (err: any) {
                assert(err.message.includes("execution reverted"), "Expected an 'execution reverted' error")
            }
        })

        it("can create a proposal if VOT3 holder that self-delegated", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, minterAccount } = await getOrDeployContractInstances(true, 1)

            // Before creating a proposal, we need to mint some VOT3 tokens to the owner
            await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("1000"))
            await b3tr.approve(await vot3.getAddress(), ethers.parseEther("9"))
            await vot3.stake(ethers.parseEther("9"))
            // then we need to delegate the votes to ourself (self-delegation)
            // this needs to be done because by default voting power is calculated only when you delegate
            await vot3.delegate(await owner.getAddress())

            // Now we can create a proposal
            const b3trAddress = await b3tr.getAddress()
            encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])

            // We also need to wait a block to update the proposer's votes snapshote
            // since we do not support ethers' evm_mine yet, we need to wait for a block with a timeout function
            let startingBlock = await governor.clock()
            let currentBlock
            do {
                await new Promise(resolve => setTimeout(resolve, 1000));
                currentBlock = await governor.clock()
            } while (startingBlock === currentBlock)

            const tx = await governor.propose(
                [b3trAddress],
                [0],
                [encodedFunctionCall],
                description,
            )

            const proposeReceipt = await tx.wait()

            // Check that the ProposalCreated event was emitted with the correct parameters
            const event = proposeReceipt.logs[0]
            const decodedLogs = governor.interface.parseLog(event);

            //event exists
            expect(decodedLogs.name).to.eql("ProposalCreated")
            // proposal id
            proposalId = decodedLogs.args[0];
            expect(proposalId).not.to.be.null
            // proposer is the owner
            expect(decodedLogs.args[1]).to.eql(await owner.getAddress())
            // targets are correct
            expect(decodedLogs.args[2]).to.eql([b3trAddress])
            // values are correct
            expect(decodedLogs.args[3].toString()).to.eql("0")
            // calldatas are correct
            expect(decodedLogs.args[5]).to.eql([encodedFunctionCall])
            // description is correct
            expect(decodedLogs.args[8]).to.eql(description)
            // block when proposal will start
            const voteStart = decodedLogs.args[6]
            expect(voteStart).not.to.be.null
            // block when proposal will end
            const voteEnd = decodedLogs.args[7]
            expect(voteEnd).not.to.be.null
            expect(voteEnd).to.eql(voteStart + BigInt(defaultVotingPeriod))

            // proposal should be in pending state
            const proposalState = await governor.state(proposalId)
            expect(proposalState.toString()).to.eql("0")
        })

        it("can calculate the proposal id from the proposal parameters", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner } = await getOrDeployContractInstances(false)

            const b3trAddress = await b3tr.getAddress()

            const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
            const retrievedProposalId = await governor.hashProposal([b3trAddress],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )

            expect(proposalId).to.eql(retrievedProposalId)
        })

        it("ANY user that holds VOT3 and DELEGATED can create a proposal", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, minterAccount } = await getOrDeployContractInstances(true, 1)

            // Before creating a proposal, we need to mint some VOT3 tokens to the owner
            await b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("1000"))
            await b3tr.connect(otherAccount).approve(await vot3.getAddress(), ethers.parseEther("9"))
            await vot3.connect(otherAccount).stake(ethers.parseEther("9"))
            // then we need to delegate the votes to ourself (self-delegation)
            // this needs to be done because by default voting power is calculated only when you delegate
            await vot3.connect(otherAccount).delegate(await otherAccount.getAddress())

            // Now we can create a proposal
            const b3trAddress = await b3tr.getAddress()
            encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])

            //TODO: move this inside the helper file
            // We also need to wait a block to update the proposer's votes snapshote
            // since we do not support ethers' evm_mine yet, we need to wait for a block with a timeout function
            let startingBlock = await governor.clock()
            let currentBlock
            do {
                await new Promise(resolve => setTimeout(resolve, 1000));
                currentBlock = await governor.clock()
            } while (startingBlock === currentBlock)

            await governor.connect(otherAccount).propose(
                [b3trAddress],
                [0],
                [encodedFunctionCall],
                description,
            )
        })
    })

    describe("Proposal Indexing", function () {

    })

    describe("Proposal Voting", function () {

    })

    describe("Proposal Execution", function () {

    })
})