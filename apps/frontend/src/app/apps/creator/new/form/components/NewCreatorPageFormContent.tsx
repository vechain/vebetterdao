import { Button, Grid, GridItem, Modal, ModalOverlay, useDisclosure, VStack } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { SubmitCreatorForm, SubmitCreatorFormData } from "@/components/SubmitCreatorForm"
import { signOut } from "next-auth/react"
import { SuccessModalContent } from "@/components/TransactionModal/SuccessModalContent"
import { CustomModalContent } from "@/components"
import { useRouter } from "next/navigation"
import { useCreatorSubmissionFormStore } from "@/store"
import { useTranslation } from "react-i18next"

export const NewCreatorPageFormContent = () => {
  const { register, reset, setValue, setError, watch, formState, control, handleSubmit, clearErrors } =
    useForm<SubmitCreatorFormData>({
      defaultValues: {
        appName: "",
        appDescription: "",
        adminWalletAddress: "",
        projectUrl: "",
        adminName: "",
        adminEmail: "",
        githubUsername: "",
        twitterUsername: "",
      },
    })

  const { errors } = formState
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { clearData } = useCreatorSubmissionFormStore()
  const router = useRouter()

  const onSubmit = async (formValues: SubmitCreatorFormData) => {
    try {
      const response = await fetch("/api/app/creator", {
        method: "POST",
        body: JSON.stringify(formValues),
      })
      if (!response.ok) throw new Error("Failed to submit creator application")

      reset() // Reset form after submission
      clearData() // Clear the store
      signOut({ redirect: false }) // Sign out for all active sessions
      onOpen() // Open the success modal}
    } catch (error) {
      //TODO: Open Modal with error message
      console.error("Failed to submit creator application", error)
    }
  }

  const navigateToHome = () => {
    onClose()
    router.push("/")
  }

  return (
    <>
      <Grid gap={[4, 4, 8]} w="full" data-testid={`new-creator-form`}>
        <GridItem colSpan={[3, 3, 2]}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <SubmitCreatorForm
              register={register}
              errors={errors}
              control={control}
              watch={watch}
              setError={setError}
              setValue={setValue}
              clearErrors={clearErrors}
            />
          </form>
        </GridItem>
      </Grid>
      <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
        <ModalOverlay />
        <CustomModalContent>
          {/* TODO: Implement the proper Modal Content */}
          <SuccessModalContent title="Your application has been submitted" />
          <VStack spacing={4} align="center" p={5}>
            <Button variant="primaryAction" onClick={navigateToHome}>
              {t("Go back to VeBetterDAO")}
            </Button>
          </VStack>
        </CustomModalContent>
      </Modal>
    </>
  )
}
