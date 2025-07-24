import { useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Separator, HStack, Heading, IconButton, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { FiArrowUpRight } from "react-icons/fi"
import { LatestAllocationDetails } from "./LatestAllocationDetails"

type Props = {
  appId: string
  isAdmin: boolean
  isModerator: boolean
  showSeparator?: boolean
}

export const AppDetails = ({ appId, isAdmin, isModerator, showSeparator = false }: Props) => {
  const router = useRouter()
  const {
    data: appMetadata,
    isLoading: appMetadataLoading,
    isError: isAppMetadataError,
    error: appMetadataError,
  } = useXAppMetadata(appId)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const role = useMemo(() => {
    if (isAdmin) {
      return "Admin"
    } else if (isModerator) {
      return "Moderator"
    } else {
      return "Error"
    }
  }, [isAdmin, isModerator])

  const navigateToAppDetail = useCallback(() => {
    router.push(`/apps/${appId}`)
  }, [router, appId])

  return (
    <VStack alignItems={"start"} justify={"flex-start"} w={"full"} gap={4}>
      <HStack gap={1} justifyContent={"space-between"} w={"full"}>
        <HStack>
          <Skeleton loading={isLogoLoading} alignContent={"start"}>
            <Image src={logo?.image ?? notFoundImage} alt={"logo"} maxW={"40px"} borderRadius="9px" />
          </Skeleton>

          <Skeleton loading={appMetadataLoading} justifyContent={"end"}>
            <Heading size={"sm"}>{appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}</Heading>
            <Text fontSize={"sm"} fontWeight={"300"} color={"#6A6A6A"}>
              {role}
            </Text>
          </Skeleton>
        </HStack>

        <Skeleton loading={appMetadataLoading} justifyContent={"end"}>
          <IconButton
            rounded={"full"}
            variant="solid"
            aria-label="Go to App"
            fontSize="22px"
            disabled={isAppMetadataError}
            onClick={navigateToAppDetail}
            color={"primary.500"}>
            <FiArrowUpRight />
          </IconButton>
        </Skeleton>
      </HStack>

      <LatestAllocationDetails appId={appId} />

      {showSeparator && <Separator w={"full"} />}
    </VStack>
  )
}
