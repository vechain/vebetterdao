"use client"

import { useColorMode } from "@chakra-ui/react"
import dynamic from "next/dynamic"

// Dynamic import is used here for several reasons:
// 1. The VechainKit component uses browser-specific APIs that aren't available during server-side rendering
// 2. Code splitting - this component will only be loaded when needed, reducing initial bundle size
// 3. The 'ssr: false' option ensures this component is only rendered on the client side
const VeChainKitProvider = dynamic(async () => (await import("@vechain/vechain-kit")).VeChainKitProvider, {
  ssr: false,
})

interface Props {
  readonly children: React.ReactNode
}

export function VechainKitProviderWrapper({ children }: Props) {
  const { colorMode } = useColorMode()

  const isDarkMode = colorMode === "dark"

  const appLogo = "https://i.ibb.co/ncysMF9/vechain-kit-logo-transparent.png"

  return (
    <VeChainKitProvider
      feeDelegation={{
        delegatorUrl: process.env.NEXT_PUBLIC_DELEGATOR_URL!,
        delegateAllTransactions: false,
      }}
      dappKit={{
        allowedWallets: ["veworld", "wallet-connect", "sync2"],
      }}
      loginModalUI={{
        variant: "vechain",
        logo: appLogo,
        description: "Choose between social login through VeChain or by connecting your wallet.",
      }}
      privyEcosystemAppIDS={[]}
      darkMode={isDarkMode}
      language={"en"}
      network={{
        type: "test",
      }}>
      {children}
    </VeChainKitProvider>
  )
}
