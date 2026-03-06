import { Text, Button, useDisclosure, Card, Image } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useMetProposalCriteria } from "../../../../api/contracts/governance/hooks/useMetProposalCriteria"
import { ButtonClickProperties, buttonClicked, buttonClickActions } from "../../../../constants/AnalyticsEvents"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"

import { RequirementModal } from "./RequirementModal"

export const CreateProposalCard = () => {
  const { account } = useWallet()
  const { open } = useWalletModal()
  const { open: isRequirementModalOpen, onOpen: openRequirementModal, onClose: closeRequirementModal } = useDisclosure()
  const { t } = useTranslation()
  const { hasMetProposalCriteria } = useMetProposalCriteria()
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
      <Card.Root variant="primary" justifyContent="center" alignItems="center">
        <Image w={"300px"} src="/assets/mascot/mascot-proposal.png" alt="Proposal" />
        <Text textStyle="md" mt={2} color={"text.subtle"}>
          {t(
            "Have an idea for something that could improve the experience in VeBetter? Create a proposal and let the community vote to make it happen!",
          )}
        </Text>
        <Button onClick={onNewClick} w={"full"} variant={"primary"} mt={5}>
          {t("Create proposal")}
        </Button>
      </Card.Root>

      <RequirementModal
        isOpen={isRequirementModalOpen}
        onClose={closeRequirementModal}
        hasNft={hasMetProposalCriteria}
      />
    </>
  )
}
