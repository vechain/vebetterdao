import {
  B3TR,
  B3TR__factory,
  Emissions__factory,
  Treasury__factory,
  VOT3,
  VOT3__factory,
  VoterRewards,
  VoterRewards__factory,
  XAllocationVoting,
  XAllocationVoting__factory,
} from "../../typechain-types"
import {
  clauseBuilder,
  type TransactionClause,
  type TransactionBody,
  coder,
  FunctionFragment,
  type IHDNode,
  VTHO_ADDRESS,
  unitsUtils,
} from "@vechain/sdk-core"
import { buildTxBody, signAndSendTx } from "../helpers/txHelper"
import { SeedAccount } from "../helpers/seedAccounts"
import { chunk } from "../helpers/chunk"

export type App = {
  address: string
  name: string
  metadataURI: string
}

export const bootstrapEmissions = async (contractAddress: string, admin: IHDNode) => {
  console.log("Bootstrapping emissions...")

  const clauses: TransactionClause[] = []

  clauses.push(
    clauseBuilder.functionInteraction(
      contractAddress,
      coder.createInterface(JSON.stringify(Emissions__factory.abi)).getFunction("bootstrap") as FunctionFragment,
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, admin.address, 32)

  if (!admin.privateKey) {
    throw new Error("Account does not have a private key")
  }
  await signAndSendTx(body, admin.privateKey)
}

export const addXDapps = async (contractAddress: string, account: IHDNode, apps: App[]) => {
  console.log("Adding x-apps...")

  const appChunks = chunk(apps, 50)

  for (const appChunk of appChunks) {
    const clauses: TransactionClause[] = []

    appChunk.map(app => {
      clauses.push(
        clauseBuilder.functionInteraction(
          contractAddress,
          coder
            .createInterface(JSON.stringify(XAllocationVoting__factory.abi))
            .getFunction("addApp") as FunctionFragment,
          [app.address, app.address, app.name, app.metadataURI],
        ),
      )
    })

    const body: TransactionBody = await buildTxBody(clauses, account.address, 32)

    if (!account.privateKey) {
      throw new Error("Account does not have a private key")
    }

    await signAndSendTx(body, account.privateKey)
  }
}

export const startEmissions = async (contractAddress: string, acct: IHDNode) => {
  console.log("Starting emissions...")

  const clauses: TransactionClause[] = []

  clauses.push(
    clauseBuilder.functionInteraction(
      contractAddress,
      coder.createInterface(JSON.stringify(Emissions__factory.abi)).getFunction("start") as FunctionFragment,
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, acct.address, 32)

  if (!acct.privateKey) {
    throw new Error("Account does not have a private key")
  }

  await signAndSendTx(body, acct.privateKey)
}

export const distributeEmissions = async (contractAddress: string, acct: IHDNode) => {
  console.log("Distributing emissions...")

  const clauses: TransactionClause[] = []

  clauses.push(
    clauseBuilder.functionInteraction(
      contractAddress,
      coder.createInterface(JSON.stringify(Emissions__factory.abi)).getFunction("distribute") as FunctionFragment,
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, acct.address, 32)

  if (!acct.privateKey) {
    throw new Error("Account does not have a private key")
  }

  await signAndSendTx(body, acct.privateKey)
}

export const airdropVTHO = async (accounts: SeedAccount[], signingAcct: IHDNode) => {
  console.log(`Airdropping VTHO...`)

  const accountChunks = chunk(accounts, 200)

  for (const accountChunk of accountChunks) {
    const clauses: TransactionClause[] = []

    accountChunk.map(account => {
      clauses.push(clauseBuilder.transferToken(VTHO_ADDRESS, account.address, unitsUtils.parseVET("200000")))
    })

    const body: TransactionBody = await buildTxBody(clauses, signingAcct.address, 32)

    if (!signingAcct.privateKey) {
      throw new Error("Account does not have a private key")
    }
    await signAndSendTx(body, signingAcct.privateKey)
  }
}

/**
 *  Airdrop B3TR from treasury to a list of accounts
 */
export const airdropB3trFromTreasury = async (treasuryAddress: string, admin: IHDNode, accounts: SeedAccount[]) => {
  console.log(`Airdropping B3TR...`)

  const accountChunks = chunk(accounts, 200)

  for (const accountChunk of accountChunks) {
    const clauses: TransactionClause[] = []

    accountChunk.map(account => {
      clauses.push(
        clauseBuilder.functionInteraction(
          treasuryAddress,
          coder.createInterface(JSON.stringify(Treasury__factory.abi)).getFunction("transferB3TR") as FunctionFragment,
          [account.address, account.amount],
        ),
      )
    })

    const body: TransactionBody = await buildTxBody(clauses, admin.address, 32)

    if (!admin.privateKey) {
      throw new Error("Account does not have a private key")
    }
    await signAndSendTx(body, admin.privateKey)
  }
}

export const swapB3trForVot3 = async (b3tr: B3TR, vot3: VOT3, accounts: SeedAccount[]) => {
  console.log(`Swapping B3TR for VOT3...`)

  const acctChunks = chunk(accounts, 100)

  const b3trAddr = await b3tr.getAddress()
  const vot3Addr = await vot3.getAddress()

  for (const chunk of acctChunks) {
    await Promise.all(
      chunk.map(async account => {
        const clauses: TransactionClause[] = []

        const b3trAmount = await b3tr.balanceOf(account.address)

        clauses.push(
          clauseBuilder.functionInteraction(
            b3trAddr,
            coder.createInterface(JSON.stringify(B3TR__factory.abi)).getFunction("approve") as FunctionFragment,
            [vot3Addr, b3trAmount],
          ),
        )

        clauses.push(
          clauseBuilder.functionInteraction(
            vot3Addr,
            coder.createInterface(JSON.stringify(VOT3__factory.abi)).getFunction("stake") as FunctionFragment,
            [b3trAmount],
          ),
        )

        const body: TransactionBody = await buildTxBody(clauses, account.address, 32)

        await signAndSendTx(body, account.privateKey)
      }),
    )
  }
}

export const castVotesToXDapps = async (
  vot3: VOT3,
  xAllocationVoting: XAllocationVoting,
  accounts: SeedAccount[],
  roundId: number,
  apps: string[],
) => {
  console.log("Casting votes to xDapps...")
  const chunks = chunk(accounts, 20)
  const contractAddress = await xAllocationVoting.getAddress()

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async account => {
        const clauses: TransactionClause[] = []
        const votePower = BigInt(await vot3.balanceOf(account.address))

        const splits: { app: string; weight: bigint }[] = []

        // eslint-disable-next-line no-unused-vars
        let randomDappsToVote = apps.filter(_ => Math.floor(Math.random() * 2) == 0)
        if (!randomDappsToVote.length) randomDappsToVote = apps

        // Get the vote power per xDapp rounding down
        const votePowerPerApp = votePower / BigInt(randomDappsToVote.length)

        randomDappsToVote.forEach(app => splits.push({ app: app, weight: votePowerPerApp }))

        clauses.push(
          clauseBuilder.functionInteraction(
            contractAddress,
            coder
              .createInterface(JSON.stringify(XAllocationVoting__factory.abi))
              .getFunction("castVote") as FunctionFragment,
            [roundId, splits.map(split => split.app), splits.map(split => split.weight)],
          ),
        )
        const body: TransactionBody = await buildTxBody(clauses, account.address, 32, 200_000 * splits.length)

        await signAndSendTx(body, account.privateKey)
      }),
    )
  }
  console.log("Votes cast.")
}

export const claimVoterRewards = async (
  voterRewards: VoterRewards,
  roundId: number,
  signingAcct: IHDNode,
  accounts: SeedAccount[],
) => {
  console.log("Claiming voter rewards...")

  const contractAddress = await voterRewards.getAddress()
  const accountChunks = chunk(accounts, 50)

  for (const accountChunk of accountChunks) {
    const clauses: TransactionClause[] = []

    accountChunk.map(account => {
      clauses.push(
        clauseBuilder.functionInteraction(
          contractAddress,
          coder
            .createInterface(JSON.stringify(VoterRewards__factory.abi))
            .getFunction("claimReward") as FunctionFragment,
          [roundId, account.address],
        ),
      )
    })

    const body: TransactionBody = await buildTxBody(clauses, signingAcct.address, 32)

    if (!signingAcct.privateKey) {
      throw new Error("Account does not have a private key")
    }

    await signAndSendTx(body, signingAcct.privateKey)
  }
}
