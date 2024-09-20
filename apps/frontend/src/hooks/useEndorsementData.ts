import { useAppEndorsedEvents, AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useUserEndorsementScore } from "@/api"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import dayjs from "dayjs"

type EndorsersInfo = {
  endorserAddress: string
  endorserTotalPoint?: string
  dateOfFirstEndorsement: string
}

type EndorsementHistory = {
  endorserAddress: string
  endorserPoint?: string
  endorserTotalPoint?: string
  dateOfEndorsement: string
  isUnendorsing: boolean
}

export type AppEndorsedHistoryEvent = AppEndorsedEvent & {
  isUnendorsing: boolean
}

export const useEndorsementInfos = (appId: string, endorserAddress: string) => {
  const { data: endorsementTotalPoint } = useUserEndorsementScore(endorserAddress)
  const { data: appEndorsedEvents } = useAppEndorsedEvents({
    appId: appId,
  })

  // Find the event where the txOrigin matches the endorserAddress
  const matchedEvent = appEndorsedEvents?.find(event => event.txOrigin.toLowerCase() === endorserAddress.toLowerCase())

  const lastEndorsementTimestamp = useEstimateBlockTimestamp({ blockNumber: matchedEvent?.blockNumber })
  const endorsingSince = dayjs(lastEndorsementTimestamp).format("DD-MM-YYYY")

  const endorserInfo: EndorsersInfo = {
    endorserAddress: endorserAddress,
    endorserTotalPoint: endorsementTotalPoint,
    dateOfFirstEndorsement: endorsingSince,
  }
  return endorserInfo
}

export const useEndorsementHistory = (event: AppEndorsedHistoryEvent) => {
  const { txOrigin, blockNumber } = event
  const endorserTotalPoint = useUserEndorsementScore(txOrigin).data

  const endorserPoint = endorserTotalPoint
  const dateOfEndorsement = useEstimateBlockTimestamp({ blockNumber })
  const endorseTime = dayjs(dateOfEndorsement).format("MMM D, YYYY")

  const endorsementHistory: EndorsementHistory = {
    endorserAddress: txOrigin,
    endorserPoint,
    endorserTotalPoint,
    dateOfEndorsement: endorseTime,
    isUnendorsing: event.isUnendorsing,
  }

  return endorsementHistory
}
