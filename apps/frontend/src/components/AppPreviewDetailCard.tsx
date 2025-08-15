import { AppDetailSocials } from "@/app/apps/[appId]/components/AppDetailOverview/components/AppDetailSocials"
import { AppCardOptionsDesktopMenu } from "@/app/apps/components/AppCardOptionsDesktopMenu"
import { AppCardOptionsMobileModal } from "@/app/apps/components/AppCardOptionsMobileModal"
import { CreateEditAppFormData } from "@/components/CreateEditAppForm"
import { notFoundImage } from "@/constants"
import { useBreakpoints } from "@/hooks"
import { useDisclosure, IconButton, Card, VStack, Skeleton, HStack, Heading, Text, Image } from "@chakra-ui/react"
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

  const { open: isMobileOptionsOpen, onClose: closeMobileOptions, onOpen: openMobileOptions } = useDisclosure()

  const renderAppOptions = useCallback(() => {
    if (isMobile) {
      return (
        <>
          <IconButton variant="subtle" rounded={"full"} onClick={openMobileOptions} aria-label="Open app options">
            <FaEllipsisVertical />
          </IconButton>
          <AppCardOptionsMobileModal
            isOpen={isMobileOptionsOpen}
            onClose={closeMobileOptions}
            teamWalletAddress={app.treasuryWalletAddress}
            externalUrl={app.projectUrl}
          />
        </>
      )
    }
    return <AppCardOptionsDesktopMenu teamWalletAddress={app.treasuryWalletAddress} externalUrl={app.projectUrl} />
  }, [isMobile, openMobileOptions, isMobileOptionsOpen, closeMobileOptions, app])

  return (
    <Card.Root variant={"baseWithBorder"} w="full">
      <Card.Body>
        <VStack w="full" gap={4} align="flex-start">
          <Skeleton asChild w="full" h={200} loading={!!isBannerLoading} rounded={"3xl"}>
            <Image
              w="full"
              src={app.banner ?? notFoundImage}
              h={"full"}
              objectFit={"cover"}
              rounded={"3xl"}
              alt={`${app.name} banner`}
            />
          </Skeleton>
          <HStack w="full" justify={"space-between"}>
            <HStack gap={4} mt={4}>
              <Skeleton loading={!!isLogoLoading} alignContent={"start"}>
                <Image src={app.logo ?? notFoundImage} alt={"logo"} boxSize={14} borderRadius="9px" />
              </Skeleton>
              <Skeleton loading={appMetadataLoading}>
                <Heading size={"md"}>{app.name ?? appMetadataError?.message ?? "Error loading name"}</Heading>
              </Skeleton>
            </HStack>
            <HStack gap={4}>{renderAppOptions()}</HStack>
          </HStack>

          <Skeleton loading={appMetadataLoading} w={["full", "70%"]}>
            <Text fontSize={"md"}>{app?.description ?? appMetadataError?.message ?? "Error loading description"}</Text>
          </Skeleton>
          <AppDetailSocials socialUrls={[]} />
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
