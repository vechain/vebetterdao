import { useXApps } from "@/api"
import { useUpdateXAppReceiverAddress } from "@/hooks"
import {
  VStack,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  Heading,
  Card,
  CardHeader,
  CardBody,
  FormErrorMessage,
  Select,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useMemo, useState } from "react"

export const UpdateReceiverAddress = () => {
  const [appId, setAppId] = useState<string | undefined>()

  const [newAddress, setNewAddress] = useState("")
  const [newAddressFieldIsDirty, setNewAddressFieldIsDirty] = useState(false)

  const { data: xApps } = useXApps()

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useUpdateXAppReceiverAddress({
    appId: appId ?? "",
    newAddress,
  })
  const isLoading = isTxReceiptLoading || sendTransactionPending

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault()

    sendTransaction(undefined)
  }

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(newAddress)
  }, [newAddress])

  const isFormValid = useMemo(() => isValidAddress && appId !== undefined && appId !== "", [appId, isValidAddress])

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="md">Update Receiver Address</Heading>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={12} alignItems={"start"}>
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

            <FormControl isRequired isInvalid={!isValidAddress && newAddressFieldIsDirty}>
              <FormLabel>
                <strong>{"New Address"}</strong>
              </FormLabel>
              <InputGroup>
                <Input
                  placeholder="Where should the X-2-Earn tokens be sent?"
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
      </CardBody>
    </Card>
  )
}
