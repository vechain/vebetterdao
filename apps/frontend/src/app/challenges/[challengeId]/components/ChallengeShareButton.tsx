import { Badge, BadgeProps, Icon } from "@chakra-ui/react"
import { ShareIos } from "iconoir-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeShareModal } from "./ChallengeShareModal"

interface ChallengeShareButtonProps extends BadgeProps {
  challengeTitle: string
}

export const ChallengeShareButton = ({ challengeTitle, ...badgeProps }: ChallengeShareButtonProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Badge variant="neutral" size="sm" rounded="sm" cursor="pointer" onClick={() => setIsOpen(true)} {...badgeProps}>
        <Icon as={ShareIos} boxSize="3" />
        {t("Invite users")}
      </Badge>
      <ChallengeShareModal isOpen={isOpen} onClose={() => setIsOpen(false)} challengeTitle={challengeTitle} />
    </>
  )
}
