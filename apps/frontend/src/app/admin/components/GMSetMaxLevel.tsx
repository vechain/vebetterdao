import { useGMMaxLevel } from "@/api/contracts/galaxyMember/hooks/useGMMaxLevel"
import { TransactionModal } from "@/components"
import { useSetGMMaxLevel } from "@/hooks/useSetGMMaxLevel"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  InputGroup,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  useDisclosure,
  VStack,
} from "@chakra-ui/react" // Import the Button component
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

export const GMSetMaxLevel = () => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { t } = useTranslation()
  type GMSetMaxLevelInput = {
    newMaxLevel: number
  }
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GMSetMaxLevelInput>({
    defaultValues: { newMaxLevel: 1 },
  })

  const newMaxLevel = watch("newMaxLevel")
  const { error, status, txReceipt, resetStatus, sendTransaction, isTxReceiptLoading } = useSetGMMaxLevel({
    maxLevel: newMaxLevel,
    onSuccess: () => {
      resetStatus()
      onClose()
    },
  })

  const onSubmit = useCallback(() => {
    console.log(newMaxLevel, currentMaxLevel)
    resetStatus()
    onOpen()
    sendTransaction(undefined)
  }, [resetStatus, sendTransaction, onOpen])
  const { data: currentMaxLevel } = useGMMaxLevel()
  const isFormValid = useMemo(
    //TODO: Check if contract max level is 10
    () => newMaxLevel !== Number(currentMaxLevel ?? 1) && newMaxLevel >= 1 && newMaxLevel <= 10,
    [currentMaxLevel, newMaxLevel],
  )
  return (
    <>
      <Card>
        <CardHeader>
          <Heading size="lg">{t("Set GM Max Level")}</Heading>
        </CardHeader>

        <CardBody>
          <VStack spacing={8} align="start" w="full">
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
              <VStack spacing={4} align="start">
                <FormControl isRequired isInvalid={Boolean(errors.newMaxLevel)}>
                  <FormLabel>
                    <strong>{t("GM New Max Level")}</strong>
                  </FormLabel>
                  <InputGroup>
                    <NumberInput
                      w="full"
                      min={1}
                      max={10} //TODO: Check if contract max level is 10
                      placeholder={t("Enter the new max level")}
                      onChange={valueAsNumber => setValue("newMaxLevel", valueAsNumber, { shouldValidate: true })}>
                      <NumberInputField
                        {...register("newMaxLevel", {
                          required: t("This field is required"),
                          valueAsNumber: true,
                          validate: value => {
                            if (!value) {
                              return t("This field is required")
                            }
                            if (value === Number(currentMaxLevel ?? 1)) {
                              return t("Value must be different from the current max level")
                            }
                          },
                        })}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </InputGroup>
                  {errors.newMaxLevel && <FormErrorMessage>{errors.newMaxLevel.message}</FormErrorMessage>}
                </FormControl>

                {/* Submit Button */}
                <Button isDisabled={!isFormValid || isTxReceiptLoading} type="submit" colorScheme="blue" size="md">
                  {t("Set Max Level")}
                </Button>
              </VStack>
            </form>
          </VStack>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        status={error ? "error" : status}
        successTitle={t("Transaction successful")}
        onTryAgain={handleSubmit(onSubmit)}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID}
        pendingTitle={t("Processing transaction...")}
        errorTitle={t("Transaction error")}
        errorDescription={error?.reason}
      />
    </>
  )
}
