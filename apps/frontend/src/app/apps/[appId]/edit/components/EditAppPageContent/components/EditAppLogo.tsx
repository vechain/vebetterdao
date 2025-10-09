import { Box, Circle, Flex, Image, Input, Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useCallback, useRef, useState } from "react"
import { UilPen } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

import { EditAppForm } from "../EditAppPageContent"
import { validateImage } from "../../../../../../../utils/ImageValidation"
import { IMAGE_REQUIREMENTS, LOGO_UPLOAD_GUIDELINES } from "../../../../../../../constants/XAppsMedia"

import { handleImageCompression } from "@/utils/imageListCompression"
import { blobToBase64 } from "@/utils/BlobUtils"
import { toaster } from "@/components/ui/toaster"

const notFoundImage = "/assets/images/image-not-found.webp"

type Props = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}

export const EditAppLogo = ({ form }: Props) => {
  const logo = form.watch("logoImage")
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const [invalidFormat, setInvalidFormat] = useState(false)
  const [invalidMessage, setInvalidMessage] = useState("Invalid image format")

  const handleClickEdit = useCallback(() => inputRef.current?.click(), [])
  const accept = IMAGE_REQUIREMENTS.logo.mimeType

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate image dimensions and ratio
        const validation = await validateImage(file, "logo")
        setInvalidFormat(!validation.isValid)
        if (!validation.isValid) {
          setInvalidMessage(validation.error ?? "Invalid image format")
          return
        }

        const compressedFile = await handleImageCompression(file)
        const base64File = await blobToBase64(compressedFile)
        form.setValue("logoImage", base64File)
      } catch (error) {
        toaster.error({
          title: "Error",
          description: "An error occurred while uploading the logo",
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
      <Text textStyle="md" fontWeight="semibold">
        {t("Logo")}
      </Text>
      <Flex w="64px" h="64px" flexBasis={"64px"} position={"relative"} rounded="16px">
        <Image
          src={logo ?? notFoundImage}
          alt={"logo"}
          maxWidth="none"
          h="full"
          w="64px"
          rounded="16px"
          objectFit={"cover"}
          objectPosition={"center"}
        />
        <Input type="file" accept={accept} display={"none"} ref={inputRef} onChange={handleUpload} />
        <Box>
          <Flex
            rounded="16px"
            w="64px"
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
            <Circle bg={"#00000033"} size={"30px"}>
              <UilPen color="white" size={"18px"} />
            </Circle>
          </Flex>
        </Box>
      </Flex>
      <Text textStyle="sm" color={invalidFormat ? "red" : "gray"} pt={0}>
        {invalidFormat ? invalidMessage : t(LOGO_UPLOAD_GUIDELINES)}
      </Text>
    </VStack>
  )
}
