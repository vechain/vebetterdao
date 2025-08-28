import { useTransactions } from "@/api"
import { TransactionCard } from "@/components"
import { Button, Card, Flex, Heading, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  address: string
}

export const UserTransactions = ({ address }: Props) => {
  const { t } = useTranslation()

  const { data } = useTransactions({
    user: address ?? "",
  })

  const transactions = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? []
  }, [data])

  const last5Transactions = useMemo(() => {
    return transactions.slice(0, 5)
  }, [transactions])

  const router = useRouter()
  const handleSeeAll = useCallback(() => {
    router.push(`/transactions/${address}`)
  }, [router, address])

  return (
    <Card.Root w={"full"} variant={"baseWithBorder"}>
      <Card.Body>
        <VStack gap={4} align="stretch">
          <VStack gap={2} align="stretch">
            <Heading size="xl">{t("Last Transactions")}</Heading>
          </VStack>

          {transactions.length > 0 ? (
            <>
              <VStack gap={4} align="stretch">
                {last5Transactions.map(transaction => (
                  <TransactionCard key={transaction.txId} transaction={transaction} />
                ))}
              </VStack>
              <Flex justify="center">
                <Button variant={"primaryGhost"} onClick={handleSeeAll}>
                  {t("See all")}
                </Button>
              </Flex>
            </>
          ) : (
            <Text>{t("No transactions found")}</Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
