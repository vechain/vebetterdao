import { Button, useDisclosure, Text } from "@chakra-ui/react"
import { useGetB3trBalance, useGetVot3Balance, useWallet } from "@vechain/vechain-kit"
import { FaRepeat } from "react-icons/fa6"
import { ConvertModal } from "./Modal"
import { useTranslation } from "react-i18next"

type Props = { isIconButton?: boolean }

export const ConvertButton: React.FC<Props> = ({ isIconButton = false }) => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useGetB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useGetVot3Balance(account?.address ?? undefined)

  const hasNoBalance = (!balance || balance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isBalanceLoading || isVot3BalanceLoading

  const buttonDisabled = isLoading || hasNoBalance

  const { isOpen, onClose, onOpen } = useDisclosure()
  const { t } = useTranslation()

  return (
    <>
      <ConvertModal isOpen={isOpen} onClose={onClose} />
      {isIconButton ? (
        <Button isDisabled={buttonDisabled} onClick={onOpen}>
          <FaRepeat />
        </Button>
      ) : (
        <Button
          isDisabled={buttonDisabled}
          onClick={onOpen}
          borderRadius={"full"}
          variant={"primaryAction"}
          w="full"
          data-testid="convert-tokens-button">
          <Text fontSize={16} fontStyle={"normal"} fontWeight={500}>
            {t("Convert tokens")}
          </Text>
        </Button>
      )}
    </>
  )
}
