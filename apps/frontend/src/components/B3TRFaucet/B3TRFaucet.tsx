import { Button, Card, CardBody, HStack, Heading, Skeleton, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { BalanceInfo } from "../BalanceCard"
import { useB3trBalance, useRemainingClaims } from "@/api"
import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/dapp-kit-react"
import { useClaimB3TRFromFaucet } from "@/hooks"
import { TransactionModal } from "../TransactionModal"
import { useCallback } from "react"

export const B3TRFaucet = () => {
  const { account } = useWallet()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const { data: b3trBalance } = useB3trBalance(getConfig().b3trFaucetAddress)
  const { data: remainingClaims } = useRemainingClaims(account ?? "")

  const claimMutation = useClaimB3TRFromFaucet({
    onSuccess: () => {},
  })

  const handleClose = useCallback(() => {
    onClose()
    claimMutation.resetStatus()
  }, [onClose, claimMutation])

  const claimB3TR = () => {
    onOpen()
    claimMutation.sendTransaction({})
  }

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack spacing={4} align="flex-start" w={"full"}>
          <HStack justifyContent={"space-between"} w="full">
            <Heading fontSize="24px">{"Faucet"}</Heading>
          </HStack>

          <VStack spacing={8} w="full" align="flex-start" justify={"stretch"}>
            <Skeleton isLoaded={!!remainingClaims}>
              <Text fontSize={"14px"}>{`You can still claim ${remainingClaims} times today.`}</Text>
            </Skeleton>
            <BalanceInfo isB3TR balanceScaled={b3trBalance?.scaled ?? ""} />
            <Button w={"full"} variant="primaryAction" onClick={claimB3TR} disabled={remainingClaims === "0"}>
              {"Claim B3TR"}
            </Button>
          </VStack>
        </VStack>
      </CardBody>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={claimMutation.error ? "error" : claimMutation.status}
        successTitle={"B3TR claimed successfully"}
        txId={claimMutation.txReceipt?.meta.txID ?? claimMutation.sendTransactionTx?.txid}
        pendingTitle={"Claiming B3TR..."}
        errorTitle={"Error claiming B3TR"}
        errorDescription={claimMutation.error?.reason}
      />
    </Card>
  )
}
