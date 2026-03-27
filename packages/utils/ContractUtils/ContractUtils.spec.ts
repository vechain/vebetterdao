import { ABIContract } from "@vechain/sdk-core"
import { describe, expect, it } from "vitest"
import { resolveAbiFunctionFromCalldata } from "./ContractUtils"

describe("ContractUtils", () => {
  it("returns the correct function", () => {
    const contractAbi = {
      _format: "json",
      contractName: "test",
      sourceName: "test",
      abi: [
        {
          type: "function",
          name: "test",
          stateMutability: "nonpayable",
          inputs: [
            {
              name: "value",
              type: "string",
            },
          ],
          outputs: [],
        },
      ],
    }
    const functionAbiInstance = ABIContract.ofAbi(
      contractAbi.abi as Parameters<typeof ABIContract.ofAbi>[0],
    ).getFunction("test")
    const encodedCallData = functionAbiInstance.encodeData(["test"]).toString()
    expect(resolveAbiFunctionFromCalldata(encodedCallData, contractAbi)).toMatchObject({
      type: "function",
      name: "test",
      inputs: [
        {
          name: "value",
          type: "string",
        },
      ],
    })
  }) // returns the correct function
})
