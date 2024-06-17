import { UseFormReturn } from "react-hook-form"
import { EditAppForm } from ".."
import { Box, Flex, Image, Input, useToast } from "@chakra-ui/react"
import { notFoundImage } from "@/constants"
import { useCallback, useRef } from "react"
import { UilPen } from "@iconscout/react-unicons"
import { blobToBase64 } from "@/utils/BlobUtils"
import { handleImageCompression } from "@/utils/imageListCompression"

type Props = {
  form: UseFormReturn<EditAppForm, any, undefined>
}

export const EditAppLogo = ({ form }: Props) => {
  const logo = form.watch("logoImage")
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

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
        toast({
          title: "Error",
          description: "An error occurred while uploading the logo",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        console.error(error)
      }
    },
    [form, toast],
  )

  return (
    <Flex w="64px" h="64px" flexBasis={"64px"} position={"relative"} rounded="16px">
      <Image
        src={logo ?? notFoundImage}
        alt={"logo"}
        maxWidth="none"
        h="fulle"
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
          <UilPen color="#FFFFFF" />
        </Flex>
      </Box>
    </Flex>
  )
}
