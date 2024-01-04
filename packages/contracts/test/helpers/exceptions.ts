import { assert } from "chai"

async function tryCatch(promise: any, reason: any) {
    try {
        await promise
        throw null
    }
    catch (error: any) {
        assert(error, "Expected an error but did not get one")
        assert(error.message.includes(reason), `Expected an ${reason} error`)
    }
}

export const catchRevert = async function (promise: any) { await tryCatch(promise, "execution reverted") }
export const catchOutOfGas = async function (promise: any) { await tryCatch(promise, "out of gas") }