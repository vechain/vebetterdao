import { UseFormReturn } from "react-hook-form"
import { EditAppForm } from ".."
import { Box, Circle, Flex, Image, Input, Text, VStack } from "@chakra-ui/react"
import { LOGO_UPLOAD_GUIDELINES, notFoundImage } from "@/constants"
import { useCallback, useRef } from "react"
import { UilPen } from "@iconscout/react-unicons"
import { blobToBase64 } from "@/utils/BlobUtils"
import { handleImageCompression } from "@/utils/imageListCompression"
import { useTranslation } from "react-i18next"
import { toaster } from "@/components/ui/toaster"

type Props = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}

export const EditAppLogo = ({ form }: Props) => {
  const logo = form.watch("logoImage")
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const handleClickEdit = useCallback(() => inputRef.current?.click(), [])

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0]
        if (file) {
          const compressedFile = await handleImageCompression(file)
          const base64File = await blobToBase64(compressedFile)
          form.setValue("logoImage", base64File)
        }
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
      <Text fontSize={16} fontWeight={500}>
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
        <Input type="file" accept="image/*" display={"none"} ref={inputRef} onChange={handleUpload} />
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
              <UilPen color="#FFFFFF" size={"18px"} />
            </Circle>
          </Flex>
        </Box>
      </Flex>
      <Text fontSize={14} color={"gray"} pt={0}>
        {t(LOGO_UPLOAD_GUIDELINES)}
      </Text>
    </VStack>
  )
}
