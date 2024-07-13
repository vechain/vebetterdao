import { useAccountBalance, useB3trBalance, useVot3Balance } from "@/api"
import { Button, Card, CardBody, Grid, GridItem, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import BigNumber from "bignumber.js"
import { useWallet } from "@vechain/dapp-kit-react"
import { FiArrowUpRight } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import { Transak, TransakConfig } from "@transak/transak-sdk"

const minVtho = 5
export const LowOnVthoCard: React.FC = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: balance, isLoading: balanceLoading } = useAccountBalance(account ?? undefined)
  const { data: b3trBalance } = useB3trBalance(account ?? undefined)
  const { data: vot3Balance } = useVot3Balance(account ?? undefined)

  const ownsTokens = useMemo(() => {
    if (!b3trBalance || !vot3Balance) return false

    return b3trBalance.original !== "0" || vot3Balance.original !== "0"
  }, [b3trBalance, vot3Balance])

  const isLowOnVtho = useMemo(() => {
    return Number(balance?.energy.scaled) < minVtho
  }, [balance])

  const labels = useMemo(() => {
    if (!balance) return
    const balanceNumber = new BigNumber(balance.energy.scaled)
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

  // Transak
  const transakConfig: TransakConfig = useMemo(
    () => ({
      apiKey: "c864513e-2de0-4382-8597-16b419d75f6e",
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
      backgroundColors: "#ffffff",
      colorMode: "LIGHT",
      themeColor: "28008c",
      hideMenu: true,
      environment: Transak.ENVIRONMENTS.STAGING,
    }),
    [account],
  )

  const initTransak = useCallback(() => {
    const transak = new Transak(transakConfig)
    transak.init()

    // This will trigger when the user closed the widget
    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      transak.close()
      // onClose()
      // navigate(ROUTES.BUY_TOKEN_EXIT)
    })

    /*
     * This will trigger when the user marks payment is made
     * You can close/navigate away at this event
     */
    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, () => {
      transak.close()
      // navigate(ROUTES.BUY_TOKEN_SUCCESS)
    })

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_FAILED, () => {
      // navigate(ROUTES.BUY_TOKEN_ERROR)
      transak.close()
    })

    Transak.on(Transak.EVENTS.TRANSAK_ORDER_CANCELLED, () => {
      transak.close()
      // navigate(ROUTES.BUY_TOKEN_EXIT)
    })
  }, [transakConfig])

  const handleOnPress = () => {
    initTransak()
  }

  if (!account || balanceLoading || !isLowOnVtho || !ownsTokens) return null

  return (
    <Card
      borderColor={"#F29B32"}
      backgroundColor={"#FFF3E5"}
      variant={"baseWithBorder"}
      boxShadow={"0px 0px 5px #F29B32"}>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(4, 1fr)"]} gap={[4, 10]} w="full">
          <GridItem colSpan={1} alignContent={["start", "center"]} justifySelf={["start", "center"]}>
            <Image src="/images/alert.svg" boxSize={[16, 28]} alt="alert-icon" />
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
