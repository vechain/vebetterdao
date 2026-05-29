import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { Treasury__factory } from "@vechain/vebetterdao-contracts/factories/Treasury__factory"
import { useThor } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import { ProposalEnriched } from "@/hooks/proposals/grants/types"

const GovernorInterface = B3TRGovernor__factory.createInterface()
const TreasuryInterface = Treasury__factory.createInterface()

/** Standard Solidity `Error(string)` revert selector. */
const SOLIDITY_ERROR_SELECTOR = "0x08c379a0"
/** Standard Solidity `Panic(uint256)` revert selector (assertions, overflow, etc.). */
const SOLIDITY_PANIC_SELECTOR = "0x4e487b71"

const PANIC_CODES: Record<string, string> = {
  "0x00": "generic panic",
  "0x01": "assertion failed",
  "0x11": "arithmetic overflow/underflow",
  "0x12": "division or modulo by zero",
  "0x21": "invalid enum value",
  "0x22": "storage byte array corrupted",
  "0x31": "pop on empty array",
  "0x32": "array index out of bounds",
  "0x41": "memory allocation overflow",
  "0x51": "zero-initialized internal function called",
}

const truncate = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n)}…` : s)

/** Shorten long hex blobs (addresses, bytes32 roles) so error messages stay readable in the UI. */
const formatErrorArg = (a: unknown): string => {
  if (typeof a === "bigint") return a.toString()
  const s = String(a)
  if (s.startsWith("0x") && s.length > 14) return `${s.slice(0, 8)}…${s.slice(-4)}`
  return s
}

const decodeRevertReason = (data: string | undefined): string | undefined => {
  if (!data || data === "0x") return undefined
  if (data.startsWith(SOLIDITY_ERROR_SELECTOR)) {
    try {
      const [reason] = ethers.AbiCoder.defaultAbiCoder().decode(["string"], "0x" + data.slice(10))
      return reason as string
    } catch {
      return truncate(data)
    }
  }
  if (data.startsWith(SOLIDITY_PANIC_SELECTOR)) {
    try {
      const [code] = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], "0x" + data.slice(10))
      const hex = `0x${(code as bigint).toString(16).padStart(2, "0")}`
      return `Panic: ${PANIC_CODES[hex] ?? hex}`
    } catch {
      return truncate(data)
    }
  }
  // Custom errors (e.g. AccessControlUnauthorizedAccount(address,bytes32) from OZ AccessControl,
  // governance-specific errors, Treasury errors). Try the most relevant ABIs in turn.
  for (const iface of [GovernorInterface, TreasuryInterface]) {
    try {
      const parsed = iface.parseError(data)
      if (parsed) {
        const args = parsed.args.map(formatErrorArg).join(", ")
        return args ? `${parsed.name}(${args})` : parsed.name
      }
    } catch {
      // try the next interface
    }
  }
  return truncate(data)
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
