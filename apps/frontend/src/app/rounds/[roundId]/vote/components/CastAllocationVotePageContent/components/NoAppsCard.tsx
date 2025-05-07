import { Box, VStack, Image, Button, Heading } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  onShowAllApps: () => void
}
export const NoAppsCard = ({ onShowAllApps }: Props) => {
  const { t } = useTranslation()

  return (
    <Box
      bg={"#FFF"}
      borderRadius={12}
      py={{ base: 5, md: 16 }}
      px={{ base: 5, md: 14 }}
      w={"full"}
      position={"relative"}
      overflow={"clip"}>
      <Image
        src="/assets/backgrounds/blue-cloud-bg-card.webp"
        position={"absolute"}
        alt="blue-cloud-bg"
        right={{ base: -140, md: 0 }}
        top={{ base: -115, md: -20 }}
        boxSize={{ base: "400px", md: "600px" }}
        zIndex={0}
      />
      <VStack w={{ base: "100%", md: "60%" }} alignContent={"flex-start"} zIndex={2} position={"relative"}>
        <Heading fontSize={24} fontWeight={700} alignSelf={"flex-start"}>
          {t("No Apps found")}
        </Heading>

        <Button onClick={onShowAllApps} variant={"primaryAction"} alignSelf={"flex-start"} mt={4} mb={2}>
          {t("Show all apps")}
        </Button>
      </VStack>
    </Box>
  )
}
