import { Recipient, RecipientInput } from "./model/input"
import { buildMintB3trTx, signAndSendTx } from "./utils/TxUtils"
import { addressUtils } from "@vechainfoundation/vechain-sdk-core"
import { HttpClient, ThorClient } from "@vechainfoundation/vechain-sdk-network"
import { loadEnvVariables } from "./utils/EnvUtils"
import B3tr from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
import { config } from "@repo/config"

console.log("Starting airdrop...")

const thorNetwork = new HttpClient(config.nodeUrl)
const thorClient = new ThorClient(thorNetwork)

const abi = B3tr.abi
if (!abi) throw new Error("ABI not found for B3TR contract")

// Reads the input JSON file and returns an array of addresses
const readInputFile = async (path: string): Promise<Recipient[]> => {
  // Read file
  const fs = require("fs")
  const fileContents = fs.readFileSync(path, "utf8")

  // Parse JSON as RecipientInput
  const recipientInput = JSON.parse(fileContents) as RecipientInput
  if (!recipientInput.recipients) throw new Error("Input file does not contain recipients")

  // Return array of addresses
  return recipientInput.recipients
}

const start = async () => {
  // Read environment variables
  const env = loadEnvVariables()

  const signer = addressUtils.fromPrivateKey(env.pk)

  // Read input file
  const recipients = await readInputFile(env.recipientInputFilePath)

  // Loop over recipients in batches of 100
  const batchSize = process.env.MAX_CLAUSES_PER_TX ? parseInt(process.env.MAX_CLAUSES_PER_TX) : 100
  const batches = []
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize))
  }

  // Send batches
  for (const batch of batches) {
    // Send airdrop
    const tx = await buildMintB3trTx(thorClient, config.b3trContractAddress, abi, batch, signer, env.gasPriceCoef)

    console.log(`Sending tx with ${batch.length} clauses`)

    // Sign the transaction
    const receipt = await signAndSendTx(thorClient, tx, env.pk)

    if (receipt.reverted) throw Error("Transaction reverted")

    console.log(`Tx was successful. TxId: ${receipt.meta.txID}`)
  }
}

start()
