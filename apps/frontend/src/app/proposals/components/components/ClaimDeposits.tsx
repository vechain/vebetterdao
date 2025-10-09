import { Box, Image, Text, Button } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { ethers } from "ethers"
import { useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { ProposalDeposit } from "../../../../api/contracts/governance/utils/buildClaimDepositsTx"

import { useWithdrawDeposits } from "@/hooks/useWithdrawDeposits"

type Props = {
  totalClaimableDeposits: bigint
  claimableDeposits: ProposalDeposit[]
}
const compactFormatter = getCompactFormatter(2)
export const ClaimDeposits = ({ totalClaimableDeposits, claimableDeposits }: Props) => {
  const { t } = useTranslation()
  const formattedDeposits = useMemo(() => {
    return Number(ethers.formatEther(totalClaimableDeposits))
  }, [totalClaimableDeposits])
  const { sendTransaction } = useWithdrawDeposits({
    proposalDeposits: claimableDeposits,
  })
  const handleClaim = useCallback(() => {
    sendTransaction()
  }, [sendTransaction])
  return (
    <Box
      bg={"contrast-on-dark-bg"}
      borderRadius={12}
      p={6}
      alignContent={"flex-start"}
      borderWidth={1}
      borderColor={"#004CFC"}
      boxShadow={"0px 0px 16px 0px rgba(0, 76, 252, 0.35)"}>
      <Image src="/assets/icons/heart-deposits.svg" alt="Proposal icon" boxSize={14} />
      <Text textStyle="2xl" fontWeight="bold" mt={4}>
        {t("Claim back community support tokens")}
      </Text>
      <Text textStyle="md" mt={2} color={"#6A6A6A"}>
        {t("You can claim back ")}
        <b>
          {compactFormatter.format(formattedDeposits)} {t("VOT3")}
        </b>{" "}
        {t("that you used to support")} {claimableDeposits.length}
        {t(" proposal")}
        {(claimableDeposits.length ?? 0) > 1 ? "s" : ""}
        {t(".")}
      </Text>
      <Button onClick={handleClaim} w={"full"} variant={"primary"} mt={5}>
        {t("Claim tokens")}
      </Button>
    </Box>
  )
}
