import { useUserStatus } from "@/api"
import { WalletAddressInput } from "@/app/components/Input"
import { UserStatus, useWhitelistBlacklistUser, useUserStatusConfig } from "@/hooks"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  InputGroup,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const ManageUserStatus = () => {
  const [user, setUser] = useState<string>("")
  const [actionType, setActionType] = useState(UserStatus.NONE)

  const userStatus = useUserStatus(user)

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(user)
  }, [user])

  const { t } = useTranslation()
  const statusConfig = useUserStatusConfig()
  const currentConfig = statusConfig[actionType]

  const { sendTransaction, isTransactionPending, status } = useWhitelistBlacklistUser({
    address: user,
    currentStatus: userStatus,
    newStatus: actionType,
  })

  const handleSetActionType = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionType(e.target.value as UserStatus)
  }, [])

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      sendTransaction()
    },
    [sendTransaction],
  )

  const isLoading = isTransactionPending || status === "pending"
  const isFormValid = isValidAddress

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">{t("Manage User Status")}</Heading>
        <Text fontSize="sm">
          {t("Manage user participation by adding them to a whitelist, blacklist, or removing their status")}
        </Text>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} alignItems={"start"}>
            <HStack spacing={4} alignItems={"start"} w={"full"}>
              <FormControl isRequired isInvalid={!isValidAddress}>
                <FormLabel>
                  <strong>{t("User address")}</strong>
                </FormLabel>
                <InputGroup>
                  <WalletAddressInput onAddressResolved={address => setUser(address ?? "")} isDisabled={isLoading} />
                </InputGroup>
              </FormControl>
            </HStack>

            <HStack spacing={4} alignItems="center" w="full">
              <FormLabel>
                <strong>{t("Action")}</strong>
              </FormLabel>
              <Select
                value={actionType}
                onChange={handleSetActionType}
                isDisabled={isLoading}
                placeholder={t("Select action")}>
                <option value={UserStatus.WHITELIST}>{t(UserStatus.WHITELIST as any)}</option>
                <option value={UserStatus.BLACKLIST}>{t(UserStatus.BLACKLIST as any)}</option>
                <option value={UserStatus.NONE}>{t(UserStatus.NONE as any)}</option>
              </Select>
            </HStack>

            <Button
              isDisabled={!isFormValid || actionType === userStatus}
              colorScheme={currentConfig.buttonColorScheme}
              type="submit"
              isLoading={isLoading}>
              {currentConfig.buttonText}
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}
