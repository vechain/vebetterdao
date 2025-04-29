import { getConfig } from "@repo/config"
import { type WalletConnectOptions } from "@vechain/dapp-kit-react"
import dynamic from "next/dynamic"

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
  projectId: "edd5fa0afa1a22e42362891aeef466bf",
  metadata: {
    name: "VeBetterDAO Governance Developer Testnet",
    description: "An environment for developers to test the VeBetterDAO Governance",
    url: "https://dev.testnet.governance.vebetterdao.org",
    icons: ["https://dev.testnet.governance.vebetterdao.org/images/favicon.png"],
  },
}

export const DappKitWithChakraProvider = ({ children }: { children: React.ReactNode }) => {
  //TODO: Reenable this to enable dark mode
  //   const { colorMode } = useColorMode()
  //   const isDark = colorMode === "dark"

  //   const { setSelectedTheme } = useSelectedTheme()

  //   useEffect(() => {
  //     setSelectedTheme(isDark ? darkTheme : lightTheme)
  //   }, [isDark])

  //   TODO: dark mode support
  return (
    <DAppKitProvider
      usePersistence
      //   themeMode={isDark ? "DARK" : "LIGHT"}
      themeMode="LIGHT"
      requireCertificate={false}
      genesis={appConfig.network.genesis}
      nodeUrl={appConfig.nodeUrl}
      logLevel={"WARN"}
      walletConnectOptions={walletConnectOptions}>
      {children}
    </DAppKitProvider>
  )
}
