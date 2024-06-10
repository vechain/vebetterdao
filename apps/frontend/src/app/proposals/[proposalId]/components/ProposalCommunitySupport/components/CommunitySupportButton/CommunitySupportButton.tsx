import { Button, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { CommunitySupportModal } from "./components/CommunitySupportModal"
import { useCurrentProposal } from "@/api"
import { useCallback } from "react"
import { useWallet, useWalletModal } from "@vechain/dapp-kit-react"

export const CommunitySupportButton = () => {
  const { account } = useWallet()
  const { open: openConnectModal } = useWalletModal()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()

  const handleClick = useCallback(() => {
    if (!account) {
      openConnectModal()
      return
    }
    onOpen()
  }, [account, onOpen, openConnectModal])

  return (
    <>
      {!proposal.isDepositReached && (
        <Button onClick={handleClick} variant="primaryAction">
          {t("Support this proposal")}
        </Button>
      )}
      <CommunitySupportModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
