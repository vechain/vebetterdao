import { TokenDetails, useB3trTokenDetails } from "@/api"
import { useMintB3tr } from "@/hooks"
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
  FormErrorMessage,
  Input,
  VStack,
} from "@chakra-ui/react"
import { AddressUtils, FormattingUtils } from "@repo/utils"
import { useMemo } from "react"
import { FieldErrors, UseFormRegister, useForm } from "react-hook-form"
import { ConfirmTransactionModalContent } from "./ConfirmTransactionModalContent"

type Props = {
  isOpen: boolean
  onClose: () => void
}

type FormData = {
  address?: string
  amount?: number
}

/**
 * This is the modal that pops up when you click the "Mint B3TR" button
 * In order to mint B3TR, you need to have the minter role. This check is done in the MintB3trButton component
 * @param props {@link Props}
 */
export const MinB3trModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { data: tokenDetails } = useB3trTokenDetails()

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const address = watch("address")
  const amount = watch("amount")

  const formattedAmount = useMemo(() => {
    try {
      if (!amount) {
        return "0"
      }

      return FormattingUtils.humanNumber(amount, amount)
    } catch (e) {
      return "0"
    }
  }, [amount, tokenDetails])

  const { sendTransaction, sendTransactionError, txReceiptError, status, resetStatus } = useMintB3tr({
    address,
    amount,
  })

  const onSubmit = (_data: FormData) => {
    if (address && amount) {
      sendTransaction()
    }
  }

  const onSuccess = () => {
    resetStatus()
    onClose()
  }

  const renderContent = useMemo(() => {
    if (status !== "ready")
      return (
        <ConfirmTransactionModalContent
          description={`Mint ${formattedAmount} B3TR`}
          status={status}
          error={sendTransactionError?.message ?? txReceiptError?.message}
          onSuccess={onSuccess}
          onTryAgain={resetStatus}
        />
      )
    return (
      <form onSubmit={handleSubmit(data => onSubmit(data))}>
        <SwapB3trModalFormContent tokenDetails={tokenDetails} register={register} errors={errors} />
      </form>
    )
  }, [status, tokenDetails, formattedAmount, register, errors, handleSubmit, sendTransactionError, txReceiptError])

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />

      <ModalContent h={320}>{renderContent}</ModalContent>
    </Modal>
  )
}

type RedeemB3trModalFormContentProps = {
  tokenDetails?: TokenDetails
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
}

const SwapB3trModalFormContent: React.FC<RedeemB3trModalFormContentProps> = ({ tokenDetails, register, errors }) => {
  const availableSupply = useMemo(() => {
    if (!tokenDetails) return 0
    return Number(tokenDetails.totalSupply) - Number(tokenDetails.circulatingSupply)
  }, [tokenDetails])

  return (
    <>
      <ModalHeader>Mint B3TR</ModalHeader>

      <ModalCloseButton />
      <ModalBody>
        <VStack spacing={4} align="center" flexBasis={0} flexGrow={1} flexShrink={1}>
          <FormControl isInvalid={!!errors.address}>
            <FormLabel htmlFor="address">Address</FormLabel>
            <Input
              id="address"
              placeholder="Receiver address..."
              {...register("address", {
                required: "Address is required",
                validate: value => AddressUtils.isValid(value) || "Invalid address",
              })}
            />
            <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.amount}>
            <FormLabel htmlFor="amount">Amount</FormLabel>
            <Input
              id="amount"
              placeholder="Amount to mint..."
              {...register("amount", {
                required: "Amount is required",
                validate: value =>
                  isNaN(Number(value)) ? "Invalid number" : Number(value) <= availableSupply || "Not enough supply",
              })}
            />
            <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
          </FormControl>
        </VStack>
      </ModalBody>

      <ModalFooter>
        <Button type="submit">Mint</Button>
      </ModalFooter>
    </>
  )
}
