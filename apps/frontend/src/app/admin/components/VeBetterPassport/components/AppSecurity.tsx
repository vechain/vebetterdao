import { APP_SECURITY_LEVELS, useAppSecurityLevel } from "@/api"
import { useUpdateAppSecurityLevel } from "@/hooks"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useXApps } from "@vechain/vechain-kit"
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
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">{t("App Security")}</Heading>
        <Text fontSize="sm">{t("Change an app's security level")}</Text>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} alignItems={"start"}>
            <HStack spacing={4} w={"full"} justify={"space-between"} align={"start"}>
              <FormControl isRequired>
                <FormLabel>
                  <strong>{"App"}</strong>
                </FormLabel>
                <Select
                  placeholder={t("Select app")}
                  isDisabled={isLoading}
                  onChange={e => setAppId(e.target.value)}
                  value={appId}>
                  {xApps?.active.map(item => {
                    return (
                      <option key={"Select" + item.name} value={item.id}>
                        {item.name}
                      </option>
                    )
                  })}
                </Select>
              </FormControl>
            </HStack>

            <HStack spacing={4} w={"full"} justify={"space-between"} align={"start"}>
              <FormControl isRequired>
                <FormLabel>
                  <strong>{"Security level"}</strong>
                </FormLabel>
                <Select
                  placeholder={t("Select app security level")}
                  isDisabled={isLoading}
                  onChange={e => setAppSecurityLevel(Number(e.target.value))}
                  value={appSecurityLevel ?? selectedAppSecurityLevel}>
                  {APP_SECURITY_LEVELS.map((item, index) => {
                    return (
                      <option key={item} value={index}>
                        {item}
                      </option>
                    )
                  })}
                </Select>
              </FormControl>
            </HStack>
            <Button isDisabled={!isFormValid} colorScheme="blue" type="submit" isLoading={isLoading}>
              {t("Update security level")}
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}
