import { AddressIcon } from "@/components/AddressIcon"
import { Button, Fade, HStack, Text } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWalletModal, Wallet } from "@vechain/vechain-kit"

type Props = {
  account: Wallet
}

export const DesktopConnectedUserButton = ({ account }: Props) => {
  const { data } = useVechainDomain(account?.address)
  const { open } = useWalletModal()

  return (
    <Fade in={true}>
      <Button onClick={open} rounded={"full"} size="md" variant={"ghost"}>
        <HStack spacing={2}>
          <AddressIcon address={account?.address ?? ""} boxSize={"28px"} rounded={"full"} />
          <Text fontWeight={"400"} data-testid={"wallet-address"}>
            {data?.domain ?? humanAddress(account?.address ?? "", 4, 6)}
          </Text>
        </HStack>
      </Button>
    </Fade>
  )
}
