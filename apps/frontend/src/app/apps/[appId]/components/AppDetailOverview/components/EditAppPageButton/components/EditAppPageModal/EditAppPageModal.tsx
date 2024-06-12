import {
  Button,
  Flex,
  HStack,
  Heading,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalOverlay,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { notFoundImage } from "@/constants"
import { CustomModalContent } from "@/components"
import { useCurrentAppMetadata } from "@/app/apps/[appId]/hooks/useCurrentAppMetadata"
import { useCurrentAppLogo } from "@/app/apps/[appId]/hooks/useCurrentAppLogo"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { useCallback } from "react"
import { UilCheck } from "@iconscout/react-unicons"
import { EditAppSocialMediaUrls } from "./components/EditAppSocialMediaUrls"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export type EditAppForm = {
  external_url: string
  twitterUrl: string
  discordUrl: string
  telegramUrl: string
  youtubeUrl: string
  mediumUrl: string
}

export const EditAppPageModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { appMetadata, appMetadataLoading, appMetadataError } = useCurrentAppMetadata()
  const { logo, isLogoLoading } = useCurrentAppLogo()

  const form = useForm<EditAppForm>()
  const { register, handleSubmit, reset: resetForm } = form

  const onSubmit = useCallback((data: EditAppForm) => {
    console.log(data)
  }, [])

  const handleCancel = useCallback(() => {
    onClose()
    resetForm()
  }, [onClose, resetForm])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xxl">
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton />
        <ModalBody p="40px">
          <Flex gap="48px" flexDir={["column", "column", "row"]} as="form" onSubmit={handleSubmit(onSubmit)}>
            <VStack alignItems={"stretch"} justify={"space-between"} gap={8}>
              <HStack justify={"space-between"}>
                <HStack gap={4}>
                  <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
                    <Image src={logo?.image ?? notFoundImage} alt={"logo"} boxSize={"64px"} borderRadius="16px" />
                  </Skeleton>
                  <Skeleton isLoaded={!appMetadataLoading}>
                    <Heading fontSize={"28px"} fontWeight={700}>
                      {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
                    </Heading>
                  </Skeleton>
                </HStack>
                <HStack>
                  <Button variant="primaryGhost" onClick={handleCancel}>
                    {t("Cancel")}
                  </Button>
                  <Button variant="primaryAction" type="submit" leftIcon={<UilCheck size="16px" />}>
                    {t("Save changes")}
                  </Button>
                </HStack>
              </HStack>
              <HStack gap={20} align={"flex-start"}>
                <VStack align={"stretch"} flex={3} gap={8}>
                  <VStack align={"stretch"}>
                    <Text fontSize={"14px"} fontWeight={400} color="#6A6A6A">
                      {t("Project URL")}
                    </Text>
                    <Input defaultValue={appMetadata?.external_url ?? ""} {...register("external_url")} />
                  </VStack>
                  <Skeleton isLoaded={!appMetadataLoading}>
                    <Text fontSize={"md"}>
                      {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
                    </Text>
                  </Skeleton>
                </VStack>
                <EditAppSocialMediaUrls form={form} />
              </HStack>
            </VStack>
          </Flex>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
