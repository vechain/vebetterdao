import { Image } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/ui/empty-state"
import { useBreakpoints } from "@/hooks/useBreakpoints"

export const NoActiveProposalCard = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  return (
    <EmptyState
      size={isMobile ? "sm" : "md"}
      icon={<Image src="/assets/icons/no-proposals-icon.svg" boxSize={"78px"} alt="No proposals" />}
      title={t("There are no active proposals in this round")}
    />
  )
}
