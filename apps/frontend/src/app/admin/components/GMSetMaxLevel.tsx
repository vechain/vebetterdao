import { Button, Card, Field, Heading, InputGroup, NumberInput, VStack } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useSetGMMaxLevel } from "@/hooks/useSetGMMaxLevel"
import { useGMMaxLevel } from "@/api/contracts/galaxyMember/hooks/useGMMaxLevel"

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
    <Card.Root>
      <Card.Header>
        <Heading size="3xl">{t("Set GM Max Level")}</Heading>
      </Card.Header>

      <Card.Body>
        <VStack gap={8} align="start" w="full">
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <VStack gap={4} align="start">
              <Field.Root required invalid={!!errors.newMaxLevel}>
                <Field.Label>
                  <strong>{t("GM New Max Level")}</strong>
                  <Field.RequiredIndicator />
                </Field.Label>
                <InputGroup>
                  <NumberInput.Root
                    w="full"
                    onValueChange={e =>
                      setValue("newMaxLevel", Number(e.value ?? GM_MIN_LEVEL_ALLOWED), { shouldValidate: true })
                    }>
                    <NumberInput.Input
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
                    <NumberInput.Control />
                  </NumberInput.Root>
                </InputGroup>
                <Field.ErrorText>{errors?.newMaxLevel?.message}</Field.ErrorText>
              </Field.Root>

              <Button disabled={!isFormValid || isTransactionPending} type="submit" colorPalette="blue" size="md">
                {t("Set Max Level")}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
