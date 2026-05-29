import { getConfig } from "@repo/config"
import { Treasury__factory } from "@vechain/vebetterdao-contracts/factories/Treasury__factory"
import { useCallClause } from "@vechain/vechain-kit"

const abi = Treasury__factory.abi
const address = getConfig().treasuryContractAddress as `0x${string}`
const b3trAddress = getConfig().b3trContractAddress as `0x${string}`

const selectLimit = (data: readonly [bigint]) => data[0]

/**
 * Hook to fetch the per-call B3TR transfer limit enforced by the Treasury.
 * Any single `transferB3TR` call (including `claimPayout` for V11 community-execution
 * proposals) reverts if the amount exceeds this value, so the frontend uses it to
 * gate proposal creation and payout actions.
 */
export const useTreasuryB3trTransferLimit = () =>
  useCallClause({
    abi,
    address,
    method: "getTransferLimitToken",
    args: [b3trAddress],
    queryOptions: { select: selectLimit },
  })
