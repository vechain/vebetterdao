import { UseFormReturn } from "react-hook-form"
import { EditAppForm } from ".."
import { Flex, Heading, IconButton, Image, Input, Text, VStack } from "@chakra-ui/react"
import {
  VEWORLD_BANNER_UPLOAD_GUIDELINES,
  AVG_PHONE_WIDTH,
  notFoundImage,
  VE_WOLRD_SCALING_FACTOR,
  IMAGE_REQUIREMENTS,
} from "@/constants"
import { useCallback, useRef } from "react"
import { UilPen } from "@iconscout/react-unicons"
import { blobToBase64 } from "@/utils/BlobUtils"
import { handleImageCompression } from "@/utils/imageListCompression"
import { useTranslation } from "react-i18next"
import { toaster } from "@/components/ui/toaster"

type Props = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}

export const EditVeWorldBanner = ({ form }: Props) => {
  const banner = form.watch("ve_world_bannerImage")
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const computedWidth = Math.min(window.innerWidth, AVG_PHONE_WIDTH) / VE_WOLRD_SCALING_FACTOR
  const accept = IMAGE_REQUIREMENTS.ve_world_banner.mimeType
  const handleClickEdit = useCallback(() => inputRef.current?.click(), [])

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0]
        if (file) {
          const compressedFile = await handleImageCompression(file)
          const base64File = await blobToBase64(compressedFile)
          form.setValue("ve_world_bannerImage", base64File)
        }
      } catch (error) {
        toaster.error({
          title: "Error",
          description: "An error occurred while uploading the banner",
          duration: 5000,
          closable: true,
        })
        console.error(error)
      }
    },
    [form],
  )

  return (
    <VStack gap={2} align={"start"}>
      <Heading size="2xl">{t("Banner")}</Heading>
      <Flex w={computedWidth} h="76px" position={"relative"} rounded="12px" mt={4}>
        <Image
          src={banner ?? notFoundImage}
          alt="ve_world_banner"
          style={{ height: 76, width: computedWidth, borderRadius: 12, overflow: "hidden" }}
          objectFit="cover"
        />
        <Input type="file" accept={accept} display={"none"} ref={inputRef} onChange={handleUpload} />
        <Flex
          rounded="12px"
          top={0}
          right={0}
          left={0}
          bottom={0}
          position="absolute"
          alignItems="center"
          justifyContent="center"
          bg={"#00000005"}
          cursor={"pointer"}
          _hover={{ bg: "#00000033" }}
          onClick={handleClickEdit}>
          <IconButton aria-label="Edit banner" rounded={"full"} bg={"#00000033"} _hover={{ bg: "#00000033" }}>
            <UilPen color="#FFFFFF" />
          </IconButton>
        </Flex>
      </Flex>
      <Text textStyle="sm" color={"gray"} pt={0}>
        {t(VEWORLD_BANNER_UPLOAD_GUIDELINES)}
      </Text>
    </VStack>
  )
}
