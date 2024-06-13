import {
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  HStack,
  Image,
  Input,
  Skeleton,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { URL_REGEX, notFoundImage } from "@/constants"
import { useCurrentAppMetadata } from "@/app/apps/[appId]/hooks/useCurrentAppMetadata"
import { useCurrentAppLogo } from "@/app/apps/[appId]/hooks/useCurrentAppLogo"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { useCallback } from "react"
import { UilCheck } from "@iconscout/react-unicons"
import { EditAppSocialMediaUrls } from "./EditAppSocialMediaUrls"
import { EditTeamXProfiles } from "./EditTeamXProfiles"
import { EditScreenshots } from "./EditScreenshots"
import { useParams, useRouter } from "next/navigation"

export type EditAppForm = {
  name: string
  external_url: string
  description: string
  twitterUrl: string
  discordUrl: string
  telegramUrl: string
  youtubeUrl: string
  mediumUrl: string
  adminTwitterAccount: string
}

export const AppEditPageContent = () => {
  const { t } = useTranslation()
  const { appMetadata } = useCurrentAppMetadata()
  const { logo, isLogoLoading } = useCurrentAppLogo()

  const form = useForm<EditAppForm>()
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = form

  const onSubmit = useCallback((data: EditAppForm) => {
    console.log(data)
  }, [])

  const { appId } = useParams()
  const router = useRouter()
  const handleCancel = useCallback(() => {
    router.push(`/apps/${appId}`)
  }, [appId, router])

  return (
    <VStack alignItems={"stretch"} gap={8} as="form" onSubmit={handleSubmit(onSubmit)} w="full">
      <Stack flexDirection={["column", "row"]} justify={"space-between"}>
        <HStack gap={4}>
          <Skeleton isLoaded={!isLogoLoading} alignContent={"start"} flexBasis={"64px"}>
            <Image src={logo?.image ?? notFoundImage} alt={"logo"} maxWidth="none" w="64px" borderRadius="16px" />
          </Skeleton>
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
          <Button variant="primaryGhost" onClick={handleCancel}>
            {t("Cancel")}
          </Button>
          <Button variant="primaryAction" type="submit" leftIcon={<UilCheck size="16px" />}>
            {t("Save changes")}
          </Button>
        </HStack>
      </Stack>
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
      {/* <Divider />
            <EditTeamXProfiles form={form} /> */}
      <Divider />
      <EditScreenshots form={form} />
    </VStack>
  )
}
