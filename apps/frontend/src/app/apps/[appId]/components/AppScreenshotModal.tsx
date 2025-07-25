import { notFoundImage } from "@/constants"
import { Container, Heading, Image, Dialog, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { v4 as uuid } from "uuid"
import { useColorModeValue } from "@/components/ui/color-mode"

type Props = {
  images: string[]
  isOpen: boolean
  onClose: () => void
}
export const AppScreenshotModal = ({ images, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const headerBg = useColorModeValue("white", "gray.700")

  return (
    <Dialog.Root size={"full"} open={isOpen} onOpenChange={details => !details.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Content m={0} h={"100vh"} borderRadius={0} overflow={"auto"}>
        <Dialog.Header pos="sticky" top={0} left={0} bg={headerBg}>
          <Heading size={"md"}>{t("Screenshots")}</Heading>
          <Dialog.CloseTrigger />
        </Dialog.Header>
        <Dialog.Body>
          <Container maxW={["full", "full", "breakpoint-xl"]}>
            <VStack gap={4}>
              {images.map((image, index) => (
                <Image
                  borderRadius={"8px"}
                  key={`screenshot-modal-${uuid()}`}
                  src={image ?? notFoundImage}
                  alt={`Screenshot ${index + 1}`}
                  w="auto"
                  h="auto"
                  maxH="100vh"
                />
              ))}
            </VStack>
          </Container>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog.Root>
  )
}
