import { useAppModerators, useXApp, useXAppMetadata } from "@/api"
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
import { blobToBase64, downloadBlob } from "@/utils/BlobUtils"

export const NewAppPageFormContent = () => {
  const { account } = useWallet()
  const router = useRouter()

  const { register, setValue, setError, formState, watch, handleSubmit, clearErrors, control } =
    useForm<CreateEditAppFormData>({
      defaultValues: {
        name: "",
        description: "",
        logo: "/images/dapp_icon_placeholder.svg",
        banner: "/images/dapp_banner_placeholder.svg",
        projectUrl: "",
        teamWalletAddress: "",
      },
    })

  const { errors } = formState

  //   const { onMetadataUpload, metadataUploadError, metadataUploading } = useUploadAppMetadata()

  //   const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()
  const onSubmit = async (data: CreateEditAppFormData) => {
    // onConfirmationOpen()

    //TODO: integrate dapp creation contract logic
    alert(`form submitted \n ${JSON.stringify(data)}`)

    // const metadataUri = await onMetadataUpload({
    //   name: data.name,
    //   description: data.description,
    //   logo: data.logo,
    //   banner: data.banner,
    //   external_url: data.projectUrl,
    //   screenshots: metadata?.screenshots ?? [],
    //   app_urls: metadata?.app_urls ?? [],
    //   social_urls: metadata?.social_urls ?? [],
    // })
    // if (!metadataUri) return
    // console.log("metadataUri", metadataUri)

    // updateAppMetadataMutation.sendTransaction({
    //   metadataUri,
    //   ...(compareAddresses(data.teamWalletAddress, appData?.teamWalletAddress)
    //     ? {}
    //     : { teamWalletAddress: data.teamWalletAddress }),
    // })
  }

  //   const onTryAgain = useCallback(() => {
  //     onConfirmationClose()
  //     onConfirmationOpen()
  //   }, [onConfirmationClose, onConfirmationOpen])

  return (
    <>
      {/* <TransactionModal
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
      /> */}

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
            <Heading size="md">App preview</Heading>
            <AppPreviewDetailCard app={watch()} />
          </VStack>
        </GridItem>
      </Grid>
    </>
  )
}
