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
import { useCallback } from "react"
import { UilCheck } from "@iconscout/react-unicons"
import { EditAppSocialMediaUrls } from "./EditAppSocialMediaUrls"
import { EditScreenshots } from "./EditScreenshots"
import { useParams, useRouter } from "next/navigation"
import { EditAppLogo } from "./EditAppLogo"
import { useCurrentAppBanner, useCurrentAppLogo, useCurrentAppMetadata } from "../../hooks"
import { EditAppBanner } from "./EditAppBanner"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"
import { TransactionModal } from "@/components/TransactionModal"

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

export const AppEditPageContent = () => {
  const { t } = useTranslation()
  const { appMetadata } = useCurrentAppMetadata()
  const { logo } = useCurrentAppLogo()
  const { banner } = useCurrentAppBanner()

  const form = useForm<EditAppForm>({
    defaultValues: {
      screenshots: appMetadata?.screenshots,
      logoImage: logo,
      bannerImage: banner,
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  const { appId } = useParams()
  const router = useRouter()
  const goBack = useCallback(() => {
    router.push(`/apps/${appId}`)
  }, [appId, router])
  const { onMetadataUpload, metadataUploadError, metadataUploading } = useUploadAppMetadata()

  const updateAppMetadataMutation = useUpdateAppDetails({
    appId: appId as string,
    onSuccess: () => {
      updateAppMetadataMutation.resetStatus()
      // goBack()
    },
  })
  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()

  const onSubmit = useCallback(
    async (data: EditAppForm) => {
      console.log(data)
      onConfirmationOpen()

      const metadataUri = await onMetadataUpload({
        name: data.name,
        description: data.description,
        logo: data.logoImage,
        banner: data.bannerImage,
        external_url: data.external_url,
        screenshots: data.screenshots ?? [],
        app_urls: [], // add app urls
        social_urls: [],
      })
      if (!metadataUri) return
      console.log("metadataUri", metadataUri)

      // TODO: add receiver address
      // updateAppMetadataMutation.sendTransaction({
      //   metadataUri,
      //   ...(compareAddresses(data.receiverAddress, appData?.receiverAddress)
      //     ? {}
      //     : { receiverAddress: data.receiverAddress }),
      // })
      updateAppMetadataMutation.sendTransaction({
        metadataUri,
      })
    },
    [onConfirmationOpen, onMetadataUpload, updateAppMetadataMutation],
  )
  const onTryAgain = useCallback(() => {
    updateAppMetadataMutation.resetStatus()
    onConfirmationClose()
    handleSubmit(onSubmit)()
  }, [onConfirmationClose, updateAppMetadataMutation, handleSubmit, onSubmit])

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
      <VStack alignItems={"stretch"} gap={8} as="form" onSubmit={handleSubmit(onSubmit)} w="full">
        <Stack flexDirection={["column", "row"]} justify={"space-between"}>
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
          <HStack>
            <Button variant="primaryGhost" onClick={goBack}>
              {t("Cancel")}
            </Button>
            <Button variant="primaryAction" type="submit" leftIcon={<UilCheck size="16px" />}>
              {t("Save changes")}
            </Button>
          </HStack>
        </Stack>
        <EditAppBanner form={form} />
        <Stack flexDirection={["column", "row"]} gap={[20, 6]} align={"flex-start"}>
          <VStack align={"stretch"} flex={3} gap={8}>
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
          <EditAppSocialMediaUrls form={form} />
        </Stack>
        <Divider />
        <EditScreenshots form={form} />
      </VStack>
    </>
  )
}
