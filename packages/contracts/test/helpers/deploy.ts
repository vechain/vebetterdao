import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { BaseContract, ContractFactory, ContractTransactionResponse } from "ethers"
import { ethers } from "hardhat"
import { B3TR, GovernorContract, GovernorContract__factory, TimeLock, VOT3 } from "../../typechain-types"

interface DeployInstance {
    B3trContract: ContractFactory
    b3tr: B3TR & { deploymentTransaction(): ContractTransactionResponse; }
    vot3: VOT3 & { deploymentTransaction(): ContractTransactionResponse; }
    timeLock: TimeLock & { deploymentTransaction(): ContractTransactionResponse; }
    governor: GovernorContract & { deploymentTransaction(): ContractTransactionResponse; }
    owner: HardhatEthersSigner
    otherAccount: HardhatEthersSigner
    minterAccount: HardhatEthersSigner
    timelockAdmin: HardhatEthersSigner
    otherAccounts: HardhatEthersSigner[]
}

export const defaultVotingPeriod = 20
export const defaultVotingTreashold = 0
export const defaultVotingDelay = 1

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
        defaultVotingDelay, // voting delay
        votingTreshold, // voting treshold
    )

    cachedDeployInstance = { B3trContract, b3tr, vot3, timeLock, governor, owner, otherAccount, minterAccount, timelockAdmin, otherAccounts }
    return cachedDeployInstance
}