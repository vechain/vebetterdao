export const dynamic = "force-dynamic"

import { RoundInfoTab } from "../../components/tabs/round-info/RoundInfoTab"
import { getHistoricalRoundData } from "../../lib/data"

export default async function RoundPage({ searchParams }: { searchParams: Promise<{ roundId?: string }> }) {
  const params = await searchParams
  const roundIdParam = params.roundId

  let roundDetails

  if (roundIdParam) {
    const roundId = parseInt(roundIdParam, 10)
    if (!isNaN(roundId)) {
      roundDetails = await getHistoricalRoundData(roundId)
    } else {
      roundDetails = await getHistoricalRoundData()
    }
  } else {
    roundDetails = await getHistoricalRoundData()
  }

  return <RoundInfoTab roundDetails={roundDetails} />
}
