import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"

import { gmNfts } from "@/constants/gmNfts"

const config = getConfig()
const GM_CONTRACT = config.galaxyMemberContractAddress.toLowerCase()
const UPGRADED_TOPIC = "0x936f056112badb39ff4b5bf0d185576c15ed35d94502e37e8b6d7bfbec428854"
const levelNameMap = new Map(gmNfts.map(gm => [Number(gm.level), gm.name]))

type ReceiptEvent = { address: string; topics: string[]; data: string }
type Receipt = { outputs: Array<{ events: ReceiptEvent[] }> }

const fetchReceipt = async (txId: string): Promise<Receipt | null> => {
  const res = await fetch(`${config.nodeUrl}/transactions/${txId}/receipt`)
  if (!res.ok) return null
  return res.json()
}

const extractGMUpgrade = (receipt: Receipt): string | null => {
  for (const output of receipt.outputs) {
    for (const event of output.events) {
      if (event.address.toLowerCase() === GM_CONTRACT && event.topics[0] === UPGRADED_TOPIC) {
        const newLevel = parseInt(event.data.slice(66, 130), 16)
        return levelNameMap.get(newLevel) ?? `Level ${newLevel}`
      }
    }
  }
  return null
}

export type GMUpgradeMap = Record<string, string>

export const useGMUpgradeInfo = (candidateTxIds: string[]) => {
  return useQuery({
    queryKey: ["gm-upgrade-info", candidateTxIds],
    queryFn: async (): Promise<GMUpgradeMap> => {
      const results = await Promise.all(
        candidateTxIds.map(async txId => {
          const receipt = await fetchReceipt(txId)
          if (!receipt) return null
          const levelName = extractGMUpgrade(receipt)
          return levelName ? ([txId, levelName] as const) : null
        }),
      )
      const map: GMUpgradeMap = {}
      for (const entry of results) {
        if (entry) map[entry[0]] = entry[1]
      }
      return map
    },
    enabled: candidateTxIds.length > 0,
    staleTime: Infinity,
  })
}
