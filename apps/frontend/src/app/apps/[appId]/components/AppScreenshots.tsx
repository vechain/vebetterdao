import { Box, Card, CardBody, Heading, Image, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCurrentAppMetadata } from "../hooks"

export const AppScreenshots = () => {
  const { t } = useTranslation()
  const { appMetadata } = useCurrentAppMetadata()
  const screenshots = [
    ...(appMetadata?.screenshots || []),
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/e2/63/96/e2639652-f17f-e7f5-0f0c-140d1c3293e9/304d3566-a34e-4f6b-82eb-8e41ce28e7d2_6.7-inch_Screenshot9.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/1f/11/6c/1f116cca-2839-0840-27e9-0c8df559809f/daac0b25-e231-4f25-859c-187532efafa1_6.7-inch_Screenshot6.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/87/a8/13/87a81350-2fac-48cf-2fcd-c74101787a8d/4c82ba92-a7be-422e-baed-a604a86e02f2_6.7-inch_Screenshot10.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/e2/63/96/e2639652-f17f-e7f5-0f0c-140d1c3293e9/304d3566-a34e-4f6b-82eb-8e41ce28e7d2_6.7-inch_Screenshot9.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/1f/11/6c/1f116cca-2839-0840-27e9-0c8df559809f/daac0b25-e231-4f25-859c-187532efafa1_6.7-inch_Screenshot6.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/87/a8/13/87a81350-2fac-48cf-2fcd-c74101787a8d/4c82ba92-a7be-422e-baed-a604a86e02f2_6.7-inch_Screenshot10.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/e2/63/96/e2639652-f17f-e7f5-0f0c-140d1c3293e9/304d3566-a34e-4f6b-82eb-8e41ce28e7d2_6.7-inch_Screenshot9.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/1f/11/6c/1f116cca-2839-0840-27e9-0c8df559809f/daac0b25-e231-4f25-859c-187532efafa1_6.7-inch_Screenshot6.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/87/a8/13/87a81350-2fac-48cf-2fcd-c74101787a8d/4c82ba92-a7be-422e-baed-a604a86e02f2_6.7-inch_Screenshot10.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/e2/63/96/e2639652-f17f-e7f5-0f0c-140d1c3293e9/304d3566-a34e-4f6b-82eb-8e41ce28e7d2_6.7-inch_Screenshot9.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/1f/11/6c/1f116cca-2839-0840-27e9-0c8df559809f/daac0b25-e231-4f25-859c-187532efafa1_6.7-inch_Screenshot6.png/460x0w.webp",
    "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/87/a8/13/87a81350-2fac-48cf-2fcd-c74101787a8d/4c82ba92-a7be-422e-baed-a604a86e02f2_6.7-inch_Screenshot10.png/460x0w.webp",
  ]

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
