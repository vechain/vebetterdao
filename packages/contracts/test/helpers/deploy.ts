import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { BaseContract, ContractFactory, ContractTransactionResponse } from "ethers"
import { ethers } from "hardhat"
import { B3TR, B3trApps, GovernorContract, TimeLock, VOT3 } from "../../typechain-types"

interface DeployInstance {
    B3trContract: ContractFactory
    b3tr: B3TR & { deploymentTransaction(): ContractTransactionResponse; }
    vot3: VOT3 & { deploymentTransaction(): ContractTransactionResponse; }
    timeLock: TimeLock & { deploymentTransaction(): ContractTransactionResponse; }
    governor: GovernorContract & { deploymentTransaction(): ContractTransactionResponse; }
    b3trApps: B3trApps & { deploymentTransaction(): ContractTransactionResponse; }
    owner: HardhatEthersSigner
    otherAccount: HardhatEthersSigner
    minterAccount: HardhatEthersSigner
    timelockAdmin: HardhatEthersSigner
    otherAccounts: HardhatEthersSigner[]
}

export const defaultVotingPeriod = 15
export const defaultVotingTreshold = 0
export const defaultVotingDelay = 1

let cachedDeployInstance: DeployInstance | undefined = undefined
export const getOrDeployContractInstances = async (forceDeploy: boolean = false, votingTreshold = defaultVotingTreshold, votingPeriod = defaultVotingPeriod) => {
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
        0, //0 seconds delay for immediate execution
        [],
        [],
        timelockAdmin,
    )
    await timeLock.waitForDeployment()

    // Deploy Governor
    const GovernorContract = await ethers.getContractFactory("GovernorContract")
    const governor = await GovernorContract.deploy(
        await vot3.getAddress(),
        await timeLock.getAddress(),
        4, // quroum percentage
        votingPeriod, // voting period
        defaultVotingDelay, // voting delay
        votingTreshold, // voting treshold
    )
    await governor.waitForDeployment()

    // Set up roles
    const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE()
    const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE()
    const CANCELLER_ROLE = await timeLock.CANCELLER_ROLE()
    await timeLock.connect(timelockAdmin).grantRole(PROPOSER_ROLE, await governor.getAddress())
    await timeLock.connect(timelockAdmin).grantRole(EXECUTOR_ROLE, await governor.getAddress())
    await timeLock.connect(timelockAdmin).grantRole(CANCELLER_ROLE, await governor.getAddress())

    // Deploy B3trApps
    const B3trAppsContract = await ethers.getContractFactory("B3trApps")
    const b3trApps = await B3trAppsContract.deploy(await timeLock.getAddress())
    await b3trApps.waitForDeployment()

    cachedDeployInstance = { B3trContract, b3tr, vot3, timeLock, b3trApps, governor, owner, otherAccount, minterAccount, timelockAdmin, otherAccounts }
    return cachedDeployInstance
}