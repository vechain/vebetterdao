import { Card, CardBody, Flex, Heading, Image, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCurrentAppScreenshots } from "../hooks/useCurrentAppScreenshots"

export const AppScreenshots = () => {
  const { t } = useTranslation()
  const { screenshots } = useCurrentAppScreenshots()

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
          <Flex overflowX="auto" gap={4}>
            {screenshots.map((screenshot, index) => (
              <Flex key={index} w="auto" h="400px" borderRadius="8px" display={"inline-block"} position="relative">
                <Image
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
      </CardBody>
    </Card>
  )
}
