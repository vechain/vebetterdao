import { useVot3Balance, useVot3TokenDetails } from "@/api"
import { Button, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { RedeemB3trModal } from "./RedeemB3trModal"

type Props = {}

export const RedeemB3trButton: React.FC<Props> = () => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useVot3Balance(account ?? undefined)
  const { data: tokenDetails, isLoading: isTokensDetailsLoading } = useVot3TokenDetails()

  const isLoading = isBalanceLoading || isTokensDetailsLoading

  const buttonDisabled = isLoading || !balance || balance === "0"

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
