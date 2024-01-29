import { assert } from "chai"
import { network } from "hardhat"

async function tryCatch(promise: any, reason: any) {
  try {
    await promise
    throw null
  } catch (error: any) {
    assert(error, "Expected an error but did not get one")
    assert(error.message.includes(reason), `Expected an ${reason} error`)
  }
}
const revertReason = network.name === "hardhat" ? "VM Exception while processing transaction" : "execution reverted"
export const catchRevert = async function (promise: any) {
  await tryCatch(promise, revertReason)
}
export const catchOutOfGas = async function (promise: any) {
  await tryCatch(promise, "out of gas")
}
