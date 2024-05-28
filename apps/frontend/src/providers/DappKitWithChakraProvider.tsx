import { useToken } from "@chakra-ui/react"
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
  projectId: "06c045cd12ae0906fe5ad7d737fcdc04",
  metadata: {
    name: "VeBetterDAO Governance",
    description: "Participate in the VeBetterDAO Governance",
    url: "https://governance.vebetterdao.org",
    icons: ["https://governance.vebetterdao.org/images/favicon.png"],
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

  const [primary500] = useToken("colors", ["primary.500"])
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
