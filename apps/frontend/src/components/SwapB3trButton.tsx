import { useB3trBalance } from "@/api"
import { Button, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { SwapB3trModal } from "./SwapB3trModal"
import { FaRepeat } from "react-icons/fa6"

type Props = { isIconButton?: boolean }

export const SwapB3trButton: React.FC<Props> = ({ isIconButton = false }) => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useB3trBalance(account ?? undefined)

  const isLoading = isBalanceLoading

  const buttonDisabled = isLoading || !balance || balance.scaled === "0"

  const { isOpen, onClose, onOpen } = useDisclosure()

  return (
    <>
      <SwapB3trModal isOpen={isOpen} onClose={onClose} />
      {isIconButton ? (
        <Button isDisabled={buttonDisabled} onClick={onOpen}>
          <FaRepeat />
        </Button>
      ) : (
        <Button size="sm" isDisabled={buttonDisabled} onClick={onOpen} leftIcon={<FaRepeat />}>
          Swap
        </Button>
      )}
    </>
  )
}
