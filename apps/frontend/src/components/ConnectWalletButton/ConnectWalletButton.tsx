import { useMediaQuery, Box } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"
import { useWallet, WalletButton, WalletButtonProps } from "@vechain/vechain-kit"
import { useEffect } from "react"

import { useColorModeValue } from "@/components/ui/color-mode"

import AnalyticsUtils from "../../utils/AnalyticsUtils/AnalyticsUtils"

const rotateAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`
type Props = {
  connectionVariant?: WalletButtonProps["connectionVariant"]
  buttonStyleProps?: WalletButtonProps["buttonStyle"]
  desktopVariant?: WalletButtonProps["desktopVariant"]
  mobileVariant?: WalletButtonProps["mobileVariant"]
}
export const ConnectWalletButton = ({ connectionVariant, buttonStyleProps, desktopVariant, mobileVariant }: Props) => {
  const { account, connection } = useWallet()
  const [isDesktop] = useMediaQuery(["(min-width: 1060px)"])
  const notLoggedIn = !account?.address
  const hoverBackground = useColorModeValue("#f8f8f8", "#2D2D2F")
  const hoverFillBackground = useColorModeValue("#F1F1F1", "#4A4A4E")
  const textColor = useColorModeValue("#1A1A1A", "#E4E4E4")
  const {
    bg: _bg,
    textColor: _buttonTextColor,
    _hover: _hoverStyles,
    _disabled: _disabledStyles,
    _focus: _focusStyles,
    rounded,
    borderRadius,
    ...layoutButtonStyleProps
  } = buttonStyleProps ?? {}

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
        desktopVariant={desktopVariant}
        mobileVariant={mobileVariant}
        data-testid="connect-wallet"
      />
    )

  return (
    <Box
      data-testid="wallet-connected"
      w="full"
      maxW="full"
      minW={0}
      background={`linear-gradient(${hoverBackground}, ${hoverBackground}) padding-box, linear-gradient(90deg, #004CFC, #B1F16C, #004CFC) border-box`}
      border="2px solid transparent"
      backgroundSize="300% 100%"
      animation={`${rotateAnimation} 3s ease infinite`}
      borderRadius={borderRadius ?? rounded ?? (isDesktop ? "full" : "12px")}
      padding="2px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      _hover={{
        background: `linear-gradient(${hoverFillBackground}, ${hoverFillBackground}) padding-box, linear-gradient(90deg, #004CFC, #B1F16C, #004CFC) border-box`,
        backgroundSize: "300% 100%",
      }}
      transition="all 0.3s ease">
      <WalletButton
        mobileVariant={mobileVariant ?? "icon"}
        desktopVariant={desktopVariant ?? "iconAndDomain"}
        buttonStyle={{
          border: "none",
          backgroundColor: "transparent",
          color: textColor,
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          height: "100%",
          borderRadius: borderRadius ?? rounded ?? (isDesktop ? "full" : "10px"),
          ...layoutButtonStyleProps,
          _hover: { bg: "transparent" },
          _active: { bg: "transparent" },
        }}
      />
    </Box>
  )
}
