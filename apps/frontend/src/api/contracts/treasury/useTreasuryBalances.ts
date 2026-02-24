import { getConfig } from "@repo/config"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { Treasury__factory } from "@vechain/vebetterdao-contracts/factories/Treasury__factory"
import { useCallClause } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

const abi = Treasury__factory.abi
const address = getConfig().treasuryContractAddress as `0x${string}`

const selectBalance = (data: readonly [bigint]) => {
  const original = data[0].toString()
  const scaled = formatEther(original)
  const formatted = scaled === "0" ? "0" : humanNumber(scaled)
  return { original, scaled, formatted }
}

export const useTreasuryB3trBalance = () =>
  useCallClause({
    abi,
    address,
    method: "getB3TRBalance",
    args: [],
    queryOptions: { select: selectBalance },
  })

export const useTreasuryVetBalance = () =>
  useCallClause({
    abi,
    address,
    method: "getVETBalance",
    args: [],
    queryOptions: { select: selectBalance },
  })

export const useTreasuryVthoBalance = () =>
  useCallClause({
    abi,
    address,
    method: "getVTHOBalance",
    args: [],
    queryOptions: { select: selectBalance },
  })

export const useTreasuryVot3Balance = () =>
  useCallClause({
    abi,
    address,
    method: "getVOT3Balance",
    args: [],
    queryOptions: { select: selectBalance },
  })
