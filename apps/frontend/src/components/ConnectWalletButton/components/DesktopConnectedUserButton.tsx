import { AddressIcon } from "@/components/AddressIcon"
import { Button, Fade, HStack, Text } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWalletModal } from "@vechain/dapp-kit-react"

type Props = {
  account: string
}

export const DesktopConnectedUserButton = ({ account }: Props) => {
  const { domain } = useVechainDomain({ addressOrDomain: account })
  const { open } = useWalletModal()

  return (
    <Fade in={true}>
      <Button onClick={open} rounded={"full"} size="md" variant={"ghost"}>
        <HStack spacing={2}>
          <AddressIcon address={account} boxSize={"28px"} rounded={"full"} />
          <Text fontWeight={"400"} data-testid={"wallet-address"}>
            {domain || humanAddress(account, 4, 6)}
          </Text>
        </HStack>
      </Button>
    </Fade>
  )
}
