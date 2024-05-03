import {
  Button,
  Card,
  CardBody,
  FormControl,
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
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { B3TRIcon } from "@/components"
import { useB3trBalance, useDepositThreshold } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { useForm } from "react-hook-form"

type FormData = {
  amount: number
}

export const NewProposalDepositPageContent = () => {
  const router = useRouter()
  const { account } = useWallet()
  const { data: balance, isLoading: balanceLoading } = useB3trBalance(account ?? undefined)
  const { data: threshold, isLoading: thresholdLoading } = useDepositThreshold()
  const { setData } = useProposalFormStore()

  const { register, handleSubmit, formState } = useForm<FormData>({
    defaultValues: {
      amount: 0,
    },
  })

  const { errors } = formState

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const onSubmit = useCallback(
    (data: FormData) => {
      setData({ depositAmount: data.amount })
    },
    [setData],
  )

  return (
    <Card>
      <CardBody py={8}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={8} align="flex-start">
            <Heading size="lg">Lock B3TR to fund your proposal</Heading>
            <Text fontSize="md" color="gray.500">
              Your proposal will need at least 10.000 B3TR to become active. You can take this B3TR from your wallet, or
              wait until other users fund your proposal.
            </Text>
            <VStack spacing={2} align="flex-start" w="full">
              <Heading size="md">How much B3TR do you want to lock to fund this proposal?</Heading>
              <Text fontSize="sm" color="gray.500">
                Your B3TR will be unlocked when the voting session ends.
              </Text>

              <FormControl isInvalid={!!errors.amount}>
                <InputGroup w="full" mt={4}>
                  <InputLeftElement pointerEvents="none">
                    <B3TRIcon colorVariant="dark" />
                  </InputLeftElement>
                  <Input
                    {...register("amount", {
                      required: "This field is required",
                      max: { value: threshold ?? 0, message: `The maximum amount is ${threshold}` },
                      validate: value => {
                        if (value > Number(balance?.scaled)) {
                          return "Insufficient balance"
                        }
                      },
                    })}
                    ml={2}
                    w="full"
                    variant="flushed"
                    placeholder="Enter the amount of B3TR"
                    fontSize={["xl", "xl", "3xl"]}
                    fontFamily={"Instrument Sans Variable"}
                  />
                  <Skeleton isLoaded={!thresholdLoading}>
                    <InputRightElement w="auto">
                      <Heading size={["sm", "sm", "lg"]} color="gray.500" fontWeight={400}>
                        {`/ ${threshold}`}
                      </Heading>
                    </InputRightElement>
                  </Skeleton>
                </InputGroup>
                <Skeleton isLoaded={!balanceLoading}>
                  {errors.amount ? (
                    <FormHelperText color="red.500">{errors.amount.message}</FormHelperText>
                  ) : (
                    <FormHelperText>Your current B3TR balance is {balance?.formatted}</FormHelperText>
                  )}
                </Skeleton>
              </FormControl>
            </VStack>

            <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
              <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
                Go back
              </Button>
              <Button rounded="full" colorScheme="primary" size="lg" type="submit">
                Fund and publish
              </Button>
            </HStack>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}
