import { useAppAdmin, useAppModerators, useXApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { CreateEditAppForm, CreateEditAppFormData } from "@/components/CreateEditAppForm"
import { TransactionModal } from "@/components/TransactionModal"
import { useUpdateAppDetails } from "@/hooks"
import { useUploadAppMetadata } from "@/hooks/useUploadAppMetadata"
import { VStack, Button, Grid, GridItem, Heading, useDisclosure } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { FaArrowLeft } from "react-icons/fa6"
import { AppPreviewDetailCard } from "@/components/AppPreviewDetailCard"
import { useWallet } from "@vechain/dapp-kit-react"

type Props = {
  appId: string
}
export const EditAppPageContent = ({ appId }: Props) => {
  const { account } = useWallet()
  const { data: appData } = useXApp(appId)
  const { data: metadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(appId)
  const { data: xAppAdmin } = useAppAdmin(appId)
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

  const { data: logo, isLoading: logoLoading } = useIpfsImage(metadata?.logo)
  const { data: banner, isLoading: bannerLoading } = useIpfsImage(metadata?.banner)

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
  const onSubmit = useCallback(
    async (data: CreateEditAppFormData) => {
      updateAppMetadataMutation.resetStatus()
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
    },
    [onMetadataUpload, updateAppMetadataMutation, appData?.receiverAddress, metadata, onConfirmationOpen],
  )

  const onTryAgain = useCallback(() => {
    updateAppMetadataMutation.resetStatus()
    onConfirmationClose()
    handleSubmit(onSubmit)()
  }, [onConfirmationClose, updateAppMetadataMutation, handleSubmit, onSubmit])

  const isAllowedToEditAddress = compareAddresses(xAppAdmin, account ?? "")
  const { data: appModerators } = useAppModerators(appId)
  const isAllowedToEdit = useMemo(() => {
    if (!account || !appModerators || !xAppAdmin) return false
    if (compareAddresses(xAppAdmin, account)) return true
    return appModerators.some(mod => compareAddresses(mod, account))
  }, [account, appModerators, xAppAdmin])

  useEffect(() => {
    if (!isAllowedToEditAddress) {
      goToAppDetail()
    }
  }, [isAllowedToEditAddress, goToAppDetail])

  if (!isAllowedToEdit) return null

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
        showExplorerButton
      />

      <VStack w="full" spacing={4} align="flex-start" data-testid={`edit-app-${appId}-detail`}>
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
                isReceiverAddressDisabled={!isAllowedToEditAddress}
              />
            </form>
          </GridItem>
          <GridItem colSpan={[3, 3, 1]} minH={0} minW={0}>
            <VStack spacing={4} w="full" align={"flex-start"} position="sticky" top={100} right={0}>
              <Heading size="md">App preview</Heading>
              <AppPreviewDetailCard
                app={watch()}
                appMetadataLoading={appMetadataLoading}
                appMetadataError={appMetadataError}
                isLogoLoading={logoLoading}
                isBannerLoading={bannerLoading}
              />
            </VStack>
          </GridItem>
        </Grid>
      </VStack>
    </>
  )
}
