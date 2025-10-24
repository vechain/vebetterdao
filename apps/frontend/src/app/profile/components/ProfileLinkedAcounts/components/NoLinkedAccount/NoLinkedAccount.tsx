import { Button, useDisclosure, Icon } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import PeopleIcon from "@/components/Icons/svg/people.svg"
import { EmptyState } from "@/components/ui/empty-state"

import { useAccountLinking } from "../../../../../../api/contracts/vePassport/hooks/useAccountLinking"

import { LinkAccountModal } from "./components/LinkAccountModal"

type Props = {
  address: string
}
export const NoLinkedAccount = ({ address }: Props) => {
  const { t } = useTranslation()
  const addLinkedAccountModal = useDisclosure()
  const { isLoading, isLinked, outgoingPendingLink } = useAccountLinking(address)
  const { account: connectedAccount } = useWallet()
  const isConnectedUser = compareAddresses(connectedAccount?.address ?? "", address)
  if (isLoading || isLinked || outgoingPendingLink) return null
  return (
    <EmptyState
      title={isConnectedUser ? t("You have no linked accounts") : t("No linked accounts")}
      description={
        isConnectedUser
          ? t("You can merge several secondary accounts with your main one")
          : t("Several secondary accounts can be merged with the user's account.")
      }
      icon={<Icon as={PeopleIcon} color="icon.default" boxSize="24" />}>
      {isConnectedUser && (
        <Button variant="primary" onClick={addLinkedAccountModal.onOpen}>
          {t("Link Accounts")}
        </Button>
      )}
      <LinkAccountModal modal={addLinkedAccountModal} />
    </EmptyState>
  )
}
