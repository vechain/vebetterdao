import { Box, VStack, Image, Text, Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const NoProposalsCard = () => {
  const router = useRouter()

  const { t } = useTranslation()

  const onNewClick = useCallback(() => {
    router.push("/proposals/new")
  }, [router])

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
        src="/images/blue-cloud-bg-card.png"
        position={"absolute"}
        alt="blue-cloud-bg"
        right={{ base: -140, md: 0 }}
        top={{ base: -115, md: -20 }}
        boxSize={{ base: "400px", md: "600px" }}
        zIndex={0}
      />
      <VStack w={{ base: "100%", md: "60%" }} alignContent={"flex-start"} zIndex={2} position={"relative"}>
        <Text
          fontSize={24}
          fontWeight={700}
          style={{ fontFamily: "Instrument Sans, sans-serif" }}
          alignSelf={"flex-start"}>
          {t("No Proposals Found")}
        </Text>
        <Text fontSize={16} fontWeight={400} mt={2} color={"#6A6A6A"}>
          {t("Have an idea for something that could improve the experience in VeBetterDAO? ")}
          <b style={{ color: "black" }}>{t("Create a proposal")}</b>
          {t(" and let the community vote to make it happen!")}
        </Text>
        <Button onClick={onNewClick} variant={"primaryAction"} alignSelf={"flex-start"} mt={4} mb={2}>
          {t("Create proposal")}
        </Button>
      </VStack>
    </Box>
  )
}
