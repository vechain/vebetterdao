import { Box, Button, HStack, Heading, IconButton, Image, Input, Text, VStack, useToast } from "@chakra-ui/react"
import { Controller, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { ChangeEvent, useCallback, useRef, useState } from "react"
import { UilTrash, UilUpload } from "@iconscout/react-unicons"
import { EditAppForm } from ".."
import { imageListCompression } from "@/utils/imageListCompression"
import { blobToBase64 } from "@/utils/BlobUtils"
import { Reorder } from "framer-motion"

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
  const [loadingScreenshot, setLoadingScreenshot] = useState(false)

  const handleImageUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      try {
        setLoadingScreenshot(true)
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
      } finally {
        setLoadingScreenshot(false)
      }
    },
    [form, screenshots, toast],
  )

  const reorderScreenshots = useCallback(
    (screenshots: string[]) => {
      form.setValue("screenshots", screenshots)
    },
    [form],
  )

  return (
    <VStack align="stretch" gap={6}>
      <HStack justify={"space-between"} flexWrap={"wrap"}>
        <Heading fontSize="24px" fontWeight="700">
          {t("Edit screenshots")}
        </Heading>
        <Button
          variant="primaryAction"
          onClick={handleUpload}
          leftIcon={<UilUpload size="16px" />}
          isLoading={loadingScreenshot}>
          {t("Upload")}
        </Button>
        <Controller
          name="screenshots"
          render={() => (
            <Input type="file" ref={inputFile} display="none" multiple accept="image/*" onChange={handleImageUpload} />
          )}
          control={form.control}
        />
      </HStack>
      {screenshots.length === 0 && <Text color="#6A6A6A">{t("No screenshot added yet")}</Text>}
      <Reorder.Group
        axis="x"
        values={screenshots}
        onReorder={reorderScreenshots}
        layoutScroll
        as="div"
        style={{
          gap: "8px",
          alignItems: "center",
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}>
        {screenshots.map((screenshot, index) => (
          <Reorder.Item
            key={screenshot}
            value={screenshot}
            as="div"
            style={{
              display: "inline-block",
              width: "auto",
              height: "400px",
              margin: "0 8px",
              position: "relative",
            }}>
            <Box
              width="auto"
              height="400px"
              position="relative"
              rounded={"8px"}
              overflow={"hidden"}
              _hover={{
                cursor: "grab",
                border: "2px solid black",
              }}
              border="2px solid transparent"
              boxSizing="border-box">
              <Image
                src={screenshot}
                alt={`Screenshot ${index + 1}`}
                h="full"
                objectFit="cover"
                maxW="none"
                draggable="false"
              />
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
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </VStack>
  )
}
