import { useTransactions } from "@/api"
import { TransactionCard } from "@/components"
import { Card, Heading, Text, VStack, Link } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import NextLink from "next/link"

type Props = {
  address: string
}

export const UserTransactions = ({ address }: Props) => {
  const { t } = useTranslation()

  const { data } = useTransactions(address ?? "", { size: 5 })

  const transactions = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? []
  }, [data])

  const hasNextPage = useMemo(() => {
    return data?.pages[0]?.pagination?.hasNext ?? false
  }, [data])

  return (
    <Card.Root w={"full"} variant={"baseWithBorder"}>
      <Card.Body>
        <VStack gap={4} align="stretch">
          <VStack gap={2} align="stretch">
            <Heading size="xl" fontWeight="bold">
              {t("Last Transactions")}
            </Heading>
          </VStack>

          {transactions.length > 0 ? (
            <>
              <VStack gap={4} align="stretch">
                {transactions.map(transaction => (
                  <TransactionCard key={transaction.txId} transaction={transaction} />
                ))}
              </VStack>
              {hasNextPage && (
                <Link asChild mx="auto" color="actions.secondary.text-lighter">
                  <NextLink href={`/transactions/${address}`}>{t("See all")}</NextLink>
                </Link>
              )}
            </>
          ) : (
            <Text>{t("No transactions found")}</Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
