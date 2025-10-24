import { Alert } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const ProposalCanceledAlert = () => {
  const { t } = useTranslation()
  return (
    <Alert.Root status="error" borderRadius="16px" border={"1px solid #D23F63"} bg="#FCEEF1">
      <Alert.Indicator>
        <UilInfoCircle size={"36px"} color="#D23F63" />
      </Alert.Indicator>
      <Alert.Title color="#D23F63" ml={2} textStyle="md">
        {t("This proposal has been canceled by the creator or VeBetter and can no longer be supported.")}
      </Alert.Title>
    </Alert.Root>
  )
}
