import { useXApps } from "@/api"
import { TransactionModal } from "@/components/TransactionModal"
import { useUpdateXAppReceiverAddress } from "@/hooks"
import {
  VStack,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  Heading,
  FormErrorMessage,
  Select,
  Card,
  CardHeader,
  CardBody,
  useDisclosure,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"

export const UpdateReceiverAddress = () => {
  const [appId, setAppId] = useState<string | undefined>()
  const [newAddress, setNewAddress] = useState("")
  const [newAddressFieldIsDirty, setNewAddressFieldIsDirty] = useState(false)
  const { isOpen, onClose, onOpen } = useDisclosure()

  const { data: xApps } = useXApps()

  const {
    sendTransaction,
    resetStatus,
    isTxReceiptLoading,
    sendTransactionPending,
    status,
    error,
    txReceipt,
    sendTransactionTx,
  } = useUpdateXAppReceiverAddress({
    appId: appId ?? "",
    newAddress,
    invalidateCache: true,
  })
  const isLoading = isTxReceiptLoading || sendTransactionPending

  const handleSubmit = useCallback(
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

  const currentAddress = useMemo(() => {
    if (appId === undefined) return ""

    const app = xApps?.find(item => item.id === appId)
    return app?.teamWalletAddress
  }, [appId, xApps])

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(newAddress)
  }, [newAddress])

  const isFormValid = useMemo(() => isValidAddress && appId !== undefined && appId !== "", [appId, isValidAddress])

  return (
    <>
      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">Update Team Wallet Address</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={8} alignItems={"start"} w="full">
            <form
              onSubmit={handleSubmit}
              style={{
                width: "100%",
              }}>
              <VStack spacing={4} alignItems={"start"}>
                <FormControl isRequired>
                  <FormLabel>
                    <strong>{"App"}</strong>
                  </FormLabel>
                  <Select
                    placeholder="Select app"
                    isDisabled={isLoading}
                    onChange={e => setAppId(e.target.value)}
                    value={appId}>
                    {xApps?.map(item => {
                      return (
                        <option key={"Select" + item.name} value={item.id}>
                          {item.name}
                        </option>
                      )
                    })}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>
                    <strong>{"Current Address"}</strong>
                  </FormLabel>
                  <InputGroup>
                    <Input value={currentAddress} disabled />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired isInvalid={!isValidAddress && newAddressFieldIsDirty}>
                  <FormLabel>
                    <strong>{"New Address"}</strong>
                  </FormLabel>
                  <InputGroup>
                    <Input
                      placeholder="Where should the allocation tokens be sent?"
                      value={newAddress}
                      onChange={e => {
                        setNewAddress(e.target.value)
                        setNewAddressFieldIsDirty(true)
                      }}
                      disabled={isLoading}
                    />
                  </InputGroup>
                  <FormErrorMessage>{"Address not valid"}</FormErrorMessage>
                </FormControl>

                <Button isDisabled={!isFormValid} colorScheme="blue" type="submit" isLoading={isLoading}>
                  Save
                </Button>
              </VStack>
            </form>
          </VStack>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={error ? "error" : status}
        successTitle={"Team wallet address updated"}
        onTryAgain={handleSubmit}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        pendingTitle={`Updating team wallet address...`}
        errorTitle={"Error updating address"}
        errorDescription={error?.reason}
      />
    </>
  )
}
