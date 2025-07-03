import { useTranslation } from "react-i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useCallback, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Transak, TransakConfig } from "@transak/transak-sdk"
import { useWallet, getAccountBalanceQueryKey } from "@vechain/vechain-kit"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"

const isProduction = process.env.NODE_ENV === "production"
export const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY ?? ""

export const LowVthoBanner = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const queryClient = useQueryClient()
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

  const handleOnPress = useCallback(() => {
    initTransak()
  }, [initTransak])

  return (
    <GenericBanner
      title={t("NOT ENOUGH VTHO")}
      titleColor="#8D6602"
      description={t("Get more VTHO to be able to vote and perform transactions!")}
      descriptionColor="#5F4400"
      logoSrc="/assets/icons/lightning.webp"
      backgroundColor="#FFD979"
      backgroundImageSrc="/assets/backgrounds/cloud-background-orange.webp"
      buttonLabel={t("Get more VTHO")}
      onButtonClick={handleOnPress}
      buttonVariant="primaryAction"
      buttonIcon={<UilArrowRight />}
    />
  )
}
