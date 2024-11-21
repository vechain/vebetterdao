import { useTransactions } from "@/api"
import { TransactionCard } from "@/components"
import { Button, Card, CardBody, Flex, Heading, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  address: string
  isConnectedUser?: boolean
}
export const UserTransactions = ({ address, isConnectedUser }: Props) => {
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
    <Card w={"full"} variant={"baseWithBorder"}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <VStack spacing={2} align="stretch">
            <Heading size="md">{t("Last Transactions")}</Heading>
          </VStack>
          <VStack spacing={4} align="stretch">
            {last5Transactions.map(transaction => (
              <TransactionCard
                key={transaction.txId}
                transaction={transaction}
                isConnectedUser={isConnectedUser}
                address={address}
              />
            ))}
          </VStack>
          {transactions.length > 0 ? (
            <Flex justify="center">
              <Button variant={"primaryGhost"} onClick={handleSeeAll}>
                {t("See all")}
              </Button>
            </Flex>
          ) : (
            <Text>{t("No transactions found")}</Text>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
