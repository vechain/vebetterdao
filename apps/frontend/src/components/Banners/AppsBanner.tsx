import { Card, Text, Image, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const AppsBanner = () => {
  const { t } = useTranslation()
  return (
    <Card
      bg="#004CFC"
      h={{ base: "220px", md: "195px" }}
      p="24px"
      justifyContent="center"
      pr={{ base: "130px", md: "200px" }}
      color="white"
      position="relative"
      overflow="visible"
      objectFit="contain"
      bgImage={"/images/cloud-background.png"}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      w="full">
      <Stack align="stretch">
        <Text fontSize={{ base: "28px", md: "36px" }} fontWeight={700}>
          {t("Explore apps")}
        </Text>
        <Text fontSize="16px" fontWeight={400}>
          {t("Browse and discover dApps where you can earn tokens for sustainable actions.")}
        </Text>
      </Stack>
      <Image
        position="absolute"
        bottom="0"
        right={{ base: "-5%", md: "0" }}
        src="/images/mascot/mascot-explore-dapps@1x.webp"
        srcSet="/images/mascot/mascot-explore-dapps@1x.webp 1x, /images/mascot/mascot-explore-dapps@2x.webp 2x"
        alt="mascot-explore-dapps"
        boxSize="200px"
        overflow="visible"
        objectFit="contain"
      />
    </Card>
  )
}
