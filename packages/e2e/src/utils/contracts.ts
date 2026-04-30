import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { Interface, Result } from "ethers"

const challengesInterface = new Interface(B3TRChallenges__factory.abi as never)

type CallView = {
  data: string
  reverted: boolean
  vmError?: string
}

const inspectClause = async (nodeUrl: string, contract: string, data: string, caller?: string): Promise<CallView> => {
  const body: Record<string, unknown> = {
    clauses: [{ to: contract, value: "0x0", data }],
  }
  if (caller) body.caller = caller
  const res = await fetch(`${nodeUrl}/accounts/*`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Thor call failed: ${res.status} ${await res.text()}`)
  const arr = (await res.json()) as CallView[]
  const first = arr[0]
  if (!first) throw new Error("Thor call returned empty result")
  return first
}

const callView = async (nodeUrl: string, contract: string, fn: string, args: unknown[] = []): Promise<Result> => {
  const data = challengesInterface.encodeFunctionData(fn, args)
  const out = await inspectClause(nodeUrl, contract, data)
  if (out.reverted) {
    throw new Error(`${fn} reverted: ${out.vmError ?? "unknown"}`)
  }
  return challengesInterface.decodeFunctionResult(fn, out.data)
}

export const readChallengeCount = async (nodeUrl: string, contract: string): Promise<bigint> => {
  const [count] = await callView(nodeUrl, contract, "challengeCount")
  return BigInt(count.toString())
}

export type ChallengeView = {
  challengeId: bigint
  creator: string
  stakeAmount: bigint
  startRound: bigint
  endRound: bigint
  duration: bigint
  allApps: boolean
  totalPrize: bigint
  participantCount: bigint
}

export const readChallenge = async (nodeUrl: string, contract: string, challengeId: bigint): Promise<ChallengeView> => {
  const [view] = await callView(nodeUrl, contract, "getChallenge", [challengeId])
  return {
    challengeId: BigInt(view.challengeId.toString()),
    creator: view.creator,
    stakeAmount: BigInt(view.stakeAmount.toString()),
    startRound: BigInt(view.startRound.toString()),
    endRound: BigInt(view.endRound.toString()),
    duration: BigInt(view.duration.toString()),
    allApps: view.allApps,
    totalPrize: BigInt(view.totalPrize.toString()),
    participantCount: BigInt(view.participantCount.toString()),
  }
}
