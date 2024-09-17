import { useUserEndorsementScore } from "@/api"
import { Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

interface UserEndorsementInfoProps {
  address: string
}

export const UserEndorsementInfo = ({ address }: UserEndorsementInfoProps) => {
  const { data: score } = useUserEndorsementScore(address)
  const { t } = useTranslation()

  return <Text>{t("{{value}} pts.", { value: score })}</Text>
}
