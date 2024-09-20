import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useUserEndorsementScore } from "@/api"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import dayjs from "dayjs"

type EndorsersInfo = {
  endorserAddress: string
  endorserTotalPoint?: string
  dateOfFirstEndorsement: string
}

// type EndorsementHistory = {
//   endorserAddress: string
//   endorserPoint: number
//   endorserTotalPoint: number
//   dateOfEndorsement: number
// }


export const useEndorsementInfos = (appId: string, endorserAddress: string) => {
  const { data: endorsementTotalPoint } = useUserEndorsementScore(endorserAddress)
  const { data: appEndorsedEvents } = useAppEndorsedEvents({
    appId: appId
  })
  console.log('appEndorsedEvents', appEndorsedEvents)

  // Find the event where the txOrigin matches the endorserAddress
  //  TODO : handle is matchedEvent is a list : e.g : one node endorse multiple times ( remove it's endorsement and re-endorse, or get more points)
  const matchedEvent = appEndorsedEvents?.find(event => event.txOrigin.toLowerCase() === endorserAddress.toLowerCase())

  const lastEndorsementTimestamp = useEstimateBlockTimestamp({ blockNumber: matchedEvent?.blockNumber })
  const endorsingSince = dayjs(lastEndorsementTimestamp).format('DD--MM-YYYY')

  console.log('endorsingSince', endorsingSince)
  const endorserInfo: EndorsersInfo = {
    endorserAddress: endorserAddress,
    endorserTotalPoint: endorsementTotalPoint,
    dateOfFirstEndorsement: endorsingSince,
  }

  return endorserInfo
}

// export const useEndorsementHistory = (appId: string, nodeId: string, endorsed: string) => {
//   // For the history it will be the same steps as endorsersInfo, but it will be a list for each endorser

//   return endorsementHistory
// }
