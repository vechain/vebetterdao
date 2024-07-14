import { AddressIcon } from "@/components/AddressIcon"
import { Button, Fade, HStack, Text } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useWalletName } from "@vechain.energy/dapp-kit-hooks"
import { useWalletModal } from "@vechain/dapp-kit-react"

type Props = {
  account: string
}

export const DesktopConnectedUserButton = ({ account }: Props) => {
  const { name } = useWalletName(account)
  const { open } = useWalletModal()

  return (
    <Fade in={true}>
      <Button onClick={open} rounded={"full"} size="md" variant={"ghost"}>
        <HStack spacing={2}>
          <AddressIcon address={account} boxSize={"28px"} rounded={"full"} />
          <Text fontWeight={"400"}>{name || humanAddress(account, 4, 6)}</Text>
        </HStack>
      </Button>
    </Fade>
  )
}
