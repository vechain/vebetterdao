import { Box, Card, CardBody, Heading, Image, VStack } from "@chakra-ui/react"
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
                mr={4}
                position="relative">
                <Image src={screenshot} alt={`Screenshot ${index + 1}`} w="full" h="full" objectFit="cover" />
              </Box>
            ))}
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )
}
