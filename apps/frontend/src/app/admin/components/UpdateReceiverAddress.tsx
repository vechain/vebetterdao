import { WalletAddressInput } from "@/app/components/Input"
import { useUpdateXAppReceiverAddress } from "@/hooks"
import { VStack, Button, Field, InputGroup, Input, Heading, NativeSelect, Card } from "@chakra-ui/react"
import { useXApps } from "@/api"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const UpdateReceiverAddress = () => {
  const [appId, setAppId] = useState<string>("")
  const [newAddress, setNewAddress] = useState("")
  const { t } = useTranslation()
  const { data: xApps } = useXApps()

  const { sendTransaction, isTransactionPending, status } = useUpdateXAppReceiverAddress({
    appId: appId[0] ?? "",
    newAddress,
  })
  const isLoading = isTransactionPending || status === "pending"

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      sendTransaction()
    },
    [sendTransaction],
  )

  const allApps = useMemo(() => [...(xApps?.active ?? []), ...(xApps?.unendorsed ?? [])], [xApps])

  const currentAddress = useMemo(() => {
    if (appId === undefined) return ""
    const app = allApps.find(item => item.id === appId[0])
    return app?.teamWalletAddress
  }, [appId, allApps])

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(newAddress)
  }, [newAddress])

  const isFormValid = useMemo(() => isValidAddress && appId !== undefined && appId[0] !== "", [appId, isValidAddress])

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="lg">{t("Update Team Wallet Address")}</Heading>
      </Card.Header>
      <Card.Body>
        <VStack gap={8} alignItems={"start"} w="full">
          <form
            onSubmit={handleSubmit}
            style={{
              width: "100%",
            }}>
            <VStack gap={4} alignItems={"start"}>
              <Field.Root required>
                <Field.Label>
                  <strong>{"App"}</strong>
                </Field.Label>
                <NativeSelect.Root disabled={isLoading}>
                  <NativeSelect.Field
                    placeholder="Select app"
                    value={appId}
                    onChange={e => setAppId(e.currentTarget.value)}>
                    {allApps?.map(item => {
                      return (
                        <option key={"Select" + item.name} value={item.id}>
                          {item.name}
                        </option>
                      )
                    })}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label>
                  <strong>{"Current Address"}</strong>
                </Field.Label>
                <InputGroup>
                  <Input value={currentAddress} disabled />
                </InputGroup>
              </Field.Root>

              <Field.Root required invalid={!isValidAddress}>
                <Field.Label>
                  <strong>{"New Address"}</strong>
                </Field.Label>
                <InputGroup>
                  <WalletAddressInput
                    placeholder={t("Where should the allocation tokens be sent?")}
                    onAddressResolved={address => setNewAddress(address ?? "")}
                    disabled={isLoading}
                  />
                </InputGroup>
              </Field.Root>

              <Button disabled={!isFormValid} colorScheme="blue" type="submit" loading={isLoading}>
                {t("Save")}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
