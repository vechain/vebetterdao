import { useCurrentAllocationsRoundId } from "@/api"
import { useHashProposal } from "@/api/contracts/governance/hooks/useHashProposal"
import { GrantFormData } from "@/hooks/proposals/grants/types"
import { useCreateGrantProposal } from "@/hooks/proposals/grants/useCreateGrantProposal"
import { useUploadGrantProposalMetadata } from "@/hooks/useUploadGrantProposalMetadata"
import { useDraftGrantProposalStore, useGrantProposalFormStore } from "@/store"
import { Button, Card, HStack, Stack, VStack } from "@chakra-ui/react"
import { toaster } from "@/components/ui/toaster"
import { getConfig } from "@repo/config"
import { Treasury__factory } from "@vechain/vebetterdao-contracts"
import { ethers } from "ethers"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { GrantsNewFormStepIndicator } from "."
import { GrantTypeSelection } from "../GrantTypeSelection"
import { AboutGrant, Milestones, Schedule } from "./steps"
import { GRANT_PROPOSAL_FORM_STORE_NAME } from "@/store/useGrantProposalFormStore"

// ============================================================================
// TYPES AND CONSTANTS
// ============================================================================

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

const STEP_INDICES = {
  GRANT_TYPE: 0,
  ABOUT_GRANT: 1,
  MILESTONES: 2,
  SCHEDULE: 3,
} as const

