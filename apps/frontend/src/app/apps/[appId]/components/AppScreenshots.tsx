import { Card, CardBody, Flex, Heading, Image, useDisclosure, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCurrentAppScreenshots } from "../hooks/useCurrentAppScreenshots"
import { AppScreenshotModal } from "./AppScreenshotModal"

export const AppScreenshots = () => {
  const { t } = useTranslation()
  const { screenshots } = useCurrentAppScreenshots()

  const { isOpen, onClose, onOpen } = useDisclosure()

  if (screenshots.length === 0) {
    return null
  }
  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <Heading fontSize="24px" fontWeight="700">
            {t("Screenshots")}
          </Heading>
          <Flex overflowX="auto" gap={4} onClick={onOpen} cursor={"pointer"}>
            {screenshots.map((screenshot, index) => (
              <Flex key={index} w="auto" h="400px" borderRadius="8px" display={"inline-block"} position="relative">
                <Image
                  borderRadius={"8px"}
                  src={screenshot}
                  alt={`Screenshot ${index + 1}`}
                  w="auto"
                  h="full"
                  maxW="none"
                  objectFit="cover"
                />
              </Flex>
            ))}
          </Flex>
        </VStack>
        <AppScreenshotModal images={screenshots} isOpen={isOpen} onClose={onClose} />
      </CardBody>
    </Card>
  )
}
