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
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { useSocialUrls } from "./hooks/useSocialUrls"
import { useIsFormChanged } from "./hooks/useIsFormChanged"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"
import { useAccountPermissions } from "@/api/contracts/account"
import { useWallet } from "@vechain/vechain-kit"
import { EditVeWorldBanner } from "./components/EditVeWorldBanner"
import { useTransaction } from "@/providers/TransactionProvider"
import { UploadMetadataModal } from "@/components/UploadMetadataModal"
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
  const { app } = useCurrentAppInfo()
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isTxModalOpen, transactionState } = useTransaction()
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
      router.push(`/apps/${app?.id}`)
    }
  }, [isAdminOrModerator, app?.id, router, permissions])

  const updateAppDetailsMutation = useUpdateAppDetails({
    appId,
    onSuccess: goToAppPage,
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
        ve_world: {
          banner: data.ve_world_bannerImage,
        },
      })
      return metadataUri
    },
    [uploadMetadataMutation, socialUrls, appMetadata?.tweets],
  )

  const updateAppDetails = useCallback(
    async (metadataUri: string) => {
      updateAppDetailsMutation.sendTransaction({
        metadataUri,
      })
    },
    [updateAppDetailsMutation],
  )

  const onSubmit = useCallback(
    async (data: EditAppForm) => {
      updateAppDetailsMutation.resetStatus()
      onOpen()

      const metadataUri = await uploadMetadata(data)
      if (!metadataUri) return

      const result = await updateAppDetails(metadataUri)
      console.log("result", result)
    },
    [updateAppDetailsMutation, onOpen, uploadMetadata, updateAppDetails],
  )

  // Update the form values when the app fetches the data from blockchain
  useEffect(() => {
    if (veWorldBanner) {
      form.setValue("ve_world_bannerImage", veWorldBanner)
    }
  }, [veWorldBanner, form])

  useEffect(() => {
    console.log("transactionState", transactionState)
  }, [transactionState])

  if (!isAdminOrModerator && !permissions?.isAdminOfX2EarnApps) {
    return null
  }

  return (
    <>
      <UploadMetadataModal isOpen={isOpen && !isTxModalOpen} onClose={onClose} />
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
                    required: {
                      value: true,
                      message: t("This field is required"),
                    },
                    minLength: {
                      value: 20,
                      message: t("{{fieldName}} is too short", { fieldName: t("Distribution Strategy") }),
                    },
                  })}
                  defaultValue={appMetadata?.distribution_strategy ?? ""}
                  resize="none"
                  h="140px"
                />
                <FormErrorMessage fontSize={"12px"}>{errors?.distribution_strategy?.message ?? ""}</FormErrorMessage>
              </FormControl>
            </VStack>
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
