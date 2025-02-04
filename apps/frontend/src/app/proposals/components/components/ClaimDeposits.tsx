import { Box, Image, Text, Button, useDisclosure } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ethers } from "ethers"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { UseQueryResult } from "@tanstack/react-query"
import { ProposalDeposit } from "@/api"
import { useWithdrawDeposits } from "@/hooks/useWithdrawDeposits"
import { TransactionModal } from "@/components"

type Props = {
  userClaimableDeposits: bigint
  userProposalClaimableDeposits: UseQueryResult<ProposalDeposit[], Error>
}

const compactFormatter = getCompactFormatter(2)

export const ClaimDeposits = ({ userClaimableDeposits, userProposalClaimableDeposits }: Props) => {
  const { t } = useTranslation()

  const { isOpen, onClose, onOpen } = useDisclosure()

  const filteredProposalClaimableDeposits = useMemo(() => {
    const proposals: ProposalDeposit[] = []
    if (!userProposalClaimableDeposits.data) return proposals
    for (const proposal of userProposalClaimableDeposits.data) {
      if (proposal && proposal.deposit !== "0") {
        proposals.push(proposal)
      }
    }

    return proposals
  }, [userProposalClaimableDeposits])

  const formattedDeposits = useMemo(() => {
    return Number(ethers.formatEther(userClaimableDeposits))
  }, [userClaimableDeposits])

  const { sendTransaction, resetStatus, status, txReceipt, sendTransactionTx, error } = useWithdrawDeposits({
    proposalDeposits: filteredProposalClaimableDeposits,
  })

  const handleClaim = useCallback(() => {
    sendTransaction()
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
          {t("that you used to support")} {filteredProposalClaimableDeposits.length}
          {t(" proposal")}
          {(filteredProposalClaimableDeposits.length ?? 0) > 1 ? "s" : ""}
          {t(".")}
        </Text>
        <Button onClick={handleClaim} w={"full"} variant={"primaryAction"} mt={5}>
          {t("Claim tokens")}
        </Button>
      </Box>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={t("Deposits Withdraw Completed!")}
        status={error ? "error" : status}
        errorDescription={error?.reason}
        errorTitle={error ? t("Error Withdrawing") : undefined}
        pendingTitle={t("Withdrawing...")}
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
      />
    </>
  )
}
