"use client"
import { useToken } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { NETWORK_TYPE } from "@repo/constants"
import dynamic from "next/dynamic"
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
export function VechainKitProviderWrapper({ children }: Props) {
  const { colorMode } = useColorMode()
  const { i18n } = useTranslation()
  const isDarkMode = colorMode === "dark"
  const vebetterLogo = "https://i.ibb.co/7tBkpgvW/Ve-Better-Blue-300ppi.png"
  const vechainLogo = "https://vechain-brand-assets.s3.eu-north-1.amazonaws.com/VeChain_Logomark_Light.png"
  const networkType = getConfig().network.type
  const allowCustomTokens = networkType === ("test" as NETWORK_TYPE)

  const [bgPrimary, primaryDefault, primaryText, primaryHover, secondaryDefault, secondaryHover, borderSecondary] =
    useToken("colors", [
      "bg.primary",
      "actions.primary.default",
      "actions.primary.text",
      "actions.primary.hover",
      "card.subtle",
      "card.hover",
      "border.secondary",
    ])

  return (
    <VeChainKitProvider
      theme={{
        modal: {
          backgroundColor: bgPrimary,
          border: `1px solid ${borderSecondary}`,
        },
        buttons: {
          primaryButton: {
            bg: primaryDefault,
            color: primaryText,
            hoverBg: primaryHover,
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
        { method: "vechain", gridColumn: 4 },
        { method: "dappkit", gridColumn: 4 },
        { method: "ecosystem", gridColumn: 4 },
      ]}
      darkMode={isDarkMode}
      language={i18n.language}
      network={{
        type: networkType,
      }}
      allowCustomTokens={allowCustomTokens}
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
      {children}
    </VeChainKitProvider>
  )
}
