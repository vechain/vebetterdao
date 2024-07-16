import { CreateEditAppForm, CreateEditAppFormData } from "@/components/CreateEditAppForm"
import { VStack, Grid, GridItem, Heading, useDisclosure } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { AppPreviewDetailCard } from "@/components/AppPreviewDetailCard"
import { useTranslation } from "react-i18next"
import { useAddApp, useUploadAppMetadata } from "@/hooks"
import { useCallback } from "react"
import { TransactionModal } from "@/components"

export const NewAppPageFormContent = () => {
  const { register, setValue, setError, formState, watch, handleSubmit, clearErrors, control, reset } =
    useForm<CreateEditAppFormData>({
      defaultValues: {
        name: "",
        description: "",
        logo: "/images/dapp_icon_placeholder.svg",
        banner: "/images/dapp_banner_placeholder.svg",
        projectUrl: "",
        adminAddress: "",
        treasuryAddress: "",
      },
    })

  const { errors } = formState
  const { t } = useTranslation()

  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()

  const addAppMutation = useAddApp({
    onSuccess: () => {
      onConfirmationClose()
      reset()
      addAppMutation.resetStatus()
    },
  })

  const uploadMetadataMutation = useUploadAppMetadata()

  const handleClose = useCallback(() => {
    onConfirmationClose()
  }, [onConfirmationClose])

  const onSubmit = useCallback(
    async (data: CreateEditAppFormData) => {
      onConfirmationOpen()

      const metadataUri = await uploadMetadataMutation.onMetadataUpload({
        name: data.name,
        description: data.description,
        external_url: data.projectUrl,
        logo: data.logo,
        banner: data.banner,
        screenshots: [],
        social_urls: [],
        app_urls: [],
        tweets: [],
      })

      if (!metadataUri) return

      addAppMutation.sendTransaction({
        adminAddress: data.adminAddress,
        treasuryAddress: data.treasuryAddress,
        name: data.name,
        metadataURI: metadataUri,
      })
    },
    [uploadMetadataMutation, addAppMutation, onConfirmationOpen],
  )

  const onTryAgain = useCallback(() => {
    onSubmit(watch())
  }, [onSubmit, watch])

  return (
    <>
      <TransactionModal
        isOpen={isConfirmationOpen}
        onClose={handleClose}
        confirmationTitle="Add app"
        successTitle="App added!"
        status={
          uploadMetadataMutation.metadataUploading
            ? "uploadingMetadata"
            : addAppMutation.error || uploadMetadataMutation.metadataUploadError
              ? "error"
              : addAppMutation.status
        }
        errorDescription={uploadMetadataMutation.metadataUploadError?.message ?? addAppMutation.error?.reason}
        errorTitle={
          uploadMetadataMutation.metadataUploadError
            ? "Error uploading metadata"
            : addAppMutation.error
              ? "Error adding app"
              : undefined
        }
        showTryAgainButton={true}
        onTryAgain={onTryAgain}
        pendingTitle="Adding app..."
        txId={addAppMutation.txReceipt?.meta.txID}
        showExplorerButton
      />

      <Grid templateColumns="repeat(3, 1fr)" gap={[4, 4, 8]} w="full" data-testid={`new-app-form`}>
        <GridItem colSpan={[3, 3, 2]}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CreateEditAppForm
              register={register}
              errors={errors}
              watch={watch}
              control={control}
              setError={setError}
              setValue={setValue}
              clearErrors={clearErrors}
            />
          </form>
        </GridItem>
        <GridItem colSpan={[3, 3, 1]} minH={0} minW={0}>
          <VStack spacing={4} w="full" align={"flex-start"} position="sticky" top={100} right={0}>
            <Heading size="md">{t("App preview")}</Heading>
            <AppPreviewDetailCard app={watch()} />
          </VStack>
        </GridItem>
      </Grid>
    </>
  )
}
