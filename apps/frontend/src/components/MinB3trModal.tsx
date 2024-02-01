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
  FormHelperText,
  Text,
  HStack,
} from "@chakra-ui/react"
import { AddressUtils, FormattingUtils } from "@repo/utils"
import { useMemo } from "react"
import { FieldErrors, UseFormRegister, UseFormSetValue, useForm } from "react-hook-form"
import { ConfirmTransactionModalContent } from "./ConfirmTransactionModalContent"
import { useWallet } from "@vechain/dapp-kit-react"

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
    setValue,
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
      sendTransaction(undefined)
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
        <SwapB3trModalFormContent tokenDetails={tokenDetails} register={register} errors={errors} setValue={setValue} />
      </form>
    )
  }, [status, tokenDetails, formattedAmount, register, errors, handleSubmit, sendTransactionError, txReceiptError])

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
      <ModalOverlay />

      <ModalContent h={360}>{renderContent}</ModalContent>
    </Modal>
  )
}

type RedeemB3trModalFormContentProps = {
  tokenDetails?: TokenDetails
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  setValue: UseFormSetValue<FormData>
}

const SwapB3trModalFormContent: React.FC<RedeemB3trModalFormContentProps> = ({
  tokenDetails,
  register,
  errors,
  setValue,
}) => {
  const { account } = useWallet()
  const availableSupply = useMemo(() => {
    if (!tokenDetails) return { amount: 0, formattedAmount: "0" }
    const amount = Number(tokenDetails.totalSupply) - Number(tokenDetails.circulatingSupply)
    return {
      amount,
      formattedAmount: FormattingUtils.humanNumber(amount, amount),
    }
  }, [tokenDetails])

  const selectCurrentAddress = () => {
    if (account) {
      setValue("address", account)
    }
  }

  const selectPercentageOfSupply = (percentage: number) => {
    setValue("amount", availableSupply.amount * (percentage / 100))
  }

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
            {errors.address?.message ? (
              <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
            ) : (
              <FormHelperText>
                <Button variant={"link"} size="sm" onClick={selectCurrentAddress}>
                  Click here to use the current address
                </Button>
              </FormHelperText>
            )}
          </FormControl>
          <FormControl isInvalid={!!errors.amount}>
            <FormLabel htmlFor="amount">Amount</FormLabel>
            <Input
              id="amount"
              placeholder="Amount to mint..."
              {...register("amount", {
                required: "Amount is required",
                validate: value =>
                  isNaN(Number(value))
                    ? "Invalid number"
                    : Number(value) <= availableSupply.amount || "Not enough supply",
              })}
            />
            {errors.amount?.message ? (
              <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
            ) : (
              <FormHelperText>
                <HStack justify={"space-between"} align={"center"}>
                  <Text>
                    Available: {availableSupply.formattedAmount} {tokenDetails?.symbol}
                  </Text>
                  <Button variant={"link"} size="sm" onClick={() => selectPercentageOfSupply(1)}>
                    Click here to use 1%
                  </Button>
                </HStack>
              </FormHelperText>
            )}
          </FormControl>
        </VStack>
      </ModalBody>

      <ModalFooter>
        <Button type="submit">Mint</Button>
      </ModalFooter>
    </>
  )
}
