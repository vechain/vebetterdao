import {
  Button,
  Card,
  CardBody,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useProposalFormStore } from "@/store"
import { VOT3Icon } from "@/components"
import { useDepositThreshold, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

type FormData = {
  amount: number
}

const compactFormatter = getCompactFormatter(2)

export const NewProposalSupportPageContent = () => {
  const router = useRouter()

  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: balance, isLoading: balanceLoading } = useVot3Balance(account ?? undefined)
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
    },
    [router, setData],
  )

  return (
    <Card variant="baseWithBorder">
      <CardBody py={8}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={8} align="flex-start">
            <Heading size="lg">Community support</Heading>
            <Text fontSize="md" color="gray.500">
              Your proposal will need support from the community to become active. Users who like your proposal and want
              to be able to vote for it can contribute with their VOT3 tokens to support it. The proposal will need a
              total of {compactFormatter.format(Number(threshold))} VOT3 to become active. You can also contribute with
              your own VOT3.
            </Text>
            <VStack spacing={2} align="flex-start" w="full">
              <Heading size="md">How much VOT3 do you want to lock to fund this proposal?</Heading>
              <Text fontSize="sm" color="gray.500">
                Your VOT3 will be unlocked when the voting session ends.
              </Text>

              <FormControl isInvalid={!!errors.amount}>
                <InputGroup w="full" mt={4}>
                  <InputLeftElement pointerEvents="none">
                    <VOT3Icon colorVariant="dark" />
                  </InputLeftElement>
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
                    ml={2}
                    w="full"
                    variant="flushed"
                    placeholder={t("Enter the amount of VOT3")}
                    fontSize={["xl", "xl", "3xl"]}
                    fontFamily={"Instrument Sans Variable"}
                  />
                  <Skeleton isLoaded={!thresholdLoading}>
                    <InputRightElement w="auto">
                      <Heading size={["sm", "sm", "lg"]} color="gray.500" fontWeight={400}>
                        {`/ ${compactFormatter.format(Number(threshold))}`}
                      </Heading>
                    </InputRightElement>
                  </Skeleton>
                </InputGroup>
                <Skeleton isLoaded={!balanceLoading}>
                  {errors.amount ? (
                    <FormErrorMessage color="red.500" data-testid="amount-input-error-message">
                      {errors.amount.message}
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText>Your current VOT3 balance is {balance?.formatted}</FormHelperText>
                  )}
                </Skeleton>
              </FormControl>
            </VStack>

            <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
              <Button
                data-testid="go-back"
                rounded="full"
                variant={"primarySubtle"}
                colorScheme="primary"
                size="lg"
                onClick={goBack}>
                {t("Go back")}
              </Button>
              <Button data-testid="continue" rounded="full" colorScheme="primary" size="lg" type="submit">
                {t("Continue")}
              </Button>
            </HStack>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}
