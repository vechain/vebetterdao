import { useTranslation } from "react-i18next"
import {
  VStack,
  CardHeader,
  CardBody,
  Card,
  useSteps,
  Button,
  HStack,
  Stack,
  useDisclosure,
  useToast,
  Text,
} from "@chakra-ui/react"
import { GrantsNewFormStepIndicator } from "."
import { GrantTypeSelection } from "../GrantTypeSelection"
import { AboutGrant } from "./steps"
import { useForm } from "react-hook-form"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { Milestones } from "./steps/Milestones"
import { useUploadGrantProposalMetadata } from "@/hooks/useUploadGrantProposalMetadata"
import { useCurrentAllocationsRoundId } from "@/api"
import { useCreateGrantProposal } from "@/hooks/proposals/grants/useCreateGrantProposal"
import { useRouter, usePathname } from "next/navigation"
import { UnsavedChangesModal } from "@/components/UnsavedChangesModal"
import { getGrantFormDisplayName } from "@/utils/formUtils"
import { useGrantDraftStore } from "@/store"
import { useEffect, useCallback, useState } from "react"
import { SuccessToastModal } from "@/app/components/Toast/SuccessToastModal"

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

export const GrantsNewFormStepCard = () => {
  const { t } = useTranslation()
  const { isOpen: isUnsavedModalOpen, onOpen: openUnsavedModal, onClose: closeUnsavedModal } = useDisclosure()

  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()

  const [selectedGrantType, setSelectedGrantType] = useState<string>("dapp")
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [lastSavedFormData, setLastSavedFormData] = useState<string>("")
  const [bypassInterception, setBypassInterception] = useState(false)

  const store = useGrantDraftStore(selectedGrantType)
  const { setData, saveDraft: saveDraftToStore, ...formData } = store
  const { handleSubmit, control, register, formState, setValue, getValues, watch, reset } = useForm<GrantFormData>({
    defaultValues: formData,
  })

  const currentFormData = watch()
  const { errors } = formState

  const projectDisplayName = getGrantFormDisplayName(currentFormData)

  // Update selected grant type when form changes
  useEffect(() => {
    if (currentFormData.grantType && currentFormData.grantType !== selectedGrantType) {
      setSelectedGrantType(currentFormData.grantType)
    }
  }, [currentFormData.grantType, selectedGrantType])

  // Only reset form when grant type changes AND we're switching to a different type with different data
  useEffect(() => {
    // Get the new store data (excluding store methods)
    const cleanFormData = { ...formData }
    delete (cleanFormData as any).setData
    delete (cleanFormData as any).saveDraft
    delete (cleanFormData as any).clearData
    delete (cleanFormData as any).hasDraft
    delete (cleanFormData as any).getAllDrafts

    // Only reset if the new store data is significantly different or if it has a name
    if (cleanFormData.applicantName || cleanFormData.projectName) {
      reset(cleanFormData)
      setLastSavedFormData(JSON.stringify(cleanFormData))
    }
  }, [selectedGrantType, reset, formData])

  // Check if form has changed since last draft save
  const hasChangedSinceLastSave = useCallback(() => {
    const currentDataString = JSON.stringify(getValues())
    return currentDataString !== lastSavedFormData
  }, [getValues, lastSavedFormData])

  const isSaveDraftDisabled = !hasChangedSinceLastSave()
  const shouldShowUnsavedModal = hasChangedSinceLastSave()

  // Initialize the "last saved" state with current form data on mount
  useEffect(() => {
    // Set the initial form data as "saved" to prevent false unsaved changes detection
    const initialFormData = getValues()
    setLastSavedFormData(JSON.stringify(initialFormData))
  }, [getValues])

  // Auto-sync form changes to store with debouncing to prevent flickering
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const subscription = watch(data => {
      // Clear previous timeout
      clearTimeout(timeoutId)

      // Debounce the sync to prevent excessive updates
      timeoutId = setTimeout(() => {
        // Only sync if the form's grant type matches the currently selected store
        if (
          data &&
          data.grantType === selectedGrantType &&
          (data.applicantName || data.projectName || data.problemDescription)
        ) {
          setData(data as GrantFormData)
        }
      }, 300) // 300ms debounce
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [watch, setData, selectedGrantType])

  const steps = [
    {
      key: GrantFormStep.GRANT_TYPE,
      content: <GrantTypeSelection control={control} />,
      title: t("Type"),
    },
    {
      key: GrantFormStep.ABOUT_GRANT,
      content: <AboutGrant register={register} setValue={setValue} watch={watch} errors={errors} />,
      title: t("About grant"),
    },
    {
      key: GrantFormStep.MILESTONES,
      content: (
        <Milestones
          register={register}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          setData={setData}
          errors={errors}
          formData={formData}
        />
      ),
      title: t("Milestones"),
    },
    {
      key: GrantFormStep.SCHEDULE,
      content: (
        <>
          <Text>{t("Schedule")}</Text>
        </>
      ),
      title: t("Schedule"),
    },
  ]

  const { activeStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: steps.length,
  })
  const { onMetadataUpload } = useUploadGrantProposalMetadata()
  const { sendTransaction: createGrantProposal } = useCreateGrantProposal({
    onSuccess: () => {
      router.push(`/proposals/grants`)
    },
  })
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const firstStep = 0
  const lastStep = steps.length - 1

  const onSubmit = async (data: GrantFormData) => {
    //Keep new and old data in the store
    setData({ ...data })
    if (activeStep !== lastStep) {
      return goToNext()
    }

    if (!currentRoundId || isNaN(Number(currentRoundId))) return //TODO: THROW ERROR

    const title = data.projectName
    const shortDescription = data.problemDescription
    const proposalMetadataURI = await onMetadataUpload({ ...data, title, shortDescription })
    if (!proposalMetadataURI) return console.error("Error uploading proposal metadata") //TODO: THROW ERROR

    //Upload the description and milestones to IPFS
    const milestonesIpfsCID = await onMetadataUpload(data.milestones)
    if (!milestonesIpfsCID) return console.error("Error uploading milestones") //TODO: THROW ERROR

    await createGrantProposal({
      metadataIpfsCID: proposalMetadataURI,
      milestonesIpfsCID,
      milestones: data.milestones,
      votingRoundId: Number(currentRoundId) + 2, //TODO: Make sure this is next round or possible round depending on min voting delay
      depositAmount: "0", //TODO: Add info from the form
    })
  }

  const handleSaveDraft = useCallback(() => {
    if (!hasChangedSinceLastSave()) return

    const currentFormData = getValues()
    const dataToSave = {
      ...currentFormData,
      grantType: selectedGrantType, // Ensure we're saving with the correct grant type
    }

    // Update store only if grant types match
    if (dataToSave.grantType === selectedGrantType) {
      setData(dataToSave)

      saveDraftToStore()

      setLastSavedFormData(JSON.stringify(dataToSave))

      // Show success toast
      toast({
        duration: 3000,
        isClosable: true,
        position: "top",
        containerStyle: {
          marginTop: "72px",
        },
        render: ({ onClose }) => <SuccessToastModal onClose={onClose} />,
      })
    }
  }, [getValues, setData, saveDraftToStore, toast, hasChangedSinceLastSave, selectedGrantType])

  // Handle navigation confirmation
  const handleLeaveAnyway = useCallback(() => {
    if (pendingNavigation) {
      // Set flag to bypass interception
      setBypassInterception(true)

      // Use setTimeout to ensure the flag is set before navigation
      setTimeout(() => {
        window.location.href = pendingNavigation
      }, 0)

      setPendingNavigation(null)
      closeUnsavedModal()
    }
  }, [pendingNavigation, closeUnsavedModal])

  const handleSaveDraftAndLeave = useCallback(() => {
    // Get current form values and ensure grant type is correct
    const currentFormData = getValues()
    const dataToSave = {
      ...currentFormData,
      grantType: selectedGrantType, // Ensure we're saving with the correct grant type
    }

    // Save only if grant types match
    if (dataToSave.grantType === selectedGrantType) {
      setData(dataToSave)
      saveDraftToStore()

      toast({
        duration: 1500,
        isClosable: true,
        position: "top",
        containerStyle: {
          marginTop: "80px",
        },
        render: ({ onClose }) => <SuccessToastModal onClose={onClose} />,
      })
    }

    if (pendingNavigation) {
      // Close modal first
      closeUnsavedModal()
      setPendingNavigation(null)

      // Navigate after a short delay to let the draft save time register
      setTimeout(() => {
        window.location.href = pendingNavigation
      }, 100)
    }
  }, [getValues, setData, saveDraftToStore, toast, pendingNavigation, closeUnsavedModal, selectedGrantType])

  // Handle browser refresh/close warning and ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Always try to save current form data before leaving
      const currentData = getValues()
      const dataToSave = {
        ...currentData,
        grantType: selectedGrantType, // Ensure correct grant type
      }

      if (dataToSave.applicantName && dataToSave.grantType === selectedGrantType) {
        setData(dataToSave)
      }

      if (shouldShowUnsavedModal) {
        e.preventDefault()
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [shouldShowUnsavedModal, getValues, setData, selectedGrantType])

  // Intercept router navigation
  useEffect(() => {
    if (!shouldShowUnsavedModal || bypassInterception) return

    // Store original push and replace methods
    const originalPush = router.push
    const originalReplace = router.replace

    // Override router methods
    router.push = (url: any, options?: any) => {
      // Check if we should bypass interception
      if (bypassInterception) {
        return originalPush.call(router, url, options)
      }

      // Check if navigation is to a different page
      const targetPath = typeof url === "string" ? url : url.toString()
      if (targetPath !== pathname && !targetPath.startsWith("#")) {
        setPendingNavigation(targetPath)
        openUnsavedModal() // Are you sure to go out of the page without saving ?
        return Promise.resolve(true)
      }
      return originalPush.call(router, url, options)
    }

    router.replace = (url: any, options?: any) => {
      // Check if we should bypass interception
      if (bypassInterception) {
        return originalReplace.call(router, url, options)
      }

      const targetPath = typeof url === "string" ? url : url.toString()
      if (targetPath !== pathname && !targetPath.startsWith("#")) {
        setPendingNavigation(targetPath)
        openUnsavedModal()
        return Promise.resolve(true)
      }
      return originalReplace.call(router, url, options)
    }

    // Also handle clicks on links for fallback
    const handleClick = (e: MouseEvent) => {
      // Check if we should bypass interception
      if (bypassInterception) return

      const target = e.target as HTMLElement
      const link = target.closest("a[href]") as HTMLAnchorElement

      if (link && link.href) {
        const url = new URL(link.href)
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          e.preventDefault()
          e.stopPropagation()
          setPendingNavigation(url.pathname + url.search + url.hash)
          openUnsavedModal()
        }
      }
    }

    document.addEventListener("click", handleClick, true)

    // Cleanup function
    return () => {
      router.push = originalPush
      router.replace = originalReplace
      document.removeEventListener("click", handleClick, true)
    }
  }, [shouldShowUnsavedModal, pathname, router, openUnsavedModal, bypassInterception])

  const currentStep = steps[activeStep]

  return (
    <>
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onClose={() => {
          closeUnsavedModal()
          setPendingNavigation(null)
        }}
        onSaveDraft={handleSaveDraftAndLeave}
        onLeaveAnyway={handleLeaveAnyway}
        projectName={projectDisplayName}
      />
      <Card>
        <CardHeader>
          <GrantsNewFormStepIndicator activeStep={activeStep} steps={steps} />
        </CardHeader>
        <CardBody px={{ base: 3, md: 8 }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <VStack spacing={4} w="full" align="flex-start">
              {currentStep?.content}
              <Stack w="full" justify="space-between" direction={{ base: "column", md: "row" }}>
                <HStack spacing={4} w="full">
                  {activeStep !== firstStep && (
                    <Button
                      onClick={goToPrevious}
                      variant="secondary"
                      px={8}
                      size="lg"
                      w={{ base: "full", md: "auto" }}>
                      {t("Back")}
                    </Button>
                  )}
                  <Button type="submit" variant="primaryAction" px={8} size="lg" w={{ base: "full", md: "auto" }}>
                    {activeStep === lastStep ? t("Apply") : t("Continue")}
                  </Button>
                </HStack>
                {activeStep !== firstStep && (
                  <Button
                    variant="primaryLink"
                    onClick={handleSaveDraft}
                    px={8}
                    isDisabled={isSaveDraftDisabled}
                    opacity={isSaveDraftDisabled ? 0.5 : 1}
                    cursor={isSaveDraftDisabled ? "not-allowed" : "pointer"}>
                    {t("Save draft")}
                  </Button>
                )}
              </Stack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </>
  )
}
