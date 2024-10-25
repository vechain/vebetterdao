import { useB3trBalance, useVot3Balance } from "@/api"
import { B3TRIcon, WalletNotConnectedOverlay } from "@/components"
import { ConvertModal } from "@/components/Convert/ConvertModal"
import { Box, Button, Heading, HStack, Image, Skeleton, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilArrowUpRight, UilExchangeAlt } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { AnalyticsUtils } from "@/utils"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "@/constants"

const compactFormatter = getCompactFormatter(2)

type Props = {
  address: string
  showGoToBalance?: boolean
}
export const TokensBalance = ({ address, showGoToBalance = false }: Props) => {
  const { t } = useTranslation()

  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useB3trBalance(address ?? undefined)
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useVot3Balance(address ?? undefined)

  const { isOpen, onClose, onOpen } = useDisclosure()
  const hasNoBalance = (!b3trBalance || b3trBalance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isB3trBalanceLoading || isVot3BalanceLoading

  const isSwapDisabled = isLoading || hasNoBalance

  const router = useRouter()
  const goToBalance = useCallback(() => {
    router.push("/profile")
  }, [router])

  if (!address) return <WalletNotConnectedOverlay />

  return (
    <VStack
      w="full"
      align={"stretch"}
      gap="24px"
      bg="#004CFC"
      rounded="xl"
      color="white"
      position={"relative"}
      p={4}
      overflow={"hidden"}>
      <Box position="absolute" top={"-140%"} left={"-30%"} w={"150%"} h="auto" zIndex={1}>
        <Image src={"/images/cloud-background.png"} alt="cloud" objectFit={"contain"} />
      </Box>
      <HStack color="white" zIndex={2} justifyContent={"space-between"}>
        <Heading fontSize="xl">{t("Your token balance")}</Heading>
        {showGoToBalance && (
          <HStack _hover={{ cursor: "pointer", textDecoration: "underline" }} gap={1} onClick={goToBalance}>
            <Text fontWeight={500}>{t("Go to balance")}</Text>
            <UilArrowUpRight size={"16px"} />
          </HStack>
        )}
      </HStack>
      <Stack gap="24px" direction={"row"} zIndex={1}>
        <VStack
          align={"stretch"}
          flex="1"
          gap="8px"
          bg="#FFFFFF26"
          border={"1px solid #FFFFFF33"}
          backdropFilter="blur(8px)"
          p="12px 16px"
          rounded="8px">
          <Text fontSize="sm" color="#FFFFFFB2">
            {t("B3TR Balance")}
          </Text>
          <HStack>
            <B3TRIcon boxSize={["24px", "28px"]} />

            <Skeleton isLoaded={!isB3trBalanceLoading}>
              <Heading fontSize={["24px", "28px"]}>
                {compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}
              </Heading>
            </Skeleton>
          </HStack>
        </VStack>
        <VStack
          align={"stretch"}
          flex="1"
          gap="8px"
          bg="#FFFFFF26"
          border={"1px solid #FFFFFF33"}
          p="12px 16px"
          rounded="8px">
          <Text fontSize="sm" color="#FFFFFFB2">
            {t("VOT3 Balance")}
          </Text>
          <HStack>
            <Image src={"/images/logo/vot3_logo_dark.svg"} boxSize={["24px", "28px"]} alt="VOT3 Icon" />
            <Skeleton isLoaded={!isVot3BalanceLoading}>
              <Heading fontSize={["24px", "28px"]}>
                {compactFormatter.format(Number(vot3Balance?.scaled ?? "0"))}
              </Heading>
            </Skeleton>
          </HStack>
        </VStack>
      </Stack>
      <Button
        isDisabled={isSwapDisabled}
        onClick={() => {
          onOpen()
          AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.SWAP_TOKENS))
        }}
        leftIcon={<UilExchangeAlt size={"16px"} />}
        variant={"whiteAction"}
        rounded={"full"}
        fontWeight={500}
        px="24px"
        zIndex={1}>
        {t("Swap tokens")}
      </Button>
      <ConvertModal isOpen={isOpen} onClose={onClose} />
    </VStack>
  )
}
