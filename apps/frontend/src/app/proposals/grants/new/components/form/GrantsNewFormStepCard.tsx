import { useCurrentAllocationsRoundId } from "@/api"
import { GrantFormData } from "@/hooks/proposals/grants/types"
import { useCreateGrantProposal } from "@/hooks/proposals/grants/useCreateGrantProposal"
import { useUploadGrantProposalMetadata } from "@/hooks/useUploadGrantProposalMetadata"
import { useGrantProposalFormStore } from "@/store"
import { Button, Card, HStack, Stack, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { GrantsNewFormStepIndicator } from "."
import { GrantTypeSelection } from "../GrantTypeSelection"
import { AboutGrant, Milestones, Schedule } from "./steps"
import { Treasury__factory } from "@vechain/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"
import { useHashProposal } from "@/api/contracts/governance/hooks/useHashProposal"

export enum GrantFormStep {
  GRANT_TYPE = "GRANT_TYPE",
  ABOUT_GRANT = "ABOUT_GRANT",
  MILESTONES = "MILESTONES",
  SCHEDULE = "SCHEDULE",
}

export type GrantStep = {
  key: GrantFormStep
  content: React.ReactNode
  title: string
}
const treasuryInterface = Treasury__factory.createInterface()

export const GrantsNewFormStepCard = () => {
  const { t } = useTranslation()

  const router = useRouter()

  const { setData, clearData, ...formData } = useGrantProposalFormStore()

  const [proposalDescriptionUriHash, setProposalDescriptionUriHash] = useState<string>("")

  const { handleSubmit, control, register, formState, setValue, getValues, watch, clearErrors, setError, reset } =
    useForm<GrantFormData>({
      defaultValues: formData,
    })

  const { errors, isValid } = formState

  const steps: GrantStep[] = [
    {
      key: GrantFormStep.GRANT_TYPE,
      content: <GrantTypeSelection control={control} />,
      title: t("Type"),
    },
    {
      key: GrantFormStep.ABOUT_GRANT,
      content: (
        <AboutGrant
          register={register}
          setData={setData}
          setValue={setValue}
          getValues={getValues}
          clearErrors={clearErrors}
          watch={watch}
          errors={errors}
          setError={setError}
        />
      ),
      title: t("About grant"),
    },
    {
      key: GrantFormStep.MILESTONES,
      content: (
        <Milestones
          control={control}
          register={register}
          setValue={setValue}
          getValues={getValues}
          watch={watch}
          setData={setData}
          errors={errors}
          // pass current RHF values instead of the unstable spread store object
          formData={getValues()}
        />
      ),
      title: t("Milestones"),
    },
    {
      key: GrantFormStep.SCHEDULE,
      content: <Schedule register={register} errors={errors} control={control} watch={watch} />,
      title: t("Schedule"),
    },
  ]

  //MIMIC USE STEPS HOOK

  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const goToNext = useCallback(() => {
    setCurrentStepIndex(currentStepIndex + 1)
  }, [currentStepIndex])

  const goToPrevious = useCallback(() => {
    setCurrentStepIndex(currentStepIndex - 1)
  }, [currentStepIndex])

  const { onMetadataUpload } = useUploadGrantProposalMetadata()
  const { sendTransaction: createGrantProposal, resetStatus } = useCreateGrantProposal({
    onSuccess: () => {
      resetStatus()
      //Cleanup form and storage
      clearData()
      reset()
      goToProposalPage()
    },
  })

  const grantsProposalActions = useMemo(() => {
    return formData.milestones.map((milestone: GrantFormData["milestones"][0]) => {
      return {
        calldata: treasuryInterface.encodeFunctionData("transferB3TR", [
          getConfig().grantsManagerContractAddress,
          ethers.parseEther(milestone.fundingAmount.toString()),
        ]),
        contractAddress: getConfig().treasuryContractAddress,
      }
    })
  }, [formData?.milestones])

  // We call the hashProposal function to precalculate the proposal id
  // so we can redirect the user to the proposal page after the tx is confirmed
  const { data: expectedProposalId } = useHashProposal(
    grantsProposalActions.map(action => ({
      contractAddress: action.contractAddress,
      calldata: action.calldata as string,
    })),
    proposalDescriptionUriHash ?? "",
  )

  const goToProposalPage = useCallback(() => {
    //Redirect to the proposal page
    router.push(`/proposals/${expectedProposalId}`)
  }, [router, expectedProposalId])

  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const onSubmit = async (data: GrantFormData) => {
    if (currentStepIndex !== lastStep) {
      return goToNext()
    }

    if (!currentRoundId || isNaN(Number(currentRoundId))) return

    const title = data.projectName
    const shortDescription = data.problemDescription
    const proposalMetadataURI = await onMetadataUpload({ ...data, title, shortDescription })
    if (!proposalMetadataURI) return console.error("Error uploading proposal metadata")

    const milestonesIpfsCID = await onMetadataUpload(data.milestones)
    if (!milestonesIpfsCID) return console.error("Error uploading milestones")
    if (!data.votingRoundId) return console.error("Support round ID is required")
    resetStatus()
    // We hash the metadata uri, which will be used by the useHashProposal hook to calculate the proposal id
    setProposalDescriptionUriHash(ethers.keccak256(ethers.toUtf8Bytes(proposalMetadataURI)))

    await createGrantProposal({
      metadataIpfsCID: proposalMetadataURI,
      milestonesIpfsCID,
      milestones: data.milestones,
      grantsReceiver: data.grantsReceiverAddress,
      votingRoundId: Number(data.votingRoundId),
      depositAmount: "0",
    })
  }

  const firstStep = 0
  const lastStep = steps.length - 1
  const currentStep = steps[currentStepIndex]

  return (
    <>
      <Card.Root>
        <Card.Header>
          <GrantsNewFormStepIndicator activeStep={currentStepIndex} steps={steps} />
        </Card.Header>
        <Card.Body px={{ base: 3, md: 8 }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <VStack gap={4} w="full" align="flex-start">
              {currentStep?.content}
              <Stack w="full" justify="space-between" direction={{ base: "column", md: "row" }}>
                <HStack gap={4} w="full">
                  {currentStepIndex !== firstStep && (
                    <Button onClick={goToPrevious} variant="secondary" px={8} size="lg">
                      {t("Back")}
                    </Button>
                  )}
                  <Button type="submit" variant="primaryAction" px={8} size="lg" disabled={!isValid}>
                    {currentStepIndex === lastStep ? t("Apply") : t("Continue")}
                  </Button>
                </HStack>
                {/* {stepsUI.value !== firstStep && (
                  <Button
                    variant="primaryLink"
                    onClick={handleSaveDraft}
                    px={8}
                    disabled={isSaveDraftDisabled}
                    _disabled={{
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }}>
                    {t("Save draft")}
                  </Button>
                )} */}
              </Stack>
            </VStack>
          </form>
        </Card.Body>
      </Card.Root>
    </>
  )
}
