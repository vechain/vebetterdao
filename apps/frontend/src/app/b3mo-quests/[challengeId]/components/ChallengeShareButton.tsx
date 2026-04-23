import { Icon, IconButton, IconButtonProps } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuShare2 } from "react-icons/lu"

import { ChallengeShareModal } from "./ChallengeShareModal"

interface ChallengeShareButtonProps extends IconButtonProps {
  challengeTitle: string
}

export const ChallengeShareButton = ({ challengeTitle, ...buttonProps }: ChallengeShareButtonProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <IconButton
        minW="9"
        h="9"
        p="0"
        borderRadius="full"
        bg="actions.primary.default"
        color="actions.primary.text"
        _hover={{ bg: "actions.primary.hover" }}
        _active={{ bg: "actions.primary.pressed" }}
        aria-label={t("Invite users")}
        onClick={() => setIsOpen(true)}
        {...buttonProps}>
        <Icon as={LuShare2} boxSize="3" />
      </IconButton>
      <ChallengeShareModal isOpen={isOpen} onClose={() => setIsOpen(false)} challengeTitle={challengeTitle} />
    </>
  )
}
