import { darkTheme, lightTheme } from "@/app/theme"
import { useSelectedTheme } from "@/store"
import { useColorMode } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { WalletConnectOptions } from "@vechain/dapp-kit-react"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const appConfig = getConfig()

const DAppKitProvider = dynamic(
  async () => {
    const { DAppKitProvider } = await import("@vechain/dapp-kit-react")
    return DAppKitProvider
  },
  {
    ssr: false,
  },
)

const walletConnectOptions: WalletConnectOptions = {
  projectId: "a0b855ceaf109dbc8426479a4c3d38d8",
  metadata: {
    name: "b3tr",
    description: "b3tr",
    url: typeof window !== "undefined" ? window.location.origin : "",
    icons: [typeof window !== "undefined" ? `${window.location.origin}/images/logo/my-dapp.png` : ""],
  },
}

export const DappKitWithChakraProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"

  const { setSelectedTheme } = useSelectedTheme()

  useEffect(() => {
    setSelectedTheme(isDark ? darkTheme : lightTheme)
  }, [isDark])

  return (
    <DAppKitProvider
      usePersistence
      themeMode={isDark ? "DARK" : "LIGHT"}
      requireCertificate={false}
      genesis={appConfig.network.genesis}
      nodeUrl={appConfig.nodeUrl}
      logLevel={"DEBUG"}
      walletConnectOptions={walletConnectOptions}>
      {children}
    </DAppKitProvider>
  )
}
