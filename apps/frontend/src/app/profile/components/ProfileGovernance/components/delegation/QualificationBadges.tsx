import { Badge, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const QualificationBadge = ({ qualified }: { qualified: boolean }) => {
  const { t } = useTranslation()
  const label = useBreakpointValue({
    base: qualified ? t("Qualified") : t("Not qualified"),
    lg: qualified ? t("Qualified to vote") : t("Not qualified to vote"),
  })
  return (
    <Badge
      color="white"
      bg={qualified ? "#3DBA67" : "#C84968"}
      borderRadius="full"
      px="12px"
      py="4px"
      textTransform={"inherit"}>
      {label}
    </Badge>
  )
}
