import { describe, it, expect } from "@jest/globals"
import { execute } from "lambda-local"
import path from "path"

describe("startRound", () => {
  it(
    "should trigger start round lambda on staging environment",
    async () => {
      const event = {}

      const result = await new Promise((resolve, reject) => {
        execute({
          event,
          lambdaPath: path.join(__dirname, "../../dist/testnet/index.js"),
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

      // Use the result for further assertions if necessary
      console.log(result)
      // Example assertion
      expect(result).toBeDefined()
    },
    5 * 60 * 1000,
  )
})
