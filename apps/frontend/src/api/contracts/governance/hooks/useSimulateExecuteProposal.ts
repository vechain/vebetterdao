import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useThor } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import { ProposalEnriched } from "@/hooks/proposals/grants/types"

const GovernorInterface = B3TRGovernor__factory.createInterface()

/**
 * Standard Solidity `Error(string)` selector. Anything starting with this is a revert reason we
 * can decode; anything else (e.g. Panic(uint256), custom errors) we surface as a hex blob.
 */
const SOLIDITY_ERROR_SELECTOR = "0x08c379a0"

const decodeRevertReason = (data: string | undefined): string | undefined => {
  if (!data || data === "0x") return undefined
  if (data.startsWith(SOLIDITY_ERROR_SELECTOR)) {
    try {
      const [reason] = ethers.AbiCoder.defaultAbiCoder().decode(["string"], "0x" + data.slice(10))
      return reason as string
    } catch {
      return data
    }
  }
  return data
}

type SimulateExecuteResult = {
  wouldRevert: boolean
  revertReason?: string
}

/**
 * Off-chain dry-run of B3TRGovernor.execute() for a Queued proposal. The Governor will accept the
 * call once the timelock delay elapses, but the *underlying* clauses (e.g. Treasury.transferB3TR)
 * can still revert — this hook surfaces that reason in the UI before the user pays gas on a
 * doomed transaction.
 */
export const useSimulateExecuteProposal = ({
  proposal,
  caller,
  enabled,
}: {
  proposal?: ProposalEnriched
  caller?: string
  enabled: boolean
}) => {
  const thor = useThor()
  const governorAddress = getConfig().b3trGovernorAddress
  const targets = proposal?.targets
  const values = proposal?.values
  const calldatas = proposal?.calldatas
  const description = proposal?.ipfsDescription
  const proposalId = proposal?.id

  return useQuery<SimulateExecuteResult>({
    queryKey: ["simulateExecuteProposal", proposalId, caller],
    enabled:
      enabled &&
      !!thor &&
      !!proposalId &&
      !!caller &&
      Array.isArray(targets) &&
      targets.length > 0 &&
      Array.isArray(values) &&
      Array.isArray(calldatas) &&
      typeof description === "string",
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = GovernorInterface.encodeFunctionData("execute", [
        targets as string[],
        (values as Array<string | number>).map(v => BigInt(v)),
        calldatas as string[],
        ethers.keccak256(ethers.toUtf8Bytes(description ?? "")),
      ])
      const result = await thor.transactions.simulateTransaction([{ to: governorAddress, value: "0x0", data }], {
        caller: caller as string,
      })
      const first = result[0]
      if (!first || !first.reverted) return { wouldRevert: false }
      return {
        wouldRevert: true,
        revertReason: decodeRevertReason(first.data) ?? first.vmError ?? "execution reverted",
      }
    },
  })
}
