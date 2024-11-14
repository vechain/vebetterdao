import { CreateEditAppForm, CreateEditAppFormData } from "@/components/CreateEditAppForm"
import { VStack, Grid, GridItem, Heading, useDisclosure, Text, Button, Image, Box } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { AppPreviewDetailCard } from "@/components/AppPreviewDetailCard"
import { useTranslation } from "react-i18next"
import { useSubmitNewApp, useUploadAppMetadata } from "@/hooks"
import { TransactionModal } from "@/components"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useXApps } from "@/api"
import { useRouter } from "next/navigation"
import { PreviewAppCard } from "./PreviewAppCard"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"

export const NewAppPageFormContent = () => {
  const router = useRouter()
  const { t } = useTranslation()

  const [appData, setAppData] = useState<CreateEditAppFormData | undefined>()
  const [isSuccessSubmission, setIsSuccessSubmission] = useState(false)

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

  const { data: xApps } = useXApps()

  const { onMetadataUpload, metadataUploadError, metadataUploading } = useUploadAppMetadata()

  const { account } = useWallet()

  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()

  const hasCreatorNft = useHasCreatorNFT(account ?? "")

  useEffect(() => {
    //Users without Creator NFT should be redirected to home
    if (!!account && !hasCreatorNft) router.push("/")
  }, [hasCreatorNft, router, account])

  const handleSuccess = useCallback(() => {
    setIsSuccessSubmission(true)
    onConfirmationClose()
  }, [onConfirmationClose])

  const submittedAppId = useMemo(() => {
    return xApps?.allApps.find(app => app.name.toLowerCase() === appData?.name.toLowerCase())?.id
  }, [appData, xApps])

  const onVisitAppPage = useCallback(() => {
    router.push(`/apps/${submittedAppId}`)
  }, [router, submittedAppId])

  const submitAppMutation = useSubmitNewApp({ onSuccess: handleSuccess })

  const onSubmit = useCallback(
    async (data: CreateEditAppFormData) => {
      setAppData(data)

      onConfirmationOpen()

      const metadataUri = await onMetadataUpload({
        name: data.name,
        description: data.description,
        logo: data.logo,
        banner: data.banner,
        external_url: data.projectUrl,
        screenshots: [],
        app_urls: [],
        social_urls: [],
        tweets: [],
        ve_world: {
          banner: data.banner,
        },
      })
      if (!metadataUri) return

      submitAppMutation.sendTransaction({
        teamWalletAddress: data.teamWalletAddress,
        adminAddress: account ?? data.teamWalletAddress,
        appName: data.name,
        appMetadataUri: metadataUri,
      })
    },
    [account, onConfirmationOpen, onMetadataUpload, submitAppMutation],
  )

  const renderAppSubmissionForm = useMemo(() => {
    return (
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
    )
  }, [clearErrors, control, errors, handleSubmit, onSubmit, register, setError, setValue, t, watch])

  const renderAppSubmissionSuccess = useMemo(() => {
    return (
      <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "3fr 4fr"]} gap={6} w="full" mt={6}>
        <VStack alignItems={"flex-start"} order={[2, 2, 1]}>
          <Text fontSize={[24, 36]} fontWeight={700}>
            {t("Congratulations, Your App is part of VeBetter DAO!")}
          </Text>
          <Text fontSize={[14, 16]} fontWeight={400}>
            {t(
              "Now, to qualify for allocations and have founding from the community, you have to gain endorsements from X-node holders to reach 100 points.",
            )}
          </Text>
          <Button variant="primaryAction" onClick={onVisitAppPage} mt={6} w={"full"}>
            {t("Visit your app page")}
          </Button>
        </VStack>
        <VStack position={"relative"} w={"full"} order={[1, 1, 2]}>
          <Image src="/images/blue-cloud-full.png" alt="Submit app success" />
          <Box w="full" h="full" position="absolute" display="flex" alignItems="center" justifyContent="center">
            <PreviewAppCard name={appData?.name} logo={appData?.logo} banner={appData?.banner} appId={submittedAppId} />
          </Box>
        </VStack>
      </Grid>
    )
  }, [appData?.banner, appData?.logo, appData?.name, onVisitAppPage, submittedAppId, t])

  return (
    <>
      <TransactionModal
        isOpen={isConfirmationOpen}
        onClose={onConfirmationClose}
        confirmationTitle="Submit App"
        successTitle="App submitted"
        status={
          metadataUploading
            ? "uploadingMetadata"
            : submitAppMutation.error || metadataUploadError
              ? "error"
              : submitAppMutation.status
        }
        errorDescription={metadataUploadError?.message ?? submitAppMutation.error?.reason}
        errorTitle={
          metadataUploadError
            ? "Error uploading metadata"
            : submitAppMutation.error
              ? "Error submitting app"
              : undefined
        }
        showTryAgainButton={true}
        pendingTitle="Submitting new app..."
        txId={submitAppMutation.txReceipt?.meta.txID}
        showExplorerButton={true}
      />
      {!isSuccessSubmission ? renderAppSubmissionForm : renderAppSubmissionSuccess}
    </>
  )
}
