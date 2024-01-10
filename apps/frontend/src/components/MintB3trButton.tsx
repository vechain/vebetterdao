import { useUserHasMinterRole } from "@/api"
import { Button, Text, VStack, useDisclosure } from "@chakra-ui/react"
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

  if (error)
    return (
      <VStack spacing={1} justify="flex-end" align={"flex-end"}>
        <Text fontSize="sm" color="red.500">
          Error checking minter role
        </Text>
        <Text fontSize="sm">{error.message}</Text>
      </VStack>
    )

  if (!hasMinterRole && !hasMinterRoleLoading)
    return (
      <VStack spacing={1} justify="flex-end" align={"flex-end"}>
        <Text fontSize="sm" color="orange.500">
          You do not have the minter role
        </Text>
        <Text fontSize="sm" color="gray.500">
          Connect with {defaultMinterAddress} to mint B3TR
        </Text>
      </VStack>
    )

  return (
    <>
      <MinB3trModal isOpen={isOpen} onClose={onClose} />
      <Button size="sm" isDisabled={buttonDisabled} onClick={onOpen} variant="link" colorScheme="teal">
        Mint B3TR
      </Button>
    </>
  )
}
