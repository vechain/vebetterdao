import { Button, HStack, Heading, IconButton, Image, Input, Text, VStack } from "@chakra-ui/react"
import { Controller, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { ChangeEvent, useCallback, useRef, useState } from "react"
import { UilDraggabledots, UilTrash, UilUpload } from "@iconscout/react-unicons"
import { EditAppForm } from ".."
import { imageListCompression } from "@/utils/imageListCompression"
import { blobToBase64 } from "@/utils/BlobUtils"
import { Reorder, useDragControls } from "framer-motion"
import { toaster } from "@/components/ui/toaster"

type Props = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}

export const EditScreenshots = ({ form }: Props) => {
  const { t } = useTranslation()
  const inputFile = useRef<HTMLInputElement>(null)
  const handleUpload = useCallback(() => {
    inputFile.current?.click()
  }, [])
  const screenshots = form.watch("screenshots")
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
        toaster.error({
          title: "Error",
          description: "An error occurred while uploading the images",
          duration: 5000,
          closable: true,
        })
        console.error(error)
      } finally {
        setLoadingScreenshot(false)
      }
    },
    [form, screenshots],
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
          loading={loadingScreenshot}>
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
          onPointerDown={event => dragControls.start(event)}>
          <UilDraggabledots size="24px" />
        </IconButton>
        <IconButton
          rounded="full"
          color="#D23F63"
          bgColor="#FCEEF1"
          _hover={{ bgColor: "#FCEEF1DD" }}
          aria-label="Delete screenshot"
          onClick={() => {
            form.setValue(
              "screenshots",
              screenshots.filter((_, i) => i !== index),
            )
          }}>
          <UilTrash size="24px" />
        </IconButton>
      </HStack>
      <Image src={screenshot} alt={`Screenshot ${index + 1}`} h="full" objectFit="contain" draggable="false" />
    </Reorder.Item>
  )
}
