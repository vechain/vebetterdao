import { APP_SECURITY_LEVELS, useAppSecurityLevel, useXApps } from "@/api"
import { useUpdateAppSecurityLevel } from "@/hooks"
import { Button, Card, Field, Heading, HStack, NativeSelect, Text, VStack } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const AppSecurity = () => {
  const [appId, setAppId] = useState<string | undefined>()
  const [appSecurityLevel, setAppSecurityLevel] = useState<number | undefined>()

  const { data: xApps } = useXApps()
  const { data: selectedAppSecurityLevel } = useAppSecurityLevel(appId ?? "")
  const { t } = useTranslation()

  const { sendTransaction, isTransactionPending, status } = useUpdateAppSecurityLevel({
    appId: appId ?? "",
    securityLevel: appSecurityLevel ?? 0,
  })

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      sendTransaction()
    },
    [sendTransaction],
  )

  const isLoading = isTransactionPending || status === "pending"
  const isFormValid = useMemo(
    () => appSecurityLevel && appSecurityLevel !== selectedAppSecurityLevel,
    [appSecurityLevel, selectedAppSecurityLevel],
  )

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="3xl">{t("App Security")}</Heading>
        <Text textStyle="sm">{t("Change an app's security level")}</Text>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit}>
          <VStack gap={4} alignItems={"start"}>
            <HStack gap={4} w={"full"} justify={"space-between"} align={"start"}>
              <Field.Root required>
                <Field.Label>
                  <strong>{"App"}</strong>
                  <Field.RequiredIndicator />
                </Field.Label>
                <NativeSelect.Root disabled={isLoading}>
                  <NativeSelect.Indicator />
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
              <Field.Root required>
                <Field.Label>
                  <strong>{"Security level"}</strong>
                  <Field.RequiredIndicator />
                </Field.Label>
                <NativeSelect.Root disabled={isLoading}>
                  <NativeSelect.Indicator />
                  <NativeSelect.Field
                    placeholder={t("Select app security level")}
                    onChange={e => setAppSecurityLevel(Number(e.target.value))}
                    value={appSecurityLevel ?? selectedAppSecurityLevel}>
                    {APP_SECURITY_LEVELS.map((item, index) => {
                      return (
                        <option key={item} value={index}>
                          {item}
                        </option>
                      )
                    })}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </HStack>
            <Button disabled={!isFormValid} colorPalette="blue" type="submit" loading={isLoading}>
              {t("Update security level")}
            </Button>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  )
}
