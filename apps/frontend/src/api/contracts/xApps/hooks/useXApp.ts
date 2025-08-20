import { X2EarnApps__factory } from "@vechain-kit/vebetterdao-contracts/typechain-types"
import { getConfig } from "@repo/config"
import { useCallClause } from "@vechain/vechain-kit"
import { useXAppsMetadataBaseUri } from ".."

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress as `0x${string}`

export const useXApp = (appId?: string) => {
  const { data: baseUri } = useXAppsMetadataBaseUri()
  return useCallClause({
    abi,
    address,
    method: "app",
    args: [appId as `0x${string}`],
    queryOptions: {
      enabled: !!appId && !!baseUri,
      select: data => {
        const [id, teamWalletAddress, name, metadataURI, createdAtTimestamp, appAvailableForAllocationVoting] =
          data[0] as unknown as [`0x${string}`, `0x${string}`, string, string, string, boolean]

        return {
          id,
          teamWalletAddress,
          name,
          metadataURI: `${baseUri}${metadataURI}`,
          createdAtTimestamp,
          appAvailableForAllocationVoting,
        }
      },
    },
  })
}
