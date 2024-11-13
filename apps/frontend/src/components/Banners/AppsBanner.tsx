import { Card, Image, Text, Stack, useMediaQuery } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const AppsBanner = () => {
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const { t } = useTranslation()
  return (
    <Card
      bg="#004CFC"
      rounded="12px"
      p="24px"
      color="white"
      position="relative"
      overflow={"hidden"}
      bgImage={"/images/cloud-background.png"}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat">
      <Stack justify={"space-between"} direction={isAbove1200 ? "row" : "column"} align="center" gap="24px">
        <Stack direction={isAbove1200 ? "row" : "column"} gap="24px" align="center">
          <Image src="/images/gift.svg" alt="rewards" boxSize={"72px"} />
          <Stack align="stretch">
            <Text fontSize="2xl" fontWeight={600} align={isAbove1200 ? "left" : "center"}>
              {t("Explore apps")}
            </Text>
            <Text align={isAbove1200 ? "left" : "center"}>
              {t("Browse and discover dApps where you can earn tokens for sustainable actions.")}
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  )
}
