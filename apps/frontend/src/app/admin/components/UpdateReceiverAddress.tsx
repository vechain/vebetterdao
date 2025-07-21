import { WalletAddressInput } from "@/app/components/Input"
import { useUpdateXAppReceiverAddress } from "@/hooks"
import {
  VStack,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  Heading,
  Select,
  Card,
  CardHeader,
  CardBody,
} from "@chakra-ui/react"
import { useXApps } from "@/api"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const UpdateReceiverAddress = () => {
  const [appId, setAppId] = useState<string | undefined>()
  const [newAddress, setNewAddress] = useState("")
  const { t } = useTranslation()
  const { data: xApps } = useXApps()

  const { sendTransaction, isTransactionPending, status } = useUpdateXAppReceiverAddress({
    appId: appId ?? "",
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
    const app = allApps.find(item => item.id === appId)
    return app?.teamWalletAddress
  }, [appId, allApps])

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(newAddress)
  }, [newAddress])

  const isFormValid = useMemo(() => isValidAddress && appId !== undefined && appId !== "", [appId, isValidAddress])

  return (
    <Card w={"full"}>
      <CardHeader>
        <Heading size="lg">{t("Update Team Wallet Address")}</Heading>
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
                  {allApps?.map(item => {
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

              <FormControl isRequired isInvalid={!isValidAddress}>
                <FormLabel>
                  <strong>{"New Address"}</strong>
                </FormLabel>
                <InputGroup>
                  <WalletAddressInput
                    placeholder={t("Where should the allocation tokens be sent?")}
                    onAddressResolved={address => setNewAddress(address ?? "")}
                    isDisabled={isLoading}
                  />
                </InputGroup>
              </FormControl>

              <Button isDisabled={!isFormValid} colorScheme="blue" type="submit" isLoading={isLoading}>
                {t("Save")}
              </Button>
            </VStack>
          </form>
        </VStack>
      </CardBody>
    </Card>
  )
}
