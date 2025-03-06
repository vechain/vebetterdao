import { Alert, AlertIcon, Text, Link } from "@chakra-ui/react"
import { Trans } from "react-i18next"

export type WarningType = "OUT" | "LOW"
interface WarningConfig {
  textColor: string
  color: string
  description: string | React.ReactElement
  onLearnMore: () => void
}

export const BalanceWarnings = ({ type }: { type: WarningType }) => {
  const warningConfigs: Record<WarningType, WarningConfig> = {
    LOW: {
      textColor: "#AF5F00",
      color: "#FFF3E5",
      description: (
        <Trans
          i18nKey="You're running low on tokens for rewards distribution <Link>Learn more.</Link>"
          components={{
            Link: <Link color="#AF5F00" textDecoration="underline" />,
          }}
        />
      ),
      onLearnMore: () => {
        // TODO: Add the docs link about running low( LINK TO #how to add funds in the rewards pool)
        window.open("", "_blank")
      },
    },
    OUT: {
      textColor: "#C84968",
      color: "#FCEEF1",
      description: (
        <Trans
          i18nKey="You're running out on tokens for rewards distribution <Link>Learn more.</Link>"
          components={{
            Link: <Link color="#C84968" textDecoration="underline" />,
          }}
        />
      ),
      onLearnMore: () => {
        // TODO: Add the docs link about running out( LINK TO Q&A)
        window.open("", "_blank")
      },
    },
  }
  const config = warningConfigs[type]

  return (
    <Alert status="warning" variant="solid" bg={config.color} borderRadius="md">
      <AlertIcon color={config.textColor} />
      <Text color={config.textColor} fontSize="sm" mr={2}>
        {config.description}
      </Text>
    </Alert>
  )
}
