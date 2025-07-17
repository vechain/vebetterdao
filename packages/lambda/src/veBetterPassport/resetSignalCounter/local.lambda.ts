import path from "path"
import dotenv from "dotenv"

import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause, Transaction, HDKey, TransactionClause } from "@vechain/sdk-core"

import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import localConfig from "@repo/config/local"
import { getConfig } from "@repo/config"
import { buildTxBody } from "../../helpers"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })

const NODE_URL = getConfig("local").nodeUrl

const VET_DOMAINS_CONTRACT_ADDRESS_MOCK = "0x92f70f37e41d6b30941444442cde459586341242" // This was deployed on my local network
const VET_DOMAINS_CONTRACT_ABI_FRAGMENT_MOCK = [
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "isVerified",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
const getCallerWalletInfo = (): { walletAddress: string; privateKey: Uint8Array } => {
  const PHRASE = process.env.MNEMONIC?.split(" ")
  if (!PHRASE) {
    throw new Error("Mnemonic not found")
  }

  const child = HDKey.fromMnemonic(PHRASE).deriveChild(0)
  const privateKey = child.privateKey
  if (!privateKey) {
    throw new Error("Private key not found")
  }
  const walletAddress = Address.ofPublicKey(child.publicKey as Uint8Array).toString()

  return { walletAddress, privateKey }
}

/**
 * Resets the signal counter for a banned wallet with a given reason.
 * @param bannedWallet - The address of the wallet to reset the signal counter for.
 * @param reason - The reason for resetting the signal counter.
 * @returns An object containing the transaction receipt and gas result.
 */
const resetSignalCounterLocal = async (
  thor: ThorClient,
  bannedWallet: string,
  reason: string,
): Promise<{ receipt: any; gasResult: any }> => {
  const { walletAddress, privateKey } = getCallerWalletInfo()

  const clauses: TransactionClause[] = []
  const clause = Clause.callFunction(
    Address.of(localConfig.veBetterPassportContractAddress),
    ABIContract.ofAbi(VeBetterPassport__factory.abi).getFunction("resetUserSignalsWithReason"),
    [bannedWallet, reason],
  )

  for (let i = 0; i < 100; i++) {
    clauses.push(clause)
  }

  const gasResult = await thor.gas.estimateGas(clauses, walletAddress)
  if (gasResult.reverted) {
    console.error("Txn (Gas) reverted:", gasResult.revertReasons, gasResult.vmErrors)
    throw new Error(`Txn (Gas) reverted: ${JSON.stringify(gasResult?.revertReasons)}`)
  }

  const txBody = await buildTxBody(thor, clauses, 4_000_000)
  const signedTx = Transaction.of(txBody).sign(privateKey)
  const tx = await thor.transactions.sendTransaction(signedTx)
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}

export const getVerifiedVetDomain = async (thor: ThorClient, walletAddress: string): Promise<boolean> => {
  const res = await thor.transactions.executeCall(
    VET_DOMAINS_CONTRACT_ADDRESS_MOCK,
    ABIContract.ofAbi(VET_DOMAINS_CONTRACT_ABI_FRAGMENT_MOCK).getFunction("isVerified"),
    [walletAddress],
  )

  if (!res.success) {
    throw new Error(`Failed to get verified vet domain for wallet: ${walletAddress}`)
  }

  return res.result?.array?.[0] as boolean
}

// Main execution function with error handling
const main = async () => {
  try {
    const thor = ThorClient.at(NODE_URL, { isPollingEnabled: false })
    console.log("thor", (await thor.gas.getMaxPriorityFeePerGas()).toString())

    const bannedWallet = "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa"

    // const isVerified = await getVerifiedVetDomain(thor, bannedWallet)
    // console.log("isVerified", isVerified)

    const reason = "Reseting user signal counter for KYC'ed wallet"
    // const result = await resetSignalCounterLocal(thor, bannedWallet, reason)
    // console.log("Signal counter reset successfully:", result)
  } catch (error) {
    console.error("Error executing reset signal counter:", error)
    throw error
  }
}

// Execute main function if this script is run directly
if (require.main === module) {
  main()
    .then(() => console.log("Process completed successfully"))
    .catch(error => {
      console.error("Process failed:", error)
      process.exit(1)
    })
}

// Export for external use
export { resetSignalCounterLocal, main }
