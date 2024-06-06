import { useAppAdmin, useAppModerators, useXApp, useXAppMetadata } from "@/api"
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
  Button,
} from "@chakra-ui/react"
import { useBreakpoints } from "@/hooks"
import { FaEllipsisVertical, FaPencil } from "react-icons/fa6"
import { AppCardOptionsDesktopMenu } from "../../components/AppCardOptionsDesktopMenu"
import { AppCardOptionsMobileModal } from "../../components/AppCardOptionsMobileModal"
import { useCallback, useMemo } from "react"
import { AppSocialUrls } from "./AppSocialUrls"
import { useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useRouter } from "next/navigation"
import { compare } from "@repo/utils/HexUtils"

type Props = { appId: string; showEditButton?: boolean }
export const AppDetailCard = ({ appId, showEditButton = true }: Props) => {
  const router = useRouter()
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()

  const { data: xApp } = useXApp(appId)
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(appId)
  const { data: xAppAdmin } = useAppAdmin(appId)

  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)
  const { data: banner, isLoading: isBannerLoading } = useIpfsImage(appMetadata?.banner)

  const { isOpen: isMobileOptionsOpen, onClose: closeMobileOptions, onOpen: openMobileOptions } = useDisclosure()
  const { data: appModerators } = useAppModerators(appId)
  const isAllowedToEdit = useMemo(() => {
    if (!account || !appModerators || !xAppAdmin) return false
    if (compareAddresses(xAppAdmin, account)) return true
    return appModerators.some(mod => compareAddresses(mod, account))
  }, [account, appModerators, xAppAdmin])

  const navigateToEdit = () => {
    router.push(`/apps/edit/${appId}`)
  }

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
          <AppCardOptionsMobileModal
            isOpen={isMobileOptionsOpen}
            onClose={closeMobileOptions}
            teamWalletAddress={xApp.teamWalletAddress}
            externalUrl={appMetadata?.external_url}
            isLoading={appMetadataLoading}
            xAppId={xApp.id}
          />
        </>
      )
    }
    return (
      <AppCardOptionsDesktopMenu
        teamWalletAddress={xApp.teamWalletAddress}
        externalUrl={appMetadata?.external_url}
        isLoading={appMetadataLoading}
        xAppId={xApp.id}
      />
    )
  }, [isMobile, openMobileOptions, xApp, isMobileOptionsOpen, closeMobileOptions, appMetadata, appMetadataLoading])

  return (
    <Card variant={"baseWithBorder"} w="full">
      <CardBody>
        <VStack w="full" spacing={4} align="flex-start">
          <Skeleton w="full" h={200} isLoaded={!isBannerLoading} rounded={"3xl"}>
            <Image
              w="full"
              src={banner?.image}
              h={"full"}
              objectFit={"cover"}
              rounded={"3xl"}
              alt={`${xApp?.name} banner`}
            />
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
            <HStack spacing={4}>
              {isAllowedToEdit && showEditButton && (
                <Button colorScheme="blue" size="sm" variant="outline" leftIcon={<FaPencil />} onClick={navigateToEdit}>
                  Edit App page
                </Button>
              )}
              {renderAppOptions()}
            </HStack>
          </HStack>

          <Skeleton isLoaded={!appMetadataLoading} w={["full", "70%"]}>
            <Text fontSize={"md"}>
              {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
            </Text>
          </Skeleton>
          <AppSocialUrls socialUrls={appMetadata?.social_urls ?? []} />
        </VStack>
      </CardBody>
    </Card>
  )
}
