import { useB3trBalance } from "@/api"
import { Button, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { SwapB3trModal } from "./SwapB3trModal"

type Props = {}

export const SwapB3trButton: React.FC<Props> = () => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useB3trBalance(account ?? undefined)

  const isLoading = isBalanceLoading

  const buttonDisabled = isLoading || !balance || balance.scaled === "0"

  const { isOpen, onClose, onOpen } = useDisclosure()

  return (
    <>
      <SwapB3trModal isOpen={isOpen} onClose={onClose} />
      <Button size="sm" isDisabled={buttonDisabled} onClick={onOpen}>
        Swap
      </Button>
    </>
  )
}
