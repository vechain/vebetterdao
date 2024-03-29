import { XApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Card, CardBody, VStack, HStack, Skeleton, IconButton, Image, Text, Box, useDisclosure } from "@chakra-ui/react"
import { FaEllipsisVertical } from "react-icons/fa6"
import { AppCardInnerDetails } from "./AppCardInnerDetails"
import { useBreakpoints } from "@/hooks"
import { AppCardOptionsMobileModal } from "./AppCardOptionsMobileModal"
import { AppCardOptionsDesktopMenu } from "./AppCardOptionsDesktopMenu"
import { useRouter } from "next/navigation"

type Props = { xApp: XApp }
export const AppCard = ({ xApp }: Props) => {
  const { isMobile } = useBreakpoints()

  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(xApp.id)

  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)
  const { data: banner, isLoading: isBannerLoading } = useIpfsImage(appMetadata?.banner)

  const { isOpen: isMobileOptionsOpen, onClose: closeMobileOptions, onOpen: openMobileOptions } = useDisclosure()

  const router = useRouter()

  const navigateToAppDetail = () => {
    router.push(`/apps/${xApp.id}`)
  }

  return (
    <Card variant={"baseWithBorder"} w="full">
      <Box w="full" position={"relative"} h={100}>
        <Skeleton w="full" h="full" isLoaded={!isBannerLoading}>
          <Image
            w="full"
            src={banner?.image}
            h={"full"}
            objectFit={"cover"}
            borderTopRadius={"md"}
            onClick={navigateToAppDetail}
            _hover={{
              cursor: "pointer",
            }}
          />
        </Skeleton>
        <Skeleton isLoaded={!isLogoLoading} alignContent={"start"} pos={"absolute"} bottom={-7} left={5}>
          <Image
            src={logo?.image ?? notFoundImage}
            alt={"logo"}
            boxSize={14}
            borderRadius="9px"
            onClick={navigateToAppDetail}
            _hover={{
              cursor: "pointer",
            }}
          />
        </Skeleton>
      </Box>
      <CardBody mt={5}>
        <VStack alignItems={"start"} justify={"flex-start"}>
          <VStack spacing={1} align="flex-start">
            <HStack spacing={1} justifyContent={"space-between"} align="center" w={"full"}>
              <Skeleton isLoaded={!appMetadataLoading}>
                <Text fontWeight={"600"} size={"xs"}>
                  {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                </Text>
              </Skeleton>
              {isMobile ? (
                <>
                  <IconButton
                    isRound={true}
                    icon={<FaEllipsisVertical />}
                    onClick={openMobileOptions}
                    aria-label="Open app options"
                  />
                  <AppCardOptionsMobileModal
                    receiverAddress={xApp.receiverAddress}
                    externalUrl={appMetadata?.external_url}
                    isLoading={appMetadataLoading}
                    isOpen={isMobileOptionsOpen}
                    onClose={closeMobileOptions}
                  />
                </>
              ) : (
                <AppCardOptionsDesktopMenu
                  receiverAddress={xApp.receiverAddress}
                  externalUrl={appMetadata?.external_url}
                  isLoading={appMetadataLoading}
                  xAppId={xApp.id}
                  showViewDetails={true}
                />
              )}
            </HStack>
            <Skeleton isLoaded={!appMetadataLoading}>
              <Text fontSize={"sm"} color={"gray.500"}>
                {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
              </Text>
            </Skeleton>
          </VStack>
          <AppCardInnerDetails xApp={xApp} />
        </VStack>
      </CardBody>
    </Card>
  )
}
