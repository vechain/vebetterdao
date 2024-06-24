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
import { useCurrentAppBanner, useCurrentAppLogo, useCurrentAppMetadata, useCurrentAppRole } from "../../../hooks"
import { EditAppBanner } from "./components/EditAppBanner"
import { useCurrentAppScreenshots } from "../../../hooks/useCurrentAppScreenshots"
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { useSocialUrls } from "./hooks/useSocialUrls"
import { useIsFormChanged } from "./hooks/useIsFormChanged"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"
import { UpdateAppMetadataTransactionModal } from "../../../components/UpdateAppMetadataTransactionModal"

export type EditAppForm = {
  name: string
  external_url: string
  description: string
  twitterUrl: string
  discordUrl: string
  telegramUrl: string
  youtubeUrl: string
  mediumUrl: string
  screenshots: string[]
  logoImage: string
  bannerImage: string
}

const findUrlByName = (urls: { name: string; url: string }[] | undefined, name: string) => {
  return urls?.find(url => url.name === name)?.url || ""
}

export const EditAppPageContent = () => {
  const { t } = useTranslation()
  const { appMetadata } = useCurrentAppMetadata()
  const { logo } = useCurrentAppLogo()
  const { banner } = useCurrentAppBanner()
  const { screenshots } = useCurrentAppScreenshots()
  const { app } = useCurrentAppInfo()
  const router = useRouter()
  const transactionModal = useDisclosure()
  const { isAdminOrModerator } = useCurrentAppRole()
  const { appId } = useParams<{ appId: string }>()

  const form = useForm<EditAppForm>({
    defaultValues: {
      screenshots: screenshots,
      logoImage: logo,
      bannerImage: banner,
      name: appMetadata?.name || "",
      external_url: appMetadata?.external_url || "",
      description: appMetadata?.description || "",
      twitterUrl: findUrlByName(appMetadata?.social_urls, "Twitter"),
      discordUrl: findUrlByName(appMetadata?.social_urls, "Discord"),
      telegramUrl: findUrlByName(appMetadata?.social_urls, "Telegram"),
      youtubeUrl: findUrlByName(appMetadata?.social_urls, "Youtube"),
      mediumUrl: findUrlByName(appMetadata?.social_urls, "Medium"),
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

  const updateAppDetailsMutation = useUpdateAppDetails({
    appId,
    onSuccess: goToAppPage,
  })

  const uploadMetadataMutation = useUploadAppMetadata()

  const onSubmit = useCallback(
    async (data: EditAppForm) => {
      updateAppDetailsMutation.resetStatus()
      transactionModal.onOpen()

      const metadataUri = await uploadMetadataMutation.onMetadataUpload({
        name: data.name,
        description: data.description,
        logo: data.logoImage,
        banner: data.bannerImage,
        external_url: data.external_url,
        screenshots: data.screenshots ?? [],
        app_urls: [],
        social_urls: socialUrls,
        tweets: appMetadata?.tweets ?? [],
      })
      if (!metadataUri) return

      updateAppDetailsMutation.sendTransaction({
        metadataUri,
      })
    },
    [updateAppDetailsMutation, transactionModal, uploadMetadataMutation, socialUrls, appMetadata?.tweets],
  )

  const handleClose = useCallback(() => {
    transactionModal.onClose()
    updateAppDetailsMutation.resetStatus()
  }, [transactionModal, updateAppDetailsMutation])

  const onTryAgain = useCallback(() => {
    handleClose()
    handleSubmit(onSubmit)()
  }, [handleClose, handleSubmit, onSubmit])

  useEffect(() => {
    if (!isAdminOrModerator) {
      router.push(`/apps/${app?.id}`)
    }
  }, [isAdminOrModerator, app?.id, router])

  if (!isAdminOrModerator) {
    return null
  }

  return (
    <>
      <UpdateAppMetadataTransactionModal
        transactionModal={transactionModal}
        handleClose={handleClose}
        uploadMetadataMutation={uploadMetadataMutation}
        updateAppDetailsMutation={updateAppDetailsMutation}
        onTryAgain={onTryAgain}
      />
      <VStack alignItems={"stretch"} gap={8} as="form" onSubmit={handleSubmit(onSubmit)} w="full">
        <Stack
          flexDirection={["column", "row"]}
          justify={["flex-start", "space-between"]}
          align={["flex-start", "center"]}>
          <HStack gap={4}>
            <EditAppLogo form={form} />
            <FormControl isInvalid={!!errors.name}>
              <Input
                {...register("name", {
                  required: { value: true, message: t("Name required") },
                  minLength: { value: 3, message: t("Name must be at least 3 characters") },
                })}
                defaultValue={appMetadata?.name || ""}
                fontSize={"28px"}
                fontWeight={700}
              />
              <FormErrorMessage fontSize={"12px"}>{errors?.name?.message || ""}</FormErrorMessage>
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
            <VStack align={"stretch"} gap={4}>
              <Text fontSize={"14px"} fontWeight={400} color="#6A6A6A">
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
                <FormErrorMessage fontSize={"12px"}>{errors?.external_url?.message || ""}</FormErrorMessage>
              </FormControl>
            </VStack>
            <FormControl isInvalid={!!errors.description}>
              <Textarea
                {...register("description", {
                  required: { value: true, message: t("Description required") },
                  minLength: { value: 20, message: t("Description must be at least 20 characters") },
                })}
                defaultValue={appMetadata?.description || ""}
                resize="none"
                h="140px"
              />
              <FormErrorMessage fontSize={"12px"}>{errors?.description?.message || ""}</FormErrorMessage>
            </FormControl>
          </VStack>
          <EditAppSocialUrls form={form} />
        </Stack>
        <Divider />
        <EditScreenshots form={form} />
      </VStack>
    </>
  )
}
