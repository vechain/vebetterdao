import { UseFormReturn } from "react-hook-form"
import { EditAppForm } from ".."
import { Flex, Heading, IconButton, Image, Input, Text, VStack } from "@chakra-ui/react"
import { AVG_PHONE_WIDTH, notFoundImage, VE_WOLRD_SCALING_FACTOR, IMAGE_REQUIREMENTS } from "@/constants"
import { useCallback, useEffect, useRef, useState } from "react"
import { UilPen } from "@iconscout/react-unicons"
import { blobToBase64 } from "@/utils/BlobUtils"
import { handleImageCompression } from "@/utils/imageListCompression"
import { useTranslation } from "react-i18next"
import { validateImage } from "@/utils"
import { toaster } from "@/components/ui/toaster"
import { VeWorldFeaturedImageGuidelines } from "@/components/CreateEditAppForm"

type Props = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}

export const EditVeWorldFeatureImage = ({ form }: Props) => {
  const featuredImage = form.watch("ve_world_featured_image")
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const [invalidFormat, setInvalidFormat] = useState(false)
  const [invalidMessage, setInvalidMessage] = useState("Invalid image format")
  const [computedWidth, setComputedWidth] = useState(0)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setComputedWidth(Math.min(window.innerWidth, AVG_PHONE_WIDTH) / VE_WOLRD_SCALING_FACTOR)
    }
  }, [])
  const accept = IMAGE_REQUIREMENTS.ve_world_featured_image.mimeType

  const handleClickEdit = useCallback(() => inputRef.current?.click(), [])

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate image dimensions and ratio
        const validation = await validateImage(file, "ve_world_featured_image")

        setInvalidFormat(!validation.isValid)
        if (!validation.isValid) {
          setInvalidMessage(validation.error ?? "Invalid image format")
          return
        }

        const compressedFile = await handleImageCompression(file)
        const base64File = await blobToBase64(compressedFile)

        form.setValue("ve_world_featured_image", base64File, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        })
      } catch (error) {
        console.error("Upload error:", error)
        toaster.error({
          title: "Error",
          description: "An error occurred while uploading the featured image",
          duration: 5000,
          closable: true,
        })
      }
    },
    [form],
  )

  return (
    <VStack gap={2} align={"start"}>
      <Heading fontSize="24px" fontWeight="700">
        {t("Featured Image")}
      </Heading>
      <Flex w={computedWidth} h="76px" position={"relative"} rounded="12px" mt={4}>
        <Image
          src={featuredImage ?? notFoundImage}
          onError={e => {
            console.error("Image failed to load:", e)
            e.currentTarget.src = notFoundImage
          }}
          alt="ve_world_featured_image"
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
          <IconButton aria-label="Edit featured image" rounded={"full"} bg={"#00000033"} _hover={{ bg: "#00000033" }}>
            <UilPen color="#FFFFFF" />
          </IconButton>
        </Flex>
      </Flex>
      <Text fontSize={14} color={invalidFormat ? "red" : "gray"} pt={0}>
        {invalidFormat ? invalidMessage : <VeWorldFeaturedImageGuidelines />}
      </Text>
    </VStack>
  )
}
