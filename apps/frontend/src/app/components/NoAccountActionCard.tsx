import { ConnectWalletButton } from "@/components"
import { EmptyState } from "@/components/ui/empty-state"
import { Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaWallet } from "react-icons/fa"
import HandPlantIcon from "@/components/Icons/svg/hand-plant.svg"

export const NoAccountActionCard = () => {
  const { t } = useTranslation()
  return (
    <EmptyState
      size="sm"
      bg="transparent"
      icon={
        <Icon boxSize={6} color="actions.tertiary.default">
          <HandPlantIcon />
        </Icon>
      }
      title={t("Create or connect a wallet to start doing Better Actions")}>
      <ConnectWalletButton
        connectionVariant="modal"
        buttonStyleProps={{
          bg: "#E0E9FE",
          textColor: "var(--vbd-colors-actions-primary-default)",
          px: 10,
          leftIcon: <FaWallet />,
        }}
      />
    </EmptyState>
  )
}
