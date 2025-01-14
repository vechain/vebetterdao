import { useTranslation } from "react-i18next"
import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  useDisclosure,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  InputGroup,
  InputRightAddon,
  Button,
  Text,
  Icon,
} from "@chakra-ui/react"
import { useCallback, useState, useMemo } from "react"
import { TransactionModal } from "@/components"
import { useXApps, useAppAdmin } from "@/api"
import { useAppLockedPercentage, useAppAllowance } from "@/api/contracts/x2EarnRewardsPool"
import { useAdminLockedFundsPercentage } from "@/hooks"
import { useWallet } from "@vechain/dapp-kit-react"
import { UilLock } from "@iconscout/react-unicons"

export const ManageRewardsApps = () => {
  const { onOpen, onClose, isOpen } = useDisclosure()
  const { t } = useTranslation()
  const { account } = useWallet()

  const [appId, setAppId] = useState<string | undefined>()
  const [percentage, setPercentage] = useState<string | undefined>()
  const { data: xApps } = useXApps()
  const { data: appAdmin } = useAppAdmin(appId ?? "")
  const { data: appAllowance } = useAppAllowance(appId ?? "", true)

  const {
    sendTransaction,
    isTxReceiptLoading,
    sendTransactionPending,
    status,
    error,
    txReceipt,
    // sendTransactionTx,
  } = useAdminLockedFundsPercentage({
    appId: appId ?? "",
    percentage: percentage ?? "",
  })

  const { data: lockedFundsPercentage } = useAppLockedPercentage(appId ?? "")

  const isLoading = isTxReceiptLoading || sendTransactionPending

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      sendTransaction(undefined)
      onOpen()
    },
    [sendTransaction, onOpen],
  )

  const isUserConnectedAdmin = useMemo(() => {
    return appAdmin?.toLowerCase() === account?.toLowerCase()
  }, [appAdmin, account])

  const allowance = useMemo(() => {
    return appAllowance?.formatted
  }, [appAllowance])
  // {/* todo: filter the select with only the xapp admin owns */}
  const isValidInteger = percentage ? Number.isInteger(Number(percentage)) && !percentage.includes(".") : true

  return (
    <>
      <Card w="full">
        <CardHeader>
          <Heading size="lg">{t("Manage rewards distribution")}</Heading>
        </CardHeader>

        <CardBody>
          <VStack flex={1} align="flex-start" spacing={8}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} alignItems={"start"}>
                <HStack w={"full"}>
                  <FormControl isRequired>
                    <FormLabel>
                      <strong>{"App"}</strong>
                    </FormLabel>
                    <Select
                      placeholder="Select app"
                      isDisabled={isLoading}
                      onChange={e => setAppId(e.target.value)}
                      value={appId}>
                      {xApps?.active.map(item => {
                        return (
                          <option key={item.id} value={item.id}>
                            {item.name + " - id: " + item.id}
                          </option>
                        )
                      })}
                    </Select>
                  </FormControl>
                </HStack>

                {isUserConnectedAdmin ? (
                  <>
                    <FormControl isRequired isInvalid={!isValidInteger || Number(percentage) > 100}>
                      <FormLabel>
                        <strong>{"Percentage"}</strong>
                      </FormLabel>
                      <InputGroup size="md">
                        <Input
                          pr="4.5rem"
                          type="number"
                          step="1"
                          min="0"
                          placeholder="percentage"
                          max={100}
                          isDisabled={isLoading}
                          onChange={e => setPercentage(e.target.value)}
                          value={percentage}
                        />
                        <InputRightAddon
                          pointerEvents="none"
                          pl={1}
                          pr={1}
                          ml={0}
                          backgroundColor={"transparent"}
                          borderColor={"inherit"}
                          borderLeft={"none"}>
                          {"%"}
                        </InputRightAddon>
                      </InputGroup>
                      {Number(percentage) > 100 && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {t("You can't lock more than 100%")}
                        </Text>
                      )}
                      {!isValidInteger && percentage && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {t("Percentage must be an integer")}
                        </Text>
                      )}
                    </FormControl>
                    <VStack align={"flex-start"} flex={1} spacing={4}>
                      <Text>{t("Actual locked percentage: {{value}} % ", { value: lockedFundsPercentage })}</Text>
                      <Text>
                        {t("Allowance available: {{value}} ", {
                          value: allowance,
                        })}
                      </Text>
                    </VStack>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      isLoading={isLoading}
                      disabled={!isValidInteger || Number(percentage) > 100}>
                      {t("Lock funds")}
                    </Button>
                  </>
                ) : (
                  <HStack flex={1} align="center" justify="center">
                    <Icon as={UilLock} color="red.500" boxSize={["20px"]} />
                    <Text>{t("Only selected app admin can have access to this functionnality")}</Text>
                  </HStack>
                )}
              </VStack>
            </form>
          </VStack>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        status={error ? "error" : status}
        successTitle={t("Transaction successful")}
        onTryAgain={handleSubmit}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID}
        pendingTitle={t("Processing transaction...")}
        errorTitle={t("Transaction error")}
        errorDescription={error?.reason}
      />
    </>
  )
}
