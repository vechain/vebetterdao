import { Box, Button, HStack, Heading, IconButton, Image, Input, VStack, useToast } from "@chakra-ui/react"
import { Controller, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { ChangeEvent, useCallback, useRef } from "react"
import { UilTrash, UilUpload } from "@iconscout/react-unicons"
import { EditAppForm } from ".."
import { imageListCompression } from "@/utils/imageListCompression"
import { blobToBase64 } from "@/utils/BlobUtils"

type Props = {
  form: UseFormReturn<EditAppForm, any, undefined>
}

export const EditScreenshots = ({ form }: Props) => {
  const { t } = useTranslation()
  const inputFile = useRef<HTMLInputElement>(null)
  const handleUpload = useCallback(() => {
    inputFile.current?.click()
  }, [])
  const screenshots = form.watch("screenshots")
  const toast = useToast()

  const handleImageUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      try {
        const files = Array.from(e.target.files || [])
        const compressedFiles = await imageListCompression(files)
        const base64Files = await Promise.all(compressedFiles.map(blobToBase64))
        form.setValue("screenshots", [...screenshots, ...base64Files])
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while uploading the images",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        console.error(error)
      }
    },
    [form, screenshots, toast],
  )

  return (
    <VStack align="stretch" gap={6}>
      <HStack justify={"space-between"}>
        <Heading fontSize="24px" fontWeight="700">
          {t("Edit screenshots")}
        </Heading>
        <Button variant="primaryAction" onClick={handleUpload} leftIcon={<UilUpload size="16px" />}>
          {t("Upload new screenshots")}
        </Button>
        <Controller
          name="screenshots"
          render={() => (
            <Input type="file" ref={inputFile} display="none" multiple accept="image/*" onChange={handleImageUpload} />
          )}
          control={form.control}
        />
      </HStack>
      <Box overflowX="auto" gap={4} whiteSpace={"nowrap"}>
        {screenshots.map((screenshot, index) => (
          <Box
            key={index}
            w="auto"
            maxW="700px"
            h="400px"
            borderRadius="8px"
            overflow="hidden"
            display={"inline-block"}
            mx={2}
            position="relative">
            <Image src={screenshot} alt={`Screenshot ${index + 1}`} w="full" h="full" objectFit="cover" />
            <IconButton
              rounded="full"
              color="#D23F63"
              bgColor="#FCEEF1"
              _hover={{ bgColor: "#FCEEF1DD" }}
              aria-label="Delete screenshot"
              icon={<UilTrash size="24px" />}
              position="absolute"
              top={2}
              right={2}
              colorScheme="red"
              onClick={() => {
                form.setValue(
                  "screenshots",
                  screenshots.filter((_, i) => i !== index),
                )
              }}
            />
          </Box>
        ))}
      </Box>
    </VStack>
  )
}
