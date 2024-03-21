import { useXApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import {
  Card,
  CardBody,
  HStack,
  Skeleton,
  Image,
  Heading,
  IconButton,
  useDisclosure,
  VStack,
  Text,
} from "@chakra-ui/react"
import { useBreakpoints } from "@/hooks"
import { FaEllipsisVertical } from "react-icons/fa6"
import { AppCardOptionsDesktopMenu } from "../../components/AppCardOptionsDesktopMenu"
import { AppCardOptionsMobileModal } from "../../components/AppCardOptionsMobileModal"
import { useCallback } from "react"
import { AppSocialUrls } from "./AppSocialUrls"

type Props = { appId: string }
export const AppDetailCard = ({ appId }: Props) => {
  const { isMobile } = useBreakpoints()

  const { data: xApp } = useXApp(appId)
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(appId)

  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)
  const { data: banner, isLoading: isBannerLoading } = useIpfsImage(appMetadata?.banner)

  const { isOpen: isMobileOptionsOpen, onClose: closeMobileOptions, onOpen: openMobileOptions } = useDisclosure()

  const renderAppOptions = useCallback(() => {
    if (!xApp) return null
    if (isMobile) {
      return (
        <>
          <IconButton
            isRound={true}
            icon={<FaEllipsisVertical />}
            onClick={openMobileOptions}
            aria-label="Open app options"
          />
          <AppCardOptionsMobileModal isOpen={isMobileOptionsOpen} onClose={closeMobileOptions} xApp={xApp} />
        </>
      )
    }
    return <AppCardOptionsDesktopMenu xApp={xApp} />
  }, [isMobile, openMobileOptions, xApp, isMobileOptionsOpen, closeMobileOptions])

  return (
    <Card variant={"baseWithBorder"} w="full">
      <CardBody>
        <VStack w="full" spacing={4} align="flex-start">
          <Skeleton w="full" h={200} isLoaded={!isBannerLoading} rounded={"3xl"}>
            <Image w="full" src={banner?.image} h={"full"} objectFit={"cover"} rounded={"3xl"} />
          </Skeleton>
          <HStack w="full" justify={"space-between"}>
            <HStack spacing={4} mt={4}>
              <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
                <Image src={logo?.image ?? notFoundImage} alt={"logo"} boxSize={14} borderRadius="9px" />
              </Skeleton>
              <Skeleton isLoaded={!appMetadataLoading}>
                <Heading size={"md"}>{appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}</Heading>
              </Skeleton>
            </HStack>
            {renderAppOptions()}
          </HStack>

          <Skeleton isLoaded={!appMetadataLoading} w={["full", "70%"]}>
            <Text fontSize={"md"}>
              {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
            </Text>
          </Skeleton>
          <AppSocialUrls appId={appId} />
        </VStack>
      </CardBody>
    </Card>
  )
}
