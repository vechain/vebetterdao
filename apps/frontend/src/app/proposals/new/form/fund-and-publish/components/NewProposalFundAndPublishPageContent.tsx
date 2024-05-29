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
  useDisclosure,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { VOT3Icon } from "@/components"
import { useDepositThreshold, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { useForm } from "react-hook-form"
import { useCreateProposal, useUploadProposalMetadata } from "@/hooks"
import { TransactionModal } from "@/components/TransactionModal"
import { useTranslation } from "react-i18next"

type FormData = {
  amount: number
}

export const NewProposalFundAndPublishPageContent = () => {
  const router = useRouter()

  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: balance, isLoading: balanceLoading } = useVot3Balance(account ?? undefined)
  const { data: threshold, isLoading: thresholdLoading } = useDepositThreshold()
  const { setData, title, shortDescription, markdownDescription, actions, votingStartRoundId } = useProposalFormStore()

  //redirect the user to the beginning of the form if the required data is missing
  // this happens in case the user tries to access this page directly
  useEffect(() => {
    if (!title || !shortDescription || !markdownDescription || !votingStartRoundId) {
      router.push("/proposals/new/form")
    }
  }, [title, shortDescription, markdownDescription, actions, votingStartRoundId, router])

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
              <Heading size="lg">Community support</Heading>
              <Text fontSize="md" color="gray.500">
                Your proposal will need support from the community to become active. Users who like your proposal and
                want to be able to vote for it can contribute with their VOT3 tokens to support it. The proposal will
                need a total of {threshold} V3 to become active. You can also contribute with your own V3.
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
                      {...register("amount", {
                        required: t("This field is required"),
                        max: {
                          value: threshold ?? 0,
                          message: t("The maximum amount is #{{threshold}}", { threshold: threshold }),
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
                          {`/ ${threshold}`}
                        </Heading>
                      </InputRightElement>
                    </Skeleton>
                  </InputGroup>
                  <Skeleton isLoaded={!balanceLoading}>
                    {errors.amount ? (
                      <FormHelperText color="red.500">{errors.amount.message}</FormHelperText>
                    ) : (
                      <FormHelperText>Your current VOT3 balance is {balance?.formatted}</FormHelperText>
                    )}
                  </Skeleton>
                </FormControl>
              </VStack>

              <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
                <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
                  {t("Go back")}
                </Button>
                <Button rounded="full" colorScheme="primary" size="lg" type="submit">
                  Fund and publish
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </>
  )
}
