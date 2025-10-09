import { Text, Button, useDisclosure, Icon, Card } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useMetProposalCriteria } from "../../../../api/contracts/governance/hooks/useMetProposalCriteria"
import { ButtonClickProperties, buttonClicked, buttonClickActions } from "../../../../constants/AnalyticsEvents"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"

import { RequirementModal } from "./RequirementModal"

import ProposalIcon from "@/components/Icons/svg/proposal.svg"

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
      <Card.Root variant="primary">
        <Icon as={ProposalIcon} boxSize={24} color="actions.tertiary.default" />
        <Text textStyle="2xl" fontWeight="bold" mt={4}>
          {t("Create a proposal")}
        </Text>
        <Text textStyle="md" mt={2} color={"#6A6A6A"}>
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
