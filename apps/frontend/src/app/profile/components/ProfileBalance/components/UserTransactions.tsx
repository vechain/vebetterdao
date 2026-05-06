import { Card, Heading, VStack, Skeleton, Button } from "@chakra-ui/react"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FiAlertCircle } from "react-icons/fi"

import { EmptyState } from "@/components/ui/empty-state"

import { useTransactions } from "../../../../../api/indexer/transactions/useTransactions"
import { TransactionCard } from "../../../../../components/TransactionCard/TransactionCard"

type Props = {
  address: string
}
export const UserTransactions = ({ address }: Props) => {
  const { t } = useTranslation()
  const { data, isLoading } = useTransactions(address ?? "", { size: 5 })
  const transactions = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? []
  }, [data])
  const hasNextPage = useMemo(() => {
    return data?.pages[0]?.pagination?.hasNext ?? false
  }, [data])
  return (
    <Skeleton rounded="xl" loading={isLoading}>
      <Card.Root w={"full"} variant="outline" borderColor="border.primary">
        <Card.Body>
          <VStack gap="4" align="stretch">
            <VStack gap="2" align="stretch">
              <Heading size="xl">{t("Last Transactions")}</Heading>
            </VStack>
            {transactions.length > 0 ? (
              <>
                <VStack gap="4" align="stretch">
                  {transactions.map(transaction => (
                    <TransactionCard key={transaction.id} transaction={transaction} />
                  ))}
                </VStack>
                {hasNextPage && (
                  <Button variant="link" asChild mx="auto">
                    <NextLink href={`/transactions/${address}`}>{t("See all")}</NextLink>
                  </Button>
                )}
              </>
            ) : (
              <EmptyState bg="transparent" size="sm" title={t("No transactions found")} icon={<FiAlertCircle />} />
            )}
          </VStack>
        </Card.Body>
      </Card.Root>
    </Skeleton>
  )
}
