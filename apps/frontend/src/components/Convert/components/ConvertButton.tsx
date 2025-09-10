import { Button, useDisclosure, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { FaRepeat } from "react-icons/fa6"
import { ConvertModal } from "./Modal"
import { useTranslation } from "react-i18next"
import { useGetB3trBalance, useGetVot3Balance } from "@/hooks"

type Props = { isIconButton?: boolean }

export const ConvertButton: React.FC<Props> = ({ isIconButton = false }) => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useGetB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useGetVot3Balance(account?.address ?? undefined)

  const hasNoBalance = (!balance || balance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isBalanceLoading || isVot3BalanceLoading

  const buttonDisabled = isLoading || hasNoBalance

  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const { t } = useTranslation()

  return (
    <>
      <ConvertModal isOpen={isOpen} onClose={onClose} />
      {isIconButton ? (
        <Button disabled={buttonDisabled} onClick={onOpen}>
          <FaRepeat />
        </Button>
      ) : (
        <Button
          disabled={buttonDisabled}
          onClick={onOpen}
          borderRadius={"full"}
          visual={"primary"}
          w="full"
          data-testid="convert-tokens-button">
          <Text textStyle="md" fontStyle={"normal"} fontWeight="semibold">
            {t("Convert tokens")}
          </Text>
        </Button>
      )}
    </>
  )
}
