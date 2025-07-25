import { AnalyticsUtils } from "@/utils"
import { useMediaQuery, Box } from "@chakra-ui/react"
import { useColorModeValue } from "@/components/ui/color-mode"
import { keyframes } from "@emotion/react"
import { useWallet, WalletButton, WalletButtonProps } from "@vechain/vechain-kit"
import { useEffect } from "react"

const rotateAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

type Props = {
  connectionVariant?: WalletButtonProps["connectionVariant"]
  buttonStyleProps?: WalletButtonProps["buttonStyle"]
}

export const ConnectWalletButton = ({ connectionVariant, buttonStyleProps }: Props) => {
  const { account, connection } = useWallet()
  const [isDesktop] = useMediaQuery(["(min-width: 1060px)"])
  const notLoggedIn = !account?.address

  const hoverBackground = useColorModeValue("#f8f8f8", "#2D2D2F")
  const textColor = useColorModeValue("#1A1A1A", "#E4E4E4")

  useEffect(() => {
    if (typeof window === "undefined" || !window?.localStorage) return
    if (connection.isConnected && account?.address) {
      // Get last logged address from localStorage
      const lastLoggedAddress = localStorage.getItem("last_logged_address")

      // Only log if this is a different address
      if (lastLoggedAddress !== account.address) {
        const connectionType = connection.isConnectedWithDappKit
          ? "DappKit"
          : connection.isConnectedWithVeChain
            ? "VeChain"
            : "Ecosystem"

        AnalyticsUtils.trackEvent("Connection", {
          action: connectionType,
        })

        // Save current address to localStorage
        localStorage.setItem("last_logged_address", account.address)
      }
    }
  }, [connection, connection?.isConnected, account?.address])

  if (notLoggedIn)
    return (
      <WalletButton
        buttonStyle={{
          variant: "primaryAction",
          size: "md",
          borderRadius: "24px",
          bg: buttonStyleProps?.bg ?? "#004CFC",
          textColor: buttonStyleProps?.textColor ?? "white",
          ...buttonStyleProps,
        }}
        connectionVariant={connectionVariant ?? "popover"}
        data-testid="connect-wallet"
      />
    )

  return (
    <Box
      background={`linear-gradient(${hoverBackground}, ${hoverBackground}) padding-box, linear-gradient(90deg, #004CFC, #B1F16C, #004CFC) border-box`}
      border="2px solid transparent"
      backgroundSize="300% 100%"
      animation={`${rotateAnimation} 3s ease infinite`}
      borderRadius={isDesktop ? "full" : "12px"}
      padding="2px"
      _hover={{
        background: `linear-gradient(${hoverBackground}, ${hoverBackground}) padding-box, linear-gradient(90deg, #004CFC, #B1F16C, #004CFC) border-box`,
        backgroundSize: "300% 100%",
      }}
      transition="all 0.3s ease">
      <WalletButton
        mobileVariant="icon"
        desktopVariant="iconAndDomain"
        buttonStyle={{
          border: "none",
          backgroundColor: "transparent",
          color: textColor,
          width: "100%",
          height: "100%",
          ...(isDesktop ? { borderRadius: "full" } : { borderRadius: "10px" }),
        }}
      />
    </Box>
  )
}
