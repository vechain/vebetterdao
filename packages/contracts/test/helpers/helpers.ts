import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory } from "ethers"
import { ethers } from "hardhat"

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

export const defaultVotingPeriod = 45818
export const defaultVotingTreashold = 0

let cachedDeployInstance: DeployInstance | undefined = undefined
export const getOrDeployContractInstances = async (forceDeploy: boolean = false, votingTreshold = defaultVotingTreashold) => {
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