import { useAccountLinking, useSustainabilityCurrentRoundOverview } from "@/api"
import { AddressIcon } from "@/components/AddressIcon"
import { LeafIcon } from "@/components/Icons/LeafIcon"
import { compareAddresses } from "@/utils/AddressUtils/AddressUtils"
import { HStack, Text, Badge, Heading, Button, useDisclosure, Stack, Show } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/dapp-kit-react"
import { useTranslation } from "react-i18next"
import { RemoveLinkModalPassportPOV } from "./components/RemoveLinkModalPassportPOV"
import { UilLinkBroken } from "@iconscout/react-unicons"
import { useMemo } from "react"
import { RemovePendingRequestModal } from "./components/RemovePendingRequestModal"
import { RemoveLinkModalEntityPOV } from "./components/RemoveLinkModalEntityPOV"
import { useWallet } from "@vechain/vechain-kit"

type Props = { isConnectedUser: boolean; account: string; pending?: boolean }

export const LinkedAccountsItem = ({ isConnectedUser, account, pending = false }: Props) => {
  const { t } = useTranslation()
  const { account: userAccount } = useWallet()
  const { domain } = useVechainDomain({ addressOrDomain: userAccount?.address ?? "" })
  const isUserAccountCard = compareAddresses(account, userAccount)
  const { data: userOverview, isLoading: isUserOverviewLoading } = useSustainabilityCurrentRoundOverview(
    userAccount?.address,
  )
  const {
    isPassport,
    isEntity,
    outgoingPendingLink,
    isLoading: isAccountLinkingLoading,
  } = useAccountLinking(userAccount?.address)
  const removeLinkModalPassportPOV = useDisclosure()
  const removeLinkModalEntityPOV = useDisclosure()
  const removePendingRequestModal = useDisclosure()

  const border = useMemo(() => {
    if (pending) return "none"
    if (isUserAccountCard) return "1px solid #4A90E2"
    return "none"
  }, [pending, isUserAccountCard])

  if (isUserOverviewLoading || isAccountLinkingLoading) return null

  return (
    <Stack
      direction={["column", "column", "row"]}
      justify={"stretch"}
      flexWrap={"wrap"}
      align={["stretch", "stretch", "center"]}
      bg="#F8F8F8"
      rounded="xl"
      p={3}
      border={border}
      boxShadow={pending ? "0px 0px 7.9px 0px rgba(242, 155, 50, 0.50)" : "none"}>
      <HStack gap={4} flex={1}>
        <AddressIcon address={account} w={12} h={12} rounded="full" />
        <HStack justify={"space-between"} w={"full"} flex={1}>
          <Stack direction={["column", "column", "row"]} align={["stretch", "stretch", "center"]}>
            <HStack>
              {domain && (
                <Text fontWeight="600" fontSize={["sm", "sm", "lg"]} borderRight={"1px solid"} paddingRight={2}>
                  {domain}
                </Text>
              )}
              <Text fontWeight="600" fontSize={["sm", "sm", "lg"]}>
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
          <Show below="md">
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
        <Show above="md">
          <HStack gap={1}>
            <LeafIcon color="#448300" size="24" />
            <Heading fontWeight="700" fontSize={"xl"}>
              {userOverview?.actionsRewarded ?? 0}
            </Heading>
          </HStack>
        </Show>
        {isConnectedUser && isPassport && !isUserAccountCard && (
          <Button
            flex={1}
            variant={"dangerGhost"}
            leftIcon={<UilLinkBroken color="#C84968" />}
            onClick={removeLinkModalPassportPOV.onOpen}>
            {t("Unlink account")}
          </Button>
        )}
        {isConnectedUser && isEntity && isUserAccountCard && (
          <Button
            flex={1}
            variant={"dangerGhost"}
            leftIcon={<UilLinkBroken color="#C84968" />}
            onClick={removeLinkModalEntityPOV.onOpen}>
            {t("Unlink account")}
          </Button>
        )}
        {isConnectedUser && pending && (
          <Button
            flex={1}
            variant={"dangerGhost"}
            leftIcon={<UilLinkBroken color="#C84968" />}
            onClick={removePendingRequestModal.onOpen}>
            {t("Remove request")}
          </Button>
        )}
      </HStack>
      <RemovePendingRequestModal modal={removePendingRequestModal} passport={outgoingPendingLink} />
      <RemoveLinkModalPassportPOV modal={removeLinkModalPassportPOV} entity={account} />
      <RemoveLinkModalEntityPOV modal={removeLinkModalEntityPOV} entity={account} />
    </Stack>
  )
}
