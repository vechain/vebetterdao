import { useEndorsementEvents, useAppEndorsers } from "@/api"
import { useEffect, useState } from "react"

export type EndorsersInfo = {
  address: string
  score: string | undefined
  timestamp: number
}

type BlockMeta = {
  blockID: string
  blockNumber: number
  blockTimestamp: number
  txID: string
  txOrigin: string
  clauseIndex: number
}

export const useEndorsementHistory = (appId: string) => {
  const [endorsementHistory, setEndorsementHistory] = useState<BlockMeta[]>([])
  const { data: endorsementEvents } = useEndorsementEvents(appId)
  const { data: endorsers } = useAppEndorsers(appId)

  useEffect(() => {
    if (endorsers) {
      const filteredEvents = endorsementEvents?.endorsed.filter(event => event.appId === appId) || []

      const history = filteredEvents
        .map(event => event.blockMeta)
        .filter((blockMeta: BlockMeta) => endorsers.includes(blockMeta.txOrigin))

      setEndorsementHistory(history)
    }
  }, [endorsers, endorsementEvents, appId])

  return endorsementHistory
}

export const useEndorsementInfos = (appId: string) => {
  const [endorsersInfo, setEndorsersInfo] = useState<EndorsersInfo[]>([])
  const endorsementHistory = useEndorsementHistory(appId)

  useEffect(() => {
    if (endorsementHistory.length > 0) {
      const infoMap: { [key: string]: EndorsersInfo } = {}

      endorsementHistory.forEach(blockMeta => {
        const { txOrigin, blockTimestamp } = blockMeta

        if (!infoMap[txOrigin]) {
          infoMap[txOrigin] = {
            address: txOrigin,
            score: "",
            timestamp: blockTimestamp,
          }
        }

        if (blockTimestamp < infoMap[txOrigin].timestamp) {
          infoMap[txOrigin].timestamp = blockTimestamp
        }
      })

      setEndorsersInfo(Object.values(infoMap))
    }
  }, [endorsementHistory])

  return endorsersInfo
}
