import { assert, ethers } from "hardhat"
import { expect } from "chai"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { Contract, ContractFactory } from "ethers"

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

describe("Governor", function () {
    let cachedDeployInstance: DeployInstance
    async function deploy(forceDeploy = false): Promise<DeployInstance> {
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
            45818, // voting period
            1, // voting delay
            0, // voting treshold
        )

        cachedDeployInstance = { B3trContract, b3tr, vot3, timeLock, governor, owner, otherAccount, minterAccount, timelockAdmin, otherAccounts }
        return cachedDeployInstance
    }
    describe("Deployment", function () {
        it("should set constructors correctly", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner } = await deploy(true)
            const votingDelay = (await governor.votingDelay()).toString()
            const votesThreshold = (await governor.proposalThreshold()).toString()

            expect(votingDelay).to.eql("1")
            expect(votesThreshold).to.eql("0")

            // proposers votes should be 0
            const clock = await governor.clock()
            const proposerVotes = (await governor.getVotes(owner, parseInt(clock.toString()) - 1)).toString()
            expect(proposerVotes).to.eql("0")
        })
    })

    // can create proposal and only owners of VOT3 can vote
    describe.only("Proposal Creation", function () {
        const description = "Test Proposal: testing propsal with random description!"
        let encodedFunctionCall: string = ""
        let proposalId: number = 0

        it("can create a proposal", async function () {
            const { governor, B3trContract, otherAccount, vot3, b3tr, owner } = await deploy(true)
            const b3trAddress = await b3tr.getAddress()

            encodedFunctionCall = B3trContract.interface.encodeFunctionData("tokenDetails", [])

            const tx = await governor.propose(
                [b3trAddress],
                [0],
                [encodedFunctionCall],
                description,
            )

            const proposeReceipt = await tx.wait()

            // Get the proposal id
            // let proposalId: number = 0;
            // Decode the logs to find the specific event
            for (const log of proposeReceipt.logs) {
                const decoded = governor.interface.parseLog(log);
                // Process the event
                if (decoded.name == "ProposalCreated") {
                    proposalId = decoded.args[0];
                }
            }

            expect(proposalId).not.to.be.null

            // che altro dovrei controllare quando creo una proposal?

            // che l'evento ritorna le cose giuste

            // che lo stato della proposal sia pending

            // che i parametri della proposal salvati in blockchain sono giusti
        })

        it("can retrieve the proposal id from the proposal parameters", async function () {
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

    // vote can be executed after proposal is passed

    // it("should not create a proposal if not a VOT3 owner", async function () {
    //     const { governor, otherAccount } = await deploy()

    //     // Create a proposal
    //     await expect(governor.connect(otherAccount).createProposal("Test Proposal", "This is a test proposal")).to.be.revertedWith("Governor: Only VOT3 owners can create proposals")
    // })
})