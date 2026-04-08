import { formatEther } from "ethers"

import { indexerQueryClient } from "../api"
import { paths } from "../schema"

type CitizensResponse = paths["/api/v1/b3tr/navigators/citizens"]["get"]["responses"]["200"]["content"]["*/*"]

export type CitizenEntity = CitizensResponse["data"][number]
export type CitizenEntityFormatted = CitizenEntity & {
  amountFormatted: string
}

export const useNavigatorCitizens = (navigatorAddress: string, size = 50) =>
  indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/navigators/citizens",
    {
      params: { query: { navigator: navigatorAddress, size, direction: "DESC" } },
    },
    {
      enabled: !!navigatorAddress,
      select: (data): CitizenEntityFormatted[] =>
        data.data.map(c => ({
          ...c,
          amountFormatted: formatEther(c.amount),
        })),
    },
  )
