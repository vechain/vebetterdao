import { Button, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { BaseModal } from "@/components/BaseModal"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"
import { useWithdrawStake } from "@/hooks/navigator/useWithdrawStake"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

const formatter = getCompactFormatter(2)

type Props = {
  isOpen: boolean
  onClose: () => void
  navigator: NavigatorEntityFormatted
}

export const WithdrawStakeModal = ({ isOpen, onClose, navigator: nav }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { sendTransaction } = useWithdrawStake({ onSuccess: onClose })

  const stakeAmount = Number(nav.stakeFormatted ?? 0)

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      showCloseButton
      modalProps={{ closeOnInteractOutside: true }}>
      <VStack gap={5} align="stretch" w="full">
        <Heading size="xl" fontWeight="bold">
          {t("Withdraw Stake")}
        </Heading>

        <HStack
          gap={3}
          w="full"
          bg="card.default"
          border="1px solid"
          borderColor="border.secondary"
          borderRadius="2xl"
          p={4}>
          <HStack
            justify="center"
            align="center"
            w="10"
            h="10"
            rounded="full"
            bg="status.warning.subtle"
            color="status.warning.primary"
            flexShrink={0}>
            <Icon as={B3trSvg} boxSize={5} />
          </HStack>
          <VStack gap={0} align="start" flex={1}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("Available to withdraw")}
            </Text>
          </VStack>
          <Text textStyle="lg" fontWeight="bold">
            {formatter.format(stakeAmount)} {"B3TR"}
          </Text>
        </HStack>

        <Text textStyle="xs" color="fg.muted">
          {t("Your full stake will be returned to your wallet.")}
        </Text>

        <VStack gap={2} mt={2} w="full">
          <Button
            variant="primary"
            w="full"
            rounded="full"
            size="lg"
            disabled={stakeAmount <= 0}
            onClick={() => sendTransaction({ amount: stakeAmount.toString() })}>
            {t("Withdraw {{amount}} B3TR", { amount: formatter.format(stakeAmount) })}
          </Button>
          <Button variant="ghost" w="full" rounded="full" size="lg" onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
