import { Button, Card, CardBody, Grid, GridItem, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import BigNumber from "bignumber.js"
import {
  getAccountBalanceQueryKey,
  useAccountBalance,
  useGetB3trBalance,
  useGetVot3Balance,
  useWallet,
} from "@vechain/vechain-kit"
import { FiArrowUpRight } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import { Transak, TransakConfig } from "@transak/transak-sdk"
import { useQueryClient } from "@tanstack/react-query"

const isProduction = process.env.NODE_ENV === "production"
export const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY ?? ""

const minVtho = 5
export const LowOnVthoCard: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { account } = useWallet()
  const { data: balance, isLoading: balanceLoading } = useAccountBalance(account?.address ?? undefined)
  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance } = useGetVot3Balance(account?.address ?? undefined)

  const ownsTokens = useMemo(() => {
    if (!b3trBalance || !vot3Balance) return false

    return b3trBalance.original !== "0" || vot3Balance.original !== "0"
  }, [b3trBalance, vot3Balance])

  const isLowOnVtho = useMemo(() => {
    return Number(balance?.energy ?? "0") < minVtho
  }, [balance])

  const labels = useMemo(() => {
    if (!balance) return
    const balanceNumber = new BigNumber(balance.energy ?? "0")
    if (balanceNumber.isZero())
      return {
        heading: "Not enough VTHO",
        body: "VTHO is used as gas in every transaction you complete in VeBetterDAO, like voting, swapping tokens, etc.",
      }
    return {
      heading: "You're low on VTHO ",
      body: "You're running low on VTHO, used as gas in every transaction you complete in VeBetterDAO, like voting, swapping tokens, etc.",
    }
  }, [balance])

  const transakConfig: TransakConfig = useMemo(
    () => ({
      apiKey,
      walletAddress: account?.address ?? "",
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
        queryKey: getAccountBalanceQueryKey(account?.address ?? undefined),
      })

      queryClient.refetchQueries({
        queryKey: getAccountBalanceQueryKey(account?.address ?? undefined),
      })
    })
  }, [transakConfig, account, queryClient])

  const handleOnPress = () => {
    initTransak()
  }

  if (!account?.address || balanceLoading || !isLowOnVtho || !ownsTokens) return null

  return (
    <Card
      borderColor={"#F29B32"}
      backgroundColor={"#FFF3E5"}
      variant={"baseWithBorder"}
      boxShadow={"0px 0px 5px #F29B32"}>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(4, 1fr)"]} gap={[4, 10]} w="full">
          <GridItem colSpan={1} alignContent={["start", "center"]} justifySelf={["start", "center"]}>
            <Image src="/assets/icons/alert.svg" boxSize={[16, 28]} alt="alert-icon" />
          </GridItem>
          <GridItem colSpan={3}>
            <VStack spacing={4} w="full" justifyContent={"start"} alignItems={"start"}>
              <Heading fontSize={"24px"} fontWeight={"700"}>
                {labels?.heading}
              </Heading>

              <Text fontSize={"16px"} fontWeight={400}>
                {labels?.body} <b>{t("Get more VTHO to get the best experience in the platform.")}</b>
              </Text>

              <Button
                onClick={handleOnPress}
                mt={2}
                colorScheme="blue"
                borderRadius={"full"}
                rightIcon={<FiArrowUpRight />}>
                {t("Get more VTHO")}
              </Button>
            </VStack>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  )
}
