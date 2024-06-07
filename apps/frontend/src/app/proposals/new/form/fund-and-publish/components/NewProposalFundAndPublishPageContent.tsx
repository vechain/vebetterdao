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
  useDisclosure,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useProposalFormStore } from "@/store"
import { VOT3Icon } from "@/components"
import { useDepositThreshold, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { useForm } from "react-hook-form"
import { useCreateProposal, useUploadProposalMetadata } from "@/hooks"
import { TransactionModal } from "@/components/TransactionModal"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

type FormData = {
  amount: number
}

const compactFormatter = getCompactFormatter(2)

export const NewProposalFundAndPublishPageContent = () => {
  const router = useRouter()

  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: balance, isLoading: balanceLoading } = useVot3Balance(account ?? undefined)
  const { data: threshold, isLoading: thresholdLoading } = useDepositThreshold()
  const { setData, title, shortDescription, markdownDescription, actions, votingStartRoundId } = useProposalFormStore()

  const { register, handleSubmit, formState } = useForm<FormData>({
    defaultValues: {
      amount: 0,
    },
  })

  const { errors } = formState

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()

  const onSuccess = useCallback(() => router.push("/proposals"), [router])

  const createProposalMutation = useCreateProposal({ onSuccess })

  const { onMetadataUpload, metadataUploadError, metadataUploading } = useUploadProposalMetadata()

  const onSubmit = useCallback(
    async (data: FormData) => {
      createProposalMutation.resetStatus()
      onConfirmationOpen()
      if (!title || !shortDescription || !markdownDescription) throw new Error("Missing data")
      const metadataUri = await onMetadataUpload({ title, shortDescription, markdownDescription })
      if (!metadataUri) return
      setData({ depositAmount: data.amount })
      if (!votingStartRoundId || !actions || !shortDescription) throw new Error("Missing data")

      const isSomeCalldataEmpty = actions.some(action => !action.calldata)
      if (isSomeCalldataEmpty) throw new Error("Missing calldata for some actions")
      createProposalMutation.sendTransaction({
        actions: actions.map(action => ({
          contractAddress: action.contractAddress,
          calldata: action.calldata as string,
        })),
        description: metadataUri,
        startRoundId: votingStartRoundId,
        depositAmount: data.amount.toString(),
      })
    },
    [
      setData,
      onConfirmationOpen,
      createProposalMutation,
      title,
      shortDescription,
      markdownDescription,
      actions,
      votingStartRoundId,
      onMetadataUpload,
    ],
  )

  const onTryAgain = useCallback(() => {
    createProposalMutation.resetStatus()
    handleSubmit(onSubmit)()
  }, [createProposalMutation, handleSubmit, onSubmit])

  return (
    <>
      <TransactionModal
        isOpen={isConfirmationOpen}
        onClose={onConfirmationClose}
        confirmationTitle="Create a proposal"
        successTitle="Proposal created!"
        status={
          metadataUploading
            ? "uploadingMetadata"
            : createProposalMutation.error || metadataUploadError
              ? "error"
              : createProposalMutation.status
        }
        errorDescription={metadataUploadError?.message ?? createProposalMutation.error?.reason}
        errorTitle={
          metadataUploadError
            ? "Error uploading metadata"
            : createProposalMutation.error
              ? "Error updating app details"
              : undefined
        }
        showTryAgainButton={true}
        onTryAgain={onTryAgain}
        pendingTitle="Creating proposal..."
        txId={createProposalMutation.txReceipt?.meta.txID}
        showExplorerButton
      />

      <Card>
        <CardBody py={8}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={8} align="flex-start">
              <Heading size="lg">{t("Support and publish")}</Heading>
              <Text fontSize="md" color="gray.500">
                {t(
                  "Your proposal will need support from the community to become active. Users who like your proposal and want to be able to vote for it can contribute with their VOT3 tokens to support it. The proposal will need a total of {{amount}} VOT3 to become active. You can also contribute with your own VOT3.",
                  { amount: compactFormatter.format(Number(threshold)) },
                )}
              </Text>
              <VStack spacing={2} align="flex-start" w="full">
                <Heading size="md">{t("Would you like to contribute to your proposal with some tokens?")}</Heading>
                <Text fontSize="sm" color="gray.500">
                  {t("You can claim back your tokens once the voting period is over.")}
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
                      <FormErrorMessage data-testid="amount-input-error-message">
                        {errors.amount.message}
                      </FormErrorMessage>
                    ) : (
                      <FormHelperText>
                        {t("Your current VOT3 balance is {{amount}}", {
                          amount: balance?.formatted,
                        })}
                      </FormHelperText>
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
                  {t("Support and publish")}
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </>
  )
}
