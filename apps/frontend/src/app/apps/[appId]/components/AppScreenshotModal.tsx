import { notFoundImage } from "@/constants"
import {
  Container,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  images: string[]
  isOpen: boolean
  onClose: () => void
}
export const AppScreenshotModal = ({ images, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const headerBg = useColorModeValue("white", "gray.700")

  return (
    <Modal size={"100%"} isOpen={isOpen} onClose={onClose}>
      <ModalContent m={0} h={"100vh"} borderRadius={0} overflow={"auto"}>
        <ModalHeader pos="sticky" top={0} left={0} bg={headerBg}>
          <Heading size={"md"}>{t("Screenshots")}</Heading>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          <Container maxW={["full", "full", "container.xl"]}>
            <VStack gap={4}>
              {images.map((image, index) => (
                <Image
                  borderRadius={"8px"}
                  key={index}
                  src={image ?? notFoundImage}
                  alt={`Screenshot ${index}`}
                  w="auto"
                  h="auto"
                  maxH="100vh"
                />
              ))}
            </VStack>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
