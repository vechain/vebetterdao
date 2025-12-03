import { VStack, Button, Field, InputGroup, Input, Heading, Text, NumberInput, Card } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useHaveXAppsClaimed } from "../../../api/contracts/xAllocationPool/hooks/useHaveXAppsClaimed"
import { useMultipleXAppRoundEarnings } from "../../../api/contracts/xAllocationPool/hooks/useMultipleXAppRoundEarnings"
import { useAllocationsRound } from "../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useRoundXApps } from "../../../api/contracts/xApps/hooks/useRoundXApps"
import { useClaimXAppsAllocations } from "../../../hooks/xApp/useClaimXAppsAllocations"

export const BulkClaimXAppsAllocations = () => {
  const [roundId, setRoundId] = useState<string>("1")
  const { t } = useTranslation()
  const { data: xApps } = useRoundXApps(roundId?.toString() ?? "")
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")
  // Calculate total amount that is avaialble to claim in this round
  const { data: totalAmounts = [] } = useMultipleXAppRoundEarnings(
    roundId?.toString() ?? "",
    xApps?.map(app => app.id) ?? [],
  )
  const total = useMemo(() => {
    return totalAmounts.reduce((acc, cur) => acc + parseInt(cur?.amount ?? "0"), 0)
  }, [totalAmounts])
  // Retrieve all apps that have claimed for the round and the ones that still needs to claim
  const { data: claims } = useHaveXAppsClaimed(roundId?.toString() ?? "", xApps?.map(app => app.id) ?? [])
  const allClaimed = useMemo(() => {
    return !claims?.some(claim => !claim.claimed)
  }, [claims])
  const xAppsLeft = useMemo(() => {
    return xApps?.filter(app => !claims?.find(claim => claim?.appId === app.id)?.claimed)
  }, [claims, xApps])
  // Calculate remaining amount to claim excluding already claimed
  const { data: remainingAmounts = [] } = useMultipleXAppRoundEarnings(
    roundId?.toString() ?? "",
    xAppsLeft?.map(app => app.id) ?? [],
  )
  const amountToClaim = useMemo(() => {
    return remainingAmounts?.reduce((acc, cur) => acc + parseInt(cur?.amount ?? "0"), 0)
  }, [remainingAmounts])
  // Handle submitting the transaction
  const { sendTransaction, isTransactionPending, status } = useClaimXAppsAllocations({
    roundId: roundId?.toString() ?? "",
    appIds: xAppsLeft?.map(app => app.id) ?? [],
  })

  const isLoading = isTransactionPending || status === "pending"

  const handleSubmit = useCallback(
    (event: { preventDefault: () => void }) => {
      event.preventDefault()
      sendTransaction()
    },
    [sendTransaction],
  )

  // Validate roundId input
  const isRoundValid = useMemo(() => {
    if (currentRoundId === undefined || !currentRound) return false
    if (parseInt(roundId) === parseInt(currentRoundId) && currentRound.state === 0) return false
    if (parseInt(roundId) > parseInt(currentRoundId) || parseInt(roundId) === 0) return false

    return true
  }, [roundId, currentRoundId, currentRound])

  return (
    <Card.Root w={"full"}>
      <Card.Header>
        <Heading size="3xl">{t("Bulk allocation claiming")}</Heading>
      </Card.Header>
      <Card.Body>
        <VStack gap={8} alignItems={"start"} flex={1} w="full">
          <VStack align={"start"}>
            <VStack gap={0} align={"start"}>
              <Text>
                {" "}
                {t("Total apps:")} {xApps?.length}
              </Text>
              <Text>
                {" "}
                {t("Remaing apps that needs claiming:")} {xAppsLeft?.length}
              </Text>
            </VStack>
          </VStack>
          <form
            onSubmit={handleSubmit}
            style={{
              width: "100%",
            }}>
            <VStack gap={4} alignItems={"start"} w="full">
              <Field.Root required invalid={!isRoundValid}>
                <Field.Label>
                  <strong>{"Round #"}</strong>
                  <Field.RequiredIndicator />
                </Field.Label>
                <NumberInput.Root
                  w="full"
                  min={0}
                  value={roundId}
                  disabled={isLoading}
                  onValueChange={e => setRoundId(e.value)}>
                  <NumberInput.Input />
                  <NumberInput.Control />
                </NumberInput.Root>
                <Field.ErrorText>{"Invalid round"}</Field.ErrorText>
              </Field.Root>

              <Field.Root>
                <Field.Label>
                  <strong>{"Total"}</strong>
                </Field.Label>
                <InputGroup
                  endElement={
                    <Text
                      pointerEvents="none"
                      pl={1}
                      pr={1}
                      ml={0}
                      backgroundColor={"transparent"}
                      borderColor={"inherit"}
                      borderLeft={"none"}>
                      {t("B3TR")}
                    </Text>
                  }>
                  <Input value={total} disabled={true} />
                </InputGroup>
              </Field.Root>

              <Field.Root>
                <Field.Label>
                  <strong>{"Remaining"}</strong>
                </Field.Label>
                <InputGroup
                  endElement={
                    <Text
                      pointerEvents="none"
                      pl={1}
                      pr={1}
                      ml={0}
                      backgroundColor={"transparent"}
                      borderColor={"inherit"}
                      borderLeft={"none"}>
                      {t("B3TR")}
                    </Text>
                  }>
                  <Input value={amountToClaim ?? 0} disabled={true} />
                </InputGroup>
              </Field.Root>

              <Button disabled={allClaimed} colorPalette="blue" type="submit" loading={isLoading}>
                {allClaimed ? "Already claimed" : "Claim for all"}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
