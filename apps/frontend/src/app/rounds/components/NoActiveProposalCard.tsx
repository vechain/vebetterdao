import { EmptyState } from "@/components/ui/empty-state"
import { Image } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const NoActiveProposalCard = () => {
  const { t } = useTranslation()

  return (
    <EmptyState
      size="lg"
      icon={<Image src="/assets/icons/no-proposals-icon.svg" boxSize={"78px"} alt="No proposals" />}
      title={t("There are no active proposals in this round")}
    />
  )
}
