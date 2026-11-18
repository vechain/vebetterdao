import { describe, expect, it, vi } from "vitest"

vi.mock("@/api/indexer/api", () => ({ fetchClient: {} }))
vi.mock("@vechain/vechain-kit", () => ({ useThor: () => undefined }))

import { fetchContractDeployBlock } from "./useContractDeployBlock"

const DEPLOY_TX = "0xf505"

describe("fetchContractDeployBlock", () => {
  it("returns the block of the contract's deployment transaction", async () => {
    const getTxBlock = vi.fn(async () => 18868863)
    await expect(
      fetchContractDeployBlock("0xabc", async () => ({ deploymentTxId: DEPLOY_TX }), getTxBlock),
    ).resolves.toBe(18868863)
    expect(getTxBlock).toHaveBeenCalledWith(DEPLOY_TX)
  })

  it("scans from genesis when the indexer has no deployment for the contract", async () => {
    const getTxBlock = vi.fn()
    await expect(fetchContractDeployBlock("0xabc", async () => null, getTxBlock)).resolves.toBe(0)
    expect(getTxBlock).not.toHaveBeenCalled()
  })

  it("fails when the deployment transaction is unknown to the node", async () => {
    await expect(
      fetchContractDeployBlock(
        "0xabc",
        async () => ({ deploymentTxId: DEPLOY_TX }),
        async () => null,
      ),
    ).rejects.toThrow(DEPLOY_TX)
  })
})
