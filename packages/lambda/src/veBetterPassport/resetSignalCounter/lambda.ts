import { APIGatewayProxyResult, Context } from "aws-lambda"

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"

import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/typechain-types"

import stagingConfig from "@repo/config/testnet-staging"
import testnetConfig from "@repo/config/testnet"
import mainnetConfig from "@repo/config/mainnet"

import { getSecret } from "../../helpers/secret"
import { CustomApiError, StandardApiError, SuccessResponseType } from "../../helpers/api.types"
import { buildResponse } from "../../helpers/api/response"
import { AppEnv } from "@repo/config/contracts"
import { buildGasEstimate, buildTxBody } from "../../helpers"

const VET_DOMAINS_CONTRACT_ABI_FRAGMENT = [
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

interface NetworkConfig {
  nodeUrl: string
  vetDomainsContractAddress: string
  veBetterPassportContractAddress: string
}

interface SecretsConfig {
  secretId: string
  walletKey: string
  privateKeyKey: string
}

const getNetworkConfig = (): NetworkConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  const TESTNET_VET_DOMAINS_ADDRESS = testnetConfig.externalContractIntegrations?.vetDomainsContractAddress
  const TESTNET_STAGING_VET_DOMAINS_ADDRESS = stagingConfig.externalContractIntegrations?.vetDomainsContractAddress
  const MAINNET_VET_DOMAINS_ADDRESS = mainnetConfig.externalContractIntegrations?.vetDomainsContractAddress

  if (!TESTNET_VET_DOMAINS_ADDRESS || !TESTNET_STAGING_VET_DOMAINS_ADDRESS || !MAINNET_VET_DOMAINS_ADDRESS) {
    throw new Error("VET Domains contract address is not set")
  }

  switch (environment) {
    case AppEnv.MAINNET:
      return {
        nodeUrl: MAINNET_URL,
        vetDomainsContractAddress: MAINNET_VET_DOMAINS_ADDRESS,
        veBetterPassportContractAddress: mainnetConfig.veBetterPassportContractAddress,
      }

    case AppEnv.TESTNET:
      return {
        nodeUrl: TESTNET_URL,
        vetDomainsContractAddress: TESTNET_VET_DOMAINS_ADDRESS,
        veBetterPassportContractAddress: testnetConfig.veBetterPassportContractAddress,
      }

    case AppEnv.TESTNET_STAGING:
      return {
        nodeUrl: TESTNET_URL,
        vetDomainsContractAddress: TESTNET_STAGING_VET_DOMAINS_ADDRESS,
        veBetterPassportContractAddress: stagingConfig.veBetterPassportContractAddress,
      }

    default:
      // Fallback to testnet for any other environment
      return {
        nodeUrl: TESTNET_URL,
        vetDomainsContractAddress: TESTNET_STAGING_VET_DOMAINS_ADDRESS,
        veBetterPassportContractAddress: stagingConfig.veBetterPassportContractAddress,
      }
  }
}

const getSecretsConfig = (): SecretsConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  switch (environment) {
    case AppEnv.MAINNET:
      return {
        secretId: "vebetterpassport_reset_signal_mainnet",
        walletKey: "WALLET",
        privateKeyKey: "RESET_SIGNALER_PK",
      }

    case AppEnv.TESTNET:
      return {
        secretId: "vebetterpassport_reset_signal_testnet",
        walletKey: "WALLET",
        privateKeyKey: "RESET_SIGNALER_PK",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        secretId: "vebetterpassport_reset_signal_testnet",
        walletKey: "WALLET",
        privateKeyKey: "RESET_SIGNALER_PK",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        secretId: "vebetterpassport_reset_signal_testnet",
        walletKey: "WALLET",
        privateKeyKey: "RESET_SIGNALER_PK",
      }
  }
}

const {
  nodeUrl: NODE_URL,
  vetDomainsContractAddress: VET_DOMAINS_CONTRACT_ADDRESS,
  veBetterPassportContractAddress: VE_BETTER_PASSPORT_CONTRACT_ADDRESS,
} = getNetworkConfig()
const { secretId: SECRET_ID, walletKey: WALLET_KEY, privateKeyKey: PRIVATE_KEY_KEY } = getSecretsConfig()

