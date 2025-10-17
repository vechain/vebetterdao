import { useQueryClient } from "@tanstack/react-query"
import { Transak, TransakConfig } from "@transak/transak-sdk"
import { useWallet, getAccountBalanceQueryKey } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

const isProduction = process.env.NODE_ENV === "production"
const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY ?? ""
export type TransakCrypto = "VTHO" | "VOT3" | "VET"
export interface UseTransakOptions {
  defaultCryptoCurrency: TransakCrypto
  defaultFiatAmount?: number
  exchangeScreenTitle?: string
  cryptoCurrencyList?: string
  onClose?: () => void
}
export const useTransak = (options: UseTransakOptions) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()
  const { defaultCryptoCurrency, defaultFiatAmount = 5, exchangeScreenTitle, cryptoCurrencyList, onClose } = options
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
      defaultFiatAmount,
      defaultNetwork: "vechain",
      defaultCryptoCurrency,
      cryptoCurrencyList: cryptoCurrencyList || defaultCryptoCurrency,
      backgroundColors: "#ffffff",
      colorMode: "LIGHT",
      themeColor: "#004cfc",
      hideMenu: true,
      environment: isProduction ? Transak.ENVIRONMENTS.PRODUCTION : Transak.ENVIRONMENTS.STAGING,
      exchangeScreenTitle: exchangeScreenTitle || `Get more ${defaultCryptoCurrency}`,
    }),
    [account, defaultCryptoCurrency, defaultFiatAmount, exchangeScreenTitle, cryptoCurrencyList],
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

      // Call custom onClose callback if provided
      onClose?.()
    })
  }, [transakConfig, account, queryClient, onClose])

  return {
    initTransak,
    isReady: !!account?.address && !!apiKey,
  }
}

// Helper functions for common use cases
export const useBuyVtho = (options?: Omit<UseTransakOptions, "defaultCryptoCurrency">) => {
  return useTransak({
    defaultCryptoCurrency: "VTHO",
    exchangeScreenTitle: "Get more VTHO",
    ...options,
  })
}

export const useBuyVet = (options?: Omit<UseTransakOptions, "defaultCryptoCurrency">) => {
  return useTransak({
    defaultCryptoCurrency: "VET",
    exchangeScreenTitle: "Get more VET",
    ...options,
  })
}
