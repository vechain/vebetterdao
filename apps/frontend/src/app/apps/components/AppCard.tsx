import { Card, VStack, HStack, Skeleton, IconButton, Image, Text, Box, useDisclosure } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { FaEllipsisVertical } from "react-icons/fa6"

import { notFoundImage } from "@/constants"

import { XApp } from "../../../api/contracts/xApps/getXApps"
import { useXAppMetadata } from "../../../api/contracts/xApps/hooks/useXAppMetadata"
import { useIpfsImage } from "../../../api/ipfs/hooks/useIpfsImage"
import { useBreakpoints } from "../../../hooks/useBreakpoints"

import { AppCardInnerDetails } from "./AppCardInnerDetails"
import { AppCardOptionsDesktopMenu } from "./AppCardOptionsDesktopMenu"
import { AppCardOptionsMobileModal } from "./AppCardOptionsMobileModal"

type Props = { xApp: XApp }
export const AppCard = ({ xApp }: Props) => {
  const { isMobile } = useBreakpoints()
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xApp.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)
  const { data: banner, isLoading: isBannerLoading } = useIpfsImage(appMetadata?.banner)
  const { open: isMobileOptionsOpen, onClose: closeMobileOptions, onOpen: openMobileOptions } = useDisclosure()
  const router = useRouter()
  const navigateToAppDetail = () => {
    router.push(`/apps/${xApp.id}`)
  }
  return (
    <Card.Root
      variant="primary"
      w="full"
      onClick={navigateToAppDetail}
      _hover={{
        cursor: "pointer",
        backgroundColor: "gray.50",
      }}>
      <Box w="full" position={"relative"} h={200}>
        <Skeleton w="full" h="full" loading={isBannerLoading}>
          <Image
            alt={`Banner for ${appMetadata?.name}`}
            w="full"
            src={banner?.image}
            h={"full"}
            objectFit={"cover"}
            borderTopRadius={"md"}
          />
        </Skeleton>
        <Skeleton loading={isLogoLoading} alignContent={"start"} pos={"absolute"} bottom={-7} left={5}>
          <Image src={logo?.image ?? notFoundImage} alt={"logo"} boxSize={14} borderRadius="9px" />
        </Skeleton>
      </Box>
      <Card.Body mt={5}>
        <VStack alignItems={"start"} justify={"flex-start"}>
          <VStack gap={1} align="flex-start" w="full">
            <HStack gap={1} justifyContent={"space-between"} align="center" w={"full"}>
              <Skeleton loading={appMetadataLoading}>
                <Text fontWeight="semibold" textStyle={"xs"}>
                  {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                </Text>
              </Skeleton>
              {isMobile ? (
                <>
                  <IconButton
                    rounded="full"
                    aria-label="Open app options"
                    onClick={e => {
                      e.stopPropagation()
                      openMobileOptions()
                    }}>
                    <FaEllipsisVertical />
                  </IconButton>
                  <AppCardOptionsMobileModal
                    teamWalletAddress={xApp.teamWalletAddress}
                    externalUrl={appMetadata?.external_url}
                    isLoading={appMetadataLoading}
                    isOpen={isMobileOptionsOpen}
                    onClose={closeMobileOptions}
                    xAppId={xApp.id}
                    showViewDetails={true}
                  />
                </>
              ) : (
                <AppCardOptionsDesktopMenu
                  teamWalletAddress={xApp.teamWalletAddress}
                  externalUrl={appMetadata?.external_url}
                  isLoading={appMetadataLoading}
                  xAppId={xApp.id}
                  showViewDetails={true}
                />
              )}
            </HStack>
            <Skeleton loading={appMetadataLoading}>
              <Text textStyle={"sm"} color={"gray.500"}>
                {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
              </Text>
            </Skeleton>
          </VStack>
        </VStack>
      </Card.Body>
      <Card.Footer>
        <AppCardInnerDetails xApp={xApp} />
      </Card.Footer>
    </Card.Root>
  )
}
