import { useAppsEligibleInNextRound, useXApps } from "@/api"
import { useSetVotingEligibility } from "@/hooks"
import { VStack, Field, Heading, Card, SimpleGrid, Switch, HStack, Separator } from "@chakra-ui/react"
import { useMemo } from "react"

export const UpdateAppsEligibility = () => {
  const { data: eligibleAppsIds } = useAppsEligibleInNextRound()
  const { data: x2EarnApps } = useXApps()

  // loop through x2EarnApps and check if appIds are in x2EarnApps,
  // if they are in then put eligible true, otherwise eligible false
  let x2EarnAppsEligible = useMemo(() => {
    return x2EarnApps?.active.map(app => {
      return {
        ...app,
        eligible: eligibleAppsIds?.includes(app.id),
      }
    })
  }, [eligibleAppsIds, x2EarnApps])

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="lg">{"Apps eligible in next round"}</Heading>
      </Card.Header>
      <Card.Body>
        <Field.Root as={SimpleGrid} gap={3}>
          {x2EarnAppsEligible?.map(app => (
            <AppEligibility key={app.id} id={app.id} name={app.name} isEligible={app.eligible ?? false} />
          ))}
        </Field.Root>
      </Card.Body>
    </Card.Root>
  )
}

const AppEligibility = ({ id, name, isEligible }: { id: string; name: string; isEligible: boolean }) => {
  const { sendTransaction, isTransactionPending, status } = useSetVotingEligibility({
    appId: id,
    isEligible: !isEligible,
    appName: name,
  })

  // const handleEligibilityChange = useCallback(
  //   (event?: { preventDefault: () => void }) => {
  //     if (event) event.preventDefault()

  //     sendTransaction()
  //   },
  //   [sendTransaction],
  // )

  return (
    <VStack>
      <HStack w={"full"} justifyContent={"space-between"}>
        <Field.Label>{name}</Field.Label>
        <Switch.Root
          checked={isEligible}
          onCheckedChange={() => sendTransaction()}
          disabled={isTransactionPending || status === "pending"}
          colorPalette="primary">
          <Switch.HiddenInput />
          <Switch.Control />
        </Switch.Root>
      </HStack>
      <Separator />
    </VStack>
  )
}
