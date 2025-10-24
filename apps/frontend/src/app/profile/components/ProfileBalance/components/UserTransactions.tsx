import { Card, Heading, VStack, Link, Skeleton } from "@chakra-ui/react"
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
  // @ts-expect-error TODO: this should be fixed in indexer side
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
                    <TransactionCard key={transaction.txId} transaction={transaction} />
                  ))}
                </VStack>
                {hasNextPage && (
                  <Link asChild mx="auto" color="actions.tertiary.default">
                    <NextLink href={`/transactions/${address}`}>{t("See all")}</NextLink>
                  </Link>
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
