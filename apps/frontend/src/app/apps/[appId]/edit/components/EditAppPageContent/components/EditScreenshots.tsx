import { Button, HStack, Heading, IconButton, Image, Input, Text, VStack, useToast } from "@chakra-ui/react"
import { Controller, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { ChangeEvent, useCallback, useRef, useState } from "react"
import { UilDraggabledots, UilTrash, UilUpload } from "@iconscout/react-unicons"
import { EditAppForm } from ".."
import { imageListCompression } from "@/utils/imageListCompression"
import { blobToBase64 } from "@/utils/BlobUtils"
import { Reorder, useDragControls } from "framer-motion"
import { IMAGE_REQUIREMENTS, SCREENSHOT_UPLOAD_GUIDELINES } from "@/constants"
import { validateImage } from "@/utils"

type Props = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}

export const EditScreenshots = ({ form }: Props) => {
  const { t } = useTranslation()
  const inputFile = useRef<HTMLInputElement>(null)
  const screenshots = form.watch("screenshots")
  const toast = useToast()
  const [loadingScreenshot, setLoadingScreenshot] = useState(false)
  const [invalidFormat, setInvalidFormat] = useState(false)
  const [invalidMessage, setInvalidMessage] = useState("Invalid image format")
  const accept = IMAGE_REQUIREMENTS.screenshot.mimeType

  const handleUpload = useCallback(() => {
    inputFile.current?.click()
  }, [])

  const handleImageUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      try {
        setLoadingScreenshot(true)
        const files = Array.from(e.target.files || [])

        // Validate each file
        for (const file of files) {
          const validation = await validateImage(file, "screenshot")
          setInvalidFormat(!validation.isValid)
          if (!validation.isValid) {
            setInvalidMessage(validation.error ?? "Invalid image format")
            setLoadingScreenshot(false)
            return
          }
        }

        const compressedFiles = await imageListCompression(files)
        const base64Files = await Promise.all(compressedFiles.map(blobToBase64))
        form.setValue("screenshots", [...screenshots, ...base64Files])
        setInvalidFormat(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while uploading the images",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        console.error(error)
        setInvalidFormat(true)
        setInvalidMessage("Error uploading images")
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
        <VStack align="flex-start" spacing={1}>
          <Heading fontSize="24px" fontWeight="700">
            {t("Edit screenshots")}
          </Heading>
          <Text fontSize={14} color={invalidFormat ? "red" : "gray"}>
            {invalidFormat ? invalidMessage : t(SCREENSHOT_UPLOAD_GUIDELINES)}
          </Text>
        </VStack>
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
            <Input type="file" ref={inputFile} display="none" multiple accept={accept} onChange={handleImageUpload} />
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
          <DraggableScreenshot
            key={screenshot}
            screenshot={screenshot}
            index={index}
            screenshots={screenshots}
            form={form}
          />
        ))}
      </Reorder.Group>
    </VStack>
  )
}
const DraggableScreenshot = ({
  key,
  screenshot,
  index,
  screenshots,
  form,
}: {
  key: string
  screenshot: string
  index: number
  screenshots: string[]
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}) => {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      key={key}
      value={screenshot}
      as="div"
      style={{
        display: "inline-block",
        width: "auto",
        height: "400px",
        margin: "0 8px",
        position: "relative",
        maxWidth: "80vw",
      }}
      dragListener={false}
      dragControls={dragControls}>
      <HStack
        bg="rgba(0, 0, 0, 0.2)"
        width="100%"
        height="50px"
        position="absolute"
        top={0}
        justifyContent="space-between"
        padding="8px"
        style={{ touchAction: "none" }}>
        <IconButton
          rounded="full"
          color="white"
          bgColor="transparent"
          _hover={{ bgColor: "gray.600" }}
          aria-label="Drag screenshot"
          icon={<UilDraggabledots size="24px" />}
          onPointerDown={event => dragControls.start(event)}
        />
        <IconButton
          rounded="full"
          color="#D23F63"
          bgColor="#FCEEF1"
          _hover={{ bgColor: "#FCEEF1DD" }}
          aria-label="Delete screenshot"
          icon={<UilTrash size="24px" />}
          onClick={() => {
            form.setValue(
              "screenshots",
              screenshots.filter((_, i) => i !== index),
            )
          }}
        />
      </HStack>
      <Image src={screenshot} alt={`Screenshot ${index + 1}`} h="full" objectFit="contain" draggable="false" />
    </Reorder.Item>
  )
}