/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
const getCallerWalletInfo = async (): Promise<{ walletAddress: string; privateKey: string }> => {
  try {
    const client = new SecretsManagerClient({ region: "eu-west-1" })

    const walletAddress = await getSecret(client, SECRET_ID, WALLET_KEY)
    const privateKey = await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY)

    if (!walletAddress || !privateKey) {
      throw new Error("Empty wallet credentials retrieved from secrets manager")
    }

    return { walletAddress, privateKey }
  } catch (error) {
    console.error("Failed to retrieve wallet credentials:", error)
    throw new Error(`Unable to get wallet credentials: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Resets the signal counter for a banned wallet with a given reason.
 * @param bannedWallet - The address of the wallet to reset the signal counter for.
 * @param reason - The reason for resetting the signal counter.
 * @returns An object containing the transaction receipt and gas result.
 */
const resetSignalCounter = async (thor: ThorClient, bannedWallet: string, reason: string) => {
  const { privateKey, walletAddress } = await getCallerWalletInfo()

  const clause = Clause.callFunction(
    Address.of(VE_BETTER_PASSPORT_CONTRACT_ADDRESS),
    ABIContract.ofAbi(VeBetterPassport__factory.abi).getFunction("resetUserSignalsWithReason"),
    [bannedWallet, reason],
  )

  const gasResult = await buildGasEstimate(thor, [clause], walletAddress)
  const txBody = await buildTxBody(thor, [clause], gasResult.totalGas)
  const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))
  const tx = await thor.transactions.sendTransaction(signedTx)
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}

/**
 * WARNING: This is a MOCK function with a MOCK contract address.
 *
 * Retrieves the verified vet domain for a given wallet address.
 * @param thor - The ThorClient instance.
 * @param walletAddress - The wallet address to check.
 * @returns A boolean indicating if the wallet has a verified vet domain.
 */
export const getVerifiedVetDomain = async (thor: ThorClient, walletAddress: string): Promise<boolean> => {
  const res = await thor.transactions.executeCall(
    VET_DOMAINS_CONTRACT_ADDRESS,
    ABIContract.ofAbi(VET_DOMAINS_CONTRACT_ABI_FRAGMENT).getFunction("isVerified"),
    [walletAddress],
  )

  if (!res.success) {
    throw new Error(`Failed to get verified vet domain for wallet: ${walletAddress}`)
  }

  return res.result?.array?.[0] as boolean
}

export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)
  console.log(`Caller wallet address: ${(await getCallerWalletInfo()).walletAddress}`)
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  console.log(`Environment: ${process.env.LAMBDA_ENV}`)
  console.log(`Network: ${NODE_URL}`)
  console.log(`VET Domains contract: ${VET_DOMAINS_CONTRACT_ADDRESS}`)
  console.log(`VeBetterPassport contract: ${VE_BETTER_PASSPORT_CONTRACT_ADDRESS}`)

  try {
    const requestBody = event?.walletAddress

    if (!requestBody) {
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: `Invalid request body - walletAddress is required: ${JSON.stringify(event)}`,
      })
    }

    const walletToBeUnbanned = requestBody

    if (!isValid(walletToBeUnbanned)) {
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: "Invalid wallet address format",
      })
    }

    const thorClient = ThorClient.at(NODE_URL, { isPollingEnabled: false })

    // Check if a wallet has completed the KYC from Mock VetDomains contract
    const isVerified = await getVerifiedVetDomain(thorClient, walletToBeUnbanned)
    if (!isVerified) {
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: "Wallet status is either pending or not verified.",
      })
    }

    const reason = `Resetting signal counter for KYC'ed wallet`
    const { receipt, gasResult } = await resetSignalCounter(thorClient, walletToBeUnbanned, reason)

    if (!receipt) {
      return buildResponse(CustomApiError.TRANSACTION_REVERTED, {
        revertReasons: gasResult?.revertReasons,
        vmErrors: gasResult?.vmErrors,
      })
    }

    return buildResponse(SuccessResponseType.SUCCESS, { receipt })
  } catch (error) {
    console.error("Error resetting signal counter:", error)

    return buildResponse(StandardApiError.INTERNAL_SERVER_ERROR, {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
