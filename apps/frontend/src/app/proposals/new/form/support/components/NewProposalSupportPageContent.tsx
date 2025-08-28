import { Button, Card, Field, HStack, Heading, Input, InputGroup, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useProposalFormStore } from "@/store"
import { VOT3Icon } from "@/components"
import { useDepositThreshold } from "@/api"
import { useWallet } from "@vechain/vechain-kit"
import { useGetVot3Balance } from "@/hooks"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

import { buttonClicked, buttonClickActions, ButtonClickProperties } from "@/constants"
import { AnalyticsUtils } from "@/utils"

type FormData = {
  amount: number
}

const compactFormatter = getCompactFormatter(2)

export const NewProposalSupportPageContent = () => {
  const router = useRouter()

  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: balance, isLoading: balanceLoading } = useGetVot3Balance(account?.address ?? undefined)
  const { data: threshold, isLoading: thresholdLoading } = useDepositThreshold()
  const { setData, depositAmount } = useProposalFormStore()

  const { register, handleSubmit, formState } = useForm<FormData>({
    defaultValues: {
      amount: depositAmount ?? 0,
    },
  })

  const { errors } = formState

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const onSubmit = useCallback(
    (data: FormData) => {
      setData({ depositAmount: data.amount })
      router.push("/proposals/new/form/preview-and-publish")
      AnalyticsUtils.trackEvent(
        buttonClicked,
        buttonClickActions(ButtonClickProperties.CONTINUE_CREATE_PROPOSAL_SUPPORT),
      )
    },
    [router, setData],
  )

  return (
    <Card.Root variant="baseWithBorder">
      <Card.Body py={8}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={[6, 8]} alignItems="flex-start">
            <VStack gap={[4, 6]} alignItems="flex-start">
              <Heading size={["xl", "2xl"]}>{t("Community support")}</Heading>
              <Text fontSize={["sm", "md"]} color="gray.500">
                {t(
                  "Your proposal will need support from the community to become active. Users who like your proposal and want to be able to vote for it can contribute with their VOT3 tokens to support it. The proposal will need a total of",
                )}{" "}
                {compactFormatter.format(Number(threshold))}{" "}
                {t("VOT3 to become active. You can also contribute with your own VOT3.")}
              </Text>
            </VStack>
            <VStack gap={2} align="flex-start" w="full">
              <Heading size={["sm", "md"]}>{t("How much VOT3 do you want to lock to fund this proposal?")}</Heading>
              <Text textStyle="sm" color="gray.500">
                {t("Your VOT3 will be unlocked when the voting session ends.")}
              </Text>

              <Field.Root invalid={!!errors.amount}>
                <InputGroup
                  w="full"
                  mt={4}
                  startElement={<VOT3Icon boxSize={8} colorVariant="dark" />}
                  startElementProps={{
                    p: 1,
                    pointerEvents: "none",
                  }}
                  endElement={
                    <Skeleton loading={thresholdLoading}>
                      <Heading w="auto" size={["lg", "lg", "3xl"]} color="gray.500" fontWeight={400}>
                        {`/ ${compactFormatter.format(Number(threshold))}`}
                      </Heading>
                    </Skeleton>
                  }>
                  <Input
                    data-testid="vot3-amount-input"
                    {...register("amount", {
                      required: t("This field is required"),
                      max: {
                        value: threshold ?? 0,
                        message: t("The maximum amount is {{threshold}}", { threshold: threshold }),
                      },
                      valueAsNumber: true,
                      validate: value => {
                        if (value > Number(balance?.scaled)) {
                          return t("Insufficient balance")
                        }
                      },
                    })}
                    w="full"
                    placeholder={t("Enter the amount of VOT3")}
                    fontSize={["xl", "xl", "3xl"]}
                  />
                </InputGroup>
                <Skeleton loading={balanceLoading}>
                  {errors.amount ? (
                    <Field.ErrorText fontStyle="sm" color="red.500" data-testid="amount-input-error-message">
                      {errors.amount.message}
                    </Field.ErrorText>
                  ) : (
                    <Field.HelperText fontStyle="sm">
                      {t("Your current VOT3 balance is")} {balance?.formatted}
                    </Field.HelperText>
                  )}
                </Skeleton>
              </Field.Root>
            </VStack>

            <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
              <Button data-testid="go-back" variant="primarySubtle" onClick={goBack}>
                {t("Go back")}
              </Button>
              <Button data-testid="continue" variant="primaryAction" type="submit">
                {t("Continue")}
              </Button>
            </HStack>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}
