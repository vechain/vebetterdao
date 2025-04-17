import { useXApps } from "@/api"
import { WalletAddressInput } from "@/app/components/Input"
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
  InputGroup,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const RegisterUserAction = () => {
  const [user, setUser] = useState<string>("")
  const [appId, setAppId] = useState<string | undefined>()
  const [round, setRound] = useState<number | undefined>()
  const [roundFieldIsDirty, setRoundFieldIsDirty] = useState<boolean>(false)

  const isValidAddress = useMemo(() => {
    return AddressUtils.isValid(user)
  }, [user])

  const isRoundValid = useMemo(() => {
    if (!round) return false
    return round >= 0
  }, [round])

  const { data: xApps } = useXApps()
  const { t } = useTranslation()

  const { sendTransaction, isTransactionPending, status } = useRegisterUserAction({
    address: user,
    appId: appId ?? "",
    roundId: round ?? 0,
  })

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      sendTransaction()
    },
    [sendTransaction],
  )

  const isLoading = isTransactionPending || status === "pending"
  const isFormValid = useMemo(() => isValidAddress && appId !== undefined && appId !== "", [appId, isValidAddress])

  return (
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
              <FormControl isRequired isInvalid={!isValidAddress}>
                <FormLabel>
                  <strong>{t("User address")}</strong>
                </FormLabel>
                <InputGroup>
                  <WalletAddressInput
                    placeholder={t("Who are we registering the action for?")}
                    onAddressResolved={address => setUser(address ?? "")}
                    isDisabled={isLoading}
                  />
                </InputGroup>
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
                    setRoundFieldIsDirty(true)
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
  )
}
