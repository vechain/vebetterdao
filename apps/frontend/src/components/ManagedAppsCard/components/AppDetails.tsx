import { XApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { HStack, Heading, IconButton, Image, Skeleton, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { FiArrowUpRight } from "react-icons/fi"
import { LatestAllocationDetails } from "./LatestAllocationDetails"
import { RoleDetails } from "./RoleDetails"

type Props = {
  app: XApp
  isAdmin: boolean
  isModerator: boolean
}

export const AppDetails = ({ app, isAdmin, isModerator }: Props) => {
  const router = useRouter()
  const {
    data: appMetadata,
    isLoading: appMetadataLoading,
    isError: isAppMetadataError,
    error: appMetadataError,
  } = useXAppMetadata(app.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  console.log(isModerator)

  const navigateToAppDetail = useCallback(() => {
    router.push(`/apps/${app.id}`)
  }, [router, app.id])

  return (
    <VStack alignItems={"start"} justify={"flex-start"} w={"full"} spacing={4}>
      <HStack spacing={1} justifyContent={"space-between"} w={"full"}>
        <HStack>
          <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
            <Image src={logo?.image ?? notFoundImage} alt={"logo"} maxW={"40px"} borderRadius="9px" />
          </Skeleton>

          <Skeleton isLoaded={!appMetadataLoading} justifyContent={"end"}>
            <Heading size={"sm"}>{appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}</Heading>
          </Skeleton>
        </HStack>

        <Skeleton isLoaded={!appMetadataLoading} justifyContent={"end"}>
          <IconButton
            isRound={true}
            variant="solid"
            aria-label="Go to App"
            fontSize="20px"
            disabled={isAppMetadataError}
            onClick={navigateToAppDetail}
            color={"primary.500"}
            icon={<FiArrowUpRight />}
          />
        </Skeleton>
      </HStack>

      <LatestAllocationDetails appId={app.id} />
      <RoleDetails isAdmin={isAdmin} isModerator={isModerator} />
    </VStack>
  )
}
