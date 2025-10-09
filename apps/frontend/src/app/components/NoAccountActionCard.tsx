import { Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaWallet } from "react-icons/fa"

import { ConnectWalletButton } from "../../components/ConnectWalletButton/ConnectWalletButton"

import { EmptyState } from "@/components/ui/empty-state"
import HandPlantIcon from "@/components/Icons/svg/hand-plant.svg"

export const NoAccountActionCard = () => {
  const { t } = useTranslation()
  return (
    <EmptyState
      size="sm"
      bg="transparent"
      icon={
        <Icon boxSize={20} color="actions.tertiary.default">
          <HandPlantIcon />
        </Icon>
      }
      title={t("Create or connect a wallet to start doing Better Actions")}>
      <ConnectWalletButton
        connectionVariant="modal"
        buttonStyleProps={{
          leftIcon: <FaWallet />,
          px: "10",
          rounded: "full",
          color: "var(--vbd-colors-actions-primary-text)",
          bgColor: "var(--vbd-colors-actions-primary-default)",
          _hover: { bg: "var(--vbd-colors-actions-primary-hover)" },
          _disabled: { bg: "var(--vbd-colors-actions-primary-disabled)" },
          _focus: { bg: "var(--vbd-colors-actions-primary-pressed)" },
        }}
      />
    </EmptyState>
  )
}
