import { useAccountLinking, useSustainabilityCurrentRoundOverview } from "@/api"
import { AddressIcon } from "@/components/AddressIcon"
import { LeafIcon } from "@/components/Icons/LeafIcon"
import { compareAddresses } from "@/utils/AddressUtils/AddressUtils"
import { HStack, Text, Badge, Heading, Button, useDisclosure, Stack, Show } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useWallet, useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"
import { RemoveLinkModalPassportPOV } from "./components/RemoveLinkModalPassportPOV"
import { UilLinkBroken } from "@iconscout/react-unicons"
import { RemovePendingRequestModal } from "./components/RemovePendingRequestModal"
import { RemoveLinkModalEntityPOV } from "./components/RemoveLinkModalEntityPOV"
import { useBreakpoints } from "@/hooks"

type Props = { isConnectedUser: boolean; account: string; pending?: boolean }

export const LinkedAccountsItem = ({ isConnectedUser, account, pending = false }: Props) => {
  const { t } = useTranslation()
  const { account: userAccount } = useWallet()
  const { isMobile } = useBreakpoints()
  const { data: vnsData } = useVechainDomain(account)
  const domain = vnsData?.domain
  const isUserAccountCard = compareAddresses(account, userAccount?.address ?? "")
  const { data: userOverview, isLoading: isUserOverviewLoading } = useSustainabilityCurrentRoundOverview(account)
  const {
    isPassport,
    isEntity,
    outgoingPendingLink,
    isLoading: isAccountLinkingLoading,
  } = useAccountLinking(userAccount?.address)
  const removeLinkModalPassportPOV = useDisclosure()
  const removeLinkModalEntityPOV = useDisclosure()
  const removePendingRequestModal = useDisclosure()

  const canUnlinkAccount = isConnectedUser && ((isPassport && !isUserAccountCard) || (isEntity && isUserAccountCard))

  if (isUserOverviewLoading || isAccountLinkingLoading) return null

  return (
    <Stack
      direction={["column", "column", "row"]}
      justify={"stretch"}
      flexWrap={"wrap"}
      align={["stretch", "stretch", "center"]}
      bg="dark-contrast-on-card-bg"
      rounded="xl"
      p={3}
      border={pending || !isUserAccountCard ? "none" : "1px solid #4A90E2"}
      boxShadow={pending ? "0px 0px 7.9px 0px rgba(242, 155, 50, 0.50)" : "none"}>
      <HStack gap={4} flex={1}>
        <AddressIcon address={account} w={12} h={12} rounded="full" />
        <HStack justify={"space-between"} w={"full"} flex={1}>
          <Stack direction={["column", "column", "row"]} align={["stretch", "stretch", "center"]}>
            <HStack>
              {domain && (
                <Text
                  fontWeight="600"
                  fontSize={["sm", "sm", "lg"]}
                  borderRight={"1px solid"}
                  paddingRight={2}
                  lineClamp={1}
                  title={domain}>
                  {humanDomain(domain, 8, 4)}
                </Text>
              )}
              <Text fontWeight="600" fontSize={["sm", "sm", "lg"]} lineClamp={1} title={account}>
                {humanAddress(account, 4, 4)}
              </Text>
            </HStack>
            {pending && (
              <Badge color="white" bg={"#F29B32"} borderRadius="full" px="12px" py="4px" textTransform={"inherit"}>
                {t("Pending request")}
              </Badge>
            )}
            {!pending && isUserAccountCard && (
              <Badge color="white" bg={"#004CFC"} borderRadius="full" px="12px" py="4px" textTransform={"inherit"}>
                {t("Your account")}
              </Badge>
            )}
          </Stack>
          <Show when={isMobile}>
            <HStack gap={1}>
              <LeafIcon color="#448300" size="24" />
              <Heading fontWeight="700" fontSize={"xl"}>
                {userOverview?.actionsRewarded ?? 0}
              </Heading>
            </HStack>
          </Show>
        </HStack>
      </HStack>
      <HStack gap={2} flex={[1, 1, 0]}>
        <Show when={!isMobile}>
          <HStack gap={1}>
            <LeafIcon color="#448300" size="24" />
            <Heading fontWeight="700" fontSize={"xl"}>
              {userOverview?.actionsRewarded ?? 0}
            </Heading>
          </HStack>
        </Show>
        {canUnlinkAccount && (
          <Button
            flex={1}
            variant={"dangerGhost"}
            onClick={isPassport ? removeLinkModalPassportPOV.onOpen : removeLinkModalEntityPOV.onOpen}>
            <UilLinkBroken color="#C84968" />
            {t("Unlink account")}
          </Button>
        )}
        {isConnectedUser && pending && (
          <Button flex={1} variant={"dangerGhost"} onClick={removePendingRequestModal.onOpen}>
            <UilLinkBroken color="#C84968" />
            {t("Remove request")}
          </Button>
        )}
      </HStack>
      <RemovePendingRequestModal modal={removePendingRequestModal} passport={outgoingPendingLink ?? ""} />
      <RemoveLinkModalPassportPOV modal={removeLinkModalPassportPOV} entity={account} />
      <RemoveLinkModalEntityPOV modal={removeLinkModalEntityPOV} entity={account} />
    </Stack>
  )
}
