import { useGMMaxLevel } from "@/api/contracts/galaxyMember/hooks/useGMMaxLevel"
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
  VStack,
} from "@chakra-ui/react" // Import the Button component
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

export const GMSetMaxLevel = () => {
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

  const GM_MAX_LEVEL_ALLOWED = 10 //Currently setting max level allowed to 10
  const GM_MIN_LEVEL_ALLOWED = 1

  const newMaxLevel = watch("newMaxLevel")
  const { resetStatus, sendTransaction, isTransactionPending } = useSetGMMaxLevel({
    maxLevel: newMaxLevel,
    onSuccess: () => {
      resetStatus()
    },
  })

  const onSubmit = useCallback(() => {
    resetStatus()
    sendTransaction()
  }, [resetStatus, sendTransaction])
  const { data: currentMaxLevel } = useGMMaxLevel()
  const isFormValid = useMemo(
    () =>
      newMaxLevel !== Number(currentMaxLevel ?? GM_MIN_LEVEL_ALLOWED) &&
      newMaxLevel > Number(currentMaxLevel ?? GM_MIN_LEVEL_ALLOWED) &&
      newMaxLevel >= GM_MIN_LEVEL_ALLOWED &&
      newMaxLevel <= GM_MAX_LEVEL_ALLOWED,
    [currentMaxLevel, newMaxLevel],
  )
  return (
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
                    min={GM_MIN_LEVEL_ALLOWED}
                    max={GM_MAX_LEVEL_ALLOWED}
                    onChange={value =>
                      setValue("newMaxLevel", Number(value ?? GM_MIN_LEVEL_ALLOWED), { shouldValidate: true })
                    }>
                    <NumberInputField
                      {...register("newMaxLevel", {
                        required: t("This field is required"),
                        valueAsNumber: true,
                        validate: value => {
                          if (!value) {
                            return t("This field is required")
                          }
                          if (value === Number(currentMaxLevel ?? GM_MIN_LEVEL_ALLOWED)) {
                            return t("Value must be different from the current max level")
                          }
                          if (value < Number(currentMaxLevel ?? GM_MIN_LEVEL_ALLOWED)) {
                            return t("Value must be greater than the current max level")
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

              <Button isDisabled={!isFormValid || isTransactionPending} type="submit" colorScheme="blue" size="md">
                {t("Set Max Level")}
              </Button>
            </VStack>
          </form>
        </VStack>
      </CardBody>
    </Card>
  )
}
