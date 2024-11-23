import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useUserEndorsementScore } from "@/api"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import dayjs from "dayjs"

type EndorsementHistory = {
  endorserAddress: string
  endorserPoint?: string
  endorserTotalPoint?: string
  dateOfEndorsement: string
  endorsed: boolean
}

export const useEndorsementHistory = (event: AppEndorsedEvent) => {
  const { txOrigin, blockNumber } = event
  const endorserTotalPoint = useUserEndorsementScore(txOrigin).data

  const endorserPoint = endorserTotalPoint
  const dateOfEndorsement = useEstimateBlockTimestamp({ blockNumber })
  const endorseTime = dayjs(dateOfEndorsement).format("MMM D, YYYY")

  const endorsementHistory: EndorsementHistory = {
    endorserAddress: txOrigin,
    endorserPoint: endorserPoint,
    endorserTotalPoint: endorserTotalPoint,
    dateOfEndorsement: endorseTime,
    endorsed: event.endorsed,
  }

  return endorsementHistory
}
