import { Separator, HStack, Heading, IconButton, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useMemo } from "react"
import { FiArrowUpRight } from "react-icons/fi"

import { notFoundImage } from "@/constants"

import { useXAppMetadata } from "../../../api/contracts/xApps/hooks/useXAppMetadata"
import { useIpfsImage } from "../../../api/ipfs/hooks/useIpfsImage"

import { LatestAllocationDetails } from "./LatestAllocationDetails"
import { LatestAllocationVotingDetails } from "./LatestAllocationVotingDetails"

type Props = {
  appId: string
  isAdmin: boolean
  isModerator: boolean
  showSeparator?: boolean
}
export const AppDetails = ({ appId, isAdmin, isModerator, showSeparator = false }: Props) => {
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
  return (
    <VStack alignItems={"start"} justify={"flex-start"} w={"full"} gap="4">
      <HStack gap="1" justifyContent={"space-between"} w={"full"}>
        <HStack>
          <Skeleton loading={isLogoLoading} alignContent={"start"}>
            <Image aspectRatio="square" src={logo?.image ?? notFoundImage} alt={"logo"} boxSize="40px" rounded="lg" />
          </Skeleton>
          <Skeleton loading={appMetadataLoading} justifyContent={"end"}>
            <Heading size={"md"}>{appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}</Heading>
            <Text textStyle={"sm"} color="text.subtle">
              {role}
            </Text>
          </Skeleton>
        </HStack>

        <Skeleton loading={appMetadataLoading} justifyContent={"end"}>
          <IconButton
            rounded={"full"}
            variant="surface"
            aria-label="Go to App"
            width="6"
            disabled={isAppMetadataError}
            asChild>
            <NextLink href={`/apps/${appId}`}>
              <FiArrowUpRight />
            </NextLink>
          </IconButton>
        </Skeleton>
      </HStack>

      <LatestAllocationDetails appId={appId} />
      <LatestAllocationVotingDetails appId={appId} />

      {showSeparator && <Separator w={"full"} />}
    </VStack>
  )
}
