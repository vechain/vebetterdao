import { Button, ButtonProps, Fade, IconButton, Skeleton, useMediaQuery } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useWalletModal, useWallet, WalletButton, WalletButtonProps } from "@vechain/vechain-kit"
import { AddressIcon } from "../AddressIcon"

const DesktopConnectedUserButton = dynamic(
  () => import("./components/DesktopConnectedUserButton").then(mod => mod.DesktopConnectedUserButton),
  {
    ssr: false,
    loading: () => (
      <Skeleton rounded="full">
        <Button size="md">{"Connect wallet"}</Button>
      </Skeleton>
    ),
  },
)

type Props = {
  responsiveVariant?: "desktop" | "mobile"
  connectionVariant?: WalletButtonProps["connectionVariant"]
  buttonStyleProps?: ButtonProps
}

export const ConnectWalletButton = ({ responsiveVariant, connectionVariant, buttonStyleProps }: Props) => {
  const { account } = useWallet()

  const { open } = useWalletModal()
  const [isDesktop] = useMediaQuery("(min-width: 1060px)")

  const shouldRenderDesktop = responsiveVariant === "desktop" || (!responsiveVariant && isDesktop)
  const notLoggedIn = !account?.address

  // If the user is not logged in, show the connect wallet button
  if (notLoggedIn)
    return (
      <Fade in={true}>
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
      </Fade>
    )

  // If the user is logged in and the on desktop, show the desktop connected user button
  if (shouldRenderDesktop) return <DesktopConnectedUserButton account={account} />

  return (
    <Fade in={true}>
      <IconButton
        onClick={open}
        rounded={"full"}
        border={"1px solid #EEEEEE"}
        bg={"rgba(255, 255, 255, 0.50)"}
        icon={<AddressIcon address={account?.address} rounded={"full"} />}
        aria-label="Connect wallet"
      />
    </Fade>
  )
}
