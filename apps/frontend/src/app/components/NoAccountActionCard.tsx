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
      icon={
        <Icon boxSize={20} color="actions.secondary.text-lighter">
          <HandPlantIcon />
        </Icon>
      }
      title={t("Create or connect a wallet to start doing Better Actions")}>
      <ConnectWalletButton
        connectionVariant="modal"
        buttonStyleProps={{
          bg: "#E0E9FE",
          textColor: "var(--vbd-colors-brand-primary)",
          px: 10,
          leftIcon: <FaWallet />,
        }}
      />
    </EmptyState>
  )
}
