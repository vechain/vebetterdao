import { Alert, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

type Props = {
  reason?: string
}

export const ProposalCanceledAlert = ({ reason }: Props) => {
  const { t } = useTranslation()
  return (
    <Alert.Root status="error" borderRadius="16px" border={"1px solid #D23F63"} bg="#FCEEF1">
      <Alert.Indicator>
        <UilInfoCircle size={"36px"} color="#D23F63" />
      </Alert.Indicator>
      <VStack align="flex-start" gap={1} ml={2}>
        <Alert.Title color="#D23F63" textStyle="md">
          {t("This proposal has been canceled by the creator or VeBetter and can no longer be supported.")}
        </Alert.Title>
        {reason ? (
          <Text color="#D23F63" textStyle="sm">
            {t("Reason")}
            {": "}
            {reason}
          </Text>
        ) : null}
      </VStack>
    </Alert.Root>
  )
}
