import { Button, Icon, Card } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { FaScaleBalanced } from "react-icons/fa6"

import HandPlantIcon from "@/components/Icons/svg/hand-plant.svg"
import { EmptyState } from "@/components/ui/empty-state"

type Props = {
  address: string
  isConnectedUser: boolean
  onExploreClick: () => void
}

export const EmptyVotedProposals = ({ address, isConnectedUser, onExploreClick }: Props) => {
  const { t } = useTranslation()

  return (
    <Card.Root variant="primary" w="full">
      <Card.Title textStyle="xl">{t("Voted Proposals")}</Card.Title>
      <Card.Body asChild>
        <EmptyState
          title={t("Voted Proposals")}
          description={t("{{subject}} voted proposals will appear here.", {
            subject: isConnectedUser ? "Your" : `${humanAddress(address ?? "", 4, 3)}`,
          })}
          icon={
            <Icon boxSize={20} color="actions.secondary.text-lighter">
              <HandPlantIcon color="rgba(117, 117, 117, 1)" />
            </Icon>
          }>
          <Button rounded={"full"} variant={"primary"} onClick={onExploreClick}>
            <Icon color="actions.secondary.text-lighter">
              <FaScaleBalanced />
            </Icon>
            {t("Explore governance")}
          </Button>
        </EmptyState>
      </Card.Body>
    </Card.Root>
  )
}
