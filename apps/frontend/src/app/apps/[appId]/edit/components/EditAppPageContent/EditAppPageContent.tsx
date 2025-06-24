import {
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  HStack,
  Input,
  Stack,
  Text,
  Textarea,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { URL_REGEX } from "@/constants"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { useCallback, useEffect } from "react"
import { UilCheck } from "@iconscout/react-unicons"
import { EditAppSocialUrls } from "./components/EditAppSocialUrls"
import { EditScreenshots } from "./components/EditScreenshots"
import { useParams, useRouter } from "next/navigation"
import { EditAppLogo } from "./components/EditAppLogo"
import {
  useCurrentAppBanner,
  useCurrentAppLogo,
  useCurrentAppMetadata,
  useCurrentAppRole,
  useCurrentAppVeWorldBanner,
} from "../../../hooks"
import { EditAppBanner } from "./components/EditAppBanner"
import { useCurrentAppScreenshots } from "../../../hooks/useCurrentAppScreenshots"
import { useSocialUrls } from "./hooks/useSocialUrls"
import { useIsFormChanged } from "./hooks/useIsFormChanged"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"
import { useAccountPermissions } from "@/api/contracts/account"
import { useWallet } from "@vechain/vechain-kit"
import { EditVeWorldBanner } from "./components/EditVeWorldBanner"
import { EditAppCategories } from "./components/EditAppCategories"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { StepModal } from "@/components/StepModal/StepModal"
import UploadingMetadataAnimation from "@/lottieAnimations/uploadingMetadata.json"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"
import Lottie from "react-lottie"

export type EditAppForm = {
  name: string
  external_url: string
  description: string
  distribution_strategy: string
  twitterUrl: string
  discordUrl: string
  telegramUrl: string
  youtubeUrl: string
  mediumUrl: string
  screenshots: string[]
  logoImage: string
  bannerImage: string
  ve_world_bannerImage: string
  categories: string[]
}

enum EditAppPageStep {
  UPLOADING = "UPLOADING",
}

const findUrlByName = (urls: { name: string; url: string }[] | undefined, name: string) => {
  return urls?.find(url => url.name === name)?.url ?? ""
}

export const EditAppPageContent = () => {
  const { t } = useTranslation()
  const { appMetadata } = useCurrentAppMetadata()
  const { logo } = useCurrentAppLogo()
  const { banner } = useCurrentAppBanner()
  const { screenshots } = useCurrentAppScreenshots()
  const { veWorldBanner } = useCurrentAppVeWorldBanner()
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isTxModalOpen, onClose: onTxModalClose } = useTransactionModal()
  const { isAdminOrModerator } = useCurrentAppRole()
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")
  const { appId } = useParams<{ appId: string }>()

  const form = useForm<EditAppForm>({
    defaultValues: {
      screenshots: screenshots,
      logoImage: logo,
      bannerImage: banner,
      name: appMetadata?.name ?? "",
      external_url: appMetadata?.external_url ?? "",
      description: appMetadata?.description ?? "",
      distribution_strategy: appMetadata?.distribution_strategy ?? "",
      twitterUrl: findUrlByName(appMetadata?.social_urls, "Twitter"),
      discordUrl: findUrlByName(appMetadata?.social_urls, "Discord"),
      telegramUrl: findUrlByName(appMetadata?.social_urls, "Telegram"),
      youtubeUrl: findUrlByName(appMetadata?.social_urls, "Youtube"),
      mediumUrl: findUrlByName(appMetadata?.social_urls, "Medium"),
      ve_world_bannerImage: veWorldBanner,
      categories: appMetadata?.categories ?? [],
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form
  const socialUrls = useSocialUrls(form)
  const isFormChanged = useIsFormChanged(form)

  const goToAppPage = useCallback(() => {
    router.push(`/apps/${appId}`)
  }, [appId, router])

  useEffect(() => {
    if (!isAdminOrModerator && !permissions?.isAdminOfX2EarnApps) {
      goToAppPage()
    }
  }, [isAdminOrModerator, appId, router, permissions, goToAppPage])

  const handleSuccess = useCallback(() => {
    onClose()
    onTxModalClose()
    goToAppPage()
  }, [onClose, onTxModalClose, goToAppPage])

  const updateAppDetailsMutation = useUpdateAppDetails({
    appId,
    onSuccess: handleSuccess,
    onFailure: () => {
      onClose()
    },
  })

  const uploadMetadataMutation = useUploadAppMetadata()

  const uploadMetadata = useCallback(
    async (data: EditAppForm) => {
      const metadataUri = await uploadMetadataMutation.onMetadataUpload({
        name: data.name,
        description: data.description,
        distribution_strategy: data?.distribution_strategy ?? "",
        logo: data.logoImage,
        banner: data.bannerImage,
        external_url: data.external_url,
        screenshots: data.screenshots ?? [],
        app_urls: [],
        social_urls: socialUrls,
        tweets: appMetadata?.tweets ?? [],
        categories: data.categories ?? [],
        ve_world: {
          banner: data.ve_world_bannerImage,
        },
      })
      return metadataUri
    },
    [uploadMetadataMutation, socialUrls, appMetadata?.tweets],
  )

  const onSubmit = useCallback(
    async (data: EditAppForm) => {
      onTxModalClose()
      onOpen()

      const metadataUri = await uploadMetadata(data)
      if (!metadataUri) return

      updateAppDetailsMutation.sendTransaction({
        metadataUri,
      })
    },
    [updateAppDetailsMutation, onOpen, uploadMetadata, onTxModalClose],
  )

  // Update the form values when the app fetches the data from blockchain
  useEffect(() => {
    if (veWorldBanner) {
      form.setValue("ve_world_bannerImage", veWorldBanner)
    }
  }, [veWorldBanner, form])

  if (!isAdminOrModerator && !permissions?.isAdminOfX2EarnApps) {
    return null
  }

  return (
    <>
      <StepModal
        isOpen={isOpen && !isTxModalOpen}
        onClose={onClose}
        disableCloseButton={true}
        steps={[
          {
            key: EditAppPageStep.UPLOADING,
            content: (
              <ModalAnimation>
                <VStack align={"center"} p={6}>
                  {/* @ts-ignore eslint-disable-line */}
                  <Lottie
                    style={{
                      pointerEvents: "none",
                    }}
                    options={{
                      loop: true,
                      autoplay: true,
                      animationData: UploadingMetadataAnimation,
                    }}
                    height={200}
                    width={200}
                  />
                </VStack>
              </ModalAnimation>
            ),
            title: "Upload metadata",
            description: "Please wait while we upload the metadata",
          },
        ]}
        activeStep={0}
        setActiveStep={() => {}}
        goToPrevious={() => {}}
      />
      <VStack alignItems={"stretch"} gap={8} as="form" onSubmit={handleSubmit(onSubmit)} w="full">
        <Stack
          flexDirection={["column", "row"]}
          justify={["flex-start", "space-between"]}
          align={["flex-start", "center"]}>
          <HStack gap={4}>
            <FormControl isInvalid={!!errors.name}>
              <Input
                {...register("name", {
                  required: { value: true, message: t("Name required") },
                  minLength: { value: 3, message: t("Name must be at least 3 characters") },
                })}
                defaultValue={appMetadata?.name ?? ""}
                fontSize={"28px"}
                fontWeight={700}
              />
              <FormErrorMessage fontSize={"12px"}>{errors?.name?.message ?? ""}</FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack flexDir={["row-reverse", "row"]} mt={[2, 0]}>
            <Button variant="primaryGhost" onClick={goToAppPage}>
              {t("Cancel")}
            </Button>
            <Button
              variant="primaryAction"
              type="submit"
              leftIcon={<UilCheck size="16px" />}
              isDisabled={!isFormChanged}>
              {t("Save changes")}
            </Button>
          </HStack>
        </Stack>

        <EditAppBanner form={form} />

        <Stack flexDirection={["column", "row"]} gap={[20, 6]} align={"flex-start"}>
          <VStack align={"stretch"} flex={3} gap={8} w="full">
            <EditAppLogo form={form} />

            <VStack align={"stretch"} gap={4}>
              <Text fontSize={16} fontWeight={500}>
                {t("Project URL")}
              </Text>
              <FormControl isInvalid={!!errors.external_url}>
                <Input
                  defaultValue={appMetadata?.external_url ?? ""}
                  {...register("external_url", {
                    required: { value: true, message: t("Project url required") },
                    pattern: {
                      value: URL_REGEX,
                      message: t("Invalid url"),
                    },
                  })}
                />
                <FormErrorMessage fontSize={"12px"}>{errors?.external_url?.message ?? ""}</FormErrorMessage>
              </FormControl>
            </VStack>

            <VStack align={"stretch"} gap={4}>
              <Text fontSize={16} fontWeight={500}>
                {t("Description")}
              </Text>
              <FormControl isInvalid={!!errors.description}>
                <Textarea
                  {...register("description", {
                    required: { value: true, message: t("Description required") },
                    minLength: { value: 20, message: t("Description must be at least 20 characters") },
                  })}
                  defaultValue={appMetadata?.description ?? ""}
                  resize="none"
                  h="140px"
                />
                <FormErrorMessage fontSize={"12px"}>{errors?.description?.message ?? ""}</FormErrorMessage>
              </FormControl>
            </VStack>
            <VStack align={"stretch"} gap={4}>
              <Text fontSize={16} fontWeight={500}>
                {t("Distribution Strategy")}
              </Text>
              <FormControl isInvalid={!!errors.distribution_strategy}>
                <Textarea
                  {...register("distribution_strategy", {
                    minLength: {
                      value: 20,
                      message: t("{{fieldName}} is too short", { fieldName: t("Distribution Strategy") }),
                    },
                  })}
                  defaultValue={appMetadata?.distribution_strategy ?? ""}
                  placeholder={t("Eg. Our goal is to distribute at least X percent of the round allocation each week.")}
                  resize="none"
                  h="140px"
                />
                <FormErrorMessage fontSize={"12px"}>{errors?.distribution_strategy?.message ?? ""}</FormErrorMessage>
              </FormControl>
            </VStack>
            <EditAppCategories form={form} />
          </VStack>
          <EditAppSocialUrls form={form} />
        </Stack>
        <Divider />
        <EditScreenshots form={form} />
        <EditVeWorldBanner form={form} />
      </VStack>
    </>
  )
}
