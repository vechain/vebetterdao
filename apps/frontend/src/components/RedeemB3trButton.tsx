import { useVot3Balance } from "@/api"
import { Button, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { RedeemB3trModal } from "./RedeemB3trModal"

type Props = {}

export const RedeemB3trButton: React.FC<Props> = () => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useVot3Balance(account ?? undefined)

  const isLoading = isBalanceLoading

  const buttonDisabled = isLoading || !balance || balance.scaled === "0"

  const { isOpen, onClose, onOpen } = useDisclosure()

  return (
    <>
      <RedeemB3trModal isOpen={isOpen} onClose={onClose} />
      <Button size="sm" isDisabled={buttonDisabled} onClick={onOpen}>
        Redeem
      </Button>
    </>
  )
}
