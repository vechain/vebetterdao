import { Alert, AlertTitle } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const ProposalCanceledAlert = () => {
  const { t } = useTranslation()
  return (
    <Alert status="error" borderRadius="16px" border={"1px solid #D23F63"} bg="#FCEEF1">
      <UilInfoCircle size={"36px"} color="#D23F63" />
      <AlertTitle color="#D23F63" ml={2} fontSize="14px">
        {t("This proposal has been cancelled by the creator or VeBetter and can no longer be supported.")}
      </AlertTitle>
    </Alert>
  )
}
