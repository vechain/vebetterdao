import { describe, it, expect } from "@jest/globals"
import { execute } from "lambda-local"
import path from "path"

const ENVIRONMENT = process.env.TEST_ENVIRONMENT || "testnet"

describe("mintCreatorNFT", () => {
  it(
    `should trigger creator NFT mint on ${ENVIRONMENT} environment`,
    async () => {
      const event = {
        body: JSON.stringify({
          creatorWalletAddress: "0x" + "1".repeat(40),
        }),
      }

      const result = await new Promise((resolve, reject) => {
        execute({
          event,
          lambdaPath: path.join(__dirname, `../dist/${ENVIRONMENT}/mintCreatorNFT/index.js`), // Updated path
          timeoutMs: 5 * 60 * 1000,
          callback: (error: Error, result: unknown) => {
            if (error) {
              reject(error)
            } else {
              resolve(result)
            }
          },
        })
      })

      console.log(result)
      expect(result).toBeDefined()
    },
    5 * 60 * 1000,
  )
})
