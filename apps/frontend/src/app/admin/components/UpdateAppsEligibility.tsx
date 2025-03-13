import { useAppsEligibleInNextRound, useXApps } from "@/api"
import { TransactionModal, TransactionModalStatus } from "@/components/TransactionModal"
import { useSetVotingEligibility } from "@/hooks"
import {
  VStack,
  FormControl,
  FormLabel,
  Heading,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Switch,
  HStack,
  Divider,
  useDisclosure,
} from "@chakra-ui/react"
import { useCallback, useMemo } from "react"

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
    <Card>
      <CardHeader>
        <Heading size="lg">{"Apps eligible in next round"}</Heading>
      </CardHeader>
      <CardBody>
        <FormControl as={SimpleGrid} gap={3}>
          {x2EarnAppsEligible?.map(app => (
            <AppEligibility key={app.id} id={app.id} name={app.name} isEligible={app.eligible ?? false} />
          ))}
        </FormControl>
      </CardBody>
    </Card>
  )
}

const AppEligibility = ({ id, name, isEligible }: { id: string; name: string; isEligible: boolean }) => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { sendTransaction, resetStatus, isTransactionPending, status, error, txReceipt } = useSetVotingEligibility({
    appId: id,
    isEligible: !isEligible,
    appName: name,
  })

  const handleEligibilityChange = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      sendTransaction(undefined)
      onOpen()
    },
    [sendTransaction, onOpen],
  )

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [resetStatus, onClose])

  return (
    <VStack>
      <HStack w={"full"} justifyContent={"space-between"}>
        <FormLabel>{name}</FormLabel>
        <Switch
          isChecked={isEligible}
          onChange={event => handleEligibilityChange(event)}
          disabled={isTransactionPending || status === "pending"}
        />
      </HStack>
      <Divider />
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={error ? TransactionModalStatus.Error : (status as TransactionModalStatus)}
        titles={{
          [TransactionModalStatus.Success]: isEligible
            ? `${name} will be eligible from next round`
            : `${name} will not be eligible from next round`,
          [TransactionModalStatus.Error]: "Error changing eligibility",
          [TransactionModalStatus.Pending]: isEligible
            ? `Enabling voting eligibility for ${name}...`
            : `Disabling voting eligibility for ${name}...`,
        }}
        onTryAgain={handleEligibilityChange}
        txId={txReceipt?.meta.txID}
        errorDescription={error?.reason}
      />
    </VStack>
  )
}
