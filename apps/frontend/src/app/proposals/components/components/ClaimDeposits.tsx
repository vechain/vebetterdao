import { Box, Image, Text, Button, useDisclosure } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ethers } from "ethers"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { ProposalDeposit } from "@/api"
import { useWithdrawDeposits } from "@/hooks/useWithdrawDeposits"
import { TransactionModal, TransactionModalStatus } from "@/components"

type Props = {
  totalClaimableDeposits: bigint
  claimableDeposits: ProposalDeposit[]
}

const compactFormatter = getCompactFormatter(2)

export const ClaimDeposits = ({ totalClaimableDeposits, claimableDeposits }: Props) => {
  const { t } = useTranslation()

  const { isOpen, onClose, onOpen } = useDisclosure()

  const formattedDeposits = useMemo(() => {
    return Number(ethers.formatEther(totalClaimableDeposits))
  }, [totalClaimableDeposits])

  const { sendTransaction, resetStatus, status, txReceipt, error } = useWithdrawDeposits({
    proposalDeposits: claimableDeposits,
  })

  const handleClaim = useCallback(() => {
    sendTransaction(undefined)
    onOpen()
  }, [sendTransaction, onOpen])

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [resetStatus, onClose])

  return (
    <>
      <Box
        bg={"white"}
        borderRadius={12}
        p={6}
        alignContent={"flex-start"}
        borderWidth={1}
        borderColor={"#004CFC"}
        boxShadow={"0px 0px 16px 0px rgba(0, 76, 252, 0.35)"}>
        <Image src="/images/heart-deposits.svg" alt="Proposal icon" boxSize={14} />
        <Text fontSize={24} fontWeight={700} mt={4}>
          {t("Claim back community support tokens")}
        </Text>
        <Text fontSize={16} fontWeight={400} mt={2} color={"#6A6A6A"}>
          {t("You can claim back ")}
          <b>
            {compactFormatter.format(formattedDeposits)} {t("VOT3")}
          </b>{" "}
          {t("that you used to support")} {claimableDeposits.length}
          {t(" proposal")}
          {(claimableDeposits.length ?? 0) > 1 ? "s" : ""}
          {t(".")}
        </Text>
        <Button onClick={handleClaim} w={"full"} variant={"primaryAction"} mt={5}>
          {t("Claim tokens")}
        </Button>
      </Box>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={error ? TransactionModalStatus.Error : (status as TransactionModalStatus)}
        errorDescription={error?.reason}
        titles={{
          [TransactionModalStatus.Success]: t("Deposits Withdraw Completed!"),
          [TransactionModalStatus.Error]: t("Error Withdrawing"),
          [TransactionModalStatus.Pending]: t("Withdrawing..."),
        }}
        showExplorerButton
        txId={txReceipt?.meta.txID}
      />
    </>
  )
}
