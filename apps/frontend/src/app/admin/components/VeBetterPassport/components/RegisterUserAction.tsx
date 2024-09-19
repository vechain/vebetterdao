import { useXApps } from "@/api"
import { TransactionModal } from "@/components"
import { useRegisterUserAction } from "@/hooks"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  InputGroup,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const RegisterUserAction = () => {
  const [user, setUser] = useState<string>("")
  const [userFieldIsDirty, setUserFieldIsDirty] = useState<boolean>(false)
  const [appId, setAppId] = useState<string | undefined>()
  const [round, setRound] = useState<number | undefined>()
  const [roundFieldIsDirty, setRoundFirldDirty] = useState<boolean>(false)
  const { isOpen, onClose, onOpen } = useDisclosure()

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(user)
  }, [user])

  const isRoundValid = useMemo(() => {
    if (!round) return false
    return round >= 0
  }, [round])

  const { data: xApps } = useXApps()
  const { t } = useTranslation()

  const {
    sendTransaction,
    resetStatus,
    isTxReceiptLoading,
    sendTransactionPending,
    status,
    error,
    txReceipt,
    sendTransactionTx,
  } = useRegisterUserAction({
    address: user,
    appId: appId ?? "",
    roundId: round ?? 0,
  })

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

  const isLoading = isTxReceiptLoading || sendTransactionPending
  const isFormValid = useMemo(() => isValidAddress && appId !== undefined && appId !== "", [appId, isValidAddress])

  return (
    <>
      <Card w={"full"}>
        <CardHeader>
          <Heading size="lg">{t("Register user participation")}</Heading>
          <Text fontSize="sm">
            {t("Register an action for a user for a specific app. Optionally, for a specific round too")}
          </Text>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} alignItems={"start"}>
              <HStack spacing={4} alignItems={"start"} w={"full"}>
                <FormControl isRequired isInvalid={!isValidAddress && userFieldIsDirty}>
                  <FormLabel>
                    <strong>{t("User address")}</strong>
                  </FormLabel>
                  <InputGroup>
                    <Input
                      placeholder={t("Who are we registering the action for?")}
                      value={user}
                      onChange={e => {
                        setUser(e.target.value)
                        setUserFieldIsDirty(true)
                      }}
                      disabled={isLoading}
                    />
                  </InputGroup>
                  <FormErrorMessage>{t("Address not valid")}</FormErrorMessage>
                </FormControl>
              </HStack>

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
                    {xApps?.map(item => {
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
                <FormControl isInvalid={!isRoundValid && roundFieldIsDirty} w={"full"}>
                  <FormLabel>
                    <strong>{t("Round")}</strong>
                  </FormLabel>
                  <NumberInput
                    min={1}
                    value={round}
                    isDisabled={isLoading}
                    onChange={value => {
                      setRound(parseInt(value))
                      setRoundFirldDirty(true)
                    }}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormErrorMessage>{t("Invalid amount")}</FormErrorMessage>
                </FormControl>
              </HStack>
              <Button isDisabled={!isFormValid} colorScheme="blue" type="submit" isLoading={isLoading}>
                {t("Register action")}
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={error ? "error" : status}
        successTitle={t("User action registered")}
        onTryAgain={handleSubmit}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        pendingTitle={t(`Registering user action...`)}
        errorTitle={t("Error registering action")}
        errorDescription={error?.reason}
      />
    </>
  )
}
