import { CreateEditAppForm, CreateEditAppFormData } from "@/components/CreateEditAppForm"
import { VStack, Grid, GridItem, Heading, Text, Button, Image, Box } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { AppPreviewDetailCard } from "@/components/AppPreviewDetailCard"
import { useTranslation } from "react-i18next"
import { useSubmitNewApp, useUploadAppMetadata } from "@/hooks"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PreviewAppCard } from "./PreviewAppCard"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { ethers } from "ethers"
import { useCreatorSubmission } from "@/api"

export const NewAppPageFormContent = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: submission } = useCreatorSubmission(account?.address ?? "")
  const { onMetadataUpload } = useUploadAppMetadata() //TODO: Add this to review modal before sending transaction

  const { data: hasCreatorNft } = useHasCreatorNFT(account?.address ?? "")
  const [appData, setAppData] = useState<CreateEditAppFormData | undefined>()
  const [isSuccessSubmission, setIsSuccessSubmission] = useState(false)

  const latestSubmission = submission?.submissions[0]

  const { register, setValue, setError, formState, watch, handleSubmit, clearErrors, control } =
    useForm<CreateEditAppFormData>({
      defaultValues: {
        name: latestSubmission?.appName ?? "",
        description: "",
        logo: "/assets/icons/dapp_icon_placeholder.svg",
        banner: "/assets/icons/dapp_banner_placeholder.svg",
        distributionStrategy: latestSubmission?.distributionStrategy ?? "",
        projectUrl: latestSubmission?.projectUrl ?? "",
        treasuryWalletAddress: "",
        adminWalletAddress: "",
      },
    })

  const { errors } = formState

  useEffect(() => {
    //Users without Creator NFT should be redirected to home
    if (!!account?.address && !hasCreatorNft) router.push("/")
  }, [hasCreatorNft, router, account?.address])

  const handleSuccess = useCallback(() => {
    setIsSuccessSubmission(true)
  }, [])
  const submitAppMutation = useSubmitNewApp({ onSuccess: handleSuccess })

  const appName = watch("name")
  const appId = useMemo(() => {
    return ethers.keccak256(ethers.toUtf8Bytes(appName))
  }, [appName])

  const onVisitAppPage = useCallback(() => {
    router.push(`/apps/${appId}`)
  }, [router, appId])

  const onSubmit = useCallback(
    async (data: CreateEditAppFormData) => {
      setAppData(data)

      const metadataUri = await onMetadataUpload({
        name: data.name,
        description: data.description,
        distribution_strategy: data.distributionStrategy,
        logo: data.logo,
        banner: data.banner,
        external_url: data.projectUrl,
        screenshots: [],
        app_urls: [],
        social_urls: [],
        tweets: [],
        categories: [],
        ve_world: {
          banner: data.ve_world_banner,
        },
      })
      if (!metadataUri) return

      const adminAddress = data.adminWalletAddress ?? account?.address ?? data.treasuryWalletAddress

      submitAppMutation.sendTransaction({
        teamWalletAddress: data.treasuryWalletAddress,
        adminAddress,
        appName: data.name,
        appMetadataUri: metadataUri,
      })
    },
    [account, onMetadataUpload, submitAppMutation],
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
          <VStack gap={4} w="full" align={"flex-start"} position="sticky" top={100} right={0}>
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
          <Image src="/assets/backgrounds/blue-cloud-full.webp" alt="Submit app success" />
          <Box w="full" h="full" position="absolute" display="flex" alignItems="center" justifyContent="center">
            <PreviewAppCard name={appData?.name} logo={appData?.logo} banner={appData?.banner} appId={appId} />
          </Box>
        </VStack>
      </Grid>
    )
  }, [appData?.banner, appData?.logo, appData?.name, onVisitAppPage, appId, t])

  return <>{!isSuccessSubmission ? renderAppSubmissionForm : renderAppSubmissionSuccess}</>
}
