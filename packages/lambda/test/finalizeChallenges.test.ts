import { describe, expect, it, jest, beforeEach } from "@jest/globals"

const executeCallMock: any = jest.fn()
const thorMock = {
  contracts: {
    executeCall: executeCallMock,
  },
  transactions: {
    sendTransaction: jest.fn(),
    waitForTransaction: jest.fn(),
  },
} as any

const aggregateAllEventsMock: any = jest.fn()
const buildGasEstimateMock: any = jest.fn()
const buildTxBodyMock: any = jest.fn()
const getCurrentRoundIdMock: any = jest.fn()
const getSecretMock: any = jest.fn()
const withRetryMock: any = jest.fn(async (operation: () => Promise<unknown>) => await operation())

const baseConfig = {
  challengesContractAddress: "0x9999999999999999999999999999999999999999",
  xAllocationVotingContractAddress: "0x8888888888888888888888888888888888888888",
}

const loadHandler = async (overrides?: Partial<typeof baseConfig>) => {
  jest.resetModules()
  process.env.LAMBDA_ENV = "testnet-staging"

  jest.doMock("@repo/config/testnet-staging", () => ({
    __esModule: true,
    default: {
      ...baseConfig,
      ...overrides,
    },
  }))

  jest.doMock("@repo/config/mainnet", () => ({
    __esModule: true,
    default: baseConfig,
  }))

  jest.doMock("@repo/config/contracts", () => ({
    AppEnv: {
      MAINNET: "mainnet",
      TESTNET_STAGING: "testnet-staging",
    },
  }))

  jest.doMock("@vechain/sdk-network", () => ({
    MAINNET_URL: "https://mainnet.local",
    TESTNET_URL: "https://testnet.local",
    ThorClient: {
      at: jest.fn(() => thorMock),
    },
  }))

  jest.doMock("../src/helpers", () => ({
    aggregateAllEvents: aggregateAllEventsMock,
    buildGasEstimate: buildGasEstimateMock,
    buildTxBody: buildTxBodyMock,
    getCurrentRoundId: getCurrentRoundIdMock,
    getSecret: getSecretMock,
    withRetry: withRetryMock,
  }))

  return (await import("../src/finalizeChallenges/lambda")).handler
}

describe("finalizeChallenges", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    executeCallMock.mockReset()
    aggregateAllEventsMock.mockReset()
    buildGasEstimateMock.mockReset()
    buildTxBodyMock.mockReset()
    getCurrentRoundIdMock.mockReset()
    getSecretMock.mockReset()
    withRetryMock.mockReset()
    withRetryMock.mockImplementation(async (operation: () => Promise<unknown>) => await operation())
  })

  it("skips when challenges contract is not configured", async () => {
    const handler = await loadHandler({
      challengesContractAddress: "0x0000000000000000000000000000000000000000",
    })

    const response = await handler({}, {} as any)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.data.details.message).toBe("Challenges contract is not configured yet.")
  })

  it("returns success when no challenges ended in the previous round", async () => {
    const handler = await loadHandler()

    getCurrentRoundIdMock.mockResolvedValue(7)
    aggregateAllEventsMock.mockResolvedValue({
      result: new Set(),
      totalEvents: 0,
    })

    const response = await handler({}, {} as any)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.data.details.endedRound).toBe(6)
    expect(body.data.details.discoveredChallenges).toBe(0)
  })

  it("processes one active challenge in dry-run mode", async () => {
    const handler = await loadHandler()

    getCurrentRoundIdMock.mockResolvedValue(9)
    aggregateAllEventsMock.mockResolvedValue({
      result: new Set([1]),
      totalEvents: 1,
    })
    getSecretMock.mockResolvedValue("1".repeat(64))
    executeCallMock.mockResolvedValue({
      success: true,
      result: {
        array: [1],
      },
    })
    buildGasEstimateMock.mockResolvedValue({
      reverted: false,
      totalGas: 100000,
    })

    const response = await handler({ dryRun: true, batchSize: 5 }, {} as any)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.data.details.dryRun).toBe(true)
    expect(body.data.details.processedBatches).toBe(1)
    expect(body.data.details.transactionIds).toEqual(["dry-run-1"])
  })
})
