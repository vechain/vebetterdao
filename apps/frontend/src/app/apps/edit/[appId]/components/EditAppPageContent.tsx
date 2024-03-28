import { useXApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { AppDetailCard } from "@/app/apps/[appId]/components/AppDetailCard"
import { CreateEditAppForm, CreateEditAppFormData } from "@/components/CreateEditAppForm"
import { TransactionModal } from "@/components/TransactionModal"
import { useUpdateAppDetails } from "@/hooks"
import { useUploadAppMetadata } from "@/hooks/useUploadAppMetadata"
import { VStack, Button, Grid, GridItem, Heading, useDisclosure } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { FaArrowLeft } from "react-icons/fa6"

type Props = {
  appId: string
}
export const EditAppPageContent = ({ appId }: Props) => {
  const { data: appData } = useXApp(appId)
  const { data: metadata } = useXAppMetadata(appId)
  const router = useRouter()

  const { register, setValue, setError, formState, watch, handleSubmit, clearErrors, control } =
    useForm<CreateEditAppFormData>({
      defaultValues: {
        name: appData?.name,
        description: metadata?.description,
        logo: metadata?.logo,
        banner: metadata?.banner,
        projectUrl: metadata?.external_url,
        receiverAddress: appData?.receiverAddress,
      },
    })

  const { errors } = formState

  const { data: logo } = useIpfsImage(metadata?.logo)
  const { data: banner } = useIpfsImage(metadata?.banner)

  useEffect(() => {
    if (logo) setValue("logo", logo?.image)
    if (banner) setValue("banner", banner?.image)
  }, [logo, banner, setValue])

  const goToAppDetail = useCallback(() => {
    router.push(`/apps/${appId}`)
  }, [router, appId])

  const { onMetadataUpload, metadataUploadError, metadataUploading } = useUploadAppMetadata()

  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()
  const updateAppMetadataMutation = useUpdateAppDetails({
    appId,
    onSuccess: goToAppDetail,
  })
  const onSubmit = async (data: CreateEditAppFormData) => {
    onConfirmationOpen()

    const metadataUri = await onMetadataUpload({
      name: data.name,
      description: data.description,
      logo: data.logo,
      banner: data.banner,
      external_url: data.projectUrl,
      screenshots: metadata?.screenshots ?? [],
      app_urls: metadata?.app_urls ?? [],
      social_urls: metadata?.social_urls ?? [],
    })
    if (!metadataUri) return
    console.log("metadataUri", metadataUri)

    updateAppMetadataMutation.sendTransaction({
      metadataUri,
      ...(compareAddresses(data.receiverAddress, appData?.receiverAddress)
        ? {}
        : { receiverAddress: data.receiverAddress }),
    })
  }

  const onTryAgain = useCallback(() => {
    updateAppMetadataMutation.resetStatus()
    onConfirmationClose()
    onConfirmationOpen()
  }, [onConfirmationClose, onConfirmationOpen, updateAppMetadataMutation])

  return (
    <>
      <TransactionModal
        isOpen={isConfirmationOpen}
        onClose={onConfirmationClose}
        confirmationTitle="Update App details"
        successTitle="App details updated!"
        status={
          metadataUploading
            ? "uploadingMetadata"
            : updateAppMetadataMutation.error || metadataUploadError
              ? "error"
              : updateAppMetadataMutation.status
        }
        errorDescription={metadataUploadError?.message ?? updateAppMetadataMutation.error?.reason}
        errorTitle={
          metadataUploadError
            ? "Error uploading metadata"
            : updateAppMetadataMutation.error
              ? "Error updating app details"
              : undefined
        }
        showTryAgainButton={true}
        onTryAgain={onTryAgain}
        pendingTitle="Updating app details..."
        txId={updateAppMetadataMutation.txReceipt?.meta.txID}
        showExplorerButton={true}
      />

      <VStack w="full" spacing={8} align="flex-start" data-testid={`app-${appId}-detail`}>
        <VStack spacing={4} alignItems={"flex-start"}>
          <Button colorScheme="gray" size="md" variant="outline" leftIcon={<FaArrowLeft />} onClick={goToAppDetail}>
            App detail
          </Button>
          <Grid templateColumns="repeat(3, 1fr)" gap={[4, 4, 8]} w="full">
            <GridItem colSpan={[3, 3, 2]}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CreateEditAppForm
                  register={register}
                  errors={errors}
                  isEdit={true}
                  editedApp={appData}
                  watch={watch}
                  control={control}
                  setError={setError}
                  setValue={setValue}
                  clearErrors={clearErrors}
                />
              </form>
            </GridItem>
            <GridItem colSpan={[3, 3, 1]}>
              <VStack spacing={4} w="full" align={"flex-start"} position="sticky" top={100} right={0}>
                <Heading size="md">App preview</Heading>
                <AppDetailCard appId={appId} />
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </VStack>
    </>
  )
}
