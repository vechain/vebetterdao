import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import {
  GalaxyMember__factory,
  StargateNFT__factory,
  X2EarnApps__factory,
} from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor, useWallet } from "@vechain/vechain-kit"

import { notFoundImage } from "@/constants"
import { convertUriToUrl } from "@/utils/uri"

import { compareAddresses } from "../../../utils/AddressUtils/AddressUtils"
import { getIpfsMetadata } from "../../ipfs/hooks/useIpfsMetadata"

import { ActiveEndorsement, UserNode } from "./useGetUserNodes"

const stargateNFTAddress = getConfig().stargateNFTContractAddress as `0x${string}`
const x2EarnAppsAddress = getConfig().x2EarnAppsContractAddress as `0x${string}`
const galaxyMemberAddress = getConfig().galaxyMemberContractAddress as `0x${string}`

const stargateNFTAbi = StargateNFT__factory.abi
const x2EarnAppsAbi = X2EarnApps__factory.abi
const galaxyMemberAbi = GalaxyMember__factory.abi

enum NodeType {
  X = "XNode",
  ECONOMIC = "Eco Node",
}

export const getNodeByIdQueryKey = (nodeId?: string) => ["nodeById", nodeId]

/**
 * Fetch a single node's data by its token ID.
 * Works for any visitor — not restricted to the node owner.
 */
export const useNodeById = (nodeId?: string) => {
  const thor = useThor()
  const { account } = useWallet()

  return useQuery<UserNode | null>({
    queryKey: getNodeByIdQueryKey(nodeId),
    queryFn: async () => {
      const id = BigInt(nodeId!)

      const [
        owner,
        manager,
        tokenData,
        tokenUri,
        isX,
        endorsementScore,
        activeEndorsementsRaw,
        availablePoints,
        pointsInfo,
        gmAttachedId,
      ] = await executeMultipleClausesCall({
        thor,
        calls: [
          { abi: stargateNFTAbi, address: stargateNFTAddress, functionName: "ownerOf" as const, args: [id] },
          { abi: stargateNFTAbi, address: stargateNFTAddress, functionName: "getTokenManager" as const, args: [id] },
          { abi: stargateNFTAbi, address: stargateNFTAddress, functionName: "getToken" as const, args: [id] },
          { abi: stargateNFTAbi, address: stargateNFTAddress, functionName: "tokenURI" as const, args: [id] },
          { abi: stargateNFTAbi, address: stargateNFTAddress, functionName: "isXToken" as const, args: [id] },
          {
            abi: x2EarnAppsAbi,
            address: x2EarnAppsAddress,
            functionName: "getNodeEndorsementScore" as const,
            args: [id],
          },
          {
            abi: x2EarnAppsAbi,
            address: x2EarnAppsAddress,
            functionName: "getNodeActiveEndorsements" as const,
            args: [id],
          },
          {
            abi: x2EarnAppsAbi,
            address: x2EarnAppsAddress,
            functionName: "getNodeAvailablePoints" as const,
            args: [id],
          },
          { abi: x2EarnAppsAbi, address: x2EarnAppsAddress, functionName: "getNodePointsInfo" as const, args: [id] },
          {
            abi: galaxyMemberAbi,
            address: galaxyMemberAddress,
            functionName: "getIdAttachedToNode" as const,
            args: [id],
          },
        ],
      })

      const rawMetadata = await getIpfsMetadata<{
        name?: string
        description?: string
        image?: string
        attributes?: { trait_type: string; value: string }[]
      }>(tokenUri as string)

      const rawVetStaked =
        typeof tokenData === "object" &&
        tokenData !== null &&
        "vetAmountStaked" in (tokenData as Record<string, unknown>)
          ? (tokenData as Record<string, unknown>).vetAmountStaked
          : Array.isArray(tokenData)
            ? (tokenData as unknown as bigint[])[3]
            : undefined

      const rawEndorsements = activeEndorsementsRaw as
        | { appId: string; points: bigint; endorsedAtRound: bigint }[]
        | undefined
      const activeEndorsements: ActiveEndorsement[] = Array.isArray(rawEndorsements)
        ? rawEndorsements.map((e: any) => ({
            appId: e.appId ?? e[0],
            points: BigInt(e.points ?? e[1] ?? 0),
            endorsedAtRound: BigInt(e.endorsedAtRound ?? e[2] ?? 0),
          }))
        : []

      const rawPointsInfo = pointsInfo as { lockedPoints?: bigint } | undefined
      const lockedPoints =
        typeof rawPointsInfo === "object" && rawPointsInfo !== null && "lockedPoints" in rawPointsInfo
          ? rawPointsInfo.lockedPoints
          : Array.isArray(rawPointsInfo)
            ? (rawPointsInfo as unknown as bigint[])[3]
            : undefined

      const gmTokenId = (gmAttachedId as bigint) ?? BigInt(0)

      return {
        id,
        owner: owner as string,
        manager: manager as string,
        levelId: Number(
          (tokenData as any)?.levelId ?? (Array.isArray(tokenData) ? (tokenData as unknown as bigint[])[1] : 0),
        ),
        type: (isX as boolean) ? NodeType.X : NodeType.ECONOMIC,
        endorsementScore: (endorsementScore as bigint) ?? BigInt(0),
        activeEndorsements,
        availablePoints: (availablePoints as bigint) ?? BigInt(0),
        pointsInCooldown: lockedPoints !== undefined ? BigInt(lockedPoints) : BigInt(0),
        vetAmountStaked: rawVetStaked !== undefined ? BigInt(rawVetStaked as bigint) : BigInt(0),
        metadata: {
          name: rawMetadata?.name ?? "",
          description: rawMetadata?.description ?? "",
          attributes: rawMetadata?.attributes ?? [],
          image: rawMetadata?.image ? convertUriToUrl(rawMetadata.image) : notFoundImage,
        },
        currentUserIsManager: compareAddresses(account?.address ?? "", manager as string),
        currentUserIsOwner: compareAddresses(account?.address ?? "", owner as string),
        gmAttachedTokenId: gmTokenId,
        isGmAttached: gmTokenId > BigInt(0),
      }
    },
    enabled: !!nodeId,
  })
}
