import { Button, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { CommunitySupportModal } from "./components/CommunitySupportModal"
import { useCurrentProposal } from "@/api"

export const CommunitySupportButton = () => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()
  return (
    <>
      <Button
        onClick={onOpen}
        bgColor={proposal.isDepositReached ? "#E1E1E1" : "#004CFC"}
        disabled={proposal.isDepositReached}
        color={"#FFFFFF"}
        rounded={"full"}
        fontSize={"16px"}
        fontWeight={500}>
        {t("Support this proposal")}
      </Button>
      <CommunitySupportModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
