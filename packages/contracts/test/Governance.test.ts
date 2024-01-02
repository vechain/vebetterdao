import { assert, ethers } from "hardhat"
import { expect } from "chai"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { BigNumberish, Contract, ContractFactory } from "ethers"
import { time } from "@nomicfoundation/hardhat-network-helpers"

interface DeployInstance {
    B3trContract: ContractFactory
    b3tr: any
    vot3: any
    timeLock: any
    governor: any
    owner: HardhatEthersSigner
    otherAccount: HardhatEthersSigner
    minterAccount: HardhatEthersSigner
    timelockAdmin: HardhatEthersSigner
    otherAccounts: HardhatEthersSigner[]
}

const defaultVotingPeriod = 45818
const defaultVotingTreashold = 0

describe("Governor", function () {
    let cachedDeployInstance: DeployInstance
    async function deploy(forceDeploy = false, votingTreshold = defaultVotingTreashold): Promise<DeployInstance> {
        if (!forceDeploy && cachedDeployInstance !== undefined) {
            return cachedDeployInstance
        }

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount, minterAccount, timelockAdmin, ...otherAccounts] = await ethers.getSigners()

        // Deploy B3TR
        const B3trContract = await ethers.getContractFactory("B3TR")
        const b3tr = await B3trContract.deploy(minterAccount)

        // Deploy VOT3
        const Vot3Contract = await ethers.getContractFactory("VOT3")
        const vot3 = await Vot3Contract.deploy(await b3tr.getAddress())

        // Deploy TimeLock
        const TimeLockContract = await ethers.getContractFactory("TimeLock")
        const timeLock = await TimeLockContract.deploy(
            3600,
            [],
            [],
            timelockAdmin,
        )

        // Deploy Governor
        const GovernorContract = await ethers.getContractFactory("GovernorContract")
        const governor = await GovernorContract.deploy(
            await vot3.getAddress(),
            await timeLock.getAddress(),
            4, // quroum percentage
            defaultVotingPeriod, // voting period
            1, // voting delay
            votingTreshold, // voting treshold
        )

        cachedDeployInstance = { B3trContract, b3tr, vot3, timeLock, governor, owner, otherAccount, minterAccount, timelockAdmin, otherAccounts }
        return cachedDeployInstance
    }
    describe("Deployment", function () {
        it("should set constructors correctly", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, timeLock } = await deploy(true)
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

    describe.only("Proposal Creation", function () {
        const description = "Test Proposal: testing propsal with random description!"
        let encodedFunctionCall: string = ""
        let proposalId: number = 0

        it("cannot create a proposal if NOT a VOT3 holder", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner } = await deploy(true, 1)

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
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, minterAccount } = await deploy(true, 1)

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
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner, minterAccount } = await deploy(true, 1)

            // Before creating a proposal, we need to mint some VOT3 tokens to the owner
            await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("1000"))
            await b3tr.approve(await vot3.getAddress(), ethers.parseEther("9"))
            await vot3.stake(ethers.parseEther("9"))
            // then we need to delegate the votes to the owner (self-delegation)
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
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner } = await deploy(false)

            const b3trAddress = await b3tr.getAddress()

            const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
            const retrievedProposalId = await governor.hashProposal([b3trAddress],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )

            expect(proposalId).to.eql(retrievedProposalId)
        })
    })

    // can index proposals

    // anyone can create a proposal?

    // vote can be executed after proposal is passed

    // it("should not create a proposal if not a VOT3 owner", async function () {
    //     const { governor, otherAccount } = await deploy()

    //     // Create a proposal
    //     await expect(governor.connect(otherAccount).createProposal("Test Proposal", "This is a test proposal")).to.be.revertedWith("Governor: Only VOT3 owners can create proposals")
    // })

    // PROPOSAL VOTING

    // PROPOSAL EXECUTION
})