const treasuryInterface = Treasury__factory.createInterface()

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GrantsNewFormStepCard = () => {
  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================

  const { t } = useTranslation()
  const router = useRouter()
  const { data: session } = useSession()
  const formRef = useRef<HTMLFormElement>(null)

  // Store state
  const { setData, clearData, currentStep: storedStep, setCurrentStep, ...formData } = useGrantProposalFormStore()
  const { addDraftGrantProposal } = useDraftGrantProposalStore()

  // Component state
  const [proposalDescriptionUriHash, setProposalDescriptionUriHash] = useState<string>("")

  // Form state
  const {
    handleSubmit,
    control,
    register,
    formState,
    setValue,
    getValues,
    watch,
    clearErrors,
    setError,
    reset,
    trigger,
  } = useForm<GrantFormData>({
    defaultValues: formData,
  })
  const { errors, isValid } = formState

  // ============================================================================
  // STEP CONFIGURATION
  // ============================================================================

  const steps: GrantStep[] = [
    {
      key: GrantFormStep.GRANT_TYPE,
      content: <GrantTypeSelection control={control} setValue={setValue} setData={setData} />,
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
          formData={getValues()}
          trigger={trigger}
        />
      ),
      title: t("Milestones"),
    },
    {
      key: GrantFormStep.SCHEDULE,
      content: <Schedule errors={errors} control={control} watch={watch} setData={setData} />,
      title: t("Schedule"),
    },
  ]

  // ============================================================================
  // STEP MANAGEMENT
  // ============================================================================

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    // Initialize step based on stored step and session data at mount time
    const hasSessionSocial =
      session?.user && (session.user.githubUsername || session.user.twitterUsername || session.user.discordUsername)

    // If user has social accounts and stored step is before About Grant, go to About Grant
    if (hasSessionSocial && storedStep < STEP_INDICES.ABOUT_GRANT) {
      setCurrentStep(STEP_INDICES.ABOUT_GRANT)
      return STEP_INDICES.ABOUT_GRANT
    }

    return storedStep
  })

  const goToNext = useCallback(() => {
    const nextStep = currentStepIndex + 1
    setCurrentStepIndex(nextStep)
    setCurrentStep(nextStep)
  }, [currentStepIndex, setCurrentStep])

  const goToPrevious = useCallback(() => {
    const prevStep = currentStepIndex - 1
    setCurrentStepIndex(prevStep)
    setCurrentStep(prevStep)
  }, [currentStepIndex, setCurrentStep])

  const saveDraft = useCallback(() => {
    if (!formData.projectName) {
      toaster.create({
        description: t("You should add a project name to save a draft"),
        type: "error",
        closable: true,
      })
      return
    }

    addDraftGrantProposal(formData)
    formRef.current?.reset?.()
    clearData()
    localStorage.removeItem(GRANT_PROPOSAL_FORM_STORE_NAME)
    router.push("/proposals/grants/manage")
  }, [addDraftGrantProposal, formRef, formData, t, router, clearData])

  // ============================================================================
  // PROPOSAL SUBMISSION LOGIC
  // ============================================================================

  const { onMetadataUpload } = useUploadGrantProposalMetadata()
  const { sendTransaction: createGrantProposal, resetStatus } = useCreateGrantProposal({
    onSuccess: () => {
      resetStatus()
      clearData()
      reset()
      signOut({ redirect: false })
      goToProposalPage()
    },
  })

  const { data: currentRoundId } = useCurrentAllocationsRoundId()

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

  const { data: expectedProposalId } = useHashProposal(
    grantsProposalActions.map(action => ({
      contractAddress: action.contractAddress,
      calldata: action.calldata as string,
    })),
    proposalDescriptionUriHash ?? "",
  )

  const goToProposalPage = useCallback(() => {
    router.push(`/proposals/${expectedProposalId}`)
  }, [router, expectedProposalId])

  const onSubmit = async (data: GrantFormData) => {
    if (!isValid) {
      //clear all errors
      clearErrors()
      //trigger all errors
      trigger()
      return
    }

    // Navigate to next step if not on final step
    if (currentStepIndex !== lastStep) {
      return goToNext()
    }

    // Validate prerequisites
    if (!currentRoundId || isNaN(Number(currentRoundId))) return
    if (!data.votingRoundId) return console.error("Support round ID is required")

    try {
      // Prepare proposal data
      const title = data.projectName
      const shortDescription = data.problemDescription
      const cleanData = { ...formData, ...data }

      // Upload metadata to IPFS
      const proposalMetadataURI = await onMetadataUpload({ ...cleanData, title, shortDescription })
      if (!proposalMetadataURI) return console.error("Error uploading proposal metadata")

      const milestonesIpfsCID = await onMetadataUpload(data.milestones)
      if (!milestonesIpfsCID) return console.error("Error uploading milestones")

      // Hash metadata URI for proposal ID calculation
      setProposalDescriptionUriHash(ethers.keccak256(ethers.toUtf8Bytes(proposalMetadataURI)))

      resetStatus()

      // Submit proposal
      await createGrantProposal({
        metadataIpfsCID: proposalMetadataURI,
        milestonesIpfsCID,
        milestones: data.milestones,
        grantsReceiver: data.grantsReceiverAddress,
        votingRoundId: Number(data.votingRoundId),
        depositAmount: "0",
      })
    } catch (error) {
      console.error("Error submitting proposal:", error)
    }
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const firstStep = 0
  const lastStep = steps.length - 1
  const currentStepData = steps[currentStepIndex]

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card.Root>
      <Card.Body px={{ base: 3, md: 8 }}>
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
          <VStack gap={4} w="full" align="flex-start">
            <GrantsNewFormStepIndicator activeStep={currentStepIndex} steps={steps} />
            {currentStepData?.content}

            <Stack w="full" justify="space-between" direction={{ base: "column", md: "row" }}>
              <HStack gap={4} w="full">
                {currentStepIndex !== firstStep && (
                  <Button w="40" type="button" onClick={goToPrevious} variant="secondary" px={8} size="lg">
                    {t("Back")}
                  </Button>
                )}
                <Button w="40" type="submit" variant="primaryAction" px={8} size="lg">
                  {currentStepIndex === lastStep ? t("Apply") : t("Continue")}
                </Button>
              </HStack>

              {currentStepIndex !== firstStep && (
                <Button
                  w="40"
                  type="button"
                  onClick={saveDraft}
                  variant="ghost"
                  color="actions.tertiary.default"
                  focusRingColor="actions.tertiary.default"
                  px={8}
                  size="lg">
                  {t("Save draft")}
                </Button>
              )}
            </Stack>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}
