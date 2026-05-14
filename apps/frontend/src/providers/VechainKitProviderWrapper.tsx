"use client"
import { useChakraContext } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { NETWORK_TYPE } from "@repo/constants"
import { useCurrentLanguage } from "@vechain/vechain-kit"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { useColorMode } from "@/components/ui/color-mode"

// Dynamic import is used here for several reasons:
// 1. The VechainKit component uses browser-specific APIs that aren't available during server-side rendering
// 2. Code splitting - this component will only be loaded when needed, reducing initial bundle size
// 3. The 'ssr: false' option ensures this component is only rendered on the client side
const VeChainKitProvider = dynamic(() => import("@vechain/vechain-kit").then(mod => mod.VeChainKitProvider), {
  ssr: false,
})

interface Props {
  readonly children: React.ReactNode
}

function LanguageSync({ children }: Props) {
  const { i18n: i18nInstance } = useTranslation()
  const { setLanguage: setKitLanguage } = useCurrentLanguage()

  useEffect(() => {
    // Sync app i18n changes to VeChainKit
    const handleLanguageChanged = (lng: string) => {
      setKitLanguage(lng)
    }

    i18nInstance.on("languageChanged", handleLanguageChanged)

    return () => {
      i18nInstance.off("languageChanged", handleLanguageChanged)
    }
  }, [i18nInstance, setKitLanguage])

  return <>{children}</>
}

export function VechainKitProviderWrapper({ children }: Props) {
  const { colorMode } = useColorMode()
  const { i18n: i18nInstance } = useTranslation()
  const isDarkMode = colorMode === "dark"
  const vebetterLogo = "https://i.ibb.co/7tBkpgvW/Ve-Better-Blue-300ppi.png"
  const vechainLogo = "https://vechain-brand-assets.s3.eu-north-1.amazonaws.com/VeChain_Logomark_Light.png"
  const networkType = getConfig().network.type
  const allowCustomTokens = networkType === ("test" as NETWORK_TYPE)

  const sys = useChakraContext()
  const tokVar = (p: string) => sys.token.var(`colors.${p}`) as string

  const bgPrimary = tokVar("bg.primary")
  const primaryDefault = tokVar("actions.primary.default")
  const primaryText = tokVar("actions.primary.text")
  const primaryHover = tokVar("actions.primary.hover")
  const secondaryDefault = tokVar("card.subtle")
  const secondaryHover = tokVar("card.hover")
  const borderSecondary = tokVar("border.secondary")

  // Sync VeChainKit language changes to app i18n
  const handleLanguageChange = (language: string) => {
    if (i18nInstance.language !== language) {
      i18nInstance.changeLanguage(language)
    }
  }

  return (
    <VeChainKitProvider
      theme={{
        modal: {
          backgroundColor: bgPrimary,
          border: `1px solid ${borderSecondary}`,
          useBottomSheetOnMobile: true,
        },
        buttons: {
          primaryButton: {
            bg: primaryDefault,
            color: primaryText,
            hoverBg: primaryHover,
            rounded: "full",
          },
          secondaryButton: {
            border: `1px solid ${borderSecondary}`,
            bg: secondaryDefault,
            hoverBg: secondaryHover,
          },
        },
      }}
      privy={{
        appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
        clientId: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!,
        loginMethods: ["google", "apple", "sms", "twitter", "github", "farcaster", "discord", "tiktok", "line"],
        appearance: {
          loginMessage: "Select a login method",
          logo: vechainLogo,
        },
        embeddedWallets: {
          createOnLogin: "all-users",
        },
      }}
      feeDelegation={{
        delegatorUrl: process.env.NEXT_PUBLIC_DELEGATOR_URL!,
        delegateAllTransactions: false,
      }}
      dappKit={{
        allowedWallets: ["veworld", "wallet-connect"],
        walletConnectOptions: {
          projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
          metadata: {
            name: "VeBetter App",
            description: "This is the official VeBetter app.",
            url: typeof window !== "undefined" ? window.location.origin : "",
            icons: [typeof window !== "undefined" ? vebetterLogo : ""],
          },
        },
      }}
      loginMethods={[
        { method: "veworld", gridColumn: 4 },
        { method: "google", gridColumn: 4 },
        { method: "apple", gridColumn: 4 },
        { method: "more", gridColumn: 4 },
      ]}
      darkMode={isDarkMode}
      language={i18nInstance.language}
      onLanguageChange={handleLanguageChange}
      network={{
        type: networkType,
        nodeUrl: getConfig().nodeUrl,
      }}
      allowCustomTokens={allowCustomTokens}
      contractAddresses={{
        b3trContractAddress: getConfig().b3trContractAddress,
        vot3ContractAddress: getConfig().vot3ContractAddress,
      }}
      legalDocuments={{
        termsAndConditions: [
          {
            url: "https://vebetterdao.org/terms-of-service",
            displayName: "VeBetter Terms of Service",
            version: 1,
            required: true,
          },
        ],
      }}>
      <LanguageSync>{children}</LanguageSync>
    </VeChainKitProvider>
  )
}
