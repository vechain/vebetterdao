import { VStack, Field, Heading, Card, Switch, HStack, Separator, Text, Button, List } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { Check } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation, Trans } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"

import { useAppsEligibleInNextRound } from "../../../api/contracts/xApps/hooks/useAppsEligibleInNextRound"
import { useXApps } from "../../../api/contracts/xApps/hooks/useXApps"
import { useSetVotingEligibility } from "../../../hooks/useSetVotingEligibility"

// Types
interface AppEligibilityData {
  id: string
  name: string
  eligible: boolean
}
interface SetVotingEligibilityData {
  appId: string
  desiredEligibility: boolean
  appName: string
}
interface AppEligibilityProps {
  app: AppEligibilityData
  isLoading: boolean
  onEligibilityChange: (id: string) => void
}
// Components
const AppEligibilitySwitch = ({ app, isLoading, onEligibilityChange }: AppEligibilityProps) => {
  return (
    <VStack>
      <Field.Root>
        <HStack w="full" justifyContent="space-between">
          <Field.Label>
            <Text>{app.name}</Text>
          </Field.Label>
          <Switch.Root
            name={app.id}
            checked={app.eligible}
            onCheckedChange={() => onEligibilityChange(app.id)}
            disabled={isLoading}
            colorPalette="primary">
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb>
                <Switch.ThumbIndicator fontSize="10px">
                  <Check color="black" />
                </Switch.ThumbIndicator>
              </Switch.Thumb>
            </Switch.Control>
          </Switch.Root>
        </HStack>
        <Separator />
      </Field.Root>
    </VStack>
  )
}

export const UpdateAppsEligibility = () => {
  const { t } = useTranslation()
  const { data: eligibleAppsIds } = useAppsEligibleInNextRound()
  const { data: x2EarnApps } = useXApps()
  const { sendTransaction, isTransactionPending } = useSetVotingEligibility()

  // State
  const [lastUpdatedApp, setLastUpdatedApp] = useState<string | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingChange, setPendingChange] = useState<SetVotingEligibilityData | null>(null)

  // Memoized data
  const x2EarnAppsEligible = useMemo<AppEligibilityData[]>(() => {
    if (!x2EarnApps?.active) return []

    return x2EarnApps.active.map(app => ({
      id: app.id,
      name: app.name,
      eligible: eligibleAppsIds?.includes(app.id) ?? false,
    }))
  }, [eligibleAppsIds, x2EarnApps])

  // Handlers
  const handleCloseModal = useCallback(() => {
    setIsConfirmModalOpen(false)
    setPendingChange(null)
  }, [])

  const handleConfirmChange = useCallback(() => {
    if (pendingChange) {
      handleCloseModal() //Close modal and clear pending change
      sendTransaction(pendingChange)
    }
  }, [pendingChange, sendTransaction, handleCloseModal])

  const handleEligibilityChange = useCallback(
    (id: string) => {
      const appData = x2EarnAppsEligible.find(app => app.id === id)
      if (!appData) {
        console.error(`${t("App not found")} ${id}`)
        return
      }

      setLastUpdatedApp(id)
      setPendingChange({
        appId: id,
        desiredEligibility: !appData.eligible,
        appName: appData.name,
      })
      setIsConfirmModalOpen(true)
    },
    [t, x2EarnAppsEligible],
  )

  const status = pendingChange?.desiredEligibility ? t("eligible") : t("ineligible")

  return (
    <>
      <Card.Root>
        <Card.Header>
          <Heading size="3xl">{t("Apps eligible in next round")}</Heading>
        </Card.Header>
        <Card.Body gap={3}>
          {x2EarnAppsEligible.map(app => (
            <AppEligibilitySwitch
              key={app.id}
              app={app}
              isLoading={isTransactionPending && lastUpdatedApp === app.id}
              onEligibilityChange={handleEligibilityChange}
            />
          ))}
        </Card.Body>
      </Card.Root>

      <BaseModal isOpen={isConfirmModalOpen} onClose={handleCloseModal} showCloseButton={true} isCloseable={true}>
        <VStack w="full" align="stretch" gap={6}>
          {/* Results Header */}
          <HStack>
            <Heading>
              <Trans
                i18nKey="Are you sure you want to make <b>'{{appName}}'</b>  <b>{{status}}</b> for the next round?"
                values={{
                  appName: pendingChange?.appName || "",
                  status,
                }}
                components={{
                  b: <b />,
                }}
              />
            </Heading>
          </HStack>

          {/* Info Message */}
          <List.Root variant="plain" gap="3">
            <List.Item>
              <Text>
                <b>{t("App Name")}</b> {pendingChange?.appName}
              </Text>
            </List.Item>
            <List.Item>
              <Text>
                <b>{t("App ID")}</b> {humanAddress(pendingChange?.appId || "")}
              </Text>
            </List.Item>
            <List.Item>
              <Text>
                <b>{t("Current Status")}</b> {!pendingChange?.desiredEligibility ? t("eligible") : t("ineligible")}
              </Text>
            </List.Item>
            <List.Item>
              <Text>
                <b>{t("Status After Transaction")}</b>{" "}
                {pendingChange?.desiredEligibility ? t("eligible") : t("ineligible")}
              </Text>
            </List.Item>
          </List.Root>

          <HStack gap={3} justifyContent="space-around">
            {/* Cancel Button */}
            <Button variant="ghost" color="status.negative.primary" onClick={handleCloseModal}>
              {t("Cancel")}
            </Button>
            {/* Confirm Button */}
            <Button variant="primary" onClick={handleConfirmChange}>
              {t("Confirm")}
            </Button>
          </HStack>
        </VStack>
      </BaseModal>
    </>
  )
}
