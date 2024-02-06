import { TokenBalance, useGetVotes, useVot3Balance } from "@/api"
import { useUnstakeB3tr } from "@/hooks"
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Modal,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Text,
  FormHelperText,
  HStack,
} from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { Control, Controller, useForm } from "react-hook-form"
import { SliderWithTooltip } from "./SliderWithTooltip"
import { ConfirmTransactionModalContent } from "./ConfirmTransactionModalContent"

type Props = {
  isOpen: boolean
  onClose: () => void
  proposalId: string
}

export const CastVoteModal: React.FC<Props> = ({ isOpen, onClose, proposalId }) => {
  const { account } = useWallet()
  const { data: votes, isLoading: isBalanceLoading } = useGetVotes(account ?? undefined)

  const onSuccess = () => {
    resetStatus()
    onClose()
  }

  const renderContent = useMemo(() => {
    if (status !== "ready")
      return (
        <ConfirmTransactionModalContent
          description={`Redeem ${formattedAmount} B3TR`}
          status={status}
          error={sendTransactionError?.message ?? txReceiptError?.message}
          onSuccess={onSuccess}
          onTryAgain={resetStatus}
        />
      )
    return <CastVoteModalContent balance={balance} formattedAmount={formattedAmount} control={control} />
  }, [status, balance, formattedAmount, control])

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <form onSubmit={handleSubmit(() => sendTransaction(undefined))}>
        <ModalContent h={320}>{renderContent}</ModalContent>
      </form>
    </Modal>
  )
}

type RedeemB3trModalFormContentProps = {
  balance?: TokenBalance
  formattedAmount: string
  control: Control<FormData, any>
}

const CastVoteModalContent: React.FC<RedeemB3trModalFormContentProps> = ({ balance, formattedAmount, control }) => {
  return (
    <>
      <ModalHeader>Cast your vote</ModalHeader>

      <ModalCloseButton />
      <ModalBody>
        <Text mb="4" fontSize={"sm"}>
          Redeem your B3TR for VOT3 tokens at a 1:1 ratio.
        </Text>
        <FormControl>
          <FormLabel>Amount to redeem</FormLabel>
          <Controller
            name="amount"
            control={control}
            rules={{
              maxLength: 100,
            }}
            render={({ field: { onChange, value } }) => (
              <SliderWithTooltip value={Number(value)} onChange={onChange} tooltipLabel={`${formattedAmount} B3TR`} />
            )}
          />
          <HStack justify="space-between">
            <Text fontSize="sm">0 VOT3</Text>
            <Text fontSize="sm">{balance?.formatted} VOT3</Text>
          </HStack>
          <FormHelperText>{`You've selected ${formattedAmount} VOT3 `}</FormHelperText>
        </FormControl>
      </ModalBody>

      <ModalFooter>
        <Button type="submit">Redeem</Button>
      </ModalFooter>
    </>
  )
}
