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
import { useGrantDraftStore } from "@/store"
import { useEffect, useCallback, useMemo, useRef, useState } from "react"
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
  const { setData, saveDraft: saveDraftToStore } = store

  const getCleanDraftFromStore = useCallback(() => {
    const { ...rest } = store as any
    return rest as Partial<GrantFormData>
  }, [store])

  const initialDefaults = useMemo(
    () => (getCleanDraftFromStore() as GrantFormData) ?? ({} as GrantFormData),
    // only depend on the type to avoid re-initting while typing
    // we want a fresh snapshot when the page first renders for that type
    [getCleanDraftFromStore],
  )

  const { handleSubmit, control, register, formState, setValue, getValues, watch, reset } = useForm<GrantFormData>({
    defaultValues: initialDefaults,
  })

  const currentFormData = watch()
  const { errors } = formState

  useEffect(() => {
    if (currentFormData.grantType && currentFormData.grantType !== selectedGrantType) {
      setSelectedGrantType(currentFormData.grantType)
    }
  }, [currentFormData.grantType, selectedGrantType])

  // Reset ONLY when the grant type changes
  const prevTypeRef = useRef<string>(selectedGrantType)
  useEffect(() => {
    if (prevTypeRef.current !== selectedGrantType) {
      const freshDraft = getCleanDraftFromStore()
      // if you want to avoid wiping completely empty drafts, keep as-is:
      reset({ ...(freshDraft as GrantFormData), grantType: selectedGrantType })
      setLastSavedFormData(JSON.stringify(getValues()))
      prevTypeRef.current = selectedGrantType
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrantType, reset, getCleanDraftFromStore])

  // Check if form has changed vs. last saved snapshot
  const hasChangedSinceLastSave = useCallback(() => {
    const currentDataString = JSON.stringify(getValues())
    return currentDataString !== lastSavedFormData
  }, [getValues, lastSavedFormData])

  const isSaveDraftDisabled = !hasChangedSinceLastSave()
  const shouldShowUnsavedModal = hasChangedSinceLastSave()

  // Initialize "last saved" on mount
  useEffect(() => {
    setLastSavedFormData(JSON.stringify(getValues()))
    // we intentionally run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced store sync — guarded to avoid spamming store & causing feedback
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const sub = watch(data => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (!data) return
        if (data.grantType !== selectedGrantType) return
        // avoid noisy writes: only push if different from lastSavedFormData
        const serialized = JSON.stringify(data)
        if (serialized !== lastSavedFormData) {
          setData(data as GrantFormData)
        }
      }, 300)
    })
    return () => {
      sub.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [watch, setData, selectedGrantType, lastSavedFormData])

  const steps: GrantStep[] = [
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
          // pass current RHF values instead of the unstable spread store object
          formData={getValues()}
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

  const onSubmit = async (data: GrantFormData) => {
    setData({ ...data })
    if (activeStep !== lastStep) {
      return goToNext()
    }

    if (!currentRoundId || isNaN(Number(currentRoundId))) return

    const title = data.projectName
    const shortDescription = data.problemDescription
    const proposalMetadataURI = await onMetadataUpload({ ...data, title, shortDescription })
    if (!proposalMetadataURI) return console.error("Error uploading proposal metadata")

    const milestonesIpfsCID = await onMetadataUpload(data.milestones)
    if (!milestonesIpfsCID) return console.error("Error uploading milestones")

    await createGrantProposal({
      metadataIpfsCID: proposalMetadataURI,
      milestonesIpfsCID,
      milestones: data.milestones,
      votingRoundId: Number(currentRoundId) + 2,
      depositAmount: "0",
    })
  }

  const handleSaveDraft = useCallback(() => {
    if (!hasChangedSinceLastSave()) return
    const currentFormData = getValues()
    const dataToSave = { ...currentFormData, grantType: selectedGrantType }
    if (dataToSave.grantType === selectedGrantType) {
      setData(dataToSave)
      saveDraftToStore()
      setLastSavedFormData(JSON.stringify(dataToSave))
      toast({
        duration: 3000,
        isClosable: true,
        position: "top",
        containerStyle: { marginTop: "72px" },
        render: ({ onClose }) => <SuccessToastModal onClose={onClose} />,
      })
    }
  }, [getValues, setData, saveDraftToStore, toast, hasChangedSinceLastSave, selectedGrantType])

  const handleLeaveAnyway = useCallback(() => {
    if (pendingNavigation) {
      setBypassInterception(true)
      setTimeout(() => {
        window.location.href = pendingNavigation
      }, 0)
      setPendingNavigation(null)
      closeUnsavedModal()
    }
  }, [pendingNavigation, closeUnsavedModal])

  const handleSaveDraftAndLeave = useCallback(() => {
    const currentFormData = getValues()
    const dataToSave = { ...currentFormData, grantType: selectedGrantType }
    if (dataToSave.grantType === selectedGrantType) {
      setData(dataToSave)
      saveDraftToStore()
      toast({
        duration: 1500,
        isClosable: true,
        position: "top",
        containerStyle: { marginTop: "80px" },
        render: ({ onClose }) => <SuccessToastModal onClose={onClose} />,
      })
    }
    if (pendingNavigation) {
      closeUnsavedModal()
      setPendingNavigation(null)
      setTimeout(() => {
        window.location.href = pendingNavigation
      }, 100)
    }
  }, [getValues, setData, saveDraftToStore, toast, pendingNavigation, closeUnsavedModal, selectedGrantType])

  // beforeunload guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentData = getValues()
      const dataToSave = { ...currentData, grantType: selectedGrantType }
      if (dataToSave.applicantName && dataToSave.grantType === selectedGrantType) {
        setData(dataToSave)
      }
      if (shouldShowUnsavedModal) {
        e.preventDefault()
        return ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [shouldShowUnsavedModal, getValues, setData, selectedGrantType])

  // Intercept router navigation (unchanged)
  useEffect(() => {
    if (!shouldShowUnsavedModal || bypassInterception) return
    const originalPush = router.push
    const originalReplace = router.replace

    router.push = (url: any, options?: any) => {
      if (bypassInterception) return originalPush.call(router, url, options)
      const targetPath = typeof url === "string" ? url : url.toString()
      if (targetPath !== pathname && !targetPath.startsWith("#")) {
        setPendingNavigation(targetPath)
        openUnsavedModal()
        return Promise.resolve(true)
      }
      return originalPush.call(router, url, options)
    }

    router.replace = (url: any, options?: any) => {
      if (bypassInterception) return originalReplace.call(router, url, options)
      const targetPath = typeof url === "string" ? url : url.toString()
      if (targetPath !== pathname && !targetPath.startsWith("#")) {
        setPendingNavigation(targetPath)
        openUnsavedModal()
        return Promise.resolve(true)
      }
      return originalReplace.call(router, url, options)
    }

    const handleClick = (e: MouseEvent) => {
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
    return () => {
      router.push = originalPush
      router.replace = originalReplace
      document.removeEventListener("click", handleClick, true)
    }
  }, [shouldShowUnsavedModal, pathname, router, openUnsavedModal, bypassInterception])

  const firstStep = 0
  const lastStep = steps.length - 1
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
