import { UseFormReturn } from "react-hook-form"
import { EditAppForm } from ".."
import { Button, Flex, IconButton, Image, Input, Text, VStack, useToast } from "@chakra-ui/react"
import { notFoundImage } from "@/constants"
import { useCallback, useRef } from "react"
import { UilPen } from "@iconscout/react-unicons"
import { blobToBase64 } from "@/utils/BlobUtils"
import { handleImageCompression } from "@/utils/imageListCompression"
import { useTranslation } from "react-i18next"

type Props = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}

export const EditAppBanner = ({ form }: Props) => {
  const banner = form.watch("bannerImage")
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { t } = useTranslation()

  const handleClickEdit = useCallback(() => inputRef.current?.click(), [])

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0]
        if (file) {
          const compressedFile = await handleImageCompression(file)
          const base64File = await blobToBase64(compressedFile)
          form.setValue("bannerImage", base64File)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while uploading the banner",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        console.error(error)
      }
    },
    [form, toast],
  )

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = "/images/VeBetterDAO-Banner Size Guide.zip"
    link.download = "VeBetterDAO-Banner Size Guide.zip"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <VStack gap={2} align={"start"}>
      <Flex w="full" h="220px" flexBasis={"64px"} position={"relative"} rounded="16px">
        <Image
          src={banner ?? notFoundImage}
          alt={"banner"}
          maxWidth="none"
          h="220px"
          w="full"
          rounded="16px"
          objectFit={"cover"}
          objectPosition={"center"}
        />
        <Input type="file" accept="image/*" display={"none"} ref={inputRef} onChange={handleUpload} />
        <Flex
          rounded="16px"
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
          <IconButton
            aria-label="Edit banner"
            rounded={"full"}
            bg={"#00000033"}
            _hover={{ bg: "#00000033" }}
            icon={<UilPen color="#FFFFFF" />}
          />
        </Flex>
      </Flex>
      <Text fontSize={"sm"} color={"gray"} pt={0}>
        {t(
          "App banners should be 1240×460 and have the most important content in a safe area of 820×240 in the center of the image to look good in every device.",
        )}
        <Button variant="link" colorScheme="blue" size={"sm"} pl={2} onClick={handleDownload}>
          {t("Download template")}
        </Button>
      </Text>
    </VStack>
  )
}
