import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
import { RequirementModal } from "./RequirementModal"
import { AnalyticsUtils } from "@/utils"
import { Box, Image, Text, Button, useDisclosure } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useGetUserGMs } from "@/api"

export const CreateProposalCard = () => {
  const { account } = useWallet()
  const { open } = useWalletModal()
  const {
    isOpen: isRequirementModalOpen,
    onOpen: openRequirementModal,
    onClose: closeRequirementModal,
  } = useDisclosure()

  const { t } = useTranslation()

  //TODO: Move to a common hook
  const { data: userGMs } = useGetUserGMs(account?.address)
  const hasMoonNft = useMemo(() => {
    //TODO: Level should come from another hook or multiclause
    return userGMs?.some(gm => Number(gm.tokenLevel) >= 2)
  }, [userGMs])

  const onNewClick = useCallback(() => {
    if (!account?.address) {
      open()
      return
    }

    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CREATE_PROPOSAL))
    openRequirementModal()
  }, [account?.address, open, openRequirementModal])

  return (
    <>
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
      <RequirementModal isOpen={isRequirementModalOpen} onClose={closeRequirementModal} hasNft={hasMoonNft ?? false} />
    </>
  )
}
