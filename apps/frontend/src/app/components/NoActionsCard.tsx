import { Button, Icon } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { PiSquaresFourFill } from "react-icons/pi"

import { EmptyState } from "@/components/ui/empty-state"
import HandPlantIcon from "@/components/Icons/svg/hand-plant.svg"

export const NoActionsCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  return (
    <EmptyState
      bg="transparent"
      size="sm"
      icon={
        <Icon boxSize={20} color="actions.secondary.text-lighter">
          <HandPlantIcon />
        </Icon>
      }
      title={t("Use the Apps to do some Better Actions and earn tokens!")}>
      <Button rounded={"full"} variant={"secondary"} onClick={() => router.push("/apps")}>
        <Icon color="actions.secondary.text-lighter">
          <PiSquaresFourFill />
        </Icon>
        {t("Explore Apps")}
      </Button>
    </EmptyState>
  )
}
