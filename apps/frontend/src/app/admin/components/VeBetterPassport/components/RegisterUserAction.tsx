import { WalletAddressInput } from "@/app/components/Input"
import { useXApps } from "@/api"
import { useRegisterUserAction } from "@/hooks"
import {
  Button,
  Card,
  Field,
  Heading,
  HStack,
  InputGroup,
  NumberInput,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const RegisterUserAction = () => {
  const [user, setUser] = useState<string>("")
  const [appId, setAppId] = useState<string | undefined>()
  const [round, setRound] = useState<string | undefined>()
  const [roundFieldIsDirty, setRoundFieldIsDirty] = useState<boolean>(false)

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(user)
  }, [user])

  const isRoundValid = useMemo(() => {
    if (!round) return false
    return Number(round) >= 0
  }, [round])

  const { data: xApps } = useXApps()
  const { t } = useTranslation()

  const { sendTransaction, isTransactionPending, status } = useRegisterUserAction({
    address: user,
    appId: appId ?? "",
    roundId: Number(round) ?? 0,
  })

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      sendTransaction()
    },
    [sendTransaction],
  )

  const isLoading = isTransactionPending || status === "pending"
  const isFormValid = useMemo(() => isValidAddress && appId !== undefined && appId !== "", [appId, isValidAddress])

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="lg">{t("Register user participation")}</Heading>
        <Text fontSize="sm">
          {t("Register an action for a user for a specific app. Optionally, for a specific round too")}
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
                  <WalletAddressInput
                    placeholder={t("Who are we registering the action for?")}
                    onAddressResolved={address => setUser(address ?? "")}
                    disabled={isLoading}
                  />
                </InputGroup>
              </Field.Root>
            </HStack>

            <HStack gap={4} w={"full"} justify={"space-between"} align={"start"}>
              <Field.Root required>
                <Field.Label>
                  <strong>{"App"}</strong>
                </Field.Label>
                <NativeSelect.Root disabled={isLoading}>
                  <NativeSelect.Field
                    placeholder={t("Select app")}
                    onChange={e => setAppId(e.target.value)}
                    value={appId}>
                    {xApps?.active.map(item => {
                      return (
                        <option key={"Select" + item.name} value={item.id}>
                          {item.name}
                        </option>
                      )
                    })}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </HStack>

            <HStack gap={4} w={"full"} justify={"space-between"} align={"start"}>
              <Field.Root invalid={!isRoundValid && roundFieldIsDirty} w={"full"}>
                <Field.Label>
                  <strong>{t("Round")}</strong>
                </Field.Label>
                <NumberInput.Root
                  min={1}
                  value={round}
                  disabled={isLoading}
                  onValueChange={e => {
                    setRound(e.value)
                    setRoundFieldIsDirty(true)
                  }}>
                  <NumberInput.Input />
                  <NumberInput.Control />
                </NumberInput.Root>
                <Field.ErrorText>{t("Invalid amount")}</Field.ErrorText>
              </Field.Root>
            </HStack>
            <Button disabled={!isFormValid} colorPalette="blue" type="submit" loading={isLoading}>
              {t("Register action")}
            </Button>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}
