import { Button, Fade, IconButton, Img, Skeleton, useMediaQuery } from "@chakra-ui/react"
import { FaWallet } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import dynamic from "next/dynamic"
import { useWalletModal, useWallet } from "@vechain/vechain-kit"

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
}

export const ConnectWalletButton = ({ responsiveVariant }: Props) => {
  const { account } = useWallet()

  const { open } = useWalletModal()
  const [isDesktop] = useMediaQuery("(min-width: 1060px)")
  const { t } = useTranslation()

  const shouldRenderDesktop = responsiveVariant === "desktop" || (!responsiveVariant && isDesktop)

  if (!account?.address)
    if (shouldRenderDesktop)
      return (
        <Fade in={true}>
          <Button
            onClick={open}
            variant={"primaryAction"}
            size="md"
            leftIcon={<FaWallet />}
            data-testid="connect-wallet">
            {t("Connect Wallet")}
          </Button>
        </Fade>
      )
    else
      return (
        <Fade in={true}>
          <IconButton
            onClick={open}
            icon={<FaWallet />}
            aria-label="Connect wallet"
            variant={"primaryAction"}
            borderRadius={"md"}
          />
        </Fade>
      )

  if (shouldRenderDesktop) return <DesktopConnectedUserButton account={account?.address} />

  return (
    <Fade in={true}>
      <IconButton
        onClick={open}
        rounded={"md"}
        border={"1px solid #EEEEEE"}
        bg={"rgba(255, 255, 255, 0.50)"}
        icon={
          <Img
            data-cy={`address-icon-${account?.address}`}
            objectFit={"cover"}
            src={account?.image}
            h={"100%"}
            boxSize={6}
            rounded={"full"}
          />
        }
        aria-label="Connect wallet"
      />
    </Fade>
  )
}
