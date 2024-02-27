import { Button, Fade, HStack, IconButton, Text, useMediaQuery } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/dapp-kit-react"
import { FaWallet } from "react-icons/fa6"
import { AddressIcon } from "./AddressIcon"
import { humanAddress } from "@repo/utils/FormattingUtils"

export const ConnectWalletButton = () => {
  const { account } = useWallet()
  const { open } = useWalletModal()
  const [isDesktop] = useMediaQuery("(min-width: 800px)")

  if (!account)
    if (isDesktop)
      return (
        <Fade in={true}>
          <Button onClick={open} colorScheme="primary" size="md" leftIcon={<FaWallet />}>
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

  if (isDesktop)
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
