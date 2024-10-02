import { useTransactionsMock } from "@/api"
import { TransactionCard, TransactionType } from "@/components"
import { Button, Card, CardBody, Flex, Heading, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

export const UserTransactions = () => {
  const { t } = useTranslation()

  const { data } = useTransactionsMock({ kind: "all" })

  const transactions = useMemo(() => {
    return (
      data?.pages.flatMap(page =>
        page.data.map(transaction => ({
          id: transaction.id,
          type: transaction.type as TransactionType,
          data: transaction,
        })),
      ) ?? []
    )
  }, [data])

  const last5Transactions = useMemo(() => {
    return transactions.slice(0, 5)
  }, [transactions])

  const router = useRouter()
  const handleSeeAll = useCallback(() => {
    router.push("/transactions")
  }, [router])

  return (
    <Card w={"full"} variant={"baseWithBorder"}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <VStack spacing={2} align="stretch">
            <Heading size="md">{t("Last Transactions")}</Heading>
          </VStack>
          <VStack spacing={4} align="stretch">
            {last5Transactions.map(transaction => (
              <TransactionCard key={transaction.id} type={transaction.type} data={transaction.data} />
            ))}
          </VStack>
          <Flex justify="center">
            <Button variant={"primaryGhost"} onClick={handleSeeAll}>
              {t("See all")}
            </Button>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  )
}
