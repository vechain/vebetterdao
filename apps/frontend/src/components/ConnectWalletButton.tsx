import { Button, Fade, HStack, IconButton, Text, useMediaQuery } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/dapp-kit-react"
import { FaWallet } from "react-icons/fa6"
import { AddressIcon } from "./AddressIcon"
import { humanAddress } from "@repo/utils/FormattingUtils"

type Props = {
  responsiveVariant?: "desktop" | "mobile"
}
export const ConnectWalletButton = ({ responsiveVariant }: Props) => {
  const { account } = useWallet()
  const { open } = useWalletModal()
  const [isDesktop] = useMediaQuery("(min-width: 800px)")

  const shouldRenderDesktop = responsiveVariant === "desktop" || (!responsiveVariant && isDesktop)

  if (!account)
    if (shouldRenderDesktop)
      return (
        <Fade in={true}>
          <Button onClick={open} colorScheme="primary" size="md" leftIcon={<FaWallet />} data-testid="connect-wallet">
            Connect Wallet
          </Button>
        </Fade>
      )
    else
      return (
        <Fade in={true}>
          <IconButton onClick={open} icon={<FaWallet />} aria-label="Connect wallet" colorScheme="primary" />
        </Fade>
      )

  if (shouldRenderDesktop)
    return (
      <Fade in={true}>
        <Button onClick={open} rounded={"full"} color="black" size="md" bg="rgba(235, 236, 252, 1)">
          <HStack spacing={2}>
            <AddressIcon address={account} boxSize={4} rounded={"full"} />
            <Text fontWeight={"400"}>{humanAddress(account, 4, 6)}</Text>
          </HStack>
        </Button>
      </Fade>
    )
  return (
    <Fade in={true}>
      <IconButton
        onClick={open}
        bg="rgba(235, 236, 252, 1)"
        rounded={"md"}
        icon={<AddressIcon address={account} boxSize={6} rounded={"full"} />}
        aria-label="Connect wallet"
      />
    </Fade>
  )
}
