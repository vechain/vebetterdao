import { useUserStatus } from "@/api"
import { WalletAddressInput } from "@/app/components/Input"
import { UserStatus, useWhitelistBlacklistUser, useUserStatusConfig } from "@/hooks"
import { Button, Card, Field, Heading, HStack, InputGroup, NativeSelect, Text, VStack } from "@chakra-ui/react"
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
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="2xl">{t("Manage User Status")}</Heading>
        <Text fontSize="sm">
          {t("Manage user participation by adding them to a whitelist, blacklist, or removing their status")}
        </Text>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit}>
          <VStack gap={4} alignItems={"start"}>
            <HStack gap={4} alignItems={"start"} w={"full"}>
              <Field.Root required invalid={!isValidAddress}>
                <Field.Label>
                  <strong>{t("User address")}</strong>
                </Field.Label>
                <InputGroup>
                  <WalletAddressInput onAddressResolved={address => setUser(address ?? "")} disabled={isLoading} />
                </InputGroup>
              </Field.Root>
            </HStack>

            <HStack gap={4} alignItems="center" w="full">
              <Field.Root>
                <Field.Label>
                  <strong>{t("Action")}</strong>
                </Field.Label>
                <NativeSelect.Root disabled={isLoading}>
                  <NativeSelect.Indicator />
                  <NativeSelect.Field
                    value={actionType}
                    onChange={handleSetActionType}
                    placeholder={t("Select action")}>
                    <option value={UserStatus.WHITELIST}>{t(UserStatus.WHITELIST as any)}</option>
                    <option value={UserStatus.BLACKLIST}>{t(UserStatus.BLACKLIST as any)}</option>
                    <option value={UserStatus.NONE}>{t(UserStatus.NONE as any)}</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </HStack>

            <Button
              disabled={!isFormValid || actionType === userStatus}
              colorPalette={currentConfig.buttonColorScheme}
              type="submit"
              loading={isLoading}>
              {currentConfig.buttonText}
            </Button>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}
