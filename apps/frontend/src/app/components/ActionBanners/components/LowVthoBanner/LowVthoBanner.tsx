import { Heading, Text, VStack, Card, CardBody, HStack, Image, Button, Show, useMediaQuery } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useCallback, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Transak, TransakConfig } from "@transak/transak-sdk"
import { useWallet } from "@vechain/dapp-kit-react"
import { getAccountBalanceQueryKey } from "@/api"

const isProduction = process.env.NODE_ENV === "production"
export const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY ?? ""

export const LowVthoBanner = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const [isVerySmallMobile] = useMediaQuery("(max-height: 667px)")

  const transakConfig: TransakConfig = useMemo(
    () => ({
      apiKey,
      walletAddress: account ?? "",
      productsAvailed: "BUY",
      networks: "vechain",
      paymentMethod: "credit_debit_card",
      disablePaymentMethods: "gbp_bank_transfer,inr_bank_transfer,sepa_bank_transfer,apple_pay,google_pay",
      disableWalletAddressForm: true,
      defaultFiatCurrency: "USD",
      defaultFiatAmount: 5,
      defaultNetwork: "vechain",
      defaultCryptoCurrency: "VTHO",
      cryptoCurrencyList: "VTHO",
      backgroundColors: "#ffffff",
      colorMode: "LIGHT",
      themeColor: "#004cfc",
      hideMenu: true,
      environment: isProduction ? Transak.ENVIRONMENTS.PRODUCTION : Transak.ENVIRONMENTS.STAGING,
      exchangeScreenTitle: t("Get more VTHO"),
    }),
    [account, t],
  )

  const initTransak = useCallback(() => {
    const transak = new Transak(transakConfig)
    transak.init()

    // This will trigger when the user closed the widget
    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      // Refresh user balance
      queryClient.cancelQueries({
        queryKey: getAccountBalanceQueryKey(account ?? undefined),
      })

      queryClient.refetchQueries({
        queryKey: getAccountBalanceQueryKey(account ?? undefined),
      })
    })
  }, [transakConfig, account, queryClient])

  const handleOnPress = useCallback(() => {
    initTransak()
  }, [initTransak])

  return (
    <Card bg="#FFD979" borderRadius="xl" w="full" h="full">
      <CardBody
        position="relative"
        overflow="hidden"
        alignContent={"center"}
        justifyContent={"center"}
        borderRadius="xl"
        padding={{ base: 4, md: 6 }}>
        <Image
          src="/images/cloud-background-orange.png"
          alt="cloud-background-orange"
          position="absolute"
          right={["-50%", "-50%", "-10%"]}
          top={["-50%", "-50%", "-150%"]}
        />
        <Show above="md">
          <HStack align="stretch" zIndex={1} position="relative" w="full">
            <Image src="/images/lightning.png" alt="Pending actions" w={24} h={24} />
            <HStack flex={1}>
              <VStack gap={2} align="stretch" flex={1}>
                <Text size="xs" color="#8D6602" fontWeight="600">
                  {t("NOT ENOUGH VTHO")}
                </Text>
                <Heading fontSize="lg" fontWeight="700" color="#5F4400">
                  {t("Get more VTHO to be able to vote and perform transactions!")}
                </Heading>
              </VStack>
              <Button onClick={handleOnPress} rightIcon={<UilArrowRight />} variant="primaryAction">
                <Text fontWeight="500">{t("Get more VTHO")}</Text>
              </Button>
            </HStack>
          </HStack>
        </Show>
        <Show below="md">
          <HStack align="center" zIndex={1} position="relative" w="full" h="full" alignItems={"center"}>
            <VStack gap={2} align="stretch" justify={"space-between"} h="full">
              <Text fontSize={12} color="#8D6602" fontWeight="600">
                {t("NOT ENOUGH VTHO")}
              </Text>
              <Heading fontSize="18" fontWeight="700" color="#5F4400">
                {t("Get more VTHO to be able to vote!")}
              </Heading>
              <Button onClick={handleOnPress} rightIcon={<UilArrowRight />} variant="primaryAction">
                <Text fontWeight="500" fontSize={16}>
                  {t("Get more VTHO")}
                </Text>
              </Button>
            </VStack>
            <Image
              src="/images/lightning.png"
              alt="Pending actions"
              w={isVerySmallMobile ? 16 : 24}
              h={isVerySmallMobile ? 16 : 24}
            />
          </HStack>
        </Show>
      </CardBody>
    </Card>
  )
}
