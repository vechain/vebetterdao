import { useSustainabilityActions } from "@/api"
import { TransactionCard, TransactionType } from "@/components"
import { Card, CardBody, Heading, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const UserTransactions = () => {
  const { t } = useTranslation()

  const { account } = useWallet()
  const { data } = useSustainabilityActions({
    wallet: account ?? undefined,
    direction: "desc",
  })

  const actions = useMemo(() => data?.pages.map(page => page.data).flat() ?? [], [data])

  const transactions = useMemo(() => {
    const _transactions: { id: string; type: TransactionType; data: any }[] = []
    // add better actions
    actions.forEach((action, index) => {
      _transactions.push({
        id: `better-action-${index}`,
        type: "better-action" as TransactionType,
        data: action,
      })
    })
    // TODO: fetch transactions
    // add mocked examples
    _transactions.push({
      id: "swap",
      type: "swap" as TransactionType,
      data: {
        type: "swap",
        amount: 100,
      },
    })
    _transactions.push({
      id: "claim",
      type: "claim" as TransactionType,
      data: {
        type: "claim",
        amount: 100,
      },
    })
    _transactions.push({
      id: "support",
      type: "support" as TransactionType,
      data: {
        type: "support",
        amount: 100,
      },
    })
    _transactions.push({
      id: "gm-upgrade",
      type: "gm-upgrade" as TransactionType,
      data: {
        type: "gm-upgrade",
        amount: 100,
      },
    })

    return _transactions
  }, [actions])

  return (
    <Card w={"full"} variant={"baseWithBorder"}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <VStack spacing={2} align="stretch">
            <Heading size="md">{t("Last Transactions")}</Heading>
          </VStack>
          <VStack spacing={6} align="stretch">
            {transactions.map(transaction => (
              <TransactionCard key={transaction.id} type={transaction.type} data={transaction.data} />
            ))}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
