import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
import { AnalyticsUtils } from "@/utils"
import { Box, Image, Text, Button } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const CreateProposalCard = () => {
  const router = useRouter()

  const { account } = useWallet()
  const { open } = useWalletModal()

  const { t } = useTranslation()

  const onNewClick = useCallback(() => {
    if (!account?.address) {
      open()
      return
    }

    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CREATE_PROPOSAL))
    router.push("/proposals/new")
  }, [account?.address, open, router])

  return (
    <Box
      bg={"contrast-on-dark-bg"}
      borderRadius={12}
      p={6}
      alignContent={"flex-start"}
      borderWidth={1}
      borderColor={"#D5D5D5"}>
      <Image src="/assets/icons/proposal.svg" alt="Proposal icon" boxSize={24} />
      <Text fontSize={24} fontWeight={700} mt={4}>
        {t("Create a proposal")}
      </Text>
      <Text fontSize={16} fontWeight={400} mt={2} color={"#6A6A6A"}>
        {t(
          "Have an idea for something that could improve the experience in VeBetterDAO? Create a proposal and let the community vote to make it happen!",
        )}
      </Text>
      <Button onClick={onNewClick} w={"full"} variant={"primaryAction"} mt={5}>
        {t("Create proposal")}
      </Button>
    </Box>
  )
}
