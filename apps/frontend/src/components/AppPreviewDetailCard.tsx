import { AppSocialUrls } from "@/app/apps/[appId]/components/AppSocialUrls"
import { AppCardOptionsDesktopMenu } from "@/app/apps/components/AppCardOptionsDesktopMenu"
import { AppCardOptionsMobileModal } from "@/app/apps/components/AppCardOptionsMobileModal"
import { CreateEditAppFormData } from "@/components/CreateEditAppForm"
import { notFoundImage } from "@/constants"
import { useBreakpoints } from "@/hooks"
import {
  useDisclosure,
  IconButton,
  Card,
  CardBody,
  VStack,
  Skeleton,
  HStack,
  Heading,
  Text,
  Image,
} from "@chakra-ui/react"
import { useCallback } from "react"
import { FaEllipsisVertical } from "react-icons/fa6"

type Props = {
  app: CreateEditAppFormData
  appMetadataLoading?: boolean
  appMetadataError?: any
  isLogoLoading?: boolean
  isBannerLoading?: boolean
}
export const AppPreviewDetailCard = ({
  app,
  appMetadataLoading,
  appMetadataError,
  isLogoLoading,
  isBannerLoading,
}: Props) => {
  const { isMobile } = useBreakpoints()

  const { isOpen: isMobileOptionsOpen, onClose: closeMobileOptions, onOpen: openMobileOptions } = useDisclosure()

  const renderAppOptions = useCallback(() => {
    if (isMobile) {
      return (
        <>
          <IconButton
            isRound={true}
            icon={<FaEllipsisVertical />}
            onClick={openMobileOptions}
            aria-label="Open app options"
          />
          <AppCardOptionsMobileModal
            isOpen={isMobileOptionsOpen}
            onClose={closeMobileOptions}
            receiverAddress={app.receiverAddress}
            externalUrl={app.projectUrl}
          />
        </>
      )
    }
    return <AppCardOptionsDesktopMenu receiverAddress={app.receiverAddress} externalUrl={app.projectUrl} />
  }, [isMobile, openMobileOptions, isMobileOptionsOpen, closeMobileOptions, app])

  return (
    <Card variant={"baseWithBorder"} w="full">
      <CardBody>
        <VStack w="full" spacing={4} align="flex-start">
          <Skeleton w="full" h={200} isLoaded={!isBannerLoading} rounded={"3xl"}>
            <Image w="full" src={app.banner ?? notFoundImage} h={"full"} objectFit={"cover"} rounded={"3xl"} />
          </Skeleton>
          <HStack w="full" justify={"space-between"}>
            <HStack spacing={4} mt={4}>
              <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
                <Image src={app.logo ?? notFoundImage} alt={"logo"} boxSize={14} borderRadius="9px" />
              </Skeleton>
              <Skeleton isLoaded={!appMetadataLoading}>
                <Heading size={"md"}>{app.name ?? appMetadataError?.message ?? "Error loading name"}</Heading>
              </Skeleton>
            </HStack>
            <HStack spacing={4}>{renderAppOptions()}</HStack>
          </HStack>

          <Skeleton isLoaded={!appMetadataLoading} w={["full", "70%"]}>
            <Text fontSize={"md"}>{app?.description ?? appMetadataError?.message ?? "Error loading description"}</Text>
          </Skeleton>
          <AppSocialUrls socialUrls={[]} />
        </VStack>
      </CardBody>
    </Card>
  )
}
