import { useUserHasMinterRole } from "@/api"
import { Button, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { MinB3trModal } from "./MinB3trModal"
import { FormattingUtils } from "@repo/utils"

type Props = {}

const defaultMinterAddress = FormattingUtils.humanAddress("0x435933c8064b4Ae76bE665428e0307eF2cCFBD68")

export const MintB3trButton: React.FC<Props> = () => {
  const { account } = useWallet()
  const {
    data: hasMinterRole,
    isLoading: hasMinterRoleLoading,
    error,
    status,
  } = useUserHasMinterRole(account ?? undefined)

  const buttonDisabled = hasMinterRoleLoading || !hasMinterRole || status === "error"

  const { isOpen, onClose, onOpen } = useDisclosure()

  if (!account) return <></>

  if (!hasMinterRole && !hasMinterRoleLoading)
    return (
      <Button size="sm" isDisabled={true}>
        You do not have the minter role
      </Button>
    )

  return (
    <>
      <MinB3trModal isOpen={isOpen} onClose={onClose} />
      <Button size="sm" isDisabled={buttonDisabled} onClick={onOpen} variant="link" colorScheme="teal">
        Mint B3tr
      </Button>
    </>
  )
}
