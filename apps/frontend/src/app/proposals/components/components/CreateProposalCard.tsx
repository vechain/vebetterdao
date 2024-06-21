import { Box, VStack, Image, Text, Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const CreateProposalCard = () => {
  const router = useRouter()

  const { t } = useTranslation()

  const onNewCLick = useCallback(() => {
    router.push("/proposals/new")
  }, [router])

  return (
    <Box bg={"white"} borderRadius={12} p={6} alignContent={"flex-start"} borderWidth={1} borderColor={"#D5D5D5"}>
      <Image src="/images/proposal.svg" alt="Proposal icon" boxSize={24} />
      <Text fontSize={24} fontWeight={700} mt={4}>
        {t("Create a proposal")}
      </Text>
      <Text fontSize={16} fontWeight={400} mt={2} color={"#6A6A6A"}>
        {t(
          "Have an idea for something that could improve the experience in VeBetterDAO? Create a proposal and let the community vote to make it happen!",
        )}
      </Text>
      <Button onClick={onNewCLick} w={"full"} variant={"primaryAction"} mt={5}>
        {t("Create proposal")}
      </Button>
    </Box>
  )
}
