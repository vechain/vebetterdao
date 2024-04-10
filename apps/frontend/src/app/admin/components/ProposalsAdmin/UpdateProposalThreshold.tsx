import { useProposalThreshold } from "@/api"
import { TransactionModal } from "@/components/TransactionModal"
import { useSetProposalThreshold } from "@/hooks"
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  useDisclosure,
} from "@chakra-ui/react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { FaCheck } from "react-icons/fa6"

type FormData = {
  threshold: number
}

export const UpdateProposalThreshold = () => {
  const { data: currentThreshold } = useProposalThreshold()

  const { setValue, register, handleSubmit, formState, watch } = useForm<FormData>()

  const amount = watch("threshold")

  const { isOpen, onClose, onOpen } = useDisclosure()
  const setProposalThresholdMutation = useSetProposalThreshold({
    amount,
  })

  useEffect(() => {
    if (currentThreshold) {
      if (!amount) setValue("threshold", currentThreshold)
    }
  }, [currentThreshold, amount, setValue])

  const { errors } = formState
  const onSubmit = (_data?: FormData) => {
    onOpen()
    setProposalThresholdMutation.sendTransaction(undefined)
  }

  return (
    <>
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        confirmationTitle="Update overnance threshold"
        successTitle="Governanace threshold updated!"
        status={setProposalThresholdMutation.error ? "error" : setProposalThresholdMutation.status}
        errorDescription={setProposalThresholdMutation.error?.reason}
        errorTitle={setProposalThresholdMutation.error ? "Error updating governance threshold" : undefined}
        showTryAgainButton={true}
        onTryAgain={onSubmit}
        pendingTitle="Updating governance threshold..."
        txId={setProposalThresholdMutation.txReceipt?.meta.txID}
        showExplorerButton={true}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isInvalid={!!errors.threshold}>
          <FormLabel>Proposal Threshold</FormLabel>
          <InputGroup>
            <Input
              {...register("threshold", {
                required: "This field is required",
                min: {
                  value: 1,
                  message: "Threshold must be greater than 0",
                },
              })}
              type="number"
              placeholder="Threshold"
            />
            <InputRightElement>
              <IconButton
                size="sm"
                colorScheme="primary"
                type="submit"
                aria-label="Update threshold"
                icon={<FaCheck />}
                isLoading={setProposalThresholdMutation.status === "pending"}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.threshold && errors.threshold.message}</FormErrorMessage>
        </FormControl>
      </form>
    </>
  )
}
