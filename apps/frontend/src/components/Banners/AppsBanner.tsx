import { Card, Text, Image, Stack, Heading } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const AppsBanner = () => {
  const { t } = useTranslation()
  return (
    <Card.Root
      bg="banner.blue"
      h={{ base: "220px", md: "195px" }}
      p="24px"
      justifyContent="center"
      pr={{ base: "130px", md: "200px" }}
      color="white"
      position="relative"
      overflow="visible"
      objectFit="contain"
      bgImage={"/assets/backgrounds/cloud-background.webp"}
      bgSize="cover"
      backgroundPosition="center"
      bgRepeat="no-repeat"
      w="full">
      <Stack alignItems="stretch">
        <Heading size="2xl" color="text.default">
          {t("Explore apps")}
        </Heading>
        <Text textStyle="md" color="info.secondary">
          {t("Browse and discover apps where you can earn tokens for sustainable actions.")}
        </Text>
      </Stack>
      <Image
        position="absolute"
        bottom="0"
        right={{ base: "-5%", md: "0" }}
        src="/assets/mascot/mascot-explore-dapps@1x.webp"
        srcSet="/assets/mascot/mascot-explore-dapps@1x.webp 1x, /assets/mascot/mascot-explore-dapps@2x.webp 2x"
        alt="mascot-explore-dapps"
        boxSize="200px"
        overflow="visible"
        objectFit="contain"
      />
    </Card.Root>
  )
}
