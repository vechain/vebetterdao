import { useB3trBalance, useVot3Balance } from "@/api"
import { Button, useColorModeValue, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { FaRepeat } from "react-icons/fa6"
import { SwapModal } from "./SwapModal"

type Props = { isIconButton?: boolean }

export const SwapButton: React.FC<Props> = ({ isIconButton = false }) => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useB3trBalance(account ?? undefined)
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useVot3Balance(account ?? undefined)

  const buttonColor = useColorModeValue("400", "300")

  const hasNoBalance = (!balance || balance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isBalanceLoading || isVot3BalanceLoading

  const buttonDisabled = isLoading || hasNoBalance

  const { isOpen, onClose, onOpen } = useDisclosure()

  return (
    <>
      <SwapModal isOpen={isOpen} onClose={onClose} />
      {isIconButton ? (
        <Button isDisabled={buttonDisabled} onClick={onOpen}>
          <FaRepeat />
        </Button>
      ) : (
        <Button
          size="sm"
          isDisabled={buttonDisabled}
          onClick={onOpen}
          leftIcon={<FaRepeat />}
          color="white"
          bgColor={`primary.${buttonColor}`}
          borderRadius={16}>
          Swap
        </Button>
      )}
    </>
  )
}